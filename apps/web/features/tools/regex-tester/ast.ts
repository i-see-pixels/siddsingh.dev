// Parses a pattern with regjsparser. The one AST drives the explanation, the language
// checks and the ReDoS check. Pure and DOM-free.

import { type AstNode, parse } from "regjsparser"

const FEATURES = {
	lookbehind: true,
	namedGroups: true,
	unicodePropertyEscape: true,
	unicodeSet: true,
	modifiers: true,
} as const

export type Node = AstNode<typeof FEATURES>

/** A capturing group: its 1-based number and its name, if any. */
export type CaptureGroup = { index: number; name?: string; from: number; to: number }

export type ParsedPattern =
	| { ok: true; root: Node; groups: CaptureGroup[] }
	| { ok: false; position?: number }

/** The direct children of a node, in pattern order. */
export function childrenOf(node: Node): Node[] {
	switch (node.type) {
		case "alternative":
		case "disjunction":
		case "group":
		case "quantifier":
			return node.body as Node[]
		case "characterClass":
			return node.body as Node[]
		case "characterClassRange":
			return [node.min, node.max]
		default:
			return []
	}
}

/** Visits `node` and everything under it, parents first. */
export function walk(
	node: Node,
	visit: (node: Node, parent: Node | null) => void,
	parent: Node | null = null,
) {
	visit(node, parent)
	for (const child of childrenOf(node)) walk(child, visit, node)
}

export function parsePattern(pattern: string, flags: string): ParsedPattern {
	try {
		// `d`, `g` and `y` don't change how a pattern parses; regjsparser only reads `u` and `v`.
		const root = parse(pattern, flags.replace(/[^uv]/g, ""), FEATURES) as Node
		const groups: CaptureGroup[] = []
		walk(root, (node) => {
			if (node.type === "group" && node.behavior === "normal") {
				groups.push({
					index: groups.length + 1,
					name: node.name?.value,
					from: node.range[0],
					to: node.range[1],
				})
			}
		})
		return { ok: true, root, groups }
	} catch (error) {
		const position = /position (\d+)/.exec(error instanceof Error ? error.message : "")?.[1]
		return { ok: false, position: position === undefined ? undefined : Number(position) }
	}
}

/** Shortest and longest text a node can match; `Infinity` when there's no limit. */
export function widthOf(node: Node): { min: number; max: number } {
	switch (node.type) {
		case "alternative":
			return (node.body as Node[]).reduce(
				(sum, child) => {
					const width = widthOf(child)
					return { min: sum.min + width.min, max: sum.max + width.max }
				},
				{ min: 0, max: 0 },
			)
		case "disjunction": {
			const widths = (node.body as Node[]).map(widthOf)
			return {
				min: Math.min(...widths.map((width) => width.min)),
				max: Math.max(...widths.map((width) => width.max)),
			}
		}
		case "group":
			if (node.behavior !== "normal" && node.behavior !== "ignore") return { min: 0, max: 0 }
			return widthOf({
				type: "alternative",
				body: node.body,
				range: node.range,
				raw: node.raw,
			} as Node)
		case "quantifier": {
			const inner = widthOf(node.body[0] as Node)
			const max = node.max === undefined ? Number.POSITIVE_INFINITY : node.max
			return { min: inner.min * node.min, max: inner.max === 0 ? 0 : inner.max * max }
		}
		case "anchor":
			return { min: 0, max: 0 }
		case "reference":
			return { min: 0, max: Number.POSITIVE_INFINITY }
		default:
			return { min: 1, max: 1 }
	}
}
