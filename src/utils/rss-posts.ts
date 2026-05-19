import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"

type RssPostMetadata = {
	title: string
	publishedAt: string
	summary: string
	image?: string
	tags?: string[]
}

export type RssPost = {
	metadata: RssPostMetadata
	slug: string
}

const blogPostsDir = path.join(process.cwd(), "src", "app", "(site)", "blog", "posts")

export function getRssPosts(): RssPost[] {
	if (!fs.existsSync(blogPostsDir)) {
		return []
	}

	return fs
		.readdirSync(blogPostsDir)
		.filter((file) => path.extname(file) === ".mdx")
		.map((file) => {
			const rawContent = fs.readFileSync(path.join(blogPostsDir, file), "utf-8")
			const { data } = matter(rawContent)

			return {
				slug: path.basename(file, path.extname(file)),
				metadata: {
					title: data.title || "",
					publishedAt: data.publishedAt || "",
					summary: data.summary || "",
					image: data.image || "",
					tags: data.tags || [],
				},
			}
		})
}
