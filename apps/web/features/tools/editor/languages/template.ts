import type { CompletionContext } from "@codemirror/autocomplete"
import { StreamLanguage } from "@codemirror/language"
import type { EditorLanguage } from "../types"

/**
 * Prompt templates with `{{variable}}` placeholders. Typing `{{` closes the braces and
 * offers the variables from `knownVariables` plus those already in the text.
 */
export function promptTemplate(knownVariables: () => string[] = () => []): EditorLanguage {
	function complete(context: CompletionContext) {
		const match = context.matchBefore(/\{\{\s*[\w.-]*/)
		if (!match) return null
		const from = match.from + (/^\{\{\s*/.exec(match.text)?.[0].length ?? 2)
		const names = new Set(knownVariables())
		for (const found of context.state.doc.toString().matchAll(/\{\{\s*([A-Za-z_][\w.-]*)/g)) {
			if (found.index !== match.from && found[1]) names.add(found[1])
		}
		return {
			from,
			validFor: /^[\w.-]*$/,
			options: [...names].map((label) => ({ label, type: "variable" })),
		}
	}

	const language = StreamLanguage.define({
		name: "prompt-template",
		token(stream) {
			if (stream.match(/^\{\{\s*[A-Za-z_][\w.-]*\s*\}\}/)) return "variable-2"
			stream.next()
			while (!stream.eol() && !stream.match("{{", false)) stream.next()
			return null
		},
		languageData: {
			closeBrackets: { brackets: ["(", "[", "{", '"'] },
			autocomplete: complete,
		},
	})

	return { name: "prompt-template", wrap: true, extensions: language }
}
