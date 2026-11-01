// Copy-ready code for each language: the pattern as that language's string literal, its
// flags, and the replacement converted to its syntax. Pure and DOM-free.

import type { CaptureGroup } from "./ast"
import type { Portability, Target } from "./portability"

type ReplacementToken =
	| { type: "text"; text: string }
	| { type: "group"; index: number }
	| { type: "name"; name: string }
	| { type: "before" | "after" }

/** Splits a JavaScript replacement string into literal text and references. */
export function parseReplacement(replacement: string, groups: CaptureGroup[]): ReplacementToken[] {
	const tokens: ReplacementToken[] = []
	const push = (text: string) => {
		const last = tokens.at(-1)
		if (last?.type === "text") last.text += text
		else tokens.push({ type: "text", text })
	}
	const named = groups.some((group) => group.name)
	let position = 0
	for (const match of replacement.matchAll(/\$(\$|&|`|'|\d{1,2}|<[^>]*>)/g)) {
		push(replacement.slice(position, match.index))
		position = match.index + match[0].length
		const token = match[1] ?? ""
		if (token === "$") push("$")
		else if (token === "&") tokens.push({ type: "group", index: 0 })
		else if (token === "`") tokens.push({ type: "before" })
		else if (token === "'") tokens.push({ type: "after" })
		else if (token.startsWith("<")) {
			const name = token.slice(1, -1)
			// With named groups, a name that doesn't exist is empty, so nothing is added.
			if (!named) push(match[0])
			else if (groups.some((group) => group.name === name))
				tokens.push({ type: "name", name })
		} else {
			// As in String.replace: two digits only if that group exists, else one digit.
			const two = Number(token)
			const one = Number(token[0])
			if (token.length === 2 && two >= 1 && two <= groups.length)
				tokens.push({ type: "group", index: two })
			else if (one >= 1 && one <= groups.length) {
				tokens.push({ type: "group", index: one })
				if (token.length === 2) push(token.slice(1))
			} else push(match[0])
		}
	}
	push(replacement.slice(position))
	return tokens
}

/** The replacement in a target's syntax, or null with a reason when it can't be written. */
export function convertReplacement(
	tokens: ReplacementToken[],
	target: Target,
	result: Portability,
	groups: CaptureGroup[],
): { text: string } | { problem: string } {
	let text = ""
	for (const token of tokens) {
		if (token.type === "before" || token.type === "after") {
			return { problem: "$` and $' (the text around the match) have no equivalent here." }
		}
		if (token.type === "text") {
			const raw = token.text
			if (target === "python") text += raw.replace(/\\/g, "\\\\")
			else if (target === "go" || target === "rust") text += raw.replace(/\$/g, "$$$$")
			else if (target === "java") text += raw.replace(/[\\$]/g, "\\$&")
			else text += raw.replace(/[\\$]/g, "\\$&")
			continue
		}
		const name =
			token.type === "name" ? (result.names.get(token.name) ?? token.name) : undefined
		const index = token.type === "group" ? token.index : undefined
		if (target === "python") text += `\\g<${name ?? index}>`
		else if (target === "go" || target === "rust") text += `\${${name ?? index}}`
		else if (target === "java") text += name ? `\${${name}}` : `$${index}`
		else {
			// preg_replace has no named references, so a name becomes its number.
			const number =
				token.type === "name"
					? groups.find((group) => group.name === token.name)?.index
					: index
			text += `\${${number}}`
		}
	}
	return { text }
}

const pythonRaw = (text: string) =>
	!text.includes('"') ? `r"${text}"` : !text.includes("'") ? `r'${text}'` : JSON.stringify(text)

const goString = (text: string) => (text.includes("`") ? JSON.stringify(text) : `\`${text}\``)

function rustRaw(text: string) {
	let hashes = ""
	while (text.includes(`"${hashes}`)) hashes += "#"
	return `r${hashes}"${text}"${hashes}`
}

/** `'/…/i'`: `/` escaped for the delimiter, then escaped again for the single-quoted string. */
function phpPattern(pattern: string, flags: string) {
	let body = ""
	for (let index = 0; index < pattern.length; index++) {
		const char = pattern[index]
		if (char === "\\") {
			const next = pattern[++index] ?? ""
			// A backslash pair must survive the string, or the next character is lost.
			if (next === "\\") body += "\\\\\\\\"
			else if (next === "'") body += "\\\\\\'"
			else body += `\\${next}`
		} else if (char === "/") body += "\\/"
		else if (char === "'") body += "\\'"
		else body += char
	}
	return `'/${body}/${flags}'`
}

const phpString = (text: string) => `'${text.replace(/[\\']/g, "\\$&")}'`

export type CodeInput = {
	pattern: string
	flags: string
	groups: CaptureGroup[]
	replacement?: string
}

export function javascriptCode({ pattern, flags, replacement }: CodeInput) {
	const literal = `/${new RegExp(pattern, flags).source}/${flags}`
	if (replacement !== undefined) {
		return `const re = ${literal}\nconst result = text.replace(re, ${JSON.stringify(replacement)})`
	}
	if (flags.includes("g")) {
		return `const re = ${literal}\nfor (const match of text.matchAll(re)) {\n\tconsole.log(match.index, match[0])\n}`
	}
	return `const re = ${literal}\nconst match = text.match(re)`
}

/** Code for `result`, which must be runnable (its pattern isn't null). */
export function targetCode(
	result: Portability,
	{ flags, groups, replacement }: Omit<CodeInput, "pattern">,
) {
	const pattern = result.pattern ?? ""
	const all = flags.includes("g")
	const has = (flag: string) => flags.includes(flag)
	const inline = [has("i") && "i", has("m") && "m", has("s") && "s"].filter(Boolean).join("")
	const prefixed = inline ? `(?${inline})${pattern}` : pattern

	let replaceText: string | undefined
	let note: string | undefined
	if (replacement !== undefined) {
		const converted = convertReplacement(
			parseReplacement(replacement, groups),
			result.target,
			result,
			groups,
		)
		if ("problem" in converted) note = converted.problem
		else replaceText = converted.text
	}
	const replacing = replaceText !== undefined
	const comment = (mark: string) => (note ? `${mark} ${note}\n` : "")

	switch (result.target) {
		case "python": {
			const options = [
				has("i") && "re.IGNORECASE",
				has("m") && "re.MULTILINE",
				has("s") && "re.DOTALL",
			]
				.filter(Boolean)
				.join(" | ")
			const compile = `pattern = re.compile(${pythonRaw(pattern)}${options ? `, ${options}` : ""})`
			if (replacing) {
				return `import re\n\n${compile}\nresult = pattern.sub(${pythonRaw(replaceText ?? "")}, text${all ? "" : ", count=1"})`
			}
			const use = all
				? "for match in pattern.finditer(text):\n    print(match.start(), match.group(0))"
				: "match = pattern.search(text)"
			return `${comment("#")}import re\n\n${compile}\n${use}`
		}
		case "go": {
			const compile = `re := regexp.MustCompile(${goString(prefixed)})`
			if (replacing) {
				const warn = all ? "" : "// Go has no replace-first: this replaces every match.\n"
				return `${warn}${compile}\nresult := re.ReplaceAllString(text, ${JSON.stringify(replaceText)})`
			}
			const use = all
				? "matches := re.FindAllStringSubmatch(text, -1)"
				: "match := re.FindStringSubmatch(text)"
			return `${comment("//")}${compile}\n${use}`
		}
		case "java": {
			const options = [
				has("i") && "Pattern.CASE_INSENSITIVE",
				has("m") && "Pattern.MULTILINE",
				has("s") && "Pattern.DOTALL",
			]
				.filter(Boolean)
				.join(" | ")
			const compile = `Pattern pattern = Pattern.compile(${JSON.stringify(pattern)}${options ? `, ${options}` : ""});\nMatcher matcher = pattern.matcher(text);`
			if (replacing) {
				return `${compile}\nString result = matcher.${all ? "replaceAll" : "replaceFirst"}(${JSON.stringify(replaceText)});`
			}
			const use = all
				? 'while (matcher.find()) {\n    System.out.println(matcher.start() + " " + matcher.group());\n}'
				: "if (matcher.find()) {\n    System.out.println(matcher.group());\n}"
			return `${comment("//")}${compile}\n${use}`
		}
		case "rust": {
			const compile = `let re = Regex::new(${rustRaw(prefixed)}).unwrap();`
			if (replacing) {
				return `${compile}\nlet result = re.${all ? "replace_all" : "replace"}(text, ${JSON.stringify(replaceText)});`
			}
			const use = all
				? 'for caps in re.captures_iter(text) {\n    println!("{}", &caps[0]);\n}'
				: "let caps = re.captures(text);"
			return `${comment("//")}${compile}\n${use}`
		}
		case "php": {
			const modifiers = [
				has("i") && "i",
				has("m") && "m",
				has("s") && "s",
				result.unicodeMode && "u",
			]
				.filter(Boolean)
				.join("")
			const literal = phpPattern(pattern, modifiers)
			if (replacing) {
				return `$result = preg_replace(${literal}, ${phpString(replaceText ?? "")}, $text${all ? "" : ", 1"});`
			}
			const use = all
				? `preg_match_all(${literal}, $text, $matches, PREG_SET_ORDER);`
				: `preg_match(${literal}, $text, $match);`
			return `${comment("//")}${use}`
		}
	}
}
