// Static check for patterns that can backtrack catastrophically. A heuristic over the AST:
// characters are modelled as sets over ASCII, with one extra slot for everything else.
// Pure and DOM-free.

import type { Node } from "./ast"

export type RedosFinding = {
	kind: "nested" | "alternation" | "adjacent"
	severity: "exponential" | "polynomial"
	message: string
	fix: string
	from: number
	to: number
	/** A short input likely to show the slowdown. */
	probe: string
}

const OTHER = 128
type CharSet = Set<number>

const range = (from: number, to: number) => {
	const set: CharSet = new Set()
	for (let value = from; value <= to; value++) set.add(value)
	return set
}
const everything = () => range(0, OTHER)
const union = (a: CharSet, b: CharSet) => new Set([...a, ...b])
const overlaps = (a: CharSet, b: CharSet) => [...a].some((value) => b.has(value))
const invert = (set: CharSet) => new Set([...everything()].filter((value) => !set.has(value)))

const DIGITS = range(48, 57)
const WORD = new Set([...DIGITS, ...range(65, 90), ...range(97, 122), 95])
const SPACE = new Set([9, 10, 11, 12, 13, 32, OTHER])

function folded(codePoint: number, ignoreCase: boolean): CharSet {
	const value = codePoint > 127 ? OTHER : codePoint
	const set: CharSet = new Set([value])
	if (ignoreCase && value >= 65 && value <= 90) set.add(value + 32)
	if (ignoreCase && value >= 97 && value <= 122) set.add(value - 32)
	return set
}

function escapeSet(value: string): CharSet {
	const lower = value.toLowerCase()
	const base = lower === "d" ? DIGITS : lower === "w" ? WORD : SPACE
	return value === lower ? base : invert(base)
}

/** The characters one instance of a single-character token can match. */
function atomSet(node: Node, ignoreCase: boolean): CharSet | null {
	switch (node.type) {
		case "value":
			return folded(node.codePoint, ignoreCase)
		case "dot": {
			const set = everything()
			set.delete(10)
			set.delete(13)
			return set
		}
		case "characterClassEscape":
			return escapeSet(node.value)
		case "unicodePropertyEscape":
			return everything()
		case "characterClassRange": {
			let set: CharSet = new Set()
			const end = Math.min(node.max.codePoint, 127)
			for (let value = node.min.codePoint; value <= end; value++)
				set = union(set, folded(value, ignoreCase))
			if (node.max.codePoint > 127) set.add(OTHER)
			return set
		}
		case "characterClass": {
			let set: CharSet = new Set()
			for (const item of node.body as Node[])
				set = union(set, atomSet(item, ignoreCase) ?? everything())
			return node.negative ? invert(set) : set
		}
		default:
			return null
	}
}

const nullable = (node: Node): boolean => {
	switch (node.type) {
		case "quantifier":
			return node.min === 0 || nullable(node.body[0] as Node)
		case "alternative":
			return (node.body as Node[]).every(nullable)
		case "disjunction":
			return (node.body as Node[]).some(nullable)
		case "group":
			if (node.behavior !== "normal" && node.behavior !== "ignore") return true
			return (node.body as Node[]).every(nullable)
		case "anchor":
		case "reference":
			return true
		default:
			return false
	}
}

/** Characters a node can start with. */
function firstSet(node: Node, ignoreCase: boolean): CharSet {
	switch (node.type) {
		case "alternative":
			return sequenceFirst(node.body as Node[], ignoreCase)
		case "group":
			if (node.behavior !== "normal" && node.behavior !== "ignore") return new Set()
			return sequenceFirst(node.body as Node[], ignoreCase)
		case "disjunction":
			return (node.body as Node[]).reduce<CharSet>(
				(set, item) => union(set, firstSet(item, ignoreCase)),
				new Set(),
			)
		case "quantifier":
			return firstSet(node.body[0] as Node, ignoreCase)
		case "anchor":
			return new Set()
		case "reference":
			return everything()
		default:
			return atomSet(node, ignoreCase) ?? everything()
	}
}

function sequenceFirst(nodes: Node[], ignoreCase: boolean): CharSet {
	let set: CharSet = new Set()
	for (const node of nodes) {
		set = union(set, firstSet(node, ignoreCase))
		if (!nullable(node)) break
	}
	return set
}

/** The node's sequence: a group or alternative's items, or the node alone. */
function sequenceOf(node: Node): Node[] {
	if (node.type === "alternative") return node.body as Node[]
	if (node.type === "group" && (node.behavior === "normal" || node.behavior === "ignore")) {
		const body = node.body as Node[]
		const only = body[0]
		return body.length === 1 && only ? sequenceOf(only) : body
	}
	return [node]
}

const unbounded = (node: Node) => node.type === "quantifier" && node.max === undefined
/** Enough repeats for a nested quantifier to blow up. */
const repeatsALot = (node: Node) =>
	node.type === "quantifier" && (node.max === undefined || node.max >= 10)

function sample(set: CharSet) {
	for (const preferred of [97, 48, 32])
		if (set.has(preferred)) return String.fromCharCode(preferred)
	for (const value of set) if (value < 127 && value > 32) return String.fromCharCode(value)
	return "a"
}

function failing(set: CharSet) {
	for (const value of [33, 35, 126, 1]) if (!set.has(value)) return String.fromCharCode(value)
	return "\n"
}

const probeFor = (set: CharSet) => `${sample(set).repeat(30)}${failing(set)}`

/**
 * Inner unbounded quantifiers whose text can run straight into what comes next inside the
 * outer repeat: the same input then splits between iterations in exponentially many ways.
 */
function findInner(
	body: Node[],
	wrap: CharSet,
	ignoreCase: boolean,
	found: (inner: Node, set: CharSet) => void,
) {
	body.forEach((node, index) => {
		const rest = body.slice(index + 1)
		let follow = sequenceFirst(rest, ignoreCase)
		if (rest.every(nullable)) follow = union(follow, wrap)
		if (node.type === "disjunction") {
			for (const branch of node.body as Node[])
				findInner(sequenceOf(branch), follow, ignoreCase, found)
		} else if (
			node.type === "group" &&
			(node.behavior === "normal" || node.behavior === "ignore")
		) {
			findInner(sequenceOf(node), follow, ignoreCase, found)
		} else if (node.type === "quantifier" && unbounded(node)) {
			const set = firstSet(node, ignoreCase)
			if (overlaps(set, follow)) found(node, set)
		}
	})
}

function atomsOf(branch: Node, ignoreCase: boolean): CharSet[] | null {
	const sets: CharSet[] = []
	for (const item of sequenceOf(branch)) {
		const set = atomSet(item, ignoreCase)
		if (!set) return null
		sets.push(set)
	}
	return sets
}

/** Whether two branches can spell the same text: they repeat the same few characters. */
function ambiguous(a: Node, b: Node, ignoreCase: boolean) {
	if (a.raw === b.raw) return true
	const first = atomsOf(a, ignoreCase)
	const second = atomsOf(b, ignoreCase)
	if (!first || !second) return false
	const sets = [...first, ...second]
	return [...(sets[0] ?? [])].some((value) => sets.every((set) => set.has(value)))
}

export function findRedos(root: Node, flags: string) {
	const ignoreCase = flags.includes("i")
	const findings: RedosFinding[] = []

	const visit = (node: Node) => {
		if (node.type === "quantifier" && repeatsALot(node)) {
			const body = node.body[0] as Node
			const items = sequenceOf(body)
			let hit = false
			findInner(items, sequenceFirst(items, ignoreCase), ignoreCase, (inner, set) => {
				if (hit) return
				hit = true
				findings.push({
					kind: "nested",
					severity: "exponential",
					message: `${inner.raw} repeats inside ${node.raw}, so the same text can split between the loops in exponentially many ways.`,
					fix: "Remove the inner or outer quantifier, or put a required separator between repeats.",
					from: node.range[0],
					to: node.range[1],
					probe: probeFor(set),
				})
			})
			const inner =
				body.type === "group" && body.body.length === 1 ? (body.body[0] as Node) : body
			if (!hit && unbounded(node) && inner.type === "disjunction") {
				const branches = inner.body as Node[]
				outer: for (let a = 0; a < branches.length; a++) {
					for (let b = a + 1; b < branches.length; b++) {
						const first = branches[a]
						const second = branches[b]
						if (first && second && ambiguous(first, second, ignoreCase)) {
							findings.push({
								kind: "alternation",
								severity: "exponential",
								message: `${first.raw} and ${second.raw} can match the same text inside ${node.raw}, so each character can be taken two ways.`,
								fix: "Make the alternatives distinct, so only one can match at each position.",
								from: node.range[0],
								to: node.range[1],
								probe: probeFor(firstSet(first, ignoreCase)),
							})
							break outer
						}
					}
				}
			}
		}

		if (node.type === "alternative") {
			const items = node.body as Node[]
			for (let index = 0; index + 1 < items.length; index++) {
				const a = items[index]
				const b = items[index + 1]
				if (!a || !b || !unbounded(a) || !unbounded(b)) continue
				const set = firstSet(a, ignoreCase)
				// With nothing after them the match can't fail, so there's nothing to retry.
				const after = items.slice(index + 2)
				if (overlaps(set, firstSet(b, ignoreCase)) && after.length > 0) {
					findings.push({
						kind: "adjacent",
						severity: "polynomial",
						message: `${a.raw} and ${b.raw} overlap, so when what follows fails, every split between them is retried.`,
						fix: "Merge them into one quantifier, or make the two sets distinct.",
						from: a.range[0],
						to: b.range[1],
						probe: probeFor(set),
					})
					break
				}
			}
		}

		if (
			node.type === "alternative" ||
			node.type === "disjunction" ||
			node.type === "group" ||
			node.type === "quantifier"
		) {
			for (const child of node.body as Node[]) visit(child)
		}
	}
	visit(root)

	// A nested finding usually contains smaller ones; keep the outermost of each overlap.
	return findings.filter(
		(finding, index) =>
			!findings.some(
				(other, otherIndex) =>
					otherIndex !== index &&
					other.from <= finding.from &&
					finding.to <= other.to &&
					(other.from !== finding.from || other.to !== finding.to || otherIndex < index),
			),
	)
}
