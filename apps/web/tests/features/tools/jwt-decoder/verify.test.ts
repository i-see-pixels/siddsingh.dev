import { describe, expect, it } from "vitest"
import { decodeToken } from "@/features/tools/jwt-decoder/decode"
import { verifySignature } from "@/features/tools/jwt-decoder/verify"
import { type AsymmetricAlg, asymmetricToken, hmacToken } from "./tokens"

function decoded(token: string) {
	const result = decodeToken(token)
	if (result.status !== "ok" || result.kind !== "jws") throw new Error("fixture didn't decode")
	return result
}

const payload = { sub: "1", iat: 1_700_000_000, exp: 1_700_003_600 }

describe("verifySignature", () => {
	it("verifies HMAC with the right secret only", async () => {
		const token = decoded(
			await hmacToken(
				{ alg: "HS256", typ: "JWT" },
				payload,
				"a-long-enough-secret-for-tests!!",
			),
		)
		expect(
			await verifySignature(token, { value: "a-long-enough-secret-for-tests!!" }),
		).toMatchObject({
			status: "verified",
			secretBytes: 32,
		})
		expect(await verifySignature(token, { value: "wrong" })).toMatchObject({
			status: "invalid",
		})
	})

	it("reads base64 secrets", async () => {
		const bytes = crypto.getRandomValues(new Uint8Array(32))
		const token = decoded(await hmacToken({ alg: "HS384", typ: "JWT" }, payload, bytes))
		const base64 = btoa(String.fromCharCode(...bytes))
		expect(await verifySignature(token, { value: base64, base64: true })).toMatchObject({
			status: "verified",
		})
	})

	for (const alg of ["RS256", "PS256", "ES256", "EdDSA"] as AsymmetricAlg[]) {
		it(`verifies ${alg} with PEM and JWK, and rejects another key`, async () => {
			const signed = await asymmetricToken(alg, payload)
			const other = await asymmetricToken(alg, payload)
			const token = decoded(signed.token)
			expect(await verifySignature(token, { value: signed.pem })).toMatchObject({
				status: "verified",
			})
			expect(
				await verifySignature(token, { value: JSON.stringify(signed.jwk) }),
			).toMatchObject({
				status: "verified",
			})
			expect(await verifySignature(token, { value: other.pem })).toMatchObject({
				status: "invalid",
			})
		})
	}

	it("picks a key from a JWKS by kid", async () => {
		const signed = await asymmetricToken("ES256", payload, "b")
		const decoy = await asymmetricToken("ES256", payload, "a")
		const jwks = JSON.stringify({ keys: [decoy.jwk, signed.jwk] })
		expect(await verifySignature(decoded(signed.token), { value: jwks })).toMatchObject({
			status: "verified",
		})
	})

	it("flags a public key used as an HMAC secret", async () => {
		const { pem } = await asymmetricToken("RS256", payload)
		const token = decoded(await hmacToken({ alg: "HS256", typ: "JWT" }, payload, pem))
		expect(await verifySignature(token, { value: pem })).toMatchObject({
			status: "verified",
			confusion: true,
		})
	})

	it("rejects a secret pasted for an RS256 token without calling it confusion", async () => {
		const { token } = await asymmetricToken("RS256", payload)
		const result = await verifySignature(decoded(token), { value: "just-a-secret" })
		expect(result.status).toBe("error")
		expect(result.confusion).toBeFalsy()
	})

	it("doesn't call a key of the wrong type confusion", async () => {
		const { token } = await asymmetricToken("ES256", payload)
		const other = await asymmetricToken("RS256", payload)
		const result = await verifySignature(decoded(token), { value: JSON.stringify(other.jwk) })
		expect(result.status).toBe("error")
		expect(result.confusion).toBeFalsy()
	})

	it("asks for the public key when a private JWK is pasted", async () => {
		const { token, jwk } = await asymmetricToken("ES256", payload)
		const result = await verifySignature(decoded(token), {
			value: JSON.stringify({ ...jwk, d: "c2VjcmV0" }),
		})
		expect(result).toMatchObject({ status: "error" })
		expect(result.message).toMatch(/private key/)
		expect(result.confusion).toBeFalsy()
	})
})
