import { builtInPrices } from "@/features/tools/llm-token-cost/models"
import {
	type Catalog,
	crossCheck,
	type OpenRouterList,
	type PriceList,
	pickModels,
} from "@/features/tools/llm-token-cost/pricing"

// Model prices for the LLM token & cost calculator. Built once and refreshed at most once a
// day, so visitors only ever call this site, never the price feeds.
export const dynamic = "force-static"
export const revalidate = 86_400

async function getJson<T>(url: string): Promise<T | null> {
	try {
		const response = await fetch(url, { signal: AbortSignal.timeout(10_000) })
		return response.ok ? ((await response.json()) as T) : null
	} catch {
		return null
	}
}

export async function GET() {
	const [catalog, openRouter] = await Promise.all([
		getJson<Catalog>("https://models.dev/api.json"),
		getJson<OpenRouterList>("https://openrouter.ai/api/v1/models"),
	])

	const picked = catalog ? pickModels(catalog) : []
	const prices: PriceList = picked.length
		? {
				models: openRouter ? crossCheck(picked, openRouter) : picked,
				checkedOn: new Date().toISOString().slice(0, 10),
				source: "live",
			}
		: builtInPrices

	return Response.json(prices)
}
