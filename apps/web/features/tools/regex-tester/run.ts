// Runs a pattern on the browser's real engine. Called inside the worker, so a pattern that
// hangs can be stopped from outside. Pure and DOM-free.

export type GroupMatch = {
	index: number
	start: number
	end: number
	text: string
}

export type Match = {
	start: number
	end: number
	text: string
	groups: GroupMatch[]
}

export type RunInput = { pattern: string; flags: string; text: string; replacement?: string }

export type RunResult = {
	matches: Match[]
	/** Stopped at MAX_MATCHES. */
	capped: boolean
	groupCount: number
	ms: number
	replaced?: { text: string; spans: { start: number; end: number }[] }
}

export const MAX_MATCHES = 5000

/** The text `$` patterns in a replacement produce for one match, as `String.replace` defines it. */
export function expandReplacement(replacement: string, match: RegExpExecArray, input: string) {
	const position = match.index
	const captures = match.length - 1
	return replacement.replace(/\$(\$|&|`|'|\d{1,2}|<[^>]*>?)/g, (whole, token: string) => {
		if (token === "$") return "$"
		if (token === "&") return match[0]
		if (token === "`") return input.slice(0, position)
		if (token === "'") return input.slice(position + match[0].length)
		if (token.startsWith("<")) {
			// Without named groups, `$<` is plain text.
			if (!match.groups || !token.endsWith(">")) return whole
			return match.groups[token.slice(1, -1)] ?? ""
		}
		// Two digits only count when that group exists; otherwise one digit and a literal.
		const two = Number(token)
		if (token.length === 2 && two >= 1 && two <= captures) return match[two] ?? ""
		const one = Number(token[0])
		if (one >= 1 && one <= captures) return (match[one] ?? "") + token.slice(1)
		return whole
	})
}

export function runRegex({ pattern, flags, text, replacement }: RunInput): RunResult {
	const started = performance.now()
	const engineFlags = flags.includes("d") ? flags : `${flags}d`
	const regex = new RegExp(pattern, engineFlags)
	const global = flags.includes("g")
	const unicode = flags.includes("u") || flags.includes("v")
	const matches: Match[] = []
	const replacing = replacement !== undefined
	const spans: { start: number; end: number }[] = []
	let output = ""
	let last = 0
	let capped = false

	for (;;) {
		const match = regex.exec(text)
		if (!match) break
		if (matches.length < MAX_MATCHES) {
			const indices = match.indices
			const groups: GroupMatch[] = []
			for (let index = 1; index < match.length; index++) {
				const range = indices?.[index]
				if (range)
					groups.push({ index, start: range[0], end: range[1], text: match[index] ?? "" })
			}
			matches.push({
				start: match.index,
				end: match.index + match[0].length,
				text: match[0],
				groups,
			})
		}
		if (replacing) {
			output += text.slice(last, match.index)
			const expansion = expandReplacement(replacement, match, text)
			spans.push({ start: output.length, end: output.length + expansion.length })
			output += expansion
			last = match.index + match[0].length
		}
		if (!global) break
		if (matches.length >= MAX_MATCHES) {
			capped = true
			// The list stops here, but a replacement has to reach the end of the text.
			if (!replacing) break
		}
		// An empty match would repeat forever; step over one character.
		if (match[0] === "") {
			const code = text.codePointAt(regex.lastIndex) ?? 0
			regex.lastIndex += unicode && code > 0xffff ? 2 : 1
		}
	}

	return {
		matches,
		capped,
		groupCount:
			(new RegExp(`${pattern}|`, flags.replace(/[gyd]/g, "")).exec("")?.length ?? 1) - 1,
		ms: performance.now() - started,
		replaced: replacing ? { text: output + text.slice(last), spans } : undefined,
	}
}
