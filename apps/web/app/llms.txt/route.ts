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
		`- [JWT decoder & security check](${url("/tools/jwt-decoder/workspace")}): open with \`#token=<header>.<payload>\` (leave the signature off so the link can't be used to sign in). It decodes the token and audits it for common security mistakes.`,
		`- [Cron expression explainer & generator](${url("/tools/cron-expression/workspace")}): open with \`#cron=<url-encoded expression>&platform=<standard|github-actions|kubernetes|eventbridge|vercel|quartz>&tz=<IANA zone>\`. It explains the schedule, lists the next runs and checks it against the platform's rules.`,
		`- [Regex tester](${url("/tools/regex-tester/workspace")}): open with \`#state=<base64url of JSON {p: pattern, f: flags, t: text, r?: replacement}>\`. It runs the pattern in the browser, explains it, checks it for catastrophic backtracking and shows whether it works in Python, Go, Java, Rust and PHP, with code for each.`,
		"",
	]

	return new Response(lines.join("\n"), {
		headers: { "Content-Type": "text/plain; charset=utf-8" },
	})
}
