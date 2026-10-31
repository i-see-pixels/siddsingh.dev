// biome-ignore-all lint/suspicious/noTemplateCurlyInString: ${1} is replacement syntax here
import { describe, expect, it } from "vitest"
import { parsePattern } from "@/features/tools/regex-tester/ast"
import {
	convertReplacement,
	javascriptCode,
	parseReplacement,
	targetCode,
} from "@/features/tools/regex-tester/codegen"
import { checkTarget, type Target } from "@/features/tools/regex-tester/portability"

const raw = String.raw

function code(pattern: string, target: Target, flags = "g", replacement?: string) {
	const parsed = parsePattern(pattern, flags)
	if (!parsed.ok) throw new Error(`didn't parse: ${pattern}`)
	const result = checkTarget(parsed, pattern, flags, target)
	return targetCode(result, { flags, groups: parsed.groups, replacement })
}

function replacement(text: string, pattern: string, target: Target) {
	const parsed = parsePattern(pattern, "g")
	if (!parsed.ok) throw new Error("didn't parse")
	const result = checkTarget(parsed, pattern, "g", target)
	return convertReplacement(parseReplacement(text, parsed.groups), target, result, parsed.groups)
}

describe("string literals", () => {
	it("Python uses raw strings and picks a quote that works", () => {
		expect(code(raw`\d+`, "python")).toContain(raw`re.compile(r"\d+")`)
		expect(code(`a"b`, "python")).toContain(`r'a"b'`)
	})

	it("Python maps flags", () => {
		expect(code("a", "python", "gims")).toContain("re.IGNORECASE | re.MULTILINE | re.DOTALL")
	})

	it("Go uses backticks, and a quoted string when the pattern has one", () => {
		expect(code(raw`\d+`, "go")).toContain("regexp.MustCompile(`\\d+`)")
		const withTick = code("a`b", "go")
		expect(withTick).toContain('regexp.MustCompile("a`b")')
		expect(withTick).not.toContain("``")
	})

	it("Go and Rust carry flags inline", () => {
		expect(code("a", "go", "gi")).toContain("`(?i)a`")
		expect(code("a", "rust", "gims")).toContain(`r"(?ims)a"`)
	})

	it("Java doubles backslashes", () => {
		expect(code(raw`\d+"`, "java", "gi")).toContain(
			raw`Pattern.compile("\\d+\"", Pattern.CASE_INSENSITIVE)`,
		)
	})

	it("Rust adds hashes when the pattern has a quote", () => {
		expect(code(`a"b`, "rust")).toContain(`r#"a"b"#`)
		expect(code(`a"#b`, "rust")).toContain(`r##"a"#b"##`)
	})

	it("PHP escapes the delimiter and the quote", () => {
		expect(code("a/b", "php")).toContain(raw`'/a\/b/'`)
		expect(code("it's", "php")).toContain(raw`'/it\'s/'`)
		expect(code(raw`\d\\`, "php")).toContain(raw`'/\d\\\\/'`)
		expect(code("a", "php", "giu")).toContain("'/a/iu'")
	})

	it("JavaScript escapes the slash", () => {
		const output = javascriptCode({ pattern: "a/b", flags: "g", groups: [] })
		expect(output).toContain(raw`/a\/b/g`)
	})
})

describe("find and replace calls", () => {
	it("loops with g and finds once without", () => {
		expect(code("a", "python", "g")).toContain("finditer")
		expect(code("a", "python", "")).toContain("search")
		expect(code("a", "go", "g")).toContain("FindAllStringSubmatch")
		expect(code("a", "java", "")).toContain("if (matcher.find())")
		expect(code("a", "rust", "g")).toContain("captures_iter")
		expect(code("a", "php", "")).toContain("preg_match(")
	})

	it("replaces all or the first", () => {
		expect(code("a", "python", "", "b")).toContain("count=1")
		expect(code("a", "java", "g", "b")).toContain("replaceAll")
		expect(code("a", "java", "", "b")).toContain("replaceFirst")
		expect(code("a", "rust", "", "b")).toContain("re.replace(")
		expect(code("a", "php", "", "b")).toContain(", 1);")
		expect(code("a", "go", "", "b")).toContain("no replace-first")
	})
})

describe("replacements", () => {
	const named = raw`(?<year>\d{4})`

	it("converts numbered groups", () => {
		expect(replacement("<$1>", "(a)", "python")).toEqual({ text: raw`<\g<1>>` })
		expect(replacement("<$1>", "(a)", "go")).toEqual({ text: "<${1}>" })
		expect(replacement("<$1>", "(a)", "rust")).toEqual({ text: "<${1}>" })
		expect(replacement("<$1>", "(a)", "java")).toEqual({ text: "<$1>" })
		expect(replacement("<$1>", "(a)", "php")).toEqual({ text: "<${1}>" })
	})

	it("converts named groups", () => {
		expect(replacement("$<year>", named, "python")).toEqual({ text: raw`\g<year>` })
		expect(replacement("$<year>", named, "go")).toEqual({ text: "${year}" })
		expect(replacement("$<year>", named, "java")).toEqual({ text: "${year}" })
		expect(replacement("$<year>", named, "php")).toEqual({ text: "${1}" })
	})

	it("uses Java's renamed group", () => {
		expect(replacement("$<first_name>", "(?<first_name>a)", "java")).toEqual({
			text: "${firstname}",
		})
	})

	it("converts the whole match", () => {
		expect(replacement("[$&]", "a", "python")).toEqual({ text: raw`[\g<0>]` })
		expect(replacement("[$&]", "a", "go")).toEqual({ text: "[${0}]" })
		expect(replacement("[$&]", "a", "java")).toEqual({ text: "[$0]" })
	})

	it("escapes literal text", () => {
		expect(replacement("$$5", "a", "go")).toEqual({ text: "$$5" })
		expect(replacement("$$5", "a", "java")).toEqual({ text: raw`\$5` })
		expect(replacement("$$5", "a", "python")).toEqual({ text: "$5" })
		expect(replacement(raw`a\b`, "a", "python")).toEqual({ text: raw`a\\b` })
	})

	it("reports what can't be written", () => {
		expect(replacement("$`", "a", "python")).toMatchObject({
			problem: expect.stringContaining("no equivalent"),
		})
	})
})
