export type ModelSpec = {
	id: string
	name: string
	provider: "Anthropic" | "OpenAI" | "Google"
	/** USD per 1M tokens. Editable in the UI because list prices change. */
	inputPrice: number
	outputPrice: number
	contextWindow: number
}

/** When the seed prices below were read from each provider's pricing page. */
export const pricesCheckedOn = "21 Oct 2026"

/**
 * Seed list prices (USD per 1M tokens, standard tier, short prompts) and context
 * windows, taken from the providers' own pricing and model pages. The tool lets
 * visitors edit every price, so stale numbers are easy to correct.
 *
 * Known changes: Gemini 4 Argon doubles on 1 Dec 2026 ($4 in / $20 out) and
 * Gemini 3.8 Flash on 1 Jan 2027 ($1.50 in / $7.50 out). Claude Haiku 5.5 costs
 * $0.50 in / $2.50 out for prompts over 100k tokens.
 */
export const models: ModelSpec[] = [
	{
		id: "claude-fable-5-1",
		name: "Claude Fable 5.1",
		provider: "Anthropic",
		inputPrice: 10,
		outputPrice: 50,
		contextWindow: 1_000_000,
	},
	{
		id: "claude-opus-5-5",
		name: "Claude Opus 5.5",
		provider: "Anthropic",
		inputPrice: 4,
		outputPrice: 20,
		contextWindow: 1_000_000,
	},
	{
		id: "claude-sonnet-5-5",
		name: "Claude Sonnet 5.5",
		provider: "Anthropic",
		inputPrice: 2,
		outputPrice: 10,
		contextWindow: 1_000_000,
	},
	{
		id: "claude-haiku-5-5",
		name: "Claude Haiku 5.5",
		provider: "Anthropic",
		inputPrice: 0.1,
		outputPrice: 0.5,
		contextWindow: 1_000_000,
	},
	{
		id: "gpt-6-astra",
		name: "GPT-6 Astra",
		provider: "OpenAI",
		inputPrice: 10,
		outputPrice: 50,
		contextWindow: 1_050_000,
	},
	{
		id: "gpt-6-1-sol",
		name: "GPT-6.1 Sol",
		provider: "OpenAI",
		inputPrice: 2,
		outputPrice: 10,
		contextWindow: 1_050_000,
	},
	{
		id: "gpt-6-luna",
		name: "GPT-6 Luna",
		provider: "OpenAI",
		inputPrice: 0.1,
		outputPrice: 0.5,
		contextWindow: 1_050_000,
	},
	{
		id: "gemini-4-argon",
		name: "Gemini 4 Argon",
		provider: "Google",
		inputPrice: 2,
		outputPrice: 10,
		contextWindow: 1_048_576,
	},
	{
		id: "gemini-3-8-flash",
		name: "Gemini 3.8 Flash",
		provider: "Google",
		inputPrice: 0.75,
		outputPrice: 3.75,
		contextWindow: 1_048_576,
	},
	{
		id: "gemini-3-5-flash-lite",
		name: "Gemini 3.5 Flash-Lite",
		provider: "Google",
		inputPrice: 0.3,
		outputPrice: 2.5,
		contextWindow: 1_048_576,
	},
]

/**
 * Only OpenAI publishes its tokenizer, so counts for those models use o200k_base
 * as is. For the others we scale the o200k_base count by a rough ratio.
 */
export const tokenizerRatio: Record<ModelSpec["provider"], number> = {
	OpenAI: 1,
	Anthropic: 1.15,
	Google: 1,
}
