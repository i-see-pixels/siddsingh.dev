// Everything the tool works out from the pattern itself. It runs in a worker, because large
// patterns can take seconds here and the page has to stay responsive. Pure and DOM-free.

import { parsePattern } from "./ast"
import { javascriptCode, targetCode } from "./codegen"
import { explain } from "./explain"
import { checkTarget, TARGET_NAMES, TARGETS } from "./portability"
import { findRedos } from "./redos"

export type AnalysisInput = { pattern: string; flags: string; replacement?: string }

/** The analysis of a pattern, or null when it doesn't parse. */
export function analyzePattern({ pattern, flags, replacement }: AnalysisInput) {
	const parsed = parsePattern(pattern, flags)
	if (!parsed.ok) return null
	return {
		languages: TARGETS.map((target) => {
			const result = checkTarget(parsed, pattern, flags, target)
			return {
				...result,
				name: TARGET_NAMES[target],
				code:
					result.pattern === null
						? null
						: targetCode(result, { flags, groups: parsed.groups, replacement }),
			}
		}),
		rows: explain(parsed.root, flags),
		redos: findRedos(parsed.root, flags),
		javascript: javascriptCode({ pattern, flags, groups: parsed.groups, replacement }),
	}
}

export type Analysis = NonNullable<ReturnType<typeof analyzePattern>>
