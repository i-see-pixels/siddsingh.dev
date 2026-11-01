// Hands a diagram from a blog post to the previewer through the URL fragment,
// which stays in the browser and is not sent to the server.

import { fromBase64Url, toBase64Url } from "../share"

const PREFIX = "#code="

export function mermaidWorkspaceHref(code: string) {
	return `/tools/mermaid-previewer/workspace${PREFIX}${toBase64Url(code)}`
}

/** The diagram code carried by `hash`, or null when it carries none. */
export function codeFromHash(hash: string) {
	if (!hash.startsWith(PREFIX)) return null
	return fromBase64Url(hash.slice(PREFIX.length))
}
