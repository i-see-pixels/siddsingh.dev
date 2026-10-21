/**
 * Structured data for search and answer engines. "<" is escaped so text from a
 * post (a title, a tag) can never close the script tag early.
 */
export function JsonLd({ data }: { data: object }) {
	return (
		<script
			type="application/ld+json"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: serialised JSON with "<" escaped.
			dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
		/>
	)
}
