// Splits and decodes a JWT. Pure and DOM-free, so tests and workers can use it.

export type Segment = "header" | "payload" | "signature"
export type JsonObject = Record<string, unknown>

export type Decoded =
	| { status: "empty" }
	| {
			status: "error"
			token: string
			notes: string[]
			message: string
			/** The part that failed, so the editor can mark it. */
			part?: Segment
	  }
	| {
			status: "ok"
			kind: "jws"
			token: string
			notes: string[]
			header: JsonObject
			payload: JsonObject
			headerText: string
			payloadText: string
			/** base64url signature; empty for a shared token whose signature was removed. */
			signature: string
			/** `header.payload`, the bytes the signature covers. */
			signingInput: string
	  }
	| {
			status: "ok"
			kind: "jwe"
			token: string
			notes: string[]
			header: JsonObject
			headerText: string
	  }

/** The token inside pasted text: drops `Bearer `, wrapping quotes and whitespace, and says what it dropped. */
export function normalizeToken(input: string) {
	const notes: string[] = []
	let token = input.trim()
	const quoted = /^(["'`])([\s\S]*)\1$/.exec(token)
	if (quoted) {
		token = (quoted[2] ?? "").trim()
		notes.push("Removed the surrounding quotes.")
	}
	if (/^bearer\s+/i.test(token)) {
		token = token.replace(/^bearer\s+/i, "")
		notes.push("Removed the Bearer prefix.")
	}
	if (/\s/.test(token)) {
		token = token.replace(/\s+/g, "")
		notes.push("Removed spaces and line breaks.")
	}
	return { token, notes }
}

/** Bytes from base64url (padding optional), or null when it isn't base64url. */
export function base64UrlToBytes(text: string) {
	if (!/^[A-Za-z0-9_-]*={0,2}$/.test(text)) return null
	try {
		const binary = atob(text.replace(/=+$/, "").replace(/-/g, "+").replace(/_/g, "/"))
		return Uint8Array.from(binary, (char) => char.charCodeAt(0))
	} catch {
		return null
	}
}

function decodeJsonPart(text: string, part: Segment) {
	const label = part === "header" ? "header" : "payload"
	const bytes = base64UrlToBytes(text)
	if (!bytes) return { error: `The ${label} isn't valid base64url.` }
	let decoded: string
	try {
		decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes)
	} catch {
		return { error: `The ${label} decodes, but not to UTF-8 text.` }
	}
	try {
		const value: unknown = JSON.parse(decoded)
		if (!value || typeof value !== "object" || Array.isArray(value)) {
			return { error: `The ${label} decodes, but isn't a JSON object.` }
		}
		return { value: value as JsonObject, text: decoded }
	} catch {
		return { error: `The ${label} decodes, but isn't JSON.` }
	}
}

/**
 * Decode `input`. Two parts are accepted only when `allowUnsigned` is set, for share
 * links, which carry `header.payload` with the signature removed on purpose.
 */
export function decodeToken(input: string, options: { allowUnsigned?: boolean } = {}): Decoded {
	if (!input.trim()) return { status: "empty" }
	const { token, notes } = normalizeToken(input)
	const parts = token.split(".")
	const fail = (message: string, part?: Segment): Decoded => ({
		status: "error",
		token,
		notes,
		message,
		part,
	})

	if (parts.length === 5) {
		const header = decodeJsonPart(parts[0] ?? "", "header")
		if ("error" in header) return fail(header.error ?? "", "header")
		return {
			status: "ok",
			kind: "jwe",
			token,
			notes,
			header: header.value,
			headerText: header.text,
		}
	}
	const unsigned = parts.length === 2 && options.allowUnsigned
	if (parts.length !== 3 && !unsigned) {
		return fail(`A JWT has three parts separated by dots. This has ${parts.length}.`)
	}
	const [headerPart = "", payloadPart = "", signature = ""] = parts
	const header = decodeJsonPart(headerPart, "header")
	if ("error" in header) return fail(header.error ?? "", "header")
	const payload = decodeJsonPart(payloadPart, "payload")
	if ("error" in payload) return fail(payload.error ?? "", "payload")
	if (signature && !base64UrlToBytes(signature)) {
		return fail("The signature isn't valid base64url.", "signature")
	}
	return {
		status: "ok",
		kind: "jws",
		token,
		notes,
		header: header.value,
		payload: payload.value,
		headerText: header.text,
		payloadText: payload.text,
		signature,
		signingInput: `${headerPart}.${payloadPart}`,
	}
}
