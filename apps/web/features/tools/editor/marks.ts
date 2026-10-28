import { StateEffect, StateField } from "@codemirror/state"
import { Decoration, EditorView, hoverTooltip } from "@codemirror/view"

/** A highlighted range in the editor, with an optional hover card and action. */
export type InlineMark = {
	from: number
	to: number
	/** Class on the marked text; `cm-mark-high`, `cm-mark-medium` and `cm-mark-low` are styled here. */
	className: string
	tooltip?: {
		title: string
		detail?: string
		action?: { label: string; run: () => void }
	}
}

export const setMarks = StateEffect.define<InlineMark[]>()

const marksField = StateField.define<{
	marks: InlineMark[]
	decorations: ReturnType<typeof Decoration.set>
}>({
	create: () => ({ marks: [], decorations: Decoration.none }),
	update(value, transaction) {
		for (const effect of transaction.effects) {
			if (!effect.is(setMarks)) continue
			const length = transaction.state.doc.length
			const marks = effect.value
				.filter((mark) => mark.from < mark.to && mark.to <= length)
				.sort((a, b) => a.from - b.from)
			return {
				marks,
				decorations: Decoration.set(
					marks.map((mark) =>
						Decoration.mark({ class: mark.className }).range(mark.from, mark.to),
					),
				),
			}
		}
		if (!transaction.docChanged) return value
		// Edits move the marks until the tool sends a fresh set.
		const changes = transaction.changes
		return {
			marks: value.marks.map((mark) => ({
				...mark,
				from: changes.mapPos(mark.from, 1),
				to: changes.mapPos(mark.to, -1),
			})),
			decorations: value.decorations.map(changes),
		}
	},
	provide: (field) => EditorView.decorations.from(field, (value) => value.decorations),
})

const markTooltip = hoverTooltip((view, pos) => {
	const mark = view.state
		.field(marksField)
		.marks.find((item) => item.tooltip && item.from <= pos && pos <= item.to)
	if (!mark?.tooltip) return null
	const { title, detail, action } = mark.tooltip
	return {
		pos: mark.from,
		end: mark.to,
		above: true,
		create() {
			const dom = document.createElement("div")
			dom.className = "cm-markTooltip"
			const heading = dom.appendChild(document.createElement("strong"))
			heading.textContent = title
			if (detail) dom.appendChild(document.createElement("span")).textContent = detail
			if (action) {
				const button = dom.appendChild(document.createElement("button"))
				button.type = "button"
				button.textContent = action.label
				button.addEventListener("click", action.run)
			}
			return { dom }
		},
	}
})

const theme = EditorView.theme({
	".cm-mark-high": {
		textDecoration: "underline wavy var(--destructive)",
		textDecorationSkipInk: "none",
		textUnderlineOffset: "3px",
	},
	".cm-mark-medium": {
		textDecoration: "underline wavy #f59e0b",
		textDecorationSkipInk: "none",
		textUnderlineOffset: "3px",
	},
	".cm-mark-low": {
		textDecoration: "underline dotted var(--muted-foreground)",
		textUnderlineOffset: "3px",
	},
	".cm-markTooltip": {
		display: "flex",
		flexDirection: "column",
		gap: "2px",
		padding: "8px 10px",
		maxWidth: "18rem",
		fontFamily: "var(--font-sans), system-ui, sans-serif",
		fontSize: "12px",
		lineHeight: "1.4",
	},
	".cm-markTooltip span": { color: "var(--muted-foreground)" },
	".cm-markTooltip button": {
		alignSelf: "flex-start",
		marginTop: "6px",
		padding: "2px 8px",
		borderRadius: "6px",
		border: "1px solid var(--border)",
		background: "var(--background)",
		color: "var(--foreground)",
		cursor: "pointer",
	},
})

/** Marks pushed in with `setMarks`; part of the editor core so any tool can use them. */
export const inlineMarks = [marksField, markTooltip, theme]
