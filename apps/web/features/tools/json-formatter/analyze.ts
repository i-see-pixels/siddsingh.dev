// Everything the tool derives from the input text, in one pass. Pure, so it runs the
// same on the main thread and in the large-input worker.

import {
	countLargeNumbers,
	depthOf,
	formatValue,
	type Indent,
	type InputKind,
	type OutputMode,
	parseInput,
} from "./format"
import { type Finding, scanSecrets } from "./secrets"

export type AnalyzeOptions = {
	mode: OutputMode
	indent: Indent
	sortKeys: boolean
	enabledRules: string[]
}

export type Analysis = {
	/** The text this analysis is for; marks and redactions only apply while the editor holds it. */
	text: string
	status: "empty" | "ok" | "error"
	kind?: InputKind
	error?: { message: string; line?: number; column?: number }
	yamlComments: boolean
	output: string
	findings: Finding[]
	stats: { lines: number; bytes: number; depth: number; largeNumbers: number }
}

export function analyze(text: string, options: AnalyzeOptions): Analysis {
	const parsed = parseInput(text)
	const stats = {
		lines: text ? text.split("\n").length : 0,
		bytes: new TextEncoder().encode(text).length,
		depth: 0,
		largeNumbers: 0,
	}
	if (parsed.status !== "ok") {
		return {
			text,
			status: parsed.status,
			error: parsed.status === "error" ? parsed : undefined,
			yamlComments: false,
			output: "",
			findings: [],
			stats,
		}
	}
	try {
		return {
			text,
			status: "ok",
			kind: parsed.kind,
			yamlComments: parsed.yamlComments,
			output: formatValue(parsed.value, options.mode, options),
			findings: scanSecrets(text, parsed.kind, new Set(options.enabledRules)),
			stats: {
				...stats,
				depth: depthOf(parsed.value),
				largeNumbers: parsed.kind === "json" ? countLargeNumbers(text) : 0,
			},
		}
	} catch {
		// Formatting and the walks above recurse once per level, so very deep input
		// overflows the stack. Report it rather than crash the tool or stall the worker.
		return {
			text,
			status: "error",
			error: { message: "Too deeply nested to format in the browser" },
			yamlComments: false,
			output: "",
			findings: [],
			stats,
		}
	}
}
