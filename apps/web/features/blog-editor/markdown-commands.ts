// Pure Markdown formatting commands. Each takes the source and the selection
// and returns one replacement for the editor to apply, so they stay testable
// and the editor can apply them in a way that keeps the browser's undo stack.

export type Selection = { start: number; end: number }

export type TextEdit = {
	/** Range to replace. */
	from: number
	to: number
	insert: string
	/** Selection after the edit. */
	select: Selection
}

export type MarkdownCommand = (value: string, selection: Selection) => TextEdit

/** Surrounds the selection, e.g. **bold**. With nothing selected, inserts and selects a placeholder. */
function wrap(before: string, after: string, placeholder: string): MarkdownCommand {
	return (value, { start, end }) => {
		const text = value.slice(start, end) || placeholder
		const from = start + before.length
		return {
			from: start,
			to: end,
			insert: `${before}${text}${after}`,
			select: { start: from, end: from + text.length },
		}
	}
}

/**
 * Adds a prefix to every selected line, or removes it when all of them already
 * have exactly that prefix. `existing` matches related prefixes to swap out, so
 * a "## " heading becomes "### " rather than "### ## ".
 */
function prefixLines(prefix: (index: number) => string, existing: RegExp): MarkdownCommand {
	return (value, { start, end }) => {
		const from = value.lastIndexOf("\n", start - 1) + 1
		const lineEnd = value.indexOf("\n", end)
		const to = lineEnd === -1 ? value.length : lineEnd
		const lines = value.slice(from, to).split("\n")
		const remove = lines.every((line, index) => line.startsWith(prefix(index)))
		const insert = lines
			.map((line, index) =>
				remove
					? line.replace(existing, "")
					: `${prefix(index)}${line.replace(existing, "")}`,
			)
			.join("\n")
		return { from, to, insert, select: { start: from, end: from + insert.length } }
	}
}

const heading = (level: 2 | 3) => prefixLines(() => `${"#".repeat(level)} `, /^#{1,6} /)

export const commands = {
	heading2: heading(2),
	heading3: heading(3),
	bold: wrap("**", "**", "bold text"),
	italic: wrap("_", "_", "italic text"),
	code: wrap("`", "`", "code"),
	codeBlock: wrap("```\n", "\n```", "code"),
	quote: prefixLines(() => "> ", /^> /),
	bulletList: prefixLines(() => "- ", /^[-*] /),
	orderedList: prefixLines((index) => `${index + 1}. `, /^\d+\. /),
	/** Wraps the selection as link text and selects the URL to type over. */
	link: (value, { start, end }) => {
		const text = value.slice(start, end) || "link text"
		const url = "https://"
		const urlStart = start + text.length + 3
		return {
			from: start,
			to: end,
			insert: `[${text}](${url})`,
			select: { start: urlStart, end: urlStart + url.length },
		}
	},
	/** Puts a URL in a paragraph of its own (which renders as an embed) and selects it. */
	embed: (value, { start, end }) => {
		const url = value.slice(start, end).trim() || "https://"
		const before = value.slice(0, start)
		const after = value.slice(end)
		const lead =
			before === "" || before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n"
		const trail = after.startsWith("\n\n") ? "" : after.startsWith("\n") ? "\n" : "\n\n"
		const urlStart = start + lead.length
		return {
			from: start,
			to: end,
			insert: `${lead}${url}${trail}`,
			select: { start: urlStart, end: urlStart + url.length },
		}
	},
} satisfies Record<string, MarkdownCommand>

export type CommandName = keyof typeof commands

/** Inserts an image on its own line at the cursor. */
export function insertImage(value: string, { start, end }: Selection, url: string, alt: string) {
	const before = start > 0 && value[start - 1] !== "\n" ? "\n" : ""
	const after = value[end] === "\n" ? "" : "\n"
	const insert = `${before}![${alt.replace(/[[\]]/g, "")}](${url})${after}`
	const caret = start + insert.length
	return { from: start, to: end, insert, select: { start: caret, end: caret } } satisfies TextEdit
}
