const WORDS_PER_MINUTE = 230

/** Word count and reading time of a post's Markdown, ignoring code blocks, links' URLs and markup. */
export function readingStats(markdown: string) {
	const text = markdown
		.replace(/```[\s\S]*?```/g, " ")
		.replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
		.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
		.replace(/https?:\/\/\S+/g, " ")
		.replace(/[#>*_`~|-]/g, " ")
	const wordCount = text.split(/\s+/).filter(Boolean).length
	return { wordCount, minutes: Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE)) }
}
