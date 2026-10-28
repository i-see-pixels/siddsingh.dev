import { StreamLanguage } from "@codemirror/language"
import { tags as t } from "@lezer/highlight"
import type { EditorLanguage } from "../types"

const SEGMENTS = ["seg0", "seg1", "seg2", "seg3", "seg4"]

/** Colours each dot-separated part of a token; a pasted `Bearer ` prefix or quotes stay muted. */
const jwtLanguage = StreamLanguage.define<{ segment: number; started: boolean }>({
	name: "jwt",
	startState: () => ({ segment: 0, started: false }),
	token(stream, state) {
		if (stream.eatSpace()) return null
		if (!state.started && stream.match(/^bearer\s+/i)) return "comment"
		if (stream.match(/^["'`]/)) return "comment"
		state.started = true
		if (stream.eat(".")) {
			state.segment++
			return "dot"
		}
		if (stream.match(/^[A-Za-z0-9_\-=]+/)) return SEGMENTS[Math.min(state.segment, 4)] ?? null
		stream.next()
		return null
	},
	tokenTable: {
		seg0: t.keyword,
		seg1: t.propertyName,
		seg2: t.atom,
		seg3: t.string,
		seg4: t.className,
		dot: t.separator,
	},
	languageData: { closeBrackets: { brackets: [] } },
})

/** JSON Web Tokens: header, payload and signature in three colours, wrapped. */
export const jwt: EditorLanguage = { name: "jwt", wrap: true, extensions: jwtLanguage }
