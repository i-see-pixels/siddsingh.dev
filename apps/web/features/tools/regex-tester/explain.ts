// Turns the AST into plain-English rows, one per token. Pure and DOM-free.

import type { Node } from "./ast"

export type ExplainRow = {
	depth: number
	token: string
	text: string
	from: number
	to: number
}

const CLASS_ESCAPES: Record<string, string> = {
	d: "a digit (0–9)",
	D: "anything except a digit",
	w: "a word character (letter, digit or _)",
	W: "anything except a word character",
	s: "whitespace",
	S: "anything except whitespace",
}

const ANCHORS: Record<string, string> = {
	start: "start of the text (or line, with the m flag)",
	end: "end of the text (or line, with the m flag)",
	boundary: "a word boundary",
	"not-boundary": "not a word boundary",
}

const GROUPS: Record<string, string> = {
	lookahead: "lookahead: must be followed by this",
	negativeLookahead: "negative lookahead: must not be followed by this",
	lookbehind: "lookbehind: must come after this",
	negativeLookbehind: "negative lookbehind: must not come after this",
	ignore: "group that doesn't capture",
}

function describeChar(codePoint: number) {
	const names: Record<number, string> = {
		9: "a tab",
		10: "a newline",
		13: "a carriage return",
		32: "a space",
		0: "the null character",
	}
	return names[codePoint] ?? `"${String.fromCodePoint(codePoint)}"`
}

function quantifierText(min: number, max: number | undefined, greedy: boolean) {
	let text: string
	if (min === 0 && max === 1) text = "optional"
	else if (min === 0 && max === undefined) text = "zero or more times"
	else if (min === 1 && max === undefined) text = "one or more times"
	else if (max === undefined) text = `${min} or more times`
	else if (min === max) text = `exactly ${min} ${min === 1 ? "time" : "times"}`
	else text = `${min} to ${max} times`
	return greedy ? text : `${text}, as few as possible`
}

function isSingleToken(node: Node) {
	return node.type !== "group" && node.type !== "alternative" && node.type !== "disjunction"
}

/** A one-line description of a node that needs no rows of its own. */
function describeAtom(node: Node, dotAll: boolean): string {
	switch (node.type) {
		case "value":
			return describeChar(node.codePoint)
		case "dot":
			return dotAll ? "any character, including a newline" : "any character except a newline"
		case "characterClassEscape":
			return CLASS_ESCAPES[node.value] ?? node.raw
		case "unicodePropertyEscape":
			return `${node.negative ? "anything except " : ""}Unicode ${node.value}`
		case "anchor":
			return ANCHORS[node.kind] ?? node.raw
		case "reference":
			return node.name
				? `the same text as group ${node.name.value}`
				: `the same text as group ${node.matchIndex}`
		case "characterClass": {
			const parts = (node.body as Node[]).map((item) =>
				item.type === "characterClassRange"
					? `${describeChar(item.min.codePoint)} to ${describeChar(item.max.codePoint)}`
					: describeAtom(item, dotAll),
			)
			if (parts.length === 0)
				return node.negative ? "any character at all" : "nothing (this never matches)"
			// With the v flag, the items of a class can subtract or intersect instead of adding up.
			const combined =
				node.kind === "subtraction"
					? `${parts[0]}, but not ${parts.slice(1).join(" or ")}`
					: node.kind === "intersection"
						? parts.join(" that is also ")
						: undefined
			if (combined) return node.negative ? `anything except ${combined}` : combined
			return `${node.negative ? "any character except" : "one of"} ${parts.join(", ")}`
		}
		case "quantifier":
			return `${describeAtom(node.body[0] as Node, dotAll)}, ${quantifierText(node.min, node.max, node.greedy)}`
		default:
			return node.raw
	}
}

export function explain(root: Node, flags = "") {
	const dotAll = flags.includes("s")
	const rows: ExplainRow[] = []
	const add = (node: Node, depth: number, text: string) =>
		rows.push({ depth, token: node.raw, text, from: node.range[0], to: node.range[1] })
	let groupNumber = 0

	const visit = (node: Node, depth: number) => {
		switch (node.type) {
			case "alternative": {
				// Runs of plain characters read better as one literal.
				let run: Node[] = []
				const flush = () => {
					const first = run[0]
					const last = run.at(-1)
					if (first && last) {
						const raw = run.map((item) => item.raw).join("")
						const text = run
							.map((item) =>
								item.type === "value" ? String.fromCodePoint(item.codePoint) : "",
							)
							.join("")
						rows.push({
							depth,
							token: raw,
							text:
								run.length === 1
									? `the character ${describeAtom(first, dotAll)}`
									: `the text "${text}"`,
							from: first.range[0],
							to: last.range[1],
						})
					}
					run = []
				}
				for (const child of node.body as Node[]) {
					if (child.type === "value") run.push(child)
					else {
						flush()
						visit(child, depth)
					}
				}
				flush()
				break
			}
			case "disjunction":
				add(node, depth, `any one of ${node.body.length} alternatives`)
				for (const child of node.body as Node[]) visit(child, depth + 1)
				break
			case "group": {
				let label: string
				if (node.behavior === "normal") {
					groupNumber++
					label = node.name
						? `capture group ${groupNumber}, named ${node.name.value}`
						: `capture group ${groupNumber}`
				} else label = GROUPS[node.behavior] ?? "group"
				add(node, depth, label)
				for (const child of node.body as Node[]) visit(child, depth + 1)
				break
			}
			case "quantifier": {
				const body = node.body[0] as Node
				if (isSingleToken(body)) add(node, depth, describeAtom(node, dotAll))
				else {
					add(node, depth, `repeat ${quantifierText(node.min, node.max, node.greedy)}:`)
					visit(body, depth + 1)
				}
				break
			}
			default:
				add(node, depth, describeAtom(node, dotAll))
		}
	}
	visit(root, 0)
	return rows
}
