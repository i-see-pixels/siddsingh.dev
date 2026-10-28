// Share links for the tools. State travels in the URL fragment (after #), which the
// browser keeps to itself: it is never sent to a server.

/** Bytes as URL-safe base64 without padding. */
export function bytesToBase64Url(bytes: Uint8Array) {
	let binary = ""
	for (const byte of bytes) binary += String.fromCharCode(byte)
	return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

/** UTF-8 text as URL-safe base64 without padding. */
export function toBase64Url(text: string) {
	return bytesToBase64Url(new TextEncoder().encode(text))
}

/** The text in `encoded`, or null when it isn't valid base64url. */
export function fromBase64Url(encoded: string) {
	try {
		const binary = atob(encoded.replace(/-/g, "+").replace(/_/g, "/"))
		return new TextDecoder("utf-8", { fatal: true }).decode(
			Uint8Array.from(binary, (char) => char.charCodeAt(0)),
		)
	} catch {
		return null
	}
}

/** The `key=value` pairs in a fragment such as `#json=…&mode=yaml`. */
export function readFragment(hash: string) {
	return new URLSearchParams(hash.replace(/^#/, ""))
}

/** An absolute link to `path` carrying `params` in its fragment. */
export function fragmentLink(path: string, params: Record<string, string>) {
	return `${window.location.origin}${path}#${new URLSearchParams(params)}`
}
