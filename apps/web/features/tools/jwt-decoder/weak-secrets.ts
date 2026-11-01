// Tries known JWT secrets against an HMAC-signed token. Runs in a worker; no DOM.
// The wordlist is SecLists' scraped-JWT-secrets.txt (MIT), served from
// /tools/jwt-decoder/weak-secrets.txt and only fetched for HS* tokens.

import { base64UrlToBytes } from "./decode"
import type { HmacAlg } from "./verify"

export const WORDLIST_URL = "/tools/jwt-decoder/weak-secrets.txt"

/** Defaults that show up in tutorials and templates; tried before the rest of the list. */
const FIRST = [
	"secret",
	"your-256-bit-secret",
	"your-384-bit-secret",
	"your-512-bit-secret",
	"password",
	"changeme",
	"jwt_secret",
	"jwtsecret",
	"jwt-secret",
	"secretkey",
	"secret_key",
	"mysecret",
	"my-secret",
	"supersecret",
	"shhhhh",
	"key",
	"test",
	"123456",
]

/** Secrets from the wordlist text, defaults first, without blanks or repeats. */
export function parseWordlist(text: string) {
	const lines = text.split(/\r?\n/)
	// The first line credits the source.
	if (lines[0]?.startsWith("# source:")) lines.shift()
	return [...new Set([...FIRST, ...lines.filter((line) => line.length > 0)])]
}

const HASHES: Record<HmacAlg, string> = { HS256: "SHA-256", HS384: "SHA-384", HS512: "SHA-512" }

function sameBytes(a: Uint8Array, b: Uint8Array) {
	if (a.length !== b.length) return false
	for (let index = 0; index < a.length; index++) if (a[index] !== b[index]) return false
	return true
}

/** The secret in `secrets` that produced `signature`, or null. Checks in parallel batches. */
export async function findWeakSecret(
	token: { alg: HmacAlg; signingInput: string; signature: string },
	secrets: readonly string[],
	onProgress?: (checked: number) => void,
	batchSize = 256,
) {
	const expected = base64UrlToBytes(token.signature)
	if (!expected) return null
	const encoder = new TextEncoder()
	const data = encoder.encode(token.signingInput)
	const algorithm = { name: "HMAC", hash: HASHES[token.alg] }
	for (let start = 0; start < secrets.length; start += batchSize) {
		const batch = secrets.slice(start, start + batchSize)
		const results = await Promise.all(
			batch.map(async (secret) => {
				const key = await crypto.subtle.importKey(
					"raw",
					encoder.encode(secret),
					algorithm,
					false,
					["sign"],
				)
				return sameBytes(
					new Uint8Array(await crypto.subtle.sign("HMAC", key, data)),
					expected,
				)
			}),
		)
		const index = results.indexOf(true)
		if (index !== -1) return batch[index] ?? null
		onProgress?.(Math.min(start + batchSize, secrets.length))
	}
	return null
}
