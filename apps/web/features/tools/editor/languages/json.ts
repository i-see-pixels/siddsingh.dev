import { json as jsonSupport } from "@codemirror/lang-json"
import type { EditorLanguage } from "../types"

/** JSON, with a real parser behind highlighting, indentation and folding. */
export const json: EditorLanguage = {
	name: "json",
	indentUnit: "  ",
	extensions: jsonSupport(),
}
