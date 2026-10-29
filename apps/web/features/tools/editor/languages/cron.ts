import { StreamLanguage } from "@codemirror/language"
import { tags as t } from "@lezer/highlight"
import type { EditorLanguage } from "../types"

/** Colours each space-separated field of a cron expression; `cron(…)` and `CRON_TZ=` stay muted. */
const cronLanguage = StreamLanguage.define<{ field: number; started: boolean }>({
	name: "cron",
	startState: () => ({ field: 0, started: false }),
	token(stream, state) {
		if (stream.eatSpace()) {
			if (state.started && !stream.eol() && stream.peek() !== ")") state.field++
			return null
		}
		if (!state.started && stream.match(/^(CRON_TZ|TZ)=\S+/)) return "comment"
		if (!state.started && stream.match(/^cron\(/i)) return "meta"
		if (stream.eat(")")) return "meta"
		if (!state.started && stream.match(/^@\w+/)) {
			state.started = true
			return "keyword"
		}
		state.started = true
		if (stream.match(/^[*?/,#-]/)) return "operator"
		if (stream.match(/^[A-Za-z0-9]+/)) return `f${Math.min(state.field, 6)}`
		stream.next()
		return null
	},
	tokenTable: {
		f0: t.keyword,
		f1: t.propertyName,
		f2: t.atom,
		f3: t.string,
		f4: t.className,
		f5: t.heading,
		f6: t.number,
	},
	languageData: { closeBrackets: { brackets: ["("] } },
})

/** Cron expressions in any dialect, one colour per field. */
export const cron: EditorLanguage = { name: "cron", extensions: cronLanguage }
