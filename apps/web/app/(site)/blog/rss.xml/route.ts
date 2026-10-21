import { getPosts } from "@/lib/blog"
import { siteConfig } from "@/lib/site-config"

const escapeXml = (text: string) =>
	text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

/** RSS 2.0 feed of published posts, linked from every page's <head>. */
export async function GET() {
	const posts = await getPosts()
	const blogUrl = new URL("/blog", siteConfig.url).href
	const items = posts
		.map((post) => {
			const link = `${blogUrl}/${post.slug}`
			return `
		<item>
			<title>${escapeXml(post.title)}</title>
			<link>${link}</link>
			<guid isPermaLink="true">${link}</guid>
			<description>${escapeXml(post.summary)}</description>
			<pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
			${post.tags.map((tag) => `<category>${escapeXml(tag)}</category>`).join("")}
		</item>`
		})
		.join("")

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
	<channel>
		<title>${escapeXml(siteConfig.name)} · Blog</title>
		<link>${blogUrl}</link>
		<description>${escapeXml(siteConfig.description)}</description>
		<language>en</language>
		<atom:link href="${blogUrl}/rss.xml" rel="self" type="application/rss+xml" />
		${posts[0] ? `<lastBuildDate>${new Date(posts[0].modifiedAt).toUTCString()}</lastBuildDate>` : ""}${items}
	</channel>
</rss>`

	return new Response(xml, {
		headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
	})
}
