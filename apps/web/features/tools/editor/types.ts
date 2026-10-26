import type { Extension } from "@codemirror/state"

/**
 * One kind of text the shared editor can edit. The editor core knows nothing about
 * any language: each tool injects the one it needs through `CodeEditor`'s `language` prop.
 */
export type EditorLanguage = {
	name: string
	/** Parser, highlighting, completion sources, indentation and folding. */
	extensions: Extension
	/** What Tab and auto-indent insert. Defaults to two spaces. */
	indentUnit?: string
	/** Soft-wrap long lines, for prose rather than code. */
	wrap?: boolean
}
