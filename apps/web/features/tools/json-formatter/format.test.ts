import { describe, expect, it } from "vitest"
import { countLargeNumbers, depthOf, formatValue, parseInput } from "./format"

describe("parseInput", () => {
	it("reads JSON", () => {
		expect(parseInput('{"a": [1, 2]}')).toMatchObject({
			status: "ok",
			kind: "json",
			value: { a: [1, 2] },
		})
	})

	it("reports the line of a JSON error", () => {
		const result = parseInput('{\n  "a": 1,\n  "b": \n}')
		expect(result).toMatchObject({ status: "error", line: 4 })
	})

	it("keeps broken JSON as a JSON error instead of reading it as YAML", () => {
		expect(parseInput('{"a": 1,}').status).toBe("error")
	})

	it("reads YAML and notices comments", () => {
		expect(parseInput("# config\nname: app\nports:\n  - 80\n")).toMatchObject({
			status: "ok",
			kind: "yaml",
			value: { name: "app", ports: [80] },
			yamlComments: true,
		})
	})

	it("doesn't treat a plain sentence as YAML", () => {
		expect(parseInput("hello world").status).toBe("error")
	})

	it("is empty for whitespace", () => {
		expect(parseInput("  \n ").status).toBe("empty")
	})
})

describe("formatValue", () => {
	const value = { b: 1, a: { d: [3, { z: 1, y: 2 }], c: true } }

	it("formats, minifies and converts to YAML", () => {
		expect(formatValue(value, "formatted", { indent: "2", sortKeys: false })).toBe(
			JSON.stringify(value, null, 2),
		)
		expect(formatValue(value, "minified", { indent: "2", sortKeys: false })).toBe(
			JSON.stringify(value),
		)
		expect(formatValue({ a: [1] }, "yaml", { indent: "2", sortKeys: false })).toBe(
			"a:\n  - 1\n",
		)
	})

	it("sorts keys at every level and keeps array order", () => {
		expect(formatValue(value, "minified", { indent: "2", sortKeys: true })).toBe(
			'{"a":{"c":true,"d":[3,{"y":2,"z":1}]},"b":1}',
		)
	})

	it("indents with tabs", () => {
		expect(formatValue({ a: 1 }, "formatted", { indent: "tab", sortKeys: false })).toBe(
			'{\n\t"a": 1\n}',
		)
	})
})

describe("helpers", () => {
	it("counts integers that JSON.parse may round, but not strings", () => {
		expect(
			countLargeNumbers('{"id": 12345678901234567, "s": "12345678901234567", "n": 1.5}'),
		).toBe(1)
	})

	it("measures depth", () => {
		expect(depthOf({ a: [{ b: 1 }] })).toBe(3)
		expect(depthOf(1)).toBe(0)
	})
})
