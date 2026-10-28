import { describe, expect, it } from "vitest"
import { decodeToken, normalizeToken } from "@/features/tools/jwt-decoder/decode"
import { unsignedParts } from "./tokens"

const parts = unsignedParts({ alg: "HS256", typ: "JWT" }, { sub: "1", name: "Ada" })
const token = `${parts}.c2lnbmF0dXJl`

describe("normalizeToken", () => {
	it("strips Bearer, quotes and line breaks and says so", () => {
		const { token: clean, notes } = normalizeToken(
			`"Bearer ${token.slice(0, 20)}\n  ${token.slice(20)}"`,
		)
		expect(clean).toBe(token)
		expect(notes).toEqual([
			"Removed the surrounding quotes.",
			"Removed the Bearer prefix.",
			"Removed spaces and line breaks.",
		])
	})
})

describe("decodeToken", () => {
	it("decodes a JWS", () => {
		const decoded = decodeToken(token)
		expect(decoded).toMatchObject({
			status: "ok",
			kind: "jws",
			header: { alg: "HS256" },
			payload: { sub: "1", name: "Ada" },
			signature: "c2lnbmF0dXJl",
			signingInput: parts,
		})
	})

	it("counts the parts when there aren't three", () => {
		expect(decodeToken(parts)).toMatchObject({
			status: "error",
			message: "A JWT has three parts separated by dots. This has 2.",
		})
		expect(decodeToken(`${token}.x`)).toMatchObject({
			message: expect.stringContaining("This has 4."),
		})
	})

	it("accepts two parts for a shared link", () => {
		expect(decodeToken(parts, { allowUnsigned: true })).toMatchObject({
			status: "ok",
			signature: "",
		})
	})

	it("reads only the header of a JWE", () => {
		const header = unsignedParts({ alg: "RSA-OAEP", enc: "A256GCM" }, {}).split(".")[0]
		expect(decodeToken(`${header}.a.b.c.d`)).toMatchObject({
			status: "ok",
			kind: "jwe",
			header: { alg: "RSA-OAEP", enc: "A256GCM" },
		})
	})

	it("names the part that fails", () => {
		expect(decodeToken(`a$b.${parts.split(".")[1]}.sig`)).toMatchObject({
			part: "header",
			message: "The header isn't valid base64url.",
		})
		expect(decodeToken(`${parts.split(".")[0]}.bm90IGpzb24.sig`)).toMatchObject({
			part: "payload",
			message: "The payload decodes, but isn't JSON.",
		})
	})
})
