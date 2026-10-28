import { syntaxTree } from "@codemirror/language"
import type { EditorState } from "@codemirror/state"
import type { PathSegment } from "./secrets"

export type PathFormat = "jsonpath" | "jq" | "javascript" | "python"

type SyntaxNode = ReturnType<ReturnType<typeof syntaxTree>["resolveInner"]>

const VALUE_NODES = new Set(["Object", "Array", "String", "Number", "True", "False", "Null"])

/**
 * The path to the key or value at `pos` in a JSON editor, read from its syntax tree.
 * Null when the cursor isn't on a value (whitespace at the top level, or not JSON).
 */
export function pathAt(state: EditorState, pos: number): PathSegment[] | null {
	let node: SyntaxNode | null = syntaxTree(state).resolveInner(pos, -1)
	if (node.name === "JsonText" || node.type.isError) node = syntaxTree(state).resolveInner(pos, 1)
	if (node.name === "JsonText") return null
	const segments: PathSegment[] = []
	for (; node && node.name !== "JsonText"; node = node.parent) {
		const parent: SyntaxNode | null = node.parent
		if (node.name === "Property") {
			const name = node.getChild("PropertyName")
			if (!name) return null
			try {
				segments.unshift(JSON.parse(state.sliceDoc(name.from, name.to)) as string)
			} catch {
				return null
			}
		} else if (parent?.name === "Array" && VALUE_NODES.has(node.name)) {
			let index = 0
			for (let sibling = node.prevSibling; sibling; sibling = sibling.prevSibling) {
				if (VALUE_NODES.has(sibling.name)) index++
			}
			segments.unshift(index)
		}
	}
	return segments
}

const JS_IDENTIFIER = /^[A-Za-z_$][\w$]*$/
const JQ_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/

function dotted(segments: PathSegment[], identifier: RegExp) {
	return segments
		.map((segment) =>
			typeof segment === "number"
				? `[${segment}]`
				: identifier.test(segment)
					? `.${segment}`
					: `[${JSON.stringify(segment)}]`,
		)
		.join("")
}

export function formatPath(segments: PathSegment[], format: PathFormat) {
	switch (format) {
		case "jsonpath":
			return `$${dotted(segments, JS_IDENTIFIER)}`
		case "jq":
			return dotted(segments, JQ_IDENTIFIER) || "."
		case "javascript":
			return `data${dotted(segments, JS_IDENTIFIER)}`
		case "python":
			return `data${segments.map((segment) => `[${JSON.stringify(segment)}]`).join("")}`
	}
}
