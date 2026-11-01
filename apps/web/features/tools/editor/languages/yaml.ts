import { yaml as yamlSupport } from "@codemirror/lang-yaml"
import type { EditorLanguage } from "../types"

/** YAML, with a real parser behind highlighting, indentation and folding. */
export const yaml: EditorLanguage = {
	name: "yaml",
	indentUnit: "  ",
	extensions: yamlSupport(),
}
