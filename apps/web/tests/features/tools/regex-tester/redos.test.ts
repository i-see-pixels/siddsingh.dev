import { describe, expect, it } from "vitest"
import { parsePattern } from "@/features/tools/regex-tester/ast"
import { findRedos } from "@/features/tools/regex-tester/redos"

const raw = String.raw

function findings(pattern: string, flags = "") {
	const parsed = parsePattern(pattern, flags)
	if (!parsed.ok) throw new Error(`didn't parse: ${pattern}`)
	return findRedos(parsed.root, flags)
}

describe("findRedos", () => {
	const risky: [string, string][] = [
		["(a+)+", "nested"],
		["(a+)+$", "nested"],
		[raw`(\w*)*`, "nested"],
		["(.*a){20}", "nested"],
		[raw`([a-z]+\s?)+$`, "nested"],
		[raw`(\w+\s*)+`, "nested"],
		["(a|b+)+", "nested"],
		["(a|a)*", "alternation"],
		[raw`(\w|\d)+`, "alternation"],
		["(a|aa)+", "alternation"],
		[raw`\w+\w+$`, "adjacent"],
		["a*a*b", "adjacent"],
	]
	for (const [pattern, kind] of risky) {
		it(`flags ${pattern}`, () => {
			expect(findings(pattern).map((finding) => finding.kind)).toContain(kind)
		})
	}

	const safe = [
		raw`\d{3}-\d{4}`,
		raw`^[a-z]+$`,
		"(a+b)+",
		raw`(\d+\.)+`,
		raw`(\w+\s)+`,
		"(ab|ac)*",
		"(a|b)*",
		"(a+){2}",
		raw`\w+\s+\w+`,
		raw`\w+\w+`,
		raw`^[\w.+-]+@[a-z0-9-]+\.[a-z]{2,}$`,
		raw`https?://[^\s/]+`,
	]
	for (const pattern of safe) {
		it(`passes ${pattern}`, () => expect(findings(pattern)).toEqual([]))
	}

	it("respects the i flag", () => {
		expect(findings("(a|A)*")).toEqual([])
		expect(findings("(a|A)*", "i")).toHaveLength(1)
	})

	it("points at the part of the pattern and suggests a fix", () => {
		const [finding] = findings("x(a+)+y")
		expect(finding).toMatchObject({ from: 1, to: 6, severity: "exponential" })
		expect(finding?.fix).toBeTruthy()
	})

	it("reports one finding for a nested pattern", () => {
		expect(findings("((a+)+)+")).toHaveLength(1)
	})

	it("builds a probe that shows the blow-up", () => {
		const [finding] = findings("^(a+)+$")
		expect(finding?.probe).toBe(`${"a".repeat(30)}!`)
	})
})
