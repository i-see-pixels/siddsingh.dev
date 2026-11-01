import { describe, expect, it } from "vitest"
import {
	type AuditInput,
	audit,
	maskPaths,
	pathKey,
	pathLabel,
	sensitiveClaims,
	sensitivePaths,
	verdict,
} from "@/features/tools/jwt-decoder/audit"

const now = 1_800_000_000
const goodHeader = { alg: "HS256", typ: "JWT", kid: "2026-key" }
const goodPayload = {
	iss: "https://auth.example.com",
	sub: "user_8f2c",
	aud: "api.example.com",
	iat: now - 60,
	nbf: now - 60,
	exp: now + 3600,
	scope: "read:orders",
}

function run(overrides: Partial<AuditInput> = {}) {
	return audit({
		kind: "jws",
		header: goodHeader,
		payload: goodPayload,
		token: "x".repeat(300),
		now,
		shared: false,
		weakSecret: { status: "clear", total: 1000 },
		verification: { status: "verified", message: "", secretBytes: 32 },
		...overrides,
	})
}

const statusOf = (checks: ReturnType<typeof audit>, id: number) =>
	checks.find((check) => check.id === id)?.status

describe("audit", () => {
	it("passes a well-formed token", () => {
		const checks = run()
		expect(
			checks.filter((check) => check.status === "fail" || check.status === "warn"),
		).toEqual([])
		expect(verdict(checks)).toBe("No problems found")
	})

	const cases: [number, string, Partial<AuditInput>][] = [
		[1, "fail", { header: { ...goodHeader, alg: "none" } }],
		[2, "fail", { weakSecret: { status: "found", secret: "secret" } }],
		[3, "warn", { verification: { status: "verified", message: "", secretBytes: 6 } }],
		[4, "fail", { payload: { ...goodPayload, exp: undefined } }],
		[5, "info", { payload: { ...goodPayload, exp: now - 100 } }],
		[6, "warn", { payload: { ...goodPayload, exp: now + 3 * 86400 } }],
		[7, "info", { payload: { ...goodPayload, nbf: now + 600 } }],
		[8, "fail", { header: { ...goodHeader, jwk: { kty: "RSA" } } }],
		[9, "warn", { header: { ...goodHeader, jku: "https://evil.example/keys" } }],
		[10, "fail", { header: { ...goodHeader, kid: "../../dev/null" } }],
		[11, "warn", { payload: { ...goodPayload, email: "ada@example.org" } }],
		[12, "info", { payload: { ...goodPayload, aud: undefined } }],
		[13, "info", { payload: { ...goodPayload, iss: undefined } }],
		[14, "info", { token: "x".repeat(5000) }],
		[
			15,
			"fail",
			{
				verification: {
					status: "verified",
					message: "",
					confusion: true,
					secretBytes: 400,
				},
			},
		],
	]
	for (const [id, status, overrides] of cases) {
		it(`check ${id} reports ${status}`, () => {
			const payload = overrides.payload
				? Object.fromEntries(
						Object.entries(overrides.payload).filter(
							([, value]) => value !== undefined,
						),
					)
				: undefined
			expect(statusOf(run({ ...overrides, ...(payload ? { payload } : {}) }), id)).toBe(
				status,
			)
		})
	}

	it("skips signature checks for a shared token", () => {
		const checks = run({ shared: true, header: { ...goodHeader, alg: "none" } })
		for (const id of [1, 2, 3, 15]) expect(statusOf(checks, id)).toBe("skip")
	})

	it("only runs header checks on a JWE", () => {
		const checks = run({
			kind: "jwe",
			header: { alg: "RSA-OAEP", enc: "A256GCM" },
			payload: undefined,
		})
		expect(checks.map((check) => check.id).sort((a, b) => a - b)).toEqual([
			1, 2, 3, 8, 9, 10, 14,
		])
	})

	it("orders problems first and counts them", () => {
		const checks = run({ header: { ...goodHeader, alg: "none", jku: "https://x" } })
		expect(checks[0]?.status).toBe("fail")
		expect(verdict(checks)).toBe("1 problem, 1 warning")
	})
})

describe("sensitiveClaims", () => {
	it("finds personal data and secrets, not ordinary claims", () => {
		const aws = ["AKIA", "IOSFODNN7EXAMPLE"].join("")
		expect(
			sensitiveClaims({
				sub: "1",
				email: "a@b.io",
				phone_number: "+1",
				api_key: "abcdefgh12345",
				note: `key ${aws}`,
			}).sort(),
		).toEqual(["api_key", "email", "note", "phone_number"])
		expect(sensitiveClaims(goodPayload)).toEqual([])
		expect(sensitiveClaims({ email: "[REDACTED]" })).toEqual([])
	})

	it("finds nested personal data", () => {
		expect(
			sensitiveClaims({ user: { email: "a@b.io", contacts: [{ phone: "+1" }] } }).sort(),
		).toEqual(["user.contacts[0].phone", "user.email"])
	})
})

describe("sensitivePaths and maskPaths", () => {
	it("masks nested claims and private key material in the header", () => {
		const token = {
			header: {
				alg: "ES256",
				jwk: { kty: "EC", crv: "P-256", x: "x", y: "y", d: "secret-d" },
			},
			payload: { sub: "1", user: { email: "a@b.io" } },
		}
		const paths = sensitivePaths(token)
		expect(paths.map(pathLabel).sort()).toEqual(["header.jwk.d", "payload.user.email"])
		const masked = maskPaths(token, new Set(paths.map(pathKey))) as typeof token
		expect(masked.header.jwk).toEqual({
			kty: "EC",
			crv: "P-256",
			x: "x",
			y: "y",
			d: "[REDACTED]",
		})
		expect(masked.payload).toEqual({ sub: "1", user: { email: "[REDACTED]" } })
	})
})

describe("audit details", () => {
	it("calls out private key material in an embedded jwk", () => {
		const checks = run({
			header: { ...goodHeader, jwk: { kty: "RSA", n: "n", e: "AQAB", d: "d" } },
		})
		expect(checks.find((check) => check.id === 8)?.detail).toMatch(/private key material/)
	})

	it("accepts standard-base64 kids and flags real injection", () => {
		for (const kid of ["a1B2/c3D4e5F6+g7H8=", "2026-key", "https://keys.example.com/1"]) {
			expect(statusOf(run({ header: { ...goodHeader, kid } }), 10), kid).toBe("pass")
		}
		for (const kid of ["../../dev/null", "/dev/null", "x' OR '1'='1", "k; rm -rf /", "a|b"]) {
			expect(statusOf(run({ header: { ...goodHeader, kid } }), 10), kid).toBe("fail")
		}
	})
})
