import {
	autocompletion,
	closeBrackets,
	closeBracketsKeymap,
	completionKeymap,
} from "@codemirror/autocomplete"
import { defaultKeymap, history, historyKeymap, indentLess, indentMore } from "@codemirror/commands"
import {
	bracketMatching,
	foldGutter,
	foldKeymap,
	HighlightStyle,
	indentOnInput,
	indentUnit,
	syntaxHighlighting,
} from "@codemirror/language"
import { highlightSelectionMatches, search, searchKeymap } from "@codemirror/search"
import { EditorSelection, StateEffect, StateField } from "@codemirror/state"
import {
	type Command,
	Decoration,
	drawSelection,
	EditorView,
	highlightActiveLine,
	highlightActiveLineGutter,
	keymap,
	lineNumbers,
} from "@codemirror/view"
import { tags as t } from "@lezer/highlight"
import { inlineMarks } from "./marks"

/** One colour per token kind, shared by every language so all the tools read alike. */
const highlight = HighlightStyle.define([
	{ tag: t.heading, class: "font-semibold text-brand" },
	{ tag: [t.keyword, t.bool, t.null], class: "text-violet-600 dark:text-violet-400" },
	{ tag: t.operator, class: "text-sky-600 dark:text-sky-400" },
	{ tag: t.propertyName, class: "text-brand" },
	{ tag: t.string, class: "text-emerald-600 dark:text-emerald-400" },
	{ tag: [t.number, t.atom], class: "text-amber-600 dark:text-amber-400" },
	{ tag: t.className, class: "text-pink-600 dark:text-pink-400" },
	{
		tag: t.special(t.variableName),
		class: "rounded-sm bg-brand-muted text-brand",
	},
	{ tag: [t.comment, t.meta], class: "text-muted-foreground italic" },
	{ tag: [t.bracket, t.separator], class: "text-muted-foreground" },
])

/** Tab inserts spaces up to the next indent stop, or indents the selected lines. */
const insertIndent: Command = (view) => {
	if (view.state.selection.ranges.some((range) => !range.empty)) return indentMore(view)
	const unit = view.state.facet(indentUnit)
	view.dispatch(
		view.state.changeByRange((range) => {
			const column = range.head - view.state.doc.lineAt(range.head).from
			const insert = unit.includes("\t")
				? "\t"
				: " ".repeat(unit.length - (column % unit.length))
			return {
				changes: { from: range.head, insert },
				range: EditorSelection.cursor(range.head + insert.length),
			}
		}),
		{ scrollIntoView: true, userEvent: "input" },
	)
	return true
}

export const setErrorLine = StateEffect.define<number | undefined>()

/** Tints the 1-based line a tool reports an error on. */
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

// Font family, size and line height are inherited from the element around the editor.
const theme = EditorView.theme({
	"&": { height: "100%", backgroundColor: "transparent" },
	"&.cm-focused": { outline: "none" },
	".cm-scroller": { fontFamily: "inherit", lineHeight: "inherit" },
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
 * The behaviour every tool's editor shares, whatever the language: line numbers, folding,
 * history, auto-closing brackets, Tab indentation, completion, search and Mod-/ comments.
 */
export const editorCore = [
	lineNumbers(),
	foldGutter(),
	highlightActiveLineGutter(),
	highlightActiveLine(),
	history(),
	drawSelection(),
	indentOnInput(),
	bracketMatching(),
	closeBrackets(),
	autocompletion({ icons: false }),
	search({ top: true }),
	highlightSelectionMatches(),
	syntaxHighlighting(highlight),
	errorLineField,
	inlineMarks,
	keymap.of([
		...closeBracketsKeymap,
		...completionKeymap,
		{ key: "Tab", run: insertIndent, shift: indentLess },
		...searchKeymap,
		...foldKeymap,
		...historyKeymap,
		...defaultKeymap,
	]),
	theme,
]
