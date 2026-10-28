// Finds secrets in JSON or YAML text and redacts them in place. No DOM or editor
// imports, so the large-input worker can run it too. Rules are modelled on gitleaks'
// defaults (https://github.com/gitleaks/gitleaks).

import { isMap, isScalar, isSeq, parseDocument } from "yaml"
import type { InputKind } from "./format"

export type Severity = "high" | "medium" | "low"
export type PathSegment = string | number

type Site = {
	kind: "string" | "number"
	/** Source range of the whole token, quotes included. */
	from: number
	to: number
	/** Text the rules read: the raw source between the quotes for JSON, the value for YAML. */
	text: string
	/** Where `text` starts in the source, when its offsets map one-to-one onto it. */
	textStart?: number
	value: string
	/** Key of the nearest enclosing object, so `"tokens": ["sk-…"]` still reads as a token. */
	key?: string
	path: PathSegment[]
}

type Match = { start: number; end: number; text: string; wholeValue?: boolean }

type Rule = {
	id: string
	name: string
	severity: Severity
	find: (site: Site) => Match[]
}

export type Finding = {
	ruleId: string
	ruleName: string
	severity: Severity
	/** Source range to replace, and what goes there. */
	from: number
	to: number
	replacement: string
	path: PathSegment[]
	preview: string
	/** Stable across edits, for "ignore this one". */
	signature: string
}

const severityRank: Record<Severity, number> = { high: 0, medium: 1, low: 2 }

/** Every match of `regex` (or of one capture group in it) as a Match. */
function pattern(regex: RegExp, group = 0) {
	const withIndices = new RegExp(regex.source, `${regex.flags}d`)
	return (site: Site): Match[] =>
		[...site.text.matchAll(withIndices)].flatMap((match) => {
			const range = match.indices?.[group]
			const text = match[group]
			return range && text ? [{ start: range[0], end: range[1], text }] : []
		})
}

const SECRET_KEY_WORDS = new Set([
	"password",
	"passwd",
	"pwd",
	"secret",
	"token",
	"auth",
	"authorization",
	"credential",
	"credentials",
	"session",
	"apikey",
	"privatekey",
	"accesskey",
	"clientsecret",
])
const SECRET_KEY_PHRASES =
	/(^|_)(api_key|private_key|access_key|secret_key|client_secret|session_id|auth_token|access_token|refresh_token|id_token)(_|$)/

/** True for keys like `password`, `apiKey` or `DB_ACCESS_TOKEN`. Matches whole words, so `author` is not one. */
export function isSecretKey(key: string | undefined) {
	if (!key) return false
	const words = key
		.replace(/([a-z0-9])([A-Z])/g, "$1_$2")
		.toLowerCase()
		.split(/[^a-z0-9]+/)
		.filter(Boolean)
	return (
		words.some((word) => SECRET_KEY_WORDS.has(word)) || SECRET_KEY_PHRASES.test(words.join("_"))
	)
}

const PLACEHOLDER =
	/^(x+|\*+|•+|<.*>|\$\{.*\}|\{\{.*\}\}|changeme|change_me|password|secret|example|your[_-].*[_-]here|\[?redacted.*)$/i

export function isPlaceholder(value: string) {
	return value.trim() === "" || PLACEHOLDER.test(value.trim())
}

function luhn(digits: string) {
	let sum = 0
	for (let index = 0; index < digits.length; index++) {
		let digit = Number(digits[digits.length - 1 - index])
		if (index % 2 === 1) {
			digit *= 2
			if (digit > 9) digit -= 9
		}
		sum += digit
	}
	return sum % 10 === 0
}

function entropy(text: string) {
	const counts = new Map<string, number>()
	for (const char of text) counts.set(char, (counts.get(char) ?? 0) + 1)
	let bits = 0
	for (const count of counts.values()) {
		const p = count / text.length
		bits -= p * Math.log2(p)
	}
	return bits
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const secretRules: Rule[] = [
	{
		id: "private-key",
		name: "Private key",
		severity: "high",
		find: (site) =>
			/-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----/.test(site.text)
				? [{ start: 0, end: site.text.length, text: site.value, wholeValue: true }]
				: [],
	},
	{
		id: "aws-access-key",
		name: "AWS access key ID",
		severity: "high",
		find: pattern(/\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g),
	},
	{
		id: "aws-secret-key",
		name: "AWS secret access key",
		severity: "high",
		find: (site) =>
			/aws.?secret/i.test(site.key ?? "") && /^[A-Za-z0-9/+]{40}$/.test(site.value)
				? [{ start: 0, end: site.text.length, text: site.value, wholeValue: true }]
				: [],
	},
	{
		id: "github-token",
		name: "GitHub token",
		severity: "high",
		find: pattern(/\bgh[pousr]_[A-Za-z0-9]{36,}\b|\bgithub_pat_[A-Za-z0-9_]{60,}\b/g),
	},
	{
		id: "anthropic-key",
		name: "Anthropic API key",
		severity: "high",
		find: pattern(/\bsk-ant-[A-Za-z0-9_-]{20,}/g),
	},
	{
		id: "openai-key",
		name: "OpenAI API key",
		severity: "high",
		find: pattern(/\bsk-(?!ant-)(?:proj-)?[A-Za-z0-9_-]{20,}/g),
	},
	{
		id: "stripe-key",
		name: "Stripe live key",
		severity: "high",
		find: pattern(/\b(?:sk|rk)_live_[A-Za-z0-9]{20,}/g),
	},
	{
		id: "slack-token",
		name: "Slack token",
		severity: "high",
		find: pattern(/\bxox[abprs]-[A-Za-z0-9-]{10,}/g),
	},
	{
		id: "google-api-key",
		name: "Google API key",
		severity: "high",
		find: pattern(/\bAIza[0-9A-Za-z_-]{35}(?![0-9A-Za-z_-])/g),
	},
	{
		id: "jwt",
		name: "JSON Web Token",
		severity: "high",
		find: pattern(/\beyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*/g),
	},
	{
		id: "connection-string",
		name: "Password in a connection string",
		severity: "high",
		// Only the password between `user:` and `@` is redacted.
		find: pattern(/\b[a-z][a-z0-9+.-]*:\/\/[^\s:/@]+:([^\s@]+)@/gi, 1),
	},
	{
		id: "secret-key-name",
		name: "Value under a secret-looking key",
		severity: "medium",
		find: (site) =>
			site.kind === "string" && isSecretKey(site.key) && site.value.length >= 8
				? [{ start: 0, end: site.text.length, text: site.value, wholeValue: true }]
				: [],
	},
	{
		id: "card-number",
		name: "Card number",
		severity: "medium",
		find: (site) =>
			[...site.text.matchAll(/(?<![\d.])\d(?:[ -]?\d){12,18}(?![\d.])/g)].flatMap((match) => {
				const digits = match[0].replace(/\D/g, "")
				if (digits.length < 13 || digits.length > 19 || !luhn(digits)) return []
				const start = match.index ?? 0
				return [
					{
						start,
						end: start + match[0].length,
						text: match[0],
						wholeValue: site.kind === "number",
					},
				]
			}),
	},
	{
		id: "email",
		name: "Email address",
		severity: "low",
		find: pattern(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g),
	},
	{
		id: "high-entropy",
		name: "Random-looking string",
		severity: "low",
		find: (site) => {
			const { value } = site
			if (site.kind !== "string" || value.length < 20 || /\s/.test(value) || UUID.test(value))
				return []
			if (/^[0-9a-f]+$/i.test(value) && !isSecretKey(site.key)) return []
			// URLs are long and varied by nature; their secrets have their own rule.
			if (/:\/\/|\[REDACTED/i.test(value)) return []
			return entropy(value) > 4
				? [{ start: 0, end: site.text.length, text: value, wholeValue: true }]
				: []
		},
	},
]

export const defaultEnabledRules = secretRules
	.filter((rule) => rule.severity === "high")
	.map((rule) => rule.id)

/** Strings and numbers in valid JSON, with their source ranges and paths. */
function jsonSites(source: string): Site[] {
	type Frame =
		| { type: "object"; key?: string; expectKey: boolean }
		| { type: "array"; index: number }
	const sites: Site[] = []
	const stack: Frame[] = []
	const nearestKey = () => {
		for (let index = stack.length - 1; index >= 0; index--) {
			const frame = stack[index]
			if (frame?.type === "object") return frame.key
		}
	}
	const path = () =>
		stack.map((frame) => (frame.type === "array" ? frame.index : (frame.key ?? "")))

	for (let i = 0; i < source.length; i++) {
		const char = source[i]
		const top = stack.at(-1)
		if (char === '"') {
			let end = i + 1
			while (end < source.length && source[end] !== '"') end += source[end] === "\\" ? 2 : 1
			const token = source.slice(i, end + 1)
			const value = JSON.parse(token) as string
			if (top?.type === "object" && top.expectKey) {
				top.key = value
				top.expectKey = false
			} else {
				const raw = source.slice(i + 1, end)
				// Escapes shift offsets, so only plain strings can be redacted in part.
				const plain = !raw.includes("\\")
				sites.push({
					kind: "string",
					from: i,
					to: end + 1,
					text: raw,
					textStart: plain ? i + 1 : undefined,
					value,
					key: nearestKey(),
					path: path(),
				})
			}
			i = end
		} else if (char === "{") stack.push({ type: "object", expectKey: true })
		else if (char === "[") stack.push({ type: "array", index: 0 })
		else if (char === "}" || char === "]") stack.pop()
		else if (char === ",") {
			if (top?.type === "object") {
				top.expectKey = true
				top.key = undefined
			} else if (top?.type === "array") top.index++
		} else if (char === "-" || (char !== undefined && char >= "0" && char <= "9")) {
			const number =
				/^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(source.slice(i, i + 400))?.[0] ?? char
			sites.push({
				kind: "number",
				from: i,
				to: i + number.length,
				text: number,
				textStart: i,
				value: number,
				key: nearestKey(),
				path: path(),
			})
			i += number.length - 1
		}
	}
	return sites
}

/** Scalars in YAML. Always redacted whole, since a plain scalar can't safely take `[` in its middle. */
function yamlSites(source: string): Site[] {
	const sites: Site[] = []
	const walk = (node: unknown, key: string | undefined, path: PathSegment[]) => {
		if (isMap(node)) {
			for (const pair of node.items) {
				const name = isScalar(pair.key) ? String(pair.key.value) : undefined
				walk(pair.value, name, [...path, name ?? ""])
			}
		} else if (isSeq(node)) {
			for (const [index, item] of node.items.entries()) walk(item, key, [...path, index])
		} else if (isScalar(node) && node.range) {
			const [from, to] = node.range
			const isNumber = typeof node.value === "number" || typeof node.value === "bigint"
			if (typeof node.value !== "string" && !isNumber) return
			const value = isNumber ? source.slice(from, to) : (node.value as string)
			sites.push({
				kind: isNumber ? "number" : "string",
				from,
				to,
				text: value,
				value,
				key,
				path,
			})
		}
	}
	walk(parseDocument(source).contents, undefined, [])
	return sites
}

function mask(text: string) {
	if (text.length < 12) return "•".repeat(Math.max(text.length, 4))
	return `${text.slice(0, 4)}${"•".repeat(Math.min(text.length - 8, 12))}${text.slice(-4)}`
}

/** Findings from the enabled rules, one per secret, highest severity first where they overlap. */
export function scanSecrets(source: string, kind: InputKind, enabled: ReadonlySet<string>) {
	const rules = secretRules.filter((rule) => enabled.has(rule.id))
	if (rules.length === 0) return []
	const sites = kind === "json" ? jsonSites(source) : yamlSites(source)
	const found: Finding[] = []
	for (const site of sites) {
		if (site.kind === "string" && isPlaceholder(site.value)) continue
		for (const rule of rules) {
			for (const match of rule.find(site)) {
				// A part already redacted, or a placeholder like `user:${PASSWORD}@`.
				if (isPlaceholder(match.text)) continue
				const partial =
					!match.wholeValue && site.textStart !== undefined && site.kind === "string"
				const label = `[REDACTED:${rule.id}]`
				found.push({
					ruleId: rule.id,
					ruleName: rule.name,
					severity: rule.severity,
					from: partial ? (site.textStart ?? 0) + match.start : site.from,
					to: partial ? (site.textStart ?? 0) + match.end : site.to,
					replacement: partial ? label : JSON.stringify(label),
					path: site.path,
					preview: mask(match.text),
					signature: `${rule.id}:${match.text}`,
				})
			}
		}
	}
	// Keep the most severe finding where ranges overlap, then the longest.
	found.sort(
		(a, b) =>
			severityRank[a.severity] - severityRank[b.severity] || b.to - b.from - (a.to - a.from),
	)
	const kept: Finding[] = []
	for (const finding of found) {
		if (!kept.some((other) => finding.from < other.to && other.from < finding.to))
			kept.push(finding)
	}
	return kept.sort((a, b) => a.from - b.from)
}

/** `source` with each finding replaced. Findings must not overlap (scanSecrets guarantees it). */
export function redact(source: string, findings: readonly Finding[]) {
	let result = source
	for (const finding of [...findings].sort((a, b) => b.from - a.from)) {
		result = result.slice(0, finding.from) + finding.replacement + result.slice(finding.to)
	}
	return result
}
