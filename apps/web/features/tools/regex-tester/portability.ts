// What happens to a JavaScript pattern in each other language: what stops it working,
// what has to be rewritten (and the rewrite), and what still runs but means something else.
//
// Checked on 2026-10-31:
// - Python 3.13 `re`: run for real on the machine this was written on, including lookbehind
//   width, `(?<n>` and `\p`, `\u{…}`, `\c`, `[]`. https://docs.python.org/3/library/re.html
// - Go `regexp/syntax`: https://pkg.go.dev/regexp/syntax (`(?<name>` listed; no lookaround or
//   backreferences in the syntax). The 1000 repeat limit comes from RE2.
// - Rust `regex`: https://docs.rs/regex/latest/regex/ (no lookaround or backreferences).
//   Set operators and Unicode `\d` are from memory of those docs; recheck when touching them.
// - Java 21 `Pattern`: https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/regex/Pattern.html
//   (names are letters and digits, starting with a letter). The bounded-lookbehind rule is from memory.
// - PHP 8.4 / PCRE2 10.44: https://www.php.net/manual/en/migration84.new-features.php and
//   https://www.pcre.org/current/doc/html/pcre2_set_max_varlookbehind.html (limit 255).

import { type Node, type ParsedPattern, walk, widthOf } from "./ast"

export type Target = "python" | "go" | "java" | "rust" | "php"
export const TARGETS: Target[] = ["python", "go", "java", "rust", "php"]
export const TARGET_NAMES: Record<Target, string> = {
	python: "Python",
	go: "Go",
	java: "Java",
	rust: "Rust",
	php: "PHP",
}

export type IssueLevel = "unsupported" | "rewrite" | "behaviour"

export type Issue = {
	level: IssueLevel
	message: string
	suggestion?: string
	/** The part of the pattern it's about. */
	from: number
	to: number
}

export type Status = "works" | "changes" | "unsupported"

export type Portability = {
	target: Target
	status: Status
	issues: Issue[]
	/** The pattern rewritten for this language; null when it can't run there. */
	pattern: string | null
	/** Group names as this language spells them, by original name. */
	names: Map<string, string>
	/** PHP only: the pattern needs `/u`, also when the JavaScript has no u or v flag. */
	unicodeMode: boolean
}

type Edit = { from: number; to: number; text: string }

const hex = (value: number, width = 2) => value.toString(16).toUpperCase().padStart(width, "0")

/**
 * A group name this language accepts. JavaScript names can hold `$` and non-ASCII letters;
 * Java's are ASCII letters and digits, the others also take `_`.
 */
function groupName(name: string, target: Target, taken: Set<string>) {
	const clean = name.replace(target === "java" ? /[^A-Za-z0-9]/g : /\W/g, "")
	const base = (target === "java" ? /^[A-Za-z]/ : /^[A-Za-z_]/).test(clean) ? clean : `g${clean}`
	let candidate = base
	for (let suffix = 2; taken.has(candidate); suffix++) candidate = `${base}${suffix}`
	taken.add(candidate)
	return candidate
}

export function checkTarget(
	parsed: ParsedPattern & { ok: true },
	pattern: string,
	flags: string,
	target: Target,
): Portability {
	const issues: Issue[] = []
	const edits: Edit[] = []
	const names = new Map<string, string>()
	const multiline = flags.includes("m")
	const seen = new Set<string>()
	const taken = new Set<string>()
	const noted = new Set<string>()

	const add = (
		level: IssueLevel,
		node: { range: [number, number] },
		message: string,
		suggestion?: string,
	) => issues.push({ level, message, suggestion, from: node.range[0], to: node.range[1] })
	/** Add an issue once per pattern, for notes that would otherwise repeat. */
	const once = (
		key: string,
		level: IssueLevel,
		node: { range: [number, number] },
		message: string,
		suggestion?: string,
	) => {
		if (noted.has(key)) return
		noted.add(key)
		add(level, node, message, suggestion)
	}
	const rewrite = (node: { range: [number, number] }, text: string, message: string) => {
		edits.push({ from: node.range[0], to: node.range[1], text })
		once(message, "rewrite", node, message)
	}

	for (const group of parsed.groups) {
		if (!group.name) continue
		if (seen.has(group.name)) {
			issues.push({
				level: "unsupported",
				message: `${TARGET_NAMES[target]} doesn't allow two groups named ${group.name}.`,
				suggestion: "Give each group its own name.",
				from: group.from,
				to: group.to,
			})
		}
		seen.add(group.name)
		if (!names.has(group.name)) names.set(group.name, groupName(group.name, target, taken))
	}

	const inClass = (parent: Node | null) => parent?.type === "characterClass"

	// PCRE rejects `\x{…}` above 255 outside UTF mode, so these escapes turn on /u.
	let unicodeMode = flags.includes("u") || flags.includes("v")
	if (target === "php") {
		walk(parsed.root, (node) => {
			if (node.type === "value" && node.kind === "unicodeEscape" && node.codePoint > 255)
				unicodeMode = true
		})
	}

	walk(parsed.root, (node, parent) => {
		switch (node.type) {
			case "group": {
				if (node.behavior === "lookahead" || node.behavior === "negativeLookahead") {
					if (target === "go" || target === "rust") {
						add(
							"unsupported",
							node,
							`${TARGET_NAMES[target]} has no lookahead: ${node.raw} can't run.`,
							"Match the text instead, and check it in code.",
						)
					}
				}
				if (node.behavior === "lookbehind" || node.behavior === "negativeLookbehind") {
					const width = widthOf({ ...node, behavior: "normal" } as Node)
					if (target === "go" || target === "rust") {
						add(
							"unsupported",
							node,
							`${TARGET_NAMES[target]} has no lookbehind: ${node.raw} can't run.`,
							"Match the prefix as well, and use a capture group for the part you want.",
						)
					} else if (target === "python" && width.min !== width.max) {
						add(
							"unsupported",
							node,
							`Python's lookbehind must be a fixed width: ${node.raw} isn't.`,
							"Split it into separate lookbehinds, or use the third-party regex package.",
						)
					} else if (target === "java" && width.max === Number.POSITIVE_INFINITY) {
						add(
							"unsupported",
							node,
							`Java's lookbehind needs a maximum length: ${node.raw} has none.`,
							"Replace * or + with a bound, like {1,50}.",
						)
					} else if (target === "php" && width.min !== width.max) {
						if (width.max > 255) {
							add(
								"unsupported",
								node,
								`PCRE2's lookbehind can be at most 255 characters: ${node.raw} can be longer.`,
							)
						} else {
							add(
								"behaviour",
								node,
								`Variable-width lookbehind needs PHP 8.4 or newer (PCRE2 10.43): older versions reject ${node.raw}.`,
							)
						}
					}
				}
				if (node.behavior === "normal" && node.name) {
					const name = node.name.value
					const start = node.range[0]
					const header = { range: [start, node.name.range[1] + 1] as [number, number] }
					const renamed = names.get(name) ?? name
					if (renamed !== name) {
						once(
							`rename-${name}`,
							"rewrite",
							header,
							`${TARGET_NAMES[target]} group names can't be written ${name} here, so it becomes ${renamed}.`,
						)
					}
					if (target === "python") {
						rewrite(header, `(?P<${renamed}>`, "Named groups are written (?P<name>…).")
					} else if (renamed !== name) {
						edits.push({
							from: header.range[0],
							to: header.range[1],
							text: `(?<${renamed}>`,
						})
					}
				}
				break
			}
			case "reference":
				if (target === "go" || target === "rust") {
					add(
						"unsupported",
						node,
						`${TARGET_NAMES[target]} has no backreferences: ${node.raw} can't run.`,
						"Capture both parts and compare them in code.",
					)
				} else if (node.name) {
					const name = node.name.value
					const renamed = names.get(name) ?? name
					if (target === "python")
						rewrite(
							node,
							`(?P=${renamed})`,
							"Named backreferences are written (?P=name).",
						)
					else if (renamed !== name)
						edits.push({
							from: node.range[0],
							to: node.range[1],
							text: `\\k<${renamed}>`,
						})
				}
				break
			case "quantifier":
				if (target === "go" && Math.max(node.min, node.max ?? 0) > 1000) {
					add(
						"unsupported",
						node,
						`Go allows at most 1000 repetitions: ${node.raw} asks for more.`,
					)
				}
				break
			case "unicodePropertyEscape": {
				const script = /^(?:Script|sc)=(.+)$/.exec(node.value)?.[1]
				const letter = node.negative ? "P" : "p"
				if (target === "python") {
					add(
						"unsupported",
						node,
						`Python's re has no Unicode properties: ${node.raw} can't run.`,
						"Use the third-party regex package, which accepts \\p{…}.",
					)
				} else if (script && target === "java") {
					rewrite(
						node,
						`\\${letter}{Is${script}}`,
						`Scripts are written \\p{IsName} in Java.`,
					)
				} else if (script && (target === "go" || target === "php")) {
					rewrite(
						node,
						`\\${letter}{${script}}`,
						`Scripts are written \\p{Name} in ${TARGET_NAMES[target]}.`,
					)
				}
				break
			}
			case "characterClass":
				if (node.body.length === 0) {
					if (node.negative) {
						rewrite(
							node,
							"[\\s\\S]",
							"[^] (any character) is JavaScript-only, so it becomes [\\s\\S].",
						)
					} else {
						add(
							"unsupported",
							node,
							"[] (never matches) is JavaScript-only.",
							"Remove this branch of the pattern.",
						)
					}
				}
				if (node.kind === "subtraction" && target !== "rust") {
					add(
						"unsupported",
						node,
						`${TARGET_NAMES[target]} has no class subtraction: ${node.raw} can't run.`,
						"List the characters you want instead.",
					)
				}
				if (node.kind === "intersection" && target !== "rust" && target !== "java") {
					add(
						"unsupported",
						node,
						`${TARGET_NAMES[target]} has no class intersection: ${node.raw} can't run.`,
						"List the characters you want instead.",
					)
				}
				// With the v flag a class inside a class adds to it; elsewhere `[` is often just a
				// character, so the pattern can run and mean something else.
				if (
					node.kind === "union" &&
					target !== "rust" &&
					target !== "java" &&
					(node.body as Node[]).some((item) => item.type === "characterClass")
				) {
					add(
						"unsupported",
						node,
						`${TARGET_NAMES[target]} has no nested classes: ${node.raw} would mean something else.`,
						"Flatten it into one class.",
					)
				}
				break
			case "characterClassEscape": {
				const lower = node.value.toLowerCase()
				if (
					(lower === "d" || lower === "w") &&
					(target === "python" || target === "rust")
				) {
					once(
						"unicode-dw",
						"behaviour",
						node,
						`${TARGET_NAMES[target]}'s ${node.raw} also matches non-ASCII letters and digits; JavaScript's is ASCII only.`,
						target === "python"
							? "Add re.ASCII for the JavaScript meaning."
							: "Use (?-u:\\d) or (?-u:\\w) for the JavaScript meaning.",
					)
				}
				if ((lower === "d" || lower === "w") && target === "php" && unicodeMode) {
					once(
						"unicode-dw",
						"behaviour",
						node,
						`With /u, PHP's ${node.raw} also matches non-ASCII letters and digits; JavaScript's is ASCII only.`,
					)
				}
				if (
					lower === "s" &&
					(target === "go" || target === "java" || (target === "php" && !unicodeMode))
				) {
					once(
						"ascii-s",
						"behaviour",
						node,
						`${TARGET_NAMES[target]}'s ${node.raw} only covers ASCII whitespace; JavaScript's includes Unicode spaces like U+00A0.`,
					)
				}
				break
			}
			case "anchor":
				if (
					node.kind === "end" &&
					!multiline &&
					(target === "python" || target === "java" || target === "php")
				) {
					once(
						"dollar",
						"behaviour",
						node,
						`${TARGET_NAMES[target]}'s $ also matches just before a final newline; JavaScript's only matches the very end.`,
						`Use ${target === "python" ? "\\Z" : "\\z"} for the JavaScript meaning.`,
					)
				}
				if (node.kind === "boundary" || node.kind === "not-boundary") {
					if (target === "python" || target === "rust") {
						once(
							"unicode-b",
							"behaviour",
							node,
							`${TARGET_NAMES[target]}'s ${node.raw} treats non-ASCII letters as word characters; JavaScript's doesn't.`,
						)
					}
				}
				break
			case "value": {
				const { kind, codePoint, raw } = node
				if (kind === "null") {
					rewrite(node, "\\x00", "\\0 is written \\x00.")
				} else if (kind === "controlLetter" && target !== "java" && target !== "php") {
					rewrite(node, `\\x${hex(codePoint)}`, `${raw} is written \\x${hex(codePoint)}.`)
				} else if (
					kind === "singleEscape" &&
					codePoint === 11 &&
					(target === "java" || target === "php")
				) {
					// `\v` is a whole class of vertical whitespace in these two.
					rewrite(node, "\\x0B", "\\v means something wider here, so it becomes \\x0B.")
				} else if (kind === "singleEscape" && codePoint === 8) {
					rewrite(node, "\\x08", "[\\b] (backspace) is written \\x08.")
				} else if (kind === "unicodeEscape" && (target === "go" || target === "php")) {
					rewrite(node, `\\x{${hex(codePoint, 4)}}`, "\\uXXXX is written \\x{XXXX}.")
				} else if (kind === "unicodeCodePointEscape") {
					if (target === "python")
						rewrite(node, `\\U${hex(codePoint, 8)}`, "\\u{…} is written \\UXXXXXXXX.")
					else if (target !== "rust")
						rewrite(node, `\\x{${hex(codePoint)}}`, "\\u{…} is written \\x{…}.")
				} else if (kind === "identifier" && /^\\[A-Za-z]$/.test(raw)) {
					// JavaScript lets any letter be escaped without meaning anything; others reject it.
					rewrite(
						node,
						raw.slice(1),
						`${raw} is just ${raw.slice(1)}, and the escape is an error here.`,
					)
				} else if (kind === "identifier" && /^\\[<>]$/.test(raw) && target === "rust") {
					rewrite(
						node,
						raw.slice(1),
						`${raw} means a word boundary in Rust, so the backslash is dropped.`,
					)
				} else if (
					kind === "symbol" &&
					raw === "{" &&
					!inClass(parent) &&
					parent?.type !== "characterClassRange" &&
					(target === "java" ||
						target === "rust" ||
						((target === "python" || target === "php") &&
							/^\{,\d+\}/.test(pattern.slice(node.range[0]))))
				) {
					// JavaScript takes a `{` that isn't a valid quantifier as itself. Java and Rust
					// reject it, and Python and PCRE read `{,3}` as a quantifier.
					rewrite(node, "\\{", "A literal { must be escaped here.")
				} else if (inClass(parent) && kind === "symbol" && raw === "[") {
					rewrite(node, "\\[", "A literal [ inside a class must be escaped.")
				} else if (
					inClass(parent) &&
					kind === "symbol" &&
					raw === "&" &&
					(target === "java" || target === "rust")
				) {
					rewrite(node, "\\&", "A literal & inside a class must be escaped here.")
				}
				break
			}
			default:
		}
	})

	if (flags.includes("y")) {
		issues.push({
			level: "behaviour",
			message: `${TARGET_NAMES[target]} has no sticky flag, so y is dropped.`,
			suggestion:
				target === "python"
					? "Use pattern.match(text, pos)."
					: target === "java" || target === "php"
						? "Start the pattern with \\G."
						: undefined,
			from: 0,
			to: 0,
		})
	}

	const status: Status = issues.some((issue) => issue.level === "unsupported")
		? "unsupported"
		: issues.some((issue) => issue.level === "rewrite")
			? "changes"
			: "works"

	let output: string | null = null
	if (status !== "unsupported") {
		output = pattern
		for (const edit of [...edits].sort((a, b) => b.from - a.from)) {
			output = output.slice(0, edit.from) + edit.text + output.slice(edit.to)
		}
	}
	return { target, status, issues, pattern: output, names, unicodeMode }
}
