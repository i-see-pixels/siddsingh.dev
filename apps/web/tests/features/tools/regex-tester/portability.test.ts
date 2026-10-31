import { describe, expect, it } from "vitest"
import { parsePattern } from "@/features/tools/regex-tester/ast"
import { checkTarget, type Target } from "@/features/tools/regex-tester/portability"

const raw = String.raw

function check(pattern: string, target: Target, flags = "") {
	const parsed = parsePattern(pattern, flags)
	if (!parsed.ok) throw new Error(`didn't parse: ${pattern}`)
	return checkTarget(parsed, pattern, flags, target)
}

describe("what can't run", () => {
	const cases: [string, Target[], string?][] = [
		[raw`a(?=b)`, ["go", "rust"]],
		[raw`a(?!b)`, ["go", "rust"]],
		[raw`(?<=\$)\d+`, ["go", "rust"]],
		[raw`(?<=a+)b`, ["python", "go", "java", "rust", "php"]],
		[raw`(?<=a{1,3})b`, ["python", "go", "rust"]],
		[raw`(a)\1`, ["go", "rust"]],
		[raw`(?<n>a)\k<n>`, ["go", "rust"]],
		[raw`\p{L}`, ["python"], "u"],
		["a{2000}", ["go"]],
		["[]", ["python", "go", "java", "rust", "php"]],
		["(?<a>x)|(?<a>y)", ["python", "go", "java", "rust", "php"]],
		["[[a-z]--[b]]", ["python", "go", "java", "php"], "v"],
		["[[a-z]&&[^b]]", ["python", "go", "php"], "v"],
	]
	const all: Target[] = ["python", "go", "java", "rust", "php"]
	for (const [pattern, unsupported, flags] of cases) {
		for (const target of all) {
			const blocked = unsupported.includes(target)
			it(`${pattern} ${blocked ? "fails" : "runs"} in ${target}`, () => {
				const result = check(pattern, target, flags)
				expect(result.status === "unsupported").toBe(blocked)
				expect(result.pattern === null).toBe(blocked)
			})
		}
	}

	it("gives a reason and a suggestion", () => {
		const issue = check(raw`(?<=\$)\d+`, "go").issues.find(
			(item) => item.level === "unsupported",
		)
		expect(issue?.message).toMatch(/no lookbehind/)
		expect(issue?.suggestion).toMatch(/capture group/)
	})
})

describe("rewrites", () => {
	const cases: [string, Target, string, string?][] = [
		[raw`(?<year>\d{4})`, "python", raw`(?P<year>\d{4})`],
		[raw`(?<y>a)\k<y>`, "python", raw`(?P<y>a)(?P=y)`],
		[raw`(?<first_name>a)\k<first_name>`, "java", raw`(?<firstname>a)\k<firstname>`],
		[raw`\p{Script=Greek}`, "java", raw`\p{IsGreek}`, "u"],
		[raw`\P{Script=Greek}`, "go", raw`\P{Greek}`, "u"],
		[`${"\\"}u0041`, "go", raw`\x{0041}`],
		[raw`\u{1F600}`, "python", raw`\U0001F600`, "u"],
		[raw`\u{1F600}`, "php", raw`\x{1F600}`, "u"],
		[raw`\cA`, "python", raw`\x01`],
		[raw`\0`, "go", raw`\x00`],
		[raw`\v`, "java", raw`\x0B`],
		[raw`[\b]`, "rust", raw`[\x08]`],
		[raw`\q`, "python", "q"],
		[raw`\<`, "rust", "<"],
		["[^]", "go", raw`[\s\S]`],
		["[[]", "java", raw`[\[]`],
		["[a&&b]", "rust", raw`[a\&\&b]`],
	]
	for (const [pattern, target, expected, flags] of cases) {
		it(`${pattern} → ${expected} in ${target}`, () => {
			const result = check(pattern, target, flags)
			expect(result.pattern).toBe(expected)
			expect(result.status).toBe("changes")
		})
	}

	it("leaves a portable pattern alone", () => {
		const result = check(raw`[a-z]+-\d{2}`, "go")
		expect(result).toMatchObject({ status: "works", pattern: raw`[a-z]+-\d{2}` })
	})
})

describe("differences in meaning", () => {
	const notes = (pattern: string, target: Target, flags = "") =>
		check(pattern, target, flags)
			.issues.filter((issue) => issue.level === "behaviour")
			.map((issue) => issue.message)

	it("flags \\d and \\w in Python and Rust only", () => {
		expect(notes(raw`\d`, "python").join()).toMatch(/non-ASCII/)
		expect(notes(raw`\w`, "rust").join()).toMatch(/non-ASCII/)
		expect(notes(raw`\d`, "go")).toEqual([])
		expect(notes(raw`\d`, "php")).toEqual([])
		expect(notes(raw`\d`, "php", "u").join()).toMatch(/non-ASCII/)
	})

	it("flags $ before a final newline, unless m is on", () => {
		expect(notes("a$", "python").join()).toMatch(/final newline/)
		expect(notes("a$", "go")).toEqual([])
		expect(notes("a$", "java", "m")).toEqual([])
	})

	it("flags narrower \\s", () => {
		expect(notes(raw`\s`, "go").join()).toMatch(/ASCII whitespace/)
		expect(notes(raw`\s`, "python")).toEqual([])
	})

	it("flags the sticky flag and PHP's lookbehind version", () => {
		expect(notes("a", "go", "y").join()).toMatch(/no sticky flag/)
		expect(notes("(?<=a{1,3})b", "php").join()).toMatch(/PHP 8.4/)
	})

	it("repeats a note only once", () => {
		expect(notes(raw`\d\d\d`, "python")).toHaveLength(1)
	})
})
