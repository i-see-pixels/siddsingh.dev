import { getPosts } from "@/lib/blog"
import { siteConfig } from "@/lib/site-config"

// llms.txt (https://llmstxt.org): a plain Markdown map of the site for AI
// assistants and answer engines, listing every published post with its summary.
export async function GET() {
	const posts = await getPosts()
	const url = (path: string) => new URL(path, siteConfig.url).href

	const lines = [
		`# ${siteConfig.name}`,
		"",
		`> ${siteConfig.description}`,
		"",
		`Written by ${siteConfig.name}, a developer based in ${siteConfig.location}.`,
		"",
		"## Blog posts",
		"",
		...posts.map(
			(post) =>
				`- [${post.title}](${url(`/blog/${post.slug}`)}) (${post.date}): ${post.summary}`,
		),
		"",
		"## Pages",
		"",
		`- [Work](${url("/work")}): case studies`,
		`- [Products](${url("/products")})`,
		`- [Tools](${url("/tools")}): free developer tools`,
		`- [About](${url("/about")})`,
		`- [RSS feed](${url("/blog/rss.xml")})`,
		"",
		"## Tools",
		"",
		"Each tool runs in the browser. Links can pre-fill a tool through the URL fragment, which is never sent to a server.",
		"",
		`- [JSON formatter & validator](${url("/tools/json-formatter/workspace")}): open with \`#json=<base64url of the JSON or YAML>\`, and add \`&mode=yaml\` for YAML output. Secrets in the input are flagged and can be redacted.`,
		"",
	]

	return new Response(lines.join("\n"), {
		headers: { "Content-Type": "text/plain; charset=utf-8" },
	})
}
