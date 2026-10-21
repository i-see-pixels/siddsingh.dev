// Hands a diagram from a blog post to the previewer through the URL fragment,
// which stays in the browser and is not sent to the server.

const PREFIX = "#code="

export function mermaidWorkspaceHref(code: string) {
	const bytes = new TextEncoder().encode(code)
	const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("")
	const encoded = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
	return `/tools/mermaid-previewer/workspace${PREFIX}${encoded}`
}

/** The diagram code carried by `hash`, or null when it carries none. */
export function codeFromHash(hash: string) {
	if (!hash.startsWith(PREFIX)) return null
	try {
		const base64 = hash.slice(PREFIX.length).replace(/-/g, "+").replace(/_/g, "/")
		const binary = atob(base64)
		return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)))
	} catch {
		return null
	}
}
