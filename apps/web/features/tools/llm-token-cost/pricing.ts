import type { ModelSpec } from "./models"

/**
 * Picks the models the calculator shows from the models.dev catalogue
 * (https://models.dev/api.json), and checks their prices against OpenRouter.
 *
 * No list of model names is kept here. A model's family is its id with the version
 * numbers taken out (`gemini-4-argon` is `gemini-argon`, `claude-opus-5-5` is
 * `claude-opus`), and the newest release of each family is shown. A new family
 * therefore appears as soon as the catalogue lists it.
 */

export type CatalogModel = {
	id: string
	name: string
	release_date?: string
	tool_call?: boolean
	status?: string
	modalities?: { input?: string[]; output?: string[] }
	cost?: { input?: number; output?: number }
	limit?: { context?: number }
}

export type Catalog = Record<string, { models?: Record<string, CatalogModel> } | undefined>

export type OpenRouterList = {
	data?: { id: string; pricing?: { prompt?: string; completion?: string } }[]
}

export type PricedModel = ModelSpec & {
	released: string
	/** OpenRouter's price when it differs from the catalogue's by more than 5%. */
	openRouter?: { input: number; output: number }
}

export type PriceList = {
	models: PricedModel[]
	/** ISO date the prices were read, or the date of the built-in list when the feed failed. */
	checkedOn: string
	source: "live" | "built-in"
}

const providers = {
	anthropic: "Anthropic",
	openai: "OpenAI",
	google: "Google",
} as const satisfies Record<string, ModelSpec["provider"]>

/** Ids with any of these words are previews, aliases or special-purpose models. */
const skipWords = new Set([
	"preview",
	"latest",
	"exp",
	"image",
	"live",
	"audio",
	"realtime",
	"tts",
	"transcribe",
	"embedding",
	"search",
	"research",
	"translate",
])

/** Families whose newest release is this much older than the provider's newest are retired. */
const RETIRED_AFTER_DAYS = 150

const isVersion = (part: string) => /^\d+(\.\d+)*$/.test(part)
/** Dated snapshots such as claude-opus-4-5-20251101 repeat the undated model. */
const isSnapshot = (part: string) => /^\d{8}$/.test(part)

/** `gemini-4-argon` → `gemini-argon`, or null when the id has no family name. */
export function familyOf(id: string) {
	const words = id.toLowerCase().split("-")
	if (words.some((word) => skipWords.has(word) || isSnapshot(word))) return null
	const family = words.filter((word) => !isVersion(word))
	// `gpt-5.6` has no name after the version, so it belongs to no family.
	return family.length > 1 ? family.join("-") : null
}

/** Version numbers in an id, for breaking ties between releases on the same day. */
const versionOf = (id: string) =>
	id
		.split("-")
		.filter(isVersion)
		.flatMap((word) => word.split("."))
		.map(Number)

function compareVersions(a: number[], b: number[]) {
	for (let index = 0; index < Math.max(a.length, b.length); index++) {
		const difference = (a[index] ?? 0) - (b[index] ?? 0)
		if (difference !== 0) return difference
	}
	return 0
}

/** Later release date first; on the same day, the higher version. */
const compareReleases = (a: CatalogModel, b: CatalogModel) =>
	(a.release_date ?? "").localeCompare(b.release_date ?? "") ||
	compareVersions(versionOf(a.id), versionOf(b.id))

const isPrice = (value: unknown): value is number =>
	typeof value === "number" && Number.isFinite(value) && value > 0 && value < 1000

/** A usable chat model: text out, tool calling, a real price and a context window. */
function isChatModel(model: CatalogModel) {
	const output = model.modalities?.output ?? []
	return (
		model.tool_call === true &&
		model.status !== "deprecated" &&
		output.length === 1 &&
		output[0] === "text" &&
		isPrice(model.cost?.input) &&
		isPrice(model.cost?.output) &&
		(model.limit?.context ?? 0) > 0 &&
		/^\d{4}-\d{2}-\d{2}$/.test(model.release_date ?? "")
	)
}

const days = (from: string, to: string) => (Date.parse(to) - Date.parse(from)) / 86_400_000

/** The newest model of each current family, per provider. Empty when the catalogue is unusable. */
export function pickModels(catalog: Catalog): PricedModel[] {
	const picked: PricedModel[] = []

	for (const [key, provider] of Object.entries(providers)) {
		const newest = new Map<string, CatalogModel>()
		for (const model of Object.values(catalog[key]?.models ?? {})) {
			const family = familyOf(model.id)
			if (!family || !isChatModel(model)) continue
			const current = newest.get(family)
			if (!current || compareReleases(model, current) > 0) newest.set(family, model)
		}

		const latest =
			[...newest.values()]
				.map((model) => model.release_date ?? "")
				.sort()
				.at(-1) ?? ""
		const current = [...newest.values()]
			.filter((model) => days(model.release_date ?? "", latest) <= RETIRED_AFTER_DAYS)
			.map(
				(model): PricedModel => ({
					id: model.id,
					name: model.name || model.id,
					provider,
					inputPrice: model.cost?.input ?? 0,
					outputPrice: model.cost?.output ?? 0,
					contextWindow: model.limit?.context ?? 0,
					released: model.release_date ?? "",
				}),
			)
			// Most capable (and most expensive) first, as on the providers' own pages.
			.sort((a, b) => b.outputPrice - a.outputPrice || b.inputPrice - a.inputPrice)

		picked.push(...current)
	}

	// A provider with nothing usable means the catalogue changed shape: don't trust any of it.
	const covered = new Set(picked.map((model) => model.provider))
	return covered.size === Object.keys(providers).length ? picked : []
}

/** OpenRouter writes `anthropic/claude-opus-5.5`; the catalogue writes `claude-opus-5-5`. */
const normalise = (id: string) => (id.split("/").pop() ?? id).replaceAll(".", "-")

const differs = (a: number, b: number) => Math.abs(a - b) / Math.max(a, b) > 0.05

/** Notes OpenRouter's price on any model where it disagrees with the catalogue. */
export function crossCheck(models: PricedModel[], openRouter: OpenRouterList): PricedModel[] {
	const prices = new Map<string, { input: number; output: number }>()
	for (const entry of openRouter.data ?? []) {
		if (entry.id.includes(":")) continue
		const input = Number(entry.pricing?.prompt) * 1_000_000
		const output = Number(entry.pricing?.completion) * 1_000_000
		if (isPrice(input) && isPrice(output)) prices.set(normalise(entry.id), { input, output })
	}
	return models.map((model) => {
		const other = prices.get(normalise(model.id))
		if (!other) return model
		const round = (value: number) => Math.round(value * 1e6) / 1e6
		return differs(model.inputPrice, other.input) || differs(model.outputPrice, other.output)
			? { ...model, openRouter: { input: round(other.input), output: round(other.output) } }
			: model
	})
}
