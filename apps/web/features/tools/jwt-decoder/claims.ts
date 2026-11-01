// What each common JWT claim means, and how to show times.

const claims: Record<string, string> = {
	iss: "Issuer: who created and signed the token.",
	sub: "Subject: the user or thing the token is about.",
	aud: "Audience: the service or services meant to accept the token.",
	exp: "Expires: the token must be rejected after this time.",
	nbf: "Not before: the token must be rejected before this time.",
	iat: "Issued at: when the token was created.",
	jti: "Token ID: a unique ID, used to stop the same token being replayed.",
	scope: "Scopes: what the token is allowed to do, separated by spaces.",
	scp: "Scopes: what the token is allowed to do (Microsoft and Okta style).",
	roles: "Roles granted to the subject.",
	azp: "Authorized party: the client the token was issued to.",
	nonce: "Nonce: ties an ID token to the sign-in request that asked for it.",
	auth_time: "When the user actually signed in.",
	sid: "Session ID at the identity provider.",
	email: "The user's email address.",
	email_verified: "Whether the identity provider has confirmed the email address.",
	name: "The user's display name.",
	tid: "Tenant ID (Microsoft Entra ID).",
	oid: "Object ID of the user (Microsoft Entra ID).",
	client_id: "The OAuth client the token was issued to.",
	cnf: "Confirmation: binds the token to a key the holder must prove they have.",
	typ: "Token type.",
	alg: "Signing algorithm.",
	kid: "Key ID: which of the issuer's keys signed the token.",
	cty: "Content type of the payload.",
	enc: "Encryption algorithm for the content (JWE).",
	jku: "URL of a key set to verify with. Servers must not trust it blindly.",
	jwk: "A public key embedded in the token itself.",
	x5u: "URL of an X.509 certificate chain.",
	x5c: "An embedded X.509 certificate chain.",
}

export function explainClaim(name: string) {
	return claims[name] ?? "Custom claim."
}

export const TIME_CLAIMS = new Set(["exp", "nbf", "iat", "auth_time", "updated_at"])

/** A duration in seconds as "2h 14m", "3 days" and so on. */
export function formatDuration(seconds: number) {
	const s = Math.abs(Math.round(seconds))
	if (s < 60) return `${s}s`
	if (s < 3600) return `${Math.floor(s / 60)}m`
	if (s < 86400) {
		const minutes = Math.floor((s % 3600) / 60)
		return `${Math.floor(s / 3600)}h${minutes ? ` ${minutes}m` : ""}`
	}
	const days = Math.floor(s / 86400)
	return `${days} ${days === 1 ? "day" : "days"}`
}

/** "in 2h 14m" or "3 days ago", from `now` (both in seconds). */
export function relativeTime(seconds: number, now: number) {
	const delta = seconds - now
	return delta >= 0 ? `in ${formatDuration(delta)}` : `${formatDuration(delta)} ago`
}

export function formatTimestamp(seconds: number) {
	const date = new Date(seconds * 1000)
	if (Number.isNaN(date.getTime())) return { local: "Invalid date", utc: "" }
	return {
		local: date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "medium" }),
		utc: `${date.toISOString().replace("T", " ").slice(0, 19)} UTC`,
	}
}
