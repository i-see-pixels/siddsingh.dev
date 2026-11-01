import { describe, expect, it } from "vitest"
import { faqFromMarkdown, faqPageJsonLd } from "@/lib/structured-data"

describe("faqFromMarkdown", () => {
	it("reads each ### question under ## FAQ as plain text", () => {
		const markdown = [
			"Intro.",
			"",
			"## FAQ",
			"",
			"### What is the best [JSON formatter](/tools/json-formatter)?",
			"",
			"One that runs **in your browser**, like `mine`.",
			"See [the tool](/tools/json-formatter).",
			"",
			"### Is it free?",
			"",
			"Yes.",
			"",
			"## Want to try it?",
			"",
			"Not part of the FAQ.",
		].join("\n")

		expect(faqFromMarkdown(markdown)).toEqual([
			{
				question: "What is the best JSON formatter?",
				answer: "One that runs in your browser, like mine. See the tool.",
			},
			{ question: "Is it free?", answer: "Yes." },
		])
	})

	it("reads an FAQ that ends the post", () => {
		expect(faqFromMarkdown("## FAQ\n\n### Why?\n\nBecause.")).toEqual([
			{ question: "Why?", answer: "Because." },
		])
	})

	it("returns nothing for a post without an FAQ", () => {
		expect(faqFromMarkdown("## Intro\n\n### Not a question\n\nText.")).toEqual([])
	})
})

describe("faqPageJsonLd", () => {
	it("wraps each item as a Question with an accepted Answer", () => {
		expect(faqPageJsonLd([{ question: "Q?", answer: "A." }]).mainEntity).toEqual([
			{ "@type": "Question", name: "Q?", acceptedAnswer: { "@type": "Answer", text: "A." } },
		])
	})
})
