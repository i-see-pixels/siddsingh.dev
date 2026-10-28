import { isMap, isSeq, type Node, parseDocument, stringify as stringifyYaml } from "yaml"

export type InputKind = "json" | "yaml"
export type OutputMode = "formatted" | "minified" | "yaml"
export type Indent = "2" | "4" | "tab"

export type ParseResult =
	| { status: "empty" }
	| { status: "ok"; kind: InputKind; value: unknown; yamlComments: boolean }
	| { status: "error"; message: string; line?: number; column?: number }

/**
 * JSON first. Text that fails as JSON is tried as YAML, but only when it doesn't start
 * like JSON and gives an object or array: almost any text is a valid YAML scalar, and
 * broken JSON such as `{"a": 1,}` is valid YAML flow syntax, so both would otherwise
 * hide the JSON error the user needs to see.
 */
export function parseInput(text: string): ParseResult {
	if (!text.trim()) return { status: "empty" }
	try {
		return { status: "ok", kind: "json", value: JSON.parse(text), yamlComments: false }
	} catch (error) {
		const jsonError = describeJsonError(text, error)
		if (/^\s*[{["]/.test(text)) return jsonError
		const doc = parseDocument(text)
		if (doc.errors.length > 0) return jsonError
		const value = doc.toJS()
		if (value === null || typeof value !== "object") return jsonError
		return { status: "ok", kind: "yaml", value, yamlComments: hasComments(doc) }
	}
}

function describeJsonError(text: string, error: unknown): ParseResult {
	const message = error instanceof Error ? error.message : "Invalid JSON"
	const lineColumn = message.match(/line (\d+) column (\d+)/)
	if (lineColumn) {
		return {
			status: "error",
			message,
			line: Number(lineColumn[1]),
			column: Number(lineColumn[2]),
		}
	}
	// Older messages give only a position; "unexpected end" gives nothing, so point at the end.
	const position = Number(message.match(/position (\d+)/)?.[1] ?? text.length)
	const before = text.slice(0, position).split("\n")
	return {
		status: "error",
		message,
		line: before.length,
		column: (before.at(-1)?.length ?? 0) + 1,
	}
}

function hasComments(doc: ReturnType<typeof parseDocument>) {
	if (doc.commentBefore || doc.comment) return true
	const walk = (node: unknown): boolean => {
		if (!node || typeof node !== "object") return false
		const { comment, commentBefore } = node as Node
		if (comment || commentBefore) return true
		if (isMap(node)) return node.items.some((pair) => walk(pair.key) || walk(pair.value))
		if (isSeq(node)) return node.items.some(walk)
		return false
	}
	return walk(doc.contents)
}

function sortKeysDeep(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(sortKeysDeep)
	if (value && typeof value === "object") {
		return Object.fromEntries(
			Object.keys(value)
				.sort()
				.map((key) => [key, sortKeysDeep((value as Record<string, unknown>)[key])]),
		)
	}
	return value
}

export function formatValue(
	value: unknown,
	mode: OutputMode,
	options: { indent: Indent; sortKeys: boolean },
) {
	const data = options.sortKeys ? sortKeysDeep(value) : value
	if (mode === "minified") return JSON.stringify(data)
	if (mode === "yaml") return stringifyYaml(data, { indent: options.indent === "4" ? 4 : 2 })
	return JSON.stringify(data, null, options.indent === "tab" ? "\t" : Number(options.indent))
}

/** Integer literals past 15 digits, which `JSON.parse` may round. Strings are skipped. */
export function countLargeNumbers(text: string) {
	let count = 0
	for (const match of text.matchAll(/"(?:[^"\\]|\\.)*"|-?\d{16,}(?![.\deE])/g)) {
		if (!match[0].startsWith('"')) count++
	}
	return count
}

export function depthOf(value: unknown): number {
	if (!value || typeof value !== "object") return 0
	const children = Array.isArray(value) ? value : Object.values(value)
	return 1 + children.reduce<number>((max, child) => Math.max(max, depthOf(child)), 0)
}

export function formatBytes(bytes: number) {
	if (bytes < 1024) return `${bytes} B`
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
	return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
