// Verifies a JWS signature with Web Crypto only. Keys are pasted by the user; nothing is fetched.

import { base64UrlToBytes } from "./decode"

export type HmacAlg = "HS256" | "HS384" | "HS512"

type AlgSpec =
	| { family: "hmac"; hash: string }
	| { family: "rsa"; hash: string }
	| { family: "pss"; hash: string; saltLength: number }
	| { family: "ecdsa"; hash: string; curve: string }
	| { family: "eddsa" }

const ALGORITHMS: Record<string, AlgSpec> = {
	HS256: { family: "hmac", hash: "SHA-256" },
	HS384: { family: "hmac", hash: "SHA-384" },
	HS512: { family: "hmac", hash: "SHA-512" },
	RS256: { family: "rsa", hash: "SHA-256" },
	RS384: { family: "rsa", hash: "SHA-384" },
	RS512: { family: "rsa", hash: "SHA-512" },
	PS256: { family: "pss", hash: "SHA-256", saltLength: 32 },
	PS384: { family: "pss", hash: "SHA-384", saltLength: 48 },
	PS512: { family: "pss", hash: "SHA-512", saltLength: 64 },
	ES256: { family: "ecdsa", hash: "SHA-256", curve: "P-256" },
	ES384: { family: "ecdsa", hash: "SHA-384", curve: "P-384" },
	ES512: { family: "ecdsa", hash: "SHA-512", curve: "P-521" },
	EdDSA: { family: "eddsa" },
	Ed25519: { family: "eddsa" },
}

export function algorithmFamily(alg: unknown) {
	return typeof alg === "string" ? ALGORITHMS[alg]?.family : undefined
}

export function isHmac(alg: unknown): alg is HmacAlg {
	return algorithmFamily(alg) === "hmac"
}

export type VerifyResult = {
	status: "verified" | "invalid" | "error" | "unsupported"
	message: string
	/**
	 * A public key was used as the secret for an HS* token: the algorithm-confusion attack.
	 * Ordinary paste mistakes, such as a key for the wrong curve, don't set it.
	 */
	confusion?: boolean
	/** Length of the HMAC secret in bytes, for the short-secret check. */
	secretBytes?: number
}

const importParams = (spec: AlgSpec) =>
	spec.family === "rsa"
		? { name: "RSASSA-PKCS1-v1_5", hash: spec.hash }
		: spec.family === "pss"
			? { name: "RSA-PSS", hash: spec.hash }
			: spec.family === "ecdsa"
				? { name: "ECDSA", namedCurve: spec.curve }
				: spec.family === "eddsa"
					? { name: "Ed25519" }
					: { name: "HMAC", hash: spec.hash }

const unsupported = (error: unknown): VerifyResult | null =>
	error instanceof DOMException && error.name === "NotSupportedError"
		? {
				status: "unsupported",
				message: "Your browser can't verify this algorithm (EdDSA needs a recent browser).",
			}
		: null

const verifyParams = (spec: AlgSpec) =>
	spec.family === "rsa"
		? { name: "RSASSA-PKCS1-v1_5" }
		: spec.family === "pss"
			? { name: "RSA-PSS", saltLength: spec.saltLength }
			: spec.family === "ecdsa"
				? { name: "ECDSA", hash: spec.hash }
				: spec.family === "eddsa"
					? { name: "Ed25519" }
					: { name: "HMAC" }

export function looksLikePublicKey(text: string) {
	const trimmed = text.trim()
	return (
		trimmed.startsWith("-----BEGIN") || (trimmed.startsWith("{") && trimmed.includes('"kty"'))
	)
}

function pemToDer(pem: string) {
	const body = pem.replace(/-----(BEGIN|END)[^-]+-----/g, "").replace(/\s+/g, "")
	const binary = atob(body)
	return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

/** The public key in `text` (PEM, JWK or JWKS), ready to verify with `alg`. */
async function importPublicKey(
	text: string,
	spec: AlgSpec,
	kid: unknown,
): Promise<CryptoKey | VerifyResult> {
	const trimmed = text.trim()
	if (trimmed.startsWith("-----BEGIN")) {
		if (/BEGIN (RSA |EC |ENCRYPTED )?PRIVATE KEY/.test(trimmed)) {
			return {
				status: "error",
				message: "That's a private key. Paste the public key instead.",
			}
		}
		if (trimmed.includes("BEGIN CERTIFICATE")) {
			return {
				status: "error",
				message:
					"That's a certificate. Paste its public key (openssl x509 -pubkey -noout -in cert.pem).",
			}
		}
		if (trimmed.includes("BEGIN RSA PUBLIC KEY")) {
			return {
				status: "error",
				message:
					"That's a PKCS#1 key. Convert it to SPKI first (openssl rsa -RSAPublicKey_in -in key.pem -pubout).",
			}
		}
		try {
			return await crypto.subtle.importKey(
				"spki",
				pemToDer(trimmed),
				importParams(spec),
				false,
				["verify"],
			)
		} catch (error) {
			return (
				unsupported(error) ?? {
					status: "error",
					message: "This public key doesn't fit the token's algorithm.",
				}
			)
		}
	}

	let parsed: unknown
	try {
		parsed = JSON.parse(trimmed)
	} catch {
		return { status: "error", message: "Paste a PEM public key, a JWK or a JWKS." }
	}
	let jwk = parsed as JsonWebKey & { kid?: string; keys?: (JsonWebKey & { kid?: string })[] }
	if (!jwk || typeof jwk !== "object") {
		return { status: "error", message: "Paste a PEM public key, a JWK or a JWKS." }
	}
	if (Array.isArray(jwk.keys)) {
		const match =
			jwk.keys.find((key) => key.kid !== undefined && key.kid === kid) ??
			(jwk.keys.length === 1 ? jwk.keys[0] : undefined)
		if (!match) {
			return {
				status: "error",
				message:
					typeof kid === "string"
						? `No key in this set has the kid "${kid}".`
						: "This key set has several keys and the token has no kid to pick one.",
			}
		}
		jwk = match
	}
	if (jwk.kty === "oct") {
		return {
			status: "error",
			message: "That's a symmetric (oct) key, but the token uses a public-key algorithm.",
		}
	}
	if ("d" in jwk) {
		return {
			status: "error",
			message: "That's a private key. Paste the public key instead (the JWK without d).",
		}
	}
	// Drop fields that make importKey stricter than verifying needs to be.
	const { key_ops: _keyOps, ext: _ext, use: _use, ...clean } = jwk
	try {
		return await crypto.subtle.importKey("jwk", clean, importParams(spec), false, ["verify"])
	} catch (error) {
		return (
			unsupported(error) ?? {
				status: "error",
				message: "This key doesn't fit the token's algorithm.",
			}
		)
	}
}

/** Verify `header.payload` against its signature with a pasted secret or public key. */
export async function verifySignature(
	token: { header: Record<string, unknown>; signingInput: string; signature: string },
	key: { value: string; base64?: boolean },
): Promise<VerifyResult> {
	const alg = token.header.alg
	const spec = typeof alg === "string" ? ALGORITHMS[alg] : undefined
	if (!spec) {
		return {
			status: "unsupported",
			message:
				typeof alg === "string" && alg.toLowerCase() === "none"
					? "An unsigned token has nothing to verify."
					: `Can't verify the algorithm ${JSON.stringify(alg)}.`,
		}
	}
	if (!token.signature) {
		return { status: "unsupported", message: "This token's signature was removed for sharing." }
	}
	const signature = base64UrlToBytes(token.signature)
	if (!signature) return { status: "error", message: "The signature isn't valid base64url." }
	if (!key.value.trim()) return { status: "error", message: "Paste a key to verify with." }
	const data = new TextEncoder().encode(token.signingInput)

	if (spec.family === "hmac") {
		const secret = key.base64
			? base64UrlToBytes(key.value.trim().replace(/\+/g, "-").replace(/\//g, "_"))
			: new TextEncoder().encode(key.value)
		if (!secret) return { status: "error", message: "The secret isn't valid base64." }
		const confusion = looksLikePublicKey(key.value)
		const cryptoKey = await crypto.subtle.importKey("raw", secret, importParams(spec), false, [
			"verify",
		])
		const ok = await crypto.subtle.verify(verifyParams(spec), cryptoKey, signature, data)
		return {
			status: ok ? "verified" : "invalid",
			message: ok ? "Signature verified." : "Invalid signature for this secret.",
			confusion,
			secretBytes: secret.length,
		}
	}

	if (!looksLikePublicKey(key.value)) {
		return {
			status: "error",
			message: `${String(alg)} needs a public key (PEM, JWK or JWKS), not a shared secret.`,
		}
	}
	let cryptoKey: CryptoKey | VerifyResult
	try {
		cryptoKey = await importPublicKey(key.value, spec, token.header.kid)
	} catch {
		cryptoKey = { status: "error", message: "Couldn't read this key." }
	}
	if (!(cryptoKey instanceof CryptoKey)) return cryptoKey
	const ok = await crypto.subtle.verify(verifyParams(spec), cryptoKey, signature, data)
	return {
		status: ok ? "verified" : "invalid",
		message: ok ? "Signature verified." : "Invalid signature for this key.",
	}
}
