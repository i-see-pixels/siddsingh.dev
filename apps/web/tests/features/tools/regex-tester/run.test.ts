import { describe, expect, it } from "vitest"
import { MAX_MATCHES, runRegex } from "@/features/tools/regex-tester/run"

describe("runRegex", () => {
	it("agrees with matchAll, including group positions", () => {
		const text = "2026-10-31 and 1999-01-02"
		const pattern = String.raw`(?<year>\d{4})-(\d{2})`
		const result = runRegex({ pattern, flags: "g", text })
		const expected = [...text.matchAll(new RegExp(pattern, "gd"))]
		expect(result.matches.map((match) => match.start)).toEqual(
			expected.map((match) => match.index),
		)
		expect(result.matches[1]?.groups).toEqual([
			{ index: 1, start: 15, end: 19, text: "1999" },
			{ index: 2, start: 20, end: 22, text: "01" },
		])
		expect(result.groupCount).toBe(2)
	})

	it("finds one match without g", () => {
		expect(runRegex({ pattern: "a", flags: "", text: "aaa" }).matches).toHaveLength(1)
	})

	it("steps past empty matches", () => {
		expect(runRegex({ pattern: "x*", flags: "g", text: "ab" }).matches).toHaveLength(3)
		expect(runRegex({ pattern: "", flags: "gu", text: "😀" }).matches).toHaveLength(2)
	})

	it("skips groups that didn't take part", () => {
		const [match] = runRegex({ pattern: "(a)|(b)", flags: "", text: "b" }).matches
		expect(match?.groups.map((group) => group.index)).toEqual([2])
	})

	it("stops at the match limit", () => {
		const result = runRegex({ pattern: "a", flags: "g", text: "a".repeat(MAX_MATCHES + 5) })
		expect(result.matches).toHaveLength(MAX_MATCHES)
		expect(result.capped).toBe(true)
	})

	it("throws on a bad pattern, for the worker to report", () => {
		expect(() => runRegex({ pattern: "(", flags: "", text: "" })).toThrow()
	})
})

describe("replace", () => {
	const cases: [string, string, string, string][] = [
		["(a)(b)", "g", "[$2$1]", "xaby ab"],
		["a", "g", "$$", "aXa"],
		["a", "g", "<$&>", "aXa"],
		["X", "", "$`|$'", "aXb"],
		[String.raw`(?<first>\w)(?<second>\w)`, "g", "$<second>$<first>", "abcd"],
		["(a)", "g", "$2", "a"],
		["(a)", "g", "$10", "a"],
		["(a)", "g", "$<x>", "a"],
		["a", "", "z", "aaa"],
	]
	for (const [pattern, flags, replacement, text] of cases) {
		it(`${pattern} → ${replacement} matches String.replace`, () => {
			const native = text.replace(new RegExp(pattern, flags), replacement)
			expect(runRegex({ pattern, flags, text, replacement }).replaced?.text).toBe(native)
		})
	}

	it("reports where each replacement landed", () => {
		const { replaced } = runRegex({ pattern: "b", flags: "g", text: "abc", replacement: "XY" })
		expect(replaced).toEqual({ text: "aXYc", spans: [{ start: 1, end: 3 }] })
	})
})
