// biome-ignore-all lint/suspicious/noTemplateCurlyInString: ${} marks CodeMirror snippet fields
"use client"

import {
	autocompletion,
	type CompletionContext,
	closeBrackets,
	closeBracketsKeymap,
	completionKeymap,
	snippetCompletion,
} from "@codemirror/autocomplete"
import { defaultKeymap, history, historyKeymap, indentLess, indentMore } from "@codemirror/commands"
import {
	bracketMatching,
	foldGutter,
	foldKeymap,
	foldService,
	HighlightStyle,
	type IndentContext,
	indentOnInput,
	indentService,
	indentUnit,
	StreamLanguage,
	syntaxHighlighting,
} from "@codemirror/language"
import { highlightSelectionMatches, search, searchKeymap } from "@codemirror/search"
import {
	EditorSelection,
	EditorState,
	type Extension,
	StateEffect,
	StateField,
} from "@codemirror/state"
import {
	type Command,
	Decoration,
	drawSelection,
	EditorView,
	highlightActiveLine,
	highlightActiveLineGutter,
	keymap,
	lineNumbers,
	placeholder as placeholderText,
} from "@codemirror/view"
import { tags as t } from "@lezer/highlight"
import { useEffect, useRef } from "react"

const UNIT = "    "

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
	},
})

const highlight = HighlightStyle.define([
	{ tag: t.heading, class: "font-semibold text-brand" },
	{ tag: t.keyword, class: "text-violet-600 dark:text-violet-400" },
	{ tag: t.operator, class: "text-sky-600 dark:text-sky-400" },
	{ tag: t.string, class: "text-emerald-600 dark:text-emerald-400" },
	{ tag: [t.number, t.atom], class: "text-amber-600 dark:text-amber-400" },
	{ tag: t.className, class: "text-pink-600 dark:text-pink-400" },
	{ tag: [t.comment, t.meta], class: "text-muted-foreground italic" },
	{ tag: t.bracket, class: "text-muted-foreground" },
])

const OPENS =
	/^\s*(?:(?:flowchart|graph|sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|gantt|pie|journey|mindmap|timeline|gitGraph|quadrantChart|requirementDiagram|xychart-beta|sankey-beta|block-beta|C4\w*|subgraph|loop|alt|else|opt|par|and|rect|critical|option|break|box)\b|.*\{\s*$)/
const CLOSES = /^(?:end|else|and|option|\})\b/

function leadingSpaces(text: string) {
	return /^\s*/.exec(text)?.[0].replace(/\t/g, UNIT).length ?? 0
}

/** Indent one level inside blocks (diagram header, subgraph, loop, `{`), and step out for `end`. */
const blockIndent = indentService.of((context: IndentContext, pos: number) => {
	const after = context.textAfterPos(pos).trimStart()
	// context.lineAt sees the line break Enter is about to insert; the raw doc does not.
	let { from } = context.lineAt(pos)
	while (from > 0) {
		const line = context.lineAt(from - 1, -1)
		if (line.text.trim()) {
			let column = leadingSpaces(line.text) + (OPENS.test(line.text) ? context.unit : 0)
			if (CLOSES.test(after)) column -= context.unit
			return Math.max(0, column)
		}
		from = line.from
	}
	return 0
})

/** Fold any line together with the more deeply indented lines below it. */
const foldByIndent = foldService.of((state, from) => {
	const line = state.doc.lineAt(from)
	if (!line.text.trim()) return null
	const base = leadingSpaces(line.text)
	let last = line
	for (let number = line.number + 1; number <= state.doc.lines; number++) {
		const next = state.doc.line(number)
		if (!next.text.trim()) continue
		if (leadingSpaces(next.text) <= base) break
		last = next
	}
	return last.number > line.number ? { from: line.to, to: last.to } : null
})

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

/** Tab inserts spaces up to the next indent stop, or indents the selected lines. */
const insertIndent: Command = (view) => {
	if (view.state.selection.ranges.some((range) => !range.empty)) return indentMore(view)
	view.dispatch(
		view.state.changeByRange((range) => {
			const line = view.state.doc.lineAt(range.head)
			const column = range.head - line.from
			const spaces = UNIT.length - (column % UNIT.length)
			return {
				changes: { from: range.head, insert: " ".repeat(spaces) },
				range: EditorSelection.cursor(range.head + spaces),
			}
		}),
		{ scrollIntoView: true, userEvent: "input" },
	)
	return true
}

const setErrorLine = StateEffect.define<number | undefined>()
const errorLineField = StateField.define({
	create: () => Decoration.none,
	update(decorations, transaction) {
		decorations = decorations.map(transaction.changes)
		for (const effect of transaction.effects) {
			if (!effect.is(setErrorLine)) continue
			const { doc } = transaction.state
			decorations =
				effect.value && effect.value <= doc.lines
					? Decoration.set(
							Decoration.line({ class: "cm-errorLine" }).range(
								doc.line(effect.value).from,
							),
						)
					: Decoration.none
		}
		return decorations
	},
	provide: (field) => EditorView.decorations.from(field),
})

const theme = EditorView.theme({
	"&": { height: "100%", backgroundColor: "transparent", fontSize: "13px" },
	"&.cm-focused": { outline: "none" },
	".cm-scroller": {
		fontFamily: "var(--font-mono), ui-monospace, monospace",
		lineHeight: "1.5rem",
	},
	".cm-content": { padding: "12px 0", caretColor: "var(--foreground)" },
	".cm-line": { padding: "0 12px" },
	".cm-cursor": { borderLeftColor: "var(--foreground)" },
	".cm-gutters": {
		backgroundColor: "color-mix(in oklab, var(--muted) 30%, transparent)",
		borderRight: "1px solid var(--line)",
		color: "color-mix(in oklab, var(--muted-foreground) 70%, transparent)",
	},
	".cm-lineNumbers .cm-gutterElement": { minWidth: "2.25rem", padding: "0 10px 0 4px" },
	".cm-foldGutter .cm-gutterElement": { width: "14px", paddingRight: "2px" },
	".cm-activeLine": { backgroundColor: "color-mix(in oklab, var(--muted) 45%, transparent)" },
	".cm-activeLineGutter": { backgroundColor: "transparent", color: "var(--foreground)" },
	"&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground":
		{ backgroundColor: "color-mix(in oklab, var(--brand) 22%, transparent)" },
	".cm-selectionMatch": { backgroundColor: "color-mix(in oklab, var(--brand) 12%, transparent)" },
	"&.cm-focused .cm-matchingBracket": {
		backgroundColor: "color-mix(in oklab, var(--brand) 18%, transparent)",
		outline: "1px solid color-mix(in oklab, var(--brand) 45%, transparent)",
	},
	".cm-errorLine": {
		backgroundColor: "color-mix(in oklab, var(--destructive) 10%, transparent)",
	},
	".cm-placeholder": { color: "var(--muted-foreground)" },
	".cm-tooltip": {
		backgroundColor: "var(--popover)",
		color: "var(--popover-foreground)",
		border: "1px solid var(--border)",
		borderRadius: "8px",
		overflow: "hidden",
		boxShadow: "0 8px 24px rgb(0 0 0 / 0.12)",
	},
	".cm-tooltip-autocomplete > ul": { fontFamily: "inherit", maxHeight: "14rem" },
	".cm-tooltip-autocomplete > ul > li": { padding: "2px 10px" },
	".cm-tooltip-autocomplete > ul > li[aria-selected]": {
		backgroundColor: "var(--brand-muted)",
		color: "var(--foreground)",
	},
	".cm-completionDetail": { color: "var(--muted-foreground)", fontStyle: "normal" },
	".cm-panels": {
		backgroundColor: "var(--background)",
		color: "var(--foreground)",
		borderColor: "var(--line)",
	},
	".cm-panel.cm-search": { padding: "6px 10px", fontFamily: "inherit" },
	".cm-panel.cm-search input, .cm-panel.cm-search button": {
		borderRadius: "6px",
		border: "1px solid var(--border)",
		backgroundColor: "var(--background)",
		backgroundImage: "none",
		color: "inherit",
	},
	".cm-searchMatch": { backgroundColor: "color-mix(in oklab, #f59e0b 25%, transparent)" },
	".cm-searchMatch-selected": {
		backgroundColor: "color-mix(in oklab, #f59e0b 50%, transparent)",
	},
})

/**
 * A CodeMirror editor for Mermaid: highlighting, auto-closing brackets and quotes,
 * Tab indentation, block-aware auto-indent, folding, completion, search and Mod-/ comments.
 */
export function MermaidEditor({
	value,
	docKey,
	onChange,
	label,
	placeholder,
	errorLine,
}: {
	value: string
	/** A new key swaps in a fresh document with its own undo history. */
	docKey: string
	onChange: (value: string) => void
	label: string
	placeholder?: string
	errorLine?: number
}) {
	const hostRef = useRef<HTMLDivElement>(null)
	const viewRef = useRef<EditorView | null>(null)
	const extensionsRef = useRef<Extension[]>([])
	const docKeyRef = useRef(docKey)
	const onChangeRef = useRef(onChange)
	onChangeRef.current = onChange

	// Built once; later prop changes are pushed in by the effects below.
	useEffect(() => {
		if (!hostRef.current) return
		extensionsRef.current = [
			lineNumbers(),
			foldGutter(),
			highlightActiveLineGutter(),
			highlightActiveLine(),
			history(),
			drawSelection(),
			EditorState.allowMultipleSelections.of(true),
			indentUnit.of(UNIT),
			EditorState.tabSize.of(UNIT.length),
			mermaidLanguage,
			syntaxHighlighting(highlight),
			blockIndent,
			foldByIndent,
			indentOnInput(),
			bracketMatching(),
			closeBrackets(),
			autocompletion({ override: [complete], icons: false }),
			search({ top: true }),
			highlightSelectionMatches(),
			errorLineField,
			placeholderText(placeholder ?? ""),
			EditorView.contentAttributes.of({ "aria-label": label }),
			keymap.of([
				...closeBracketsKeymap,
				...completionKeymap,
				{ key: "Tab", run: insertIndent, shift: indentLess },
				...searchKeymap,
				...foldKeymap,
				...historyKeymap,
				...defaultKeymap,
			]),
			EditorView.updateListener.of((update) => {
				if (update.docChanged) onChangeRef.current(update.state.doc.toString())
			}),
			theme,
		]
		const view = new EditorView({
			parent: hostRef.current,
			state: EditorState.create({ doc: value, extensions: extensionsRef.current }),
		})
		viewRef.current = view
		return () => {
			view.destroy()
			viewRef.current = null
		}
	}, [])

	// Switching diagrams starts a fresh document; a reset is an ordinary edit, so Mod-Z undoes it.
	useEffect(() => {
		const view = viewRef.current
		if (!view) return
		if (docKeyRef.current !== docKey) {
			docKeyRef.current = docKey
			view.setState(EditorState.create({ doc: value, extensions: extensionsRef.current }))
			view.dispatch({ effects: setErrorLine.of(undefined) })
		} else if (view.state.doc.toString() !== value) {
			view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } })
		}
	}, [value, docKey])

	useEffect(() => {
		viewRef.current?.dispatch({ effects: setErrorLine.of(errorLine) })
	}, [errorLine])

	return <div ref={hostRef} className="min-h-0 flex-1 overflow-hidden" />
}
