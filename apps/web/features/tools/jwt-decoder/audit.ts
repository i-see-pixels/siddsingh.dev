// The security audit: fifteen checks, each with a plain-English result and fix.

import {
	defaultEnabledRules,
	isPlaceholder,
	isSecretKey,
	type PathSegment,
	scanSecrets,
} from "../json-formatter/secrets"
import { formatDuration } from "./claims"
import type { JsonObject } from "./decode"
import { isHmac, type VerifyResult } from "./verify"

export type CheckStatus = "pass" | "info" | "warn" | "fail" | "skip" | "pending"

export type AuditCheck = {
	id: number
	title: string
	status: CheckStatus
	detail: string
	fix?: string
}

export type WeakSecretState =
	| { status: "idle" }
	| { status: "checking"; checked: number; total: number }
	| { status: "found"; secret: string }
	| { status: "clear"; total: number }
	| { status: "error"; message: string }

export type AuditInput = {
	kind: "jws" | "jwe"
	header: JsonObject
	payload?: JsonObject
	token: string
	/** Seconds since the epoch. */
	now: number
	/** The signature was removed for sharing, so signature checks can't run. */
	shared: boolean
	weakSecret: WeakSecretState
	verification?: VerifyResult | null
}

const PERSONAL_CLAIMS =
	/^(email|e_?mail_address|phone|phone_?number|mobile|address|street_?address|postal_?code|password|passwd|ssn|social_?security(_?number)?|dob|birth_?date|date_?of_?birth|national_?id|passport(_?number)?|card_?number|credit_?card|iban)$/i

/**
 * Path traversal, a system path, or SQL and shell injection in a kid. A lone `/` isn't
 * enough: standard-base64 key IDs contain it.
 */
const SUSPICIOUS_KID = /\.\.[/\\]|^\/(?:dev|etc|proc|tmp|var|usr|home|root)\b|[\\'";`|]|--|\$\(/

/** JWK members that only a private or symmetric key has. */
const PRIVATE_JWK_MEMBERS = new Set(["d", "p", "q", "dp", "dq", "qi", "k"])

const highRules = new Set(defaultEnabledRules)

/** A path as one string, for sets and React keys. */
export const pathKey = (path: readonly PathSegment[]) => JSON.stringify(path)

/** A path for people: `user.email`, `roles[0]`. */
export function pathLabel(path: readonly PathSegment[]) {
	return path
		.map((segment, index) =>
			typeof segment === "number" ? `[${segment}]` : index === 0 ? segment : `.${segment}`,
		)
		.join("")
}

/**
 * Paths to values that hold personal data, secrets or private key material, at any
 * depth. Anyone holding the token can read them.
 */
export function sensitivePaths(value: unknown) {
	const found = new Map<string, PathSegment[]>()
	const add = (path: PathSegment[]) => found.set(pathKey(path), path)
	const walk = (node: unknown, path: PathSegment[]) => {
		if (Array.isArray(node)) {
			for (const [index, child] of node.entries()) walk(child, [...path, index])
			return
		}
		if (!node || typeof node !== "object") return
		const isJwk = "kty" in node
		for (const [name, child] of Object.entries(node)) {
			const childPath = [...path, name]
			// Already masked, for example in a share link.
			if (typeof child === "string" && isPlaceholder(child)) continue
			if (
				PERSONAL_CLAIMS.test(name) ||
				(isJwk && PRIVATE_JWK_MEMBERS.has(name)) ||
				(typeof child === "string" && isSecretKey(name) && child.length >= 8)
			)
				add(childPath)
			else walk(child, childPath)
		}
	}
	walk(value, [])
	for (const finding of scanSecrets(JSON.stringify(value), "json", highRules)) {
		if (!found.has(pathKey(finding.path))) add(finding.path)
	}
	// A flagged object covers everything inside it.
	const paths = [...found.values()]
	return paths.filter(
		(path) =>
			!paths.some(
				(other) =>
					other.length < path.length &&
					other.every((segment, index) => segment === path[index]),
			),
	)
}

/** Labels of the payload values `sensitivePaths` finds. */
export function sensitiveClaims(payload: JsonObject) {
	return sensitivePaths(payload).map(pathLabel)
}

/** `value` with the value at each path in `masked` (see `pathKey`) replaced. */
export function maskPaths(
	value: unknown,
	masked: ReadonlySet<string>,
	path: PathSegment[] = [],
): unknown {
	if (path.length > 0 && masked.has(pathKey(path))) return "[REDACTED]"
	if (Array.isArray(value))
		return value.map((child, index): unknown => maskPaths(child, masked, [...path, index]))
	if (!value || typeof value !== "object") return value
	return Object.fromEntries(
		Object.entries(value).map(([name, child]) => [
			name,
			maskPaths(child, masked, [...path, name]),
		]),
	)
}

const numeric = (value: unknown) =>
	typeof value === "number" && Number.isFinite(value) ? value : undefined

export function audit(input: AuditInput): AuditCheck[] {
	const { header, payload = {}, now, shared, weakSecret, verification } = input
	const alg = typeof header.alg === "string" ? header.alg : undefined
	const isJwe = input.kind === "jwe"
	const checks: AuditCheck[] = []
	const add = (check: AuditCheck) => checks.push(check)
	const sharedSkip = (id: number, title: string) =>
		add({
			id,
			title,
			status: "skip",
			detail: "Skipped: the signature was removed for sharing, so there's nothing to check.",
		})

	// 1. Unsigned token
	if (shared) sharedSkip(1, "Signing algorithm")
	else if (isJwe) {
		add({
			id: 1,
			title: "Encryption",
			status: "pass",
			detail: `Encrypted: key management ${alg ?? "unknown"}, content ${String(header.enc ?? "unknown")}.`,
		})
	} else if (!alg || alg.toLowerCase() === "none") {
		add({
			id: 1,
			title: "Signing algorithm",
			status: "fail",
			detail: "The token is unsigned (alg: none). A server that accepts it lets anyone forge any identity.",
			fix: "Reject none and pin the algorithms the server accepts.",
		})
	} else add({ id: 1, title: "Signing algorithm", status: "pass", detail: `Signed with ${alg}.` })

	// 2. Weak HMAC secret, and 3. short user-supplied secret
	if (shared) {
		sharedSkip(2, "Known weak secret")
		sharedSkip(3, "Secret length")
	} else if (isJwe || !isHmac(alg)) {
		add({
			id: 2,
			title: "Known weak secret",
			status: "skip",
			detail: "Only applies to HMAC (HS*) tokens.",
		})
		add({
			id: 3,
			title: "Secret length",
			status: "skip",
			detail: "Only applies to HMAC (HS*) tokens.",
		})
	} else {
		const weak: AuditCheck =
			weakSecret.status === "found"
				? {
						id: 2,
						title: "Known weak secret",
						status: "fail",
						detail: `Signed with "${weakSecret.secret}", which is on public wordlists. Anyone can sign tokens with it.`,
						fix: "Rotate to a random secret of at least 32 bytes.",
					}
				: weakSecret.status === "clear"
					? {
							id: 2,
							title: "Known weak secret",
							status: "pass",
							detail: `Not one of ${weakSecret.total.toLocaleString()} known secrets. That doesn't prove the secret is strong.`,
						}
					: weakSecret.status === "checking"
						? {
								id: 2,
								title: "Known weak secret",
								status: "pending",
								detail: `Checking ${weakSecret.checked.toLocaleString()} of ${weakSecret.total.toLocaleString()} known secrets…`,
							}
						: weakSecret.status === "error"
							? {
									id: 2,
									title: "Known weak secret",
									status: "skip",
									detail: weakSecret.message,
								}
							: {
									id: 2,
									title: "Known weak secret",
									status: "pending",
									detail: "Waiting to check.",
								}
		add(weak)
		const bytes = verification?.secretBytes
		add(
			bytes === undefined
				? {
						id: 3,
						title: "Secret length",
						status: "skip",
						detail: "Paste the secret under Verify signature to check its length.",
					}
				: bytes < 32
					? {
							id: 3,
							title: "Secret length",
							status: "warn",
							detail: `The secret is ${bytes} bytes. Short secrets can be brute-forced offline.`,
							fix: "Use at least 32 random bytes.",
						}
					: { id: 3, title: "Secret length", status: "pass", detail: `${bytes} bytes.` },
		)
	}

	// 4–7. Expiry and validity window
	const exp = numeric(payload.exp)
	const iat = numeric(payload.iat)
	const nbf = numeric(payload.nbf)
	if (!isJwe) {
		add(
			exp === undefined
				? {
						id: 4,
						title: "Expiry",
						status: "fail",
						detail: "No exp claim: the token never expires, so a leaked one works forever.",
						fix: "Set exp, usually minutes to hours ahead for access tokens.",
					}
				: { id: 4, title: "Expiry", status: "pass", detail: "Has an exp claim." },
		)
		add(
			exp !== undefined && exp < now
				? {
						id: 5,
						title: "Still valid",
						status: "info",
						detail: `Expired ${formatDuration(now - exp)} ago.`,
					}
				: {
						id: 5,
						title: "Still valid",
						status: exp === undefined ? "skip" : "pass",
						detail:
							exp === undefined
								? "No exp to compare."
								: `Expires in ${formatDuration(exp - now)}.`,
					},
		)
		const lifetime = exp !== undefined && iat !== undefined ? exp - iat : undefined
		add(
			lifetime === undefined
				? { id: 6, title: "Lifetime", status: "skip", detail: "Needs both iat and exp." }
				: lifetime > 86400
					? {
							id: 6,
							title: "Lifetime",
							status: "warn",
							detail: `Valid for ${formatDuration(lifetime)}. Long-lived tokens widen the damage of a leak.`,
							fix: "Keep access tokens short and renew them with a refresh token.",
						}
					: {
							id: 6,
							title: "Lifetime",
							status: "pass",
							detail: `Valid for ${formatDuration(lifetime)}.`,
						},
		)
		const ahead = Math.max(nbf !== undefined ? nbf - now : 0, iat !== undefined ? iat - now : 0)
		add(
			ahead > 0
				? {
						id: 7,
						title: "Not yet valid",
						status: "info",
						detail: `${nbf !== undefined && nbf > now ? "nbf" : "iat"} is ${formatDuration(ahead)} in the future: not valid yet, or the issuer's clock is ahead.`,
					}
				: {
						id: 7,
						title: "Not yet valid",
						status: "pass",
						detail: "iat and nbf are in the past.",
					},
		)
	}

	// 8–10. Header risks
	const embedded = header.jwk
	const privateMembers =
		embedded && typeof embedded === "object"
			? Object.keys(embedded).filter((name) => PRIVATE_JWK_MEMBERS.has(name))
			: []
	add(
		"jwk" in header
			? {
					id: 8,
					title: "Embedded key",
					status: "fail",
					detail:
						privateMembers.length > 0
							? `The header's jwk includes private key material (${privateMembers.join(", ")}). Anyone with the token can sign as the issuer.`
							: "The header carries its own key (jwk). If the server trusts it, an attacker can sign with their own key.",
					fix:
						privateMembers.length > 0
							? "Rotate this key now, and never put a key in the header."
							: "Ignore keys in the header; verify only with keys the server already has.",
				}
			: { id: 8, title: "Embedded key", status: "pass", detail: "No jwk in the header." },
	)
	const keyUrl = ["jku", "x5u"].filter((name) => name in header)
	add(
		keyUrl.length > 0
			? {
					id: 9,
					title: "Key URL",
					status: "warn",
					detail: `The header points to a key URL (${keyUrl.join(", ")}). An attacker can point it at their own keys.`,
					fix: "Only fetch keys from an allowlist of URLs.",
				}
			: { id: 9, title: "Key URL", status: "pass", detail: "No jku or x5u in the header." },
	)
	const kid = header.kid
	add(
		typeof kid === "string" && SUSPICIOUS_KID.test(kid)
			? {
					id: 10,
					title: "Key ID",
					status: "fail",
					detail: `The kid "${kid}" looks like path traversal or injection.`,
					fix: "Treat kid as an opaque lookup key: never a file path or part of a query.",
				}
			: {
					id: 10,
					title: "Key ID",
					status: kid === undefined ? "skip" : "pass",
					detail: kid === undefined ? "No kid in the header." : "The kid looks safe.",
				},
	)

	// 11–13. Payload contents
	if (!isJwe) {
		const flagged = sensitiveClaims(payload)
		add(
			flagged.length > 0
				? {
						id: 11,
						title: "Readable data",
						status: "warn",
						detail: `The payload holds ${flagged.join(", ")}. Anyone with the token can read it: it's encoded, not encrypted.`,
						fix: "Keep personal data and secrets out of tokens, or use an encrypted token (JWE).",
					}
				: {
						id: 11,
						title: "Readable data",
						status: "pass",
						detail: "No personal data or secrets found in the payload.",
					},
		)
		add(
			"aud" in payload
				? { id: 12, title: "Audience", status: "pass", detail: "Has an aud claim." }
				: {
						id: 12,
						title: "Audience",
						status: "info",
						detail: "No aud claim: a token minted for one service may be accepted by another.",
					},
		)
		add(
			"iss" in payload
				? { id: 13, title: "Issuer", status: "pass", detail: "Has an iss claim." }
				: {
						id: 13,
						title: "Issuer",
						status: "info",
						detail: "No iss claim: a server can't tell who minted the token.",
					},
		)
	}

	// 14. Size
	const size = new TextEncoder().encode(input.token).length
	add(
		size > 4096
			? {
					id: 14,
					title: "Size",
					status: "info",
					detail: `${(size / 1024).toFixed(1)} KB: too big for some cookies and headers.`,
				}
			: { id: 14, title: "Size", status: "pass", detail: `${size.toLocaleString()} bytes.` },
	)

	// 15. Algorithm confusion
	if (shared) sharedSkip(15, "Key matches algorithm")
	else if (!isJwe) {
		add(
			verification?.confusion
				? {
						id: 15,
						title: "Key matches algorithm",
						status: "fail",
						detail: `This ${alg ?? "HMAC"} token is checked with a public key as its secret. Servers that pick the algorithm from the token can be tricked into exactly this, letting anyone who has the public key sign tokens.`,
						fix: "Pin the expected algorithm for each key on the server.",
					}
				: {
						id: 15,
						title: "Key matches algorithm",
						status: verification ? "pass" : "skip",
						detail: verification
							? "The key fits the algorithm."
							: "Paste a key under Verify signature to check it.",
					},
		)
	}

	const order: Record<CheckStatus, number> = {
		fail: 0,
		warn: 1,
		pending: 2,
		info: 3,
		pass: 4,
		skip: 5,
	}
	return checks.sort((a, b) => order[a.status] - order[b.status] || a.id - b.id)
}

export function verdict(checks: AuditCheck[]) {
	const fails = checks.filter((check) => check.status === "fail").length
	const warns = checks.filter((check) => check.status === "warn").length
	if (fails + warns === 0) return "No problems found"
	const parts = []
	if (fails) parts.push(`${fails} ${fails === 1 ? "problem" : "problems"}`)
	if (warns) parts.push(`${warns} ${warns === 1 ? "warning" : "warnings"}`)
	return parts.join(", ")
}
