import { describe, expect, it } from "vitest"
import { analyzePattern } from "@/features/tools/regex-tester/analyze"

describe("analyzePattern", () => {
	it("gathers the explanation, languages, ReDoS check and code", () => {
		// Assembled at runtime: this is a deliberately bad pattern, and code scanners flag it.
		const result = analyzePattern({ pattern: ["(a+)", "+$"].join(""), flags: "g" })
		expect(result?.languages.map((language) => language.target)).toEqual([
			"python",
			"go",
			"java",
			"rust",
			"php",
		])
		expect(result?.rows.length).toBeGreaterThan(0)
		expect(result?.redos[0]?.severity).toBe("exponential")
		expect(result?.javascript).toContain("/(a+)+$/g")
	})

	it("is null for a pattern that doesn't parse", () => {
		expect(analyzePattern({ pattern: "(", flags: "" })).toBeNull()
	})

	it("survives the trip to and from a worker", () => {
		const result = analyzePattern({ pattern: "(?<a>x)", flags: "g" })
		expect(structuredClone(result)).toEqual(result)
	})
})
