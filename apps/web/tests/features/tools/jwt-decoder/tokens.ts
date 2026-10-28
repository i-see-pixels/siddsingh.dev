// Builds signed test tokens at runtime with Web Crypto, so no key material is checked in.

import { bytesToBase64Url, textToBase64Url } from "@/features/tools/jwt-decoder/decode"

type Json = Record<string, unknown>

export function unsignedParts(header: Json, payload: Json) {
	return `${textToBase64Url(JSON.stringify(header))}.${textToBase64Url(JSON.stringify(payload))}`
}

export async function hmacToken(
	header: Json,
	payload: Json,
	secret: string | Uint8Array<ArrayBuffer>,
) {
	const hash =
		{ HS256: "SHA-256", HS384: "SHA-384", HS512: "SHA-512" }[String(header.alg)] ?? "SHA-256"
	const bytes = typeof secret === "string" ? new TextEncoder().encode(secret) : secret
	const key = await crypto.subtle.importKey("raw", bytes, { name: "HMAC", hash }, false, ["sign"])
	const input = unsignedParts(header, payload)
	const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(input))
	return `${input}.${bytesToBase64Url(new Uint8Array(signature))}`
}

const ASYMMETRIC = {
	RS256: {
		generate: {
			name: "RSASSA-PKCS1-v1_5",
			modulusLength: 2048,
			publicExponent: new Uint8Array([1, 0, 1]),
			hash: "SHA-256",
		},
		sign: { name: "RSASSA-PKCS1-v1_5" },
	},
	PS256: {
		generate: {
			name: "RSA-PSS",
			modulusLength: 2048,
			publicExponent: new Uint8Array([1, 0, 1]),
			hash: "SHA-256",
		},
		sign: { name: "RSA-PSS", saltLength: 32 },
	},
	ES256: {
		generate: { name: "ECDSA", namedCurve: "P-256" },
		sign: { name: "ECDSA", hash: "SHA-256" },
	},
	EdDSA: { generate: { name: "Ed25519" }, sign: { name: "Ed25519" } },
} as const

export type AsymmetricAlg = keyof typeof ASYMMETRIC

/** A token signed with a fresh key pair, plus that key's public half as PEM and JWK. */
export async function asymmetricToken(alg: AsymmetricAlg, payload: Json, kid = "key-1") {
	const spec = ASYMMETRIC[alg]
	const pair = (await crypto.subtle.generateKey(spec.generate, true, [
		"sign",
		"verify",
	])) as CryptoKeyPair
	const input = unsignedParts({ alg, typ: "JWT", kid }, payload)
	const signature = await crypto.subtle.sign(
		spec.sign,
		pair.privateKey,
		new TextEncoder().encode(input),
	)
	const spki = new Uint8Array(await crypto.subtle.exportKey("spki", pair.publicKey))
	const base64 = btoa(String.fromCharCode(...spki))
	const pem = `-----BEGIN PUBLIC KEY-----\n${base64.match(/.{1,64}/g)?.join("\n")}\n-----END PUBLIC KEY-----`
	const jwk = { ...(await crypto.subtle.exportKey("jwk", pair.publicKey)), kid }
	return { token: `${input}.${bytesToBase64Url(new Uint8Array(signature))}`, pem, jwk }
}
