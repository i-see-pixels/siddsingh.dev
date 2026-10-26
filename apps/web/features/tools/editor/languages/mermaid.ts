// biome-ignore-all lint/suspicious/noTemplateCurlyInString: ${} marks CodeMirror snippet fields
import { type CompletionContext, snippetCompletion } from "@codemirror/autocomplete"
import { StreamLanguage } from "@codemirror/language"
import { tags as t } from "@lezer/highlight"
import type { EditorLanguage } from "../types"
import { blockIndent, foldByIndent } from "./shared"

const DIAGRAMS = [
	"flowchart",
	"graph",
	"sequenceDiagram",
	"classDiagram",
	"stateDiagram-v2",
	"stateDiagram",
	"erDiagram",
	"gantt",
	"pie",
	"journey",
	"mindmap",
	"timeline",
	"gitGraph",
	"quadrantChart",
	"requirementDiagram",
	"xychart-beta",
	"sankey-beta",
	"block-beta",
	"C4Context",
]

const KEYWORDS = [
	"subgraph",
	"end",
	"direction",
	"classDef",
	"class",
	"style",
	"linkStyle",
	"click",
	"participant",
	"actor",
	"as",
	"loop",
	"alt",
	"else",
	"opt",
	"par",
	"and",
	"rect",
	"critical",
	"option",
	"break",
	"box",
	"note",
	"Note",
	"over",
	"left of",
	"right of",
	"activate",
	"deactivate",
	"autonumber",
	"title",
	"dateFormat",
	"axisFormat",
	"excludes",
	"section",
	"state",
	"accTitle",
	"accDescr",
	"commit",
	"branch",
	"checkout",
	"merge",
]

const DIRECTIONS = ["TD", "TB", "BT", "LR", "RL"]

const KEYWORD_SET = new Set([...KEYWORDS, ...DIRECTIONS].flatMap((word) => word.split(" ")))
const DIAGRAM_SET = new Set(DIAGRAMS)

// Flowchart, sequence and ER arrows: -->, ---, ==>, -.->, ->>, -x, -), ||--o{ and friends.
const ARROW =
	/^(?:<<?|[xo](?=[-=.])|\|[|o]|\}[|o])?(?:-{2,}|={2,}|-\.+-?|\.{2,}|-(?=[-)>x]))(?:>>?|[xo](?!\w)|[|o]\{|[|o]\||\))?/

const mermaidLanguage = StreamLanguage.define<{ lineStart: boolean }>({
	name: "mermaid",
	startState: () => ({ lineStart: true }),
	token(stream, state) {
		if (stream.sol()) state.lineStart = true
		if (stream.eatSpace()) return null
		const first = state.lineStart
		state.lineStart = false

		if (stream.match(/^%%\{.*?\}%%/)) return "meta"
		if (stream.match("%%")) {
			stream.skipToEnd()
			return "comment"
		}
		if (stream.match(/^"[^"]*"?/)) return "string"
		if (stream.match(/^:::[\w-]+/)) return "className"
		if (stream.match(/^#[0-9a-fA-F]{3,8}\b/)) return "atom"
		if (stream.match(ARROW)) return "operator"
		if (stream.match(/^-?\d+(?:\.\d+)?(?:%|px|d|h|w)?\b/)) return "number"
		const word = stream.match(/^[A-Za-z_][\w-]*/)
		if (word && typeof word !== "boolean") {
			if (first && DIAGRAM_SET.has(word[0])) return "heading"
			if (KEYWORD_SET.has(word[0])) return "keyword"
			return null
		}
		if (stream.match(/^[[\](){}]/)) return "bracket"
		stream.next()
		return null
	},
	tokenTable: { heading: t.heading, className: t.className },
	languageData: {
		commentTokens: { line: "%%" },
		closeBrackets: { brackets: ["(", "[", "{", '"', "|"] },
		indentOnInput: /^\s*(?:end|else|and|option|\})$/,
		autocomplete: complete,
	},
})

const OPENS =
	/^\s*(?:(?:flowchart|graph|sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|gantt|pie|journey|mindmap|timeline|gitGraph|quadrantChart|requirementDiagram|xychart-beta|sankey-beta|block-beta|C4\w*|subgraph|loop|alt|else|opt|par|and|rect|critical|option|break|box)\b|.*\{\s*$)/
const CLOSES = /^(?:end|else|and|option|\})\b/

const snippets = [
	snippetCompletion("flowchart ${TD}\n    ${A} --> ${B}", {
		label: "flowchart",
		detail: "diagram",
		type: "class",
	}),
	snippetCompletion("sequenceDiagram\n    ${A}->>${B}: ${message}", {
		label: "sequenceDiagram",
		detail: "diagram",
		type: "class",
	}),
	snippetCompletion("subgraph ${title}\n    ${}\nend", {
		label: "subgraph",
		detail: "block",
		type: "keyword",
	}),
	snippetCompletion("loop ${condition}\n    ${}\nend", {
		label: "loop",
		detail: "block",
		type: "keyword",
	}),
	snippetCompletion("alt ${condition}\n    ${}\nelse ${otherwise}\n    \nend", {
		label: "alt",
		detail: "block",
		type: "keyword",
	}),
	snippetCompletion("classDef ${name} fill:${#ede9fe},stroke:${#8b5cf6}", {
		label: "classDef",
		detail: "style",
		type: "keyword",
	}),
]
const snippetLabels = new Set(snippets.map((option) => option.label))

/** Keywords, diagram types and the node ids already in the diagram. */
function complete(context: CompletionContext) {
	const word = context.matchBefore(/[A-Za-z_][\w-]*/)
	if (!word || (word.from === word.to && !context.explicit)) return null
	const ids = new Set<string>()
	for (const match of context.state.doc.toString().matchAll(/[A-Za-z_][\w-]*/g)) {
		if (match.index !== word.from) ids.add(match[0])
	}
	const known = new Set([...DIAGRAMS, ...KEYWORDS, ...DIRECTIONS])
	return {
		from: word.from,
		validFor: /^[\w-]*$/,
		options: [
			...snippets,
			...DIAGRAMS.filter((label) => !snippetLabels.has(label)).map((label) => ({
				label,
				type: "class",
				detail: "diagram",
			})),
			...[...KEYWORDS, ...DIRECTIONS]
				.filter((label) => !snippetLabels.has(label))
				.map((label) => ({ label, type: "keyword" })),
			...[...ids]
				.filter((id) => !known.has(id))
				.map((label) => ({ label, type: "variable", boost: -1 })),
		],
	}
}

/** Mermaid diagrams: highlighting, completion and block-aware indent and folding. */
export const mermaid: EditorLanguage = {
	name: "mermaid",
	indentUnit: "    ",
	extensions: [mermaidLanguage, blockIndent(OPENS, CLOSES), foldByIndent],
}
