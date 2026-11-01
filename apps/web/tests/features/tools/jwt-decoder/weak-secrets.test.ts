import { describe, expect, it } from "vitest"
import { findWeakSecret, parseWordlist } from "@/features/tools/jwt-decoder/weak-secrets"
import { hmacToken } from "./tokens"

const list = parseWordlist("# source: test\nalpha\n\nbeta\nsecret\nalpha\n")

describe("parseWordlist", () => {
	it("drops the source line, blanks and repeats, and tries defaults first", () => {
		expect(list[0]).toBe("secret")
		expect(list).toContain("alpha")
		expect(list.filter((item) => item === "alpha")).toHaveLength(1)
		expect(list).not.toContain("# source: test")
	})
})

describe("findWeakSecret", () => {
	const header = { alg: "HS256", typ: "JWT" }

	it("finds a known secret", async () => {
		const token = await hmacToken(header, { sub: "1" }, "beta")
		const [h, p, signature = ""] = token.split(".")
		const started = performance.now()
		expect(
			await findWeakSecret(
				{ alg: "HS256", signingInput: `${h}.${p}`, signature },
				list,
				undefined,
				2,
			),
		).toBe("beta")
		expect(performance.now() - started).toBeLessThan(1000)
	})

	it("returns null for a strong secret", async () => {
		const token = await hmacToken(
			header,
			{ sub: "1" },
			crypto.getRandomValues(new Uint8Array(32)),
		)
		const [h, p, signature = ""] = token.split(".")
		expect(
			await findWeakSecret({ alg: "HS256", signingInput: `${h}.${p}`, signature }, list),
		).toBeNull()
	})
})
