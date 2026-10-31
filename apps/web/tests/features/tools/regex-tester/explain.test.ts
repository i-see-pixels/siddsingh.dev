import { describe, expect, it } from "vitest"
import { parsePattern } from "@/features/tools/regex-tester/ast"
import { explain } from "@/features/tools/regex-tester/explain"

const raw = String.raw

function rows(pattern: string, flags = "") {
	const parsed = parsePattern(pattern, flags)
	if (!parsed.ok) throw new Error(`didn't parse: ${pattern}`)
	return explain(parsed.root, flags)
}

describe("explain", () => {
	it("describes a named group and its contents", () => {
		expect(rows(raw`(?<year>\d{4})`)).toEqual([
			{
				depth: 0,
				token: raw`(?<year>\d{4})`,
				text: "capture group 1, named year",
				from: 0,
				to: 14,
			},
			{
				depth: 1,
				token: raw`\d{4}`,
				text: "a digit (0–9), exactly 4 times",
				from: 8,
				to: 13,
			},
		])
	})

	it("joins plain characters into one row", () => {
		expect(rows("abc")).toMatchObject([
			{ token: "abc", text: 'the text "abc"', from: 0, to: 3 },
		])
	})

	it("describes alternatives, classes, anchors and lookaround", () => {
		const text = rows(raw`^(?:cat|dog)[^a-z]+?(?=!)\b$`).map((row) => row.text)
		expect(text).toContain("start of the text (or line, with the m flag)")
		expect(text).toContain("any one of 2 alternatives")
		expect(text).toContain(
			'any character except "a" to "z", one or more times, as few as possible',
		)
		expect(text).toContain("lookahead: must be followed by this")
		expect(text).toContain("a word boundary")
	})

	it("explains repeated groups and references", () => {
		const text = rows(raw`(ab)+\1`).map((row) => row.text)
		expect(text[0]).toBe("repeat one or more times:")
		expect(text).toContain("the same text as group 1")
	})

	it("reads v-mode subtraction and intersection for what they do", () => {
		expect(rows(raw`[\w--\d]`, "v")[0]?.text).toBe(
			"a word character (letter, digit or _), but not a digit (0–9)",
		)
		expect(rows(raw`[\w&&[a-f]]`, "v")[0]?.text).toBe(
			'a word character (letter, digit or _) that is also one of "a" to "f"',
		)
	})

	it("describes the dot by the s flag", () => {
		expect(rows(".")[0]?.text).toBe("any character except a newline")
		expect(rows(".", "s")[0]?.text).toBe("any character, including a newline")
	})
})
