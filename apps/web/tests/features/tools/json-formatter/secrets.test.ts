import { describe, expect, it } from "vitest"
import {
	defaultEnabledRules,
	isSecretKey,
	redact,
	scanSecrets,
	secretRules,
} from "@/features/tools/json-formatter/secrets"

const allRules = new Set(secretRules.map((rule) => rule.id))
const defaults = new Set(defaultEnabledRules)

// Token-shaped fixtures are assembled at runtime so this file doesn't trip secret scanners.
const join = (...parts: string[]) => parts.join("")
const fixtures: Record<string, { key: string; value: string }> = {
	"private-key": {
		key: "key",
		value: join("-----BEGIN ", "RSA PRIVATE KEY-----\nMIIEow\n-----END RSA PRIVATE KEY-----"),
	},
	"aws-access-key": { key: "id", value: "AKIAIOSFODNN7EXAMPLE" },
	"aws-secret-key": {
		key: "aws_secret_access_key",
		value: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
	},
	"github-token": { key: "gh", value: join("gh", "p_", "A1b2C3d4E5".repeat(4)) },
	"anthropic-key": { key: "k", value: join("sk-", "ant-", "api03-", "x".repeat(30)) },
	"openai-key": { key: "k", value: join("sk-", "proj-", "Ab3".repeat(10)) },
	"stripe-key": { key: "k", value: join("sk", "_live_", "4eC39HqLyjWDarjtT1zdp7dc") },
	"slack-token": { key: "k", value: join("xox", "b-", "1234567890-abcdefghij") },
	"google-api-key": { key: "k", value: join("AI", "za", "SyD".repeat(11), "Ab") },
	jwt: {
		key: "k",
		value: join("eyJ", "hbGciOiJIUzI1NiJ9", ".eyJ", "zdWIiOiIxIn0", ".sig_nature-1"),
	},
	"connection-string": { key: "url", value: "postgres://admin:hunter2pass@db.internal:5432/app" },
	"secret-key-name": { key: "password", value: "correct-horse-battery" },
	"card-number": { key: "card", value: "4111 1111 1111 1111" },
	email: { key: "contact", value: "jane.doe@acme.io" },
	"high-entropy": { key: "blob", value: "q8Zr2LmX9vKp4TnW7sYb3HcE" },
}

const jsonOf = (key: string, value: string) => JSON.stringify({ [key]: value }, null, 2)

describe("secret rules", () => {
	for (const rule of secretRules) {
		it(`finds ${rule.id}`, () => {
			const fixture = fixtures[rule.id]
			expect(fixture, `fixture for ${rule.id}`).toBeDefined()
			if (!fixture) return
			const findings = scanSecrets(jsonOf(fixture.key, fixture.value), "json", allRules)
			expect(findings.map((finding) => finding.ruleId)).toContain(rule.id)
		})
	}

	it("ignores placeholders", () => {
		for (const value of [
			"",
			"xxxxxxxx",
			"********",
			"<your-api-key>",
			// biome-ignore lint/suspicious/noTemplateCurlyInString: a literal placeholder
			"${API_KEY}",
			"{{token}}",
			"changeme",
			"your_api_key_here",
			"example",
			"[REDACTED:openai-key]",
		]) {
			expect(scanSecrets(jsonOf("password", value), "json", allRules), value).toEqual([])
		}
	})

	it("only runs high-severity rules by default", () => {
		const text = JSON.stringify({
			password: "correct-horse-battery",
			contact: "jane.doe@acme.io",
		})
		expect(scanSecrets(text, "json", defaults)).toEqual([])
	})

	it("reads whole words in key names", () => {
		expect(isSecretKey("password")).toBe(true)
		expect(isSecretKey("apiKey")).toBe(true)
		expect(isSecretKey("DB_ACCESS_TOKEN")).toBe(true)
		expect(isSecretKey("author")).toBe(false)
		expect(isSecretKey("max_tokens")).toBe(false)
	})

	it("doesn't flag ordinary values", () => {
		const text = JSON.stringify({
			id: "3f2b8c1e-9a4d-4e6f-8b2a-1c3d5e7f9a0b",
			author: "Jane Doe",
			description: "A perfectly ordinary sentence about nothing secret.",
			count: 1234567890123,
		})
		expect(scanSecrets(text, "json", allRules)).toEqual([])
	})
})

describe("redaction", () => {
	it("keeps the JSON valid with the same keys", () => {
		const input = {
			db: fixtures["connection-string"]?.value,
			nested: {
				list: [fixtures["aws-access-key"]?.value, { password: "correct-horse-battery" }],
			},
			card: 4111111111111111,
		}
		const text = JSON.stringify(input, null, 2)
		const output = redact(text, scanSecrets(text, "json", allRules))
		const parsed = JSON.parse(output)
		expect(Object.keys(parsed)).toEqual(Object.keys(input))
		expect(parsed.nested.list[0]).toBe("[REDACTED:aws-access-key]")
		expect(parsed.nested.list[1].password).toBe("[REDACTED:secret-key-name]")
		expect(parsed.card).toBe("[REDACTED:card-number]")
	})

	it("redacts only the password in a connection string", () => {
		const text = jsonOf("url", "postgres://app:app@db:5432/app")
		const output = JSON.parse(redact(text, scanSecrets(text, "json", allRules)))
		expect(output.url).toBe("postgres://app:[REDACTED:connection-string]@db:5432/app")
	})

	it("doesn't flag text it has already redacted", () => {
		const text = jsonOf("url", "postgres://app:hunter2pass@db:5432/app")
		const once = redact(text, scanSecrets(text, "json", allRules))
		expect(scanSecrets(once, "json", allRules)).toEqual([])
	})

	it("keeps the rest of a log line around a token", () => {
		const token = fixtures["github-token"]?.value ?? ""
		const text = jsonOf("message", `push failed for ${token} at 10:02`)
		const output = JSON.parse(redact(text, scanSecrets(text, "json", allRules)))
		expect(output.message).toBe("push failed for [REDACTED:github-token] at 10:02")
	})

	it("redacts YAML values and keeps it valid", async () => {
		const { parse } = await import("yaml")
		const text = `db:\n  user: app\n  password: correct-horse-battery\n# a comment\nkey: ${fixtures["aws-access-key"]?.value}\n`
		const output = redact(text, scanSecrets(text, "yaml", allRules))
		expect(parse(output)).toEqual({
			db: { user: "app", password: "[REDACTED:secret-key-name]" },
			key: "[REDACTED:aws-access-key]",
		})
	})

	it("finds secrets in keys", () => {
		const token = fixtures["github-token"]?.value ?? ""
		const text = JSON.stringify({ [token]: true })
		const output = JSON.parse(redact(text, scanSecrets(text, "json", defaults)))
		expect(Object.keys(output)).toEqual(["[REDACTED:github-token]"])
	})

	it("redacts secrets in YAML keys and comments and keeps it valid", async () => {
		const { parse } = await import("yaml")
		const token = fixtures["github-token"]?.value ?? ""
		const key = fixtures["aws-access-key"]?.value ?? ""
		const text = `# old token: ${token}\n${key}: 1\nname: app # ${token}\n`
		const output = redact(text, scanSecrets(text, "yaml", defaults))
		expect(output).not.toContain(token)
		expect(output).toContain("# old token: [REDACTED:github-token]")
		expect(parse(output)).toEqual({ "[REDACTED:aws-access-key]": 1, name: "app" })
	})

	it("still finds secrets inside placeholder-like delimiters", () => {
		const token = fixtures["github-token"]?.value ?? ""
		const text = jsonOf("message", `<${token}>`)
		expect(scanSecrets(text, "json", defaults).map((finding) => finding.ruleId)).toEqual([
			"github-token",
		])
	})

	it("scans long strings without a match quickly", () => {
		const text = jsonOf("x", "a-".repeat(200_000))
		const started = performance.now()
		scanSecrets(text, "json", allRules)
		expect(performance.now() - started).toBeLessThan(2000)
	})

	it("gives each finding its path", () => {
		const text = JSON.stringify({ a: [{ b: fixtures["aws-access-key"]?.value }] })
		expect(scanSecrets(text, "json", allRules)[0]?.path).toEqual(["a", 0, "b"])
	})
})
