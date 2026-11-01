import { foldService, indentService } from "@codemirror/language"

function leadingColumns(text: string) {
	return /^\s*/.exec(text)?.[0].replace(/\t/g, "    ").length ?? 0
}

/**
 * Indent one level after a line matching `opens`, and one level out when the text
 * after the cursor matches `closes`. Works for any line-oriented language.
 */
export function blockIndent(opens: RegExp, closes: RegExp) {
	return indentService.of((context, pos) => {
		const after = context.textAfterPos(pos).trimStart()
		// context.lineAt sees the line break Enter is about to insert; the raw doc does not.
		let { from } = context.lineAt(pos)
		while (from > 0) {
			const line = context.lineAt(from - 1, -1)
			if (line.text.trim()) {
				let column = leadingColumns(line.text) + (opens.test(line.text) ? context.unit : 0)
				if (closes.test(after)) column -= context.unit
				return Math.max(0, column)
			}
			from = line.from
		}
		return 0
	})
}

/** Fold any line together with the more deeply indented lines below it. */
export const foldByIndent = foldService.of((state, from) => {
	const line = state.doc.lineAt(from)
	if (!line.text.trim()) return null
	const base = leadingColumns(line.text)
	let last = line
	for (let number = line.number + 1; number <= state.doc.lines; number++) {
		const next = state.doc.line(number)
		if (!next.text.trim()) continue
		if (leadingColumns(next.text) <= base) break
		last = next
	}
	return last.number > line.number ? { from: line.to, to: last.to } : null
})
