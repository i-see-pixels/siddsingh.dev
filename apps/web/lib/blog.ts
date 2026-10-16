import { readdirSync } from "node:fs"
import path from "node:path"

// Blog posts are MDX files in content/blog; the file name is the slug and each
// post exports its metadata (start from content/blog/_template.mdx). Files
// starting with "_" are skipped; the template also keeps the dynamic import
// below compiling while there are no posts.

export type PostMeta = {
	title: string
	summary: string
	/** ISO date, e.g. "2026-10-17". */
	date: string
	updated?: string
	tags?: string[]
}

export type Post = PostMeta & { slug: string }

const postsDir = path.join(process.cwd(), "content/blog")

export function getPostSlugs() {
	try {
		return readdirSync(postsDir)
			.filter((file) => file.endsWith(".mdx") && !file.startsWith("_"))
			.map((file) => file.replace(/\.mdx$/, ""))
	} catch {
		return []
	}
}

export async function getPost(slug: string) {
	const { default: Content, metadata } = await import(`@/content/blog/${slug}.mdx`)
	return { Content, post: { slug, ...(metadata as PostMeta) } }
}

/** Newest first. */
export async function getPosts(): Promise<Post[]> {
	const posts = await Promise.all(getPostSlugs().map(async (slug) => (await getPost(slug)).post))
	return posts.sort((a, b) => b.date.localeCompare(a.date))
}

/** "17 Oct 2026". */
export function formatDate(date: string) {
	return new Date(date).toLocaleDateString("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
		timeZone: "UTC",
	})
}
