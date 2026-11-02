import { PHASE_PRODUCTION_BUILD } from "next/constants"
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
		// The feeds are larger than the 2MB data cache allows. Only the response below is cached.
		const response = await fetch(url, {
			cache: "no-store",
			signal: AbortSignal.timeout(10_000),
		})
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
	if (!picked.length) {
		// A build has nothing older to fall back on, so it ships the built-in list. On a daily
		// refresh, throwing keeps the last good list cached and retries on the next request.
		if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) return Response.json(builtInPrices)
		throw new Error("The models.dev catalogue is unavailable or unusable")
	}

	const prices: PriceList = {
		models: openRouter ? crossCheck(picked, openRouter) : picked,
		checkedOn: new Date().toISOString().slice(0, 10),
		source: "live",
	}
	return Response.json(prices)
}
