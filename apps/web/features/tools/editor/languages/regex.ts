import { StreamLanguage } from "@codemirror/language"
import { tags as t } from "@lezer/highlight"
import type { EditorLanguage } from "../types"

/** Colours groups, classes, quantifiers, escapes and anchors in a JavaScript pattern. */
const regexLanguage = StreamLanguage.define<{ inClass: boolean }>({
	name: "regex",
	startState: () => ({ inClass: false }),
	token(stream, state) {
		if (
			stream.match(
				/^\\(?:[pP]\{[^}]*\}|u\{[0-9a-fA-F]+\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|c[A-Za-z]|k<[^>]*>|[\s\S])/,
			)
		) {
			return "escape"
		}
		if (state.inClass) {
			if (stream.eat("]")) {
				state.inClass = false
				return "className"
			}
			stream.next()
			return "className"
		}
		if (stream.match(/^\[\^?/)) {
			state.inClass = true
			return "className"
		}
		if (
			stream.match(/^\(\?(?:<?[=!]|:|<[^>]*>|[a-z-]+:)?/) ||
			stream.match("(") ||
			stream.eat(")")
		) {
			return "keyword"
		}
		if (stream.match(/^(?:[*+?]|\{\d+(?:,\d*)?\})\??/)) return "operator"
		if (stream.match(/^[\^$|.]/)) return "atom"
		stream.next()
		return null
	},
	tokenTable: { className: t.className, escape: t.string },
	languageData: { closeBrackets: { brackets: ["(", "[", "{"] } },
})

/** JavaScript regular expressions. */
export const regex: EditorLanguage = { name: "regex", extensions: regexLanguage }
