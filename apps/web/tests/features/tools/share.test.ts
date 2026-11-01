import { describe, expect, it } from "vitest"
import { codeFromHash, mermaidWorkspaceHref } from "@/features/tools/mermaid-previewer/share"
import { fromBase64Url, readFragment, toBase64Url } from "@/features/tools/share"

describe("share links", () => {
	it("round-trips UTF-8 text through base64url", () => {
		const text = 'flowchart LR\n  A["café ✓"] --> B{{"日本"}}'
		const encoded = toBase64Url(text)
		expect(encoded).not.toMatch(/[+/=]/)
		expect(fromBase64Url(encoded)).toBe(text)
	})

	it("returns null for text that isn't base64url", () => {
		expect(fromBase64Url("%%%")).toBeNull()
	})

	it("reads fragment params", () => {
		const params = readFragment("#json=abc&mode=yaml")
		expect(params.get("json")).toBe("abc")
		expect(params.get("mode")).toBe("yaml")
	})

	it("keeps Mermaid's #code= links working", () => {
		const code = "graph TD\n  A --> B"
		const href = mermaidWorkspaceHref(code)
		expect(href.startsWith("/tools/mermaid-previewer/workspace#code=")).toBe(true)
		expect(codeFromHash(href.slice(href.indexOf("#")))).toBe(code)
	})
})
