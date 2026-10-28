import { json } from "@codemirror/lang-json"
import { ensureSyntaxTree } from "@codemirror/language"
import { EditorState } from "@codemirror/state"
import { describe, expect, it } from "vitest"
import { formatPath, pathAt } from "./path"

function stateOf(doc: string) {
	const state = EditorState.create({ doc, extensions: json() })
	ensureSyntaxTree(state, doc.length)
	return state
}

const doc = JSON.stringify({ items: [{ name: "pen", "unit-price": 3 }], ok: true }, null, 2)

describe("pathAt", () => {
	it("finds a key inside an array element", () => {
		const state = stateOf(doc)
		expect(pathAt(state, doc.indexOf('"unit-price"') + 3)).toEqual(["items", 0, "unit-price"])
	})

	it("finds a value", () => {
		const state = stateOf(doc)
		expect(pathAt(state, doc.indexOf('"pen"') + 2)).toEqual(["items", 0, "name"])
		expect(pathAt(state, doc.indexOf("true") + 1)).toEqual(["ok"])
	})
})

describe("formatPath", () => {
	const segments = ["items", 0, "unit-price"]
	it("writes each format", () => {
		expect(formatPath(segments, "jsonpath")).toBe('$.items[0]["unit-price"]')
		expect(formatPath(segments, "jq")).toBe('.items[0]["unit-price"]')
		expect(formatPath(segments, "javascript")).toBe('data.items[0]["unit-price"]')
		expect(formatPath(segments, "python")).toBe('data["items"][0]["unit-price"]')
		expect(formatPath([], "jq")).toBe(".")
	})
})
