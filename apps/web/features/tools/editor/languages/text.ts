import { EditorState } from "@codemirror/state"
import type { EditorLanguage } from "../types"
import { blockIndent, foldByIndent } from "./shared"

/** Code in any language: no highlighting, but bracket-aware indentation and folding. */
export const plainText: EditorLanguage = {
	name: "text",
	indentUnit: "  ",
	extensions: [
		EditorState.languageData.of(() => [{ indentOnInput: /^\s*[\]})]$/ }]),
		blockIndent(/[[{(]\s*$/, /^[\]})]/),
		foldByIndent,
	],
}

/** Prose such as prompts: wrapped lines, and no auto-closed apostrophes. */
export const prose: EditorLanguage = {
	name: "prose",
	wrap: true,
	extensions: EditorState.languageData.of(() => [
		{ closeBrackets: { brackets: ["(", "[", "{", '"'] } },
	]),
}
