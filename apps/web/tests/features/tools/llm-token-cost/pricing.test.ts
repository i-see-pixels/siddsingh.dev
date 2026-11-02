import { describe, expect, it } from "vitest"
import {
	type Catalog,
	type CatalogModel,
	crossCheck,
	familyOf,
	type OpenRouterList,
	pickModels,
} from "@/features/tools/llm-token-cost/pricing"
import catalogSnapshot from "./models-dev.json"
import openRouterSnapshot from "./openrouter.json"

// Snapshots of both feeds taken on 3 Nov 2026, trimmed to the fields the tool reads.
const catalog = catalogSnapshot as Catalog
const openRouter = openRouterSnapshot as OpenRouterList

const ids = (list: { id: string }[]) => list.map((model) => model.id)

function withModel(model: CatalogModel): Catalog {
	const google = catalog.google ?? {}
	return { ...catalog, google: { ...google, models: { ...google.models, [model.id]: model } } }
}

const carbon: CatalogModel = {
	id: "gemini-4-carbon",
	name: "Gemini 4 Carbon",
	release_date: "2026-11-02",
	tool_call: true,
	modalities: { input: ["text"], output: ["text"] },
	cost: { input: 0.5, output: 3 },
	limit: { context: 1_048_576 },
}

describe("familyOf", () => {
	it("drops version numbers", () => {
		expect(familyOf("gemini-4-argon")).toBe("gemini-argon")
		expect(familyOf("claude-opus-5-5")).toBe("claude-opus")
		expect(familyOf("gpt-6.1-sol")).toBe("gpt-sol")
		expect(familyOf("gemini-3.5-flash-lite")).toBe("gemini-flash-lite")
	})

	it("skips ids without a family name, previews, aliases and snapshots", () => {
		expect(familyOf("gpt-5.6")).toBeNull()
		expect(familyOf("gemini-flash-latest")).toBeNull()
		expect(familyOf("gemini-omni-flash-preview")).toBeNull()
		expect(familyOf("claude-opus-4-5-20251101")).toBeNull()
		expect(familyOf("gpt-realtime-2.1")).toBeNull()
	})
})

describe("pickModels", () => {
	it("shows the newest model of each current family", () => {
		expect(ids(pickModels(catalog))).toEqual([
			"claude-fable-5-1",
			"claude-opus-5-5",
			"claude-sonnet-5-5",
			"claude-haiku-5-5",
			"gpt-6-astra",
			"gpt-6.1-sol",
			"gpt-6.1-terra",
			"gpt-6-luna",
			"gemini-4-argon",
			"gemini-3.8-flash",
			"gemini-3.5-flash-lite",
		])
	})

	it("reads prices and context windows from the catalogue", () => {
		const terra = pickModels(catalog).find((model) => model.id === "gpt-6.1-terra")
		expect(terra).toMatchObject({
			provider: "OpenAI",
			inputPrice: 1,
			outputPrice: 5,
			contextWindow: 1_050_000,
			released: "2026-10-26",
		})
	})

	it("adds a new family without any code change", () => {
		const picked = ids(pickModels(withModel(carbon)))
		expect(picked).toContain("gemini-4-carbon")
		expect(picked).toContain("gemini-4-argon")
	})

	it("replaces a model when a newer one in its family arrives", () => {
		const picked = ids(
			pickModels(withModel({ ...carbon, id: "gemini-4.1-argon", name: "Gemini 4.1 Argon" })),
		)
		expect(picked).toContain("gemini-4.1-argon")
		expect(picked).not.toContain("gemini-4-argon")
	})

	it("retires a family once its newest model is far behind the provider's newest", () => {
		const later = withModel({ ...carbon, release_date: "2027-03-01" })
		expect(ids(pickModels(later))).not.toContain("gemini-3.5-flash-lite")
	})

	it("ignores models that are not text chat models with a price", () => {
		const picked = ids(
			pickModels(
				withModel({
					...carbon,
					id: "gemini-4-neon",
					modalities: { output: ["text", "image"] },
				}),
			),
		)
		expect(picked).not.toContain("gemini-4-neon")
		expect(
			ids(pickModels(withModel({ ...carbon, cost: { input: 0, output: 0 } }))),
		).not.toContain("gemini-4-carbon")
	})

	it("returns nothing when a provider has no usable models", () => {
		expect(pickModels({ ...catalog, google: { models: {} } })).toEqual([])
		expect(pickModels({})).toEqual([])
	})
})

describe("crossCheck", () => {
	it("flags only the models where OpenRouter disagrees", () => {
		// In the snapshot OpenRouter charges 10% more for Gemini 3.8 Flash and agrees on the rest.
		const flagged = crossCheck(pickModels(catalog), openRouter).filter(
			(model) => model.openRouter,
		)
		expect(flagged.map(({ id, openRouter }) => ({ id, openRouter }))).toEqual([
			{ id: "gemini-3.8-flash", openRouter: { input: 0.825, output: 4.125 } },
		])
	})

	it("notes OpenRouter's price when it differs", () => {
		const changed: OpenRouterList = {
			data: [
				{
					id: "anthropic/claude-opus-5.5",
					pricing: { prompt: "0.000005", completion: "0.000025" },
				},
			],
		}
		const opus = crossCheck(pickModels(catalog), changed).find(
			(model) => model.id === "claude-opus-5-5",
		)
		expect(opus?.openRouter).toEqual({ input: 5, output: 25 })
	})
})
