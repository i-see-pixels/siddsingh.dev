import type { MetadataRoute } from "next"
import { getPosts } from "@/lib/blog"
import { tools } from "@/lib/content"
import { navItems, siteConfig } from "@/lib/site-config"

const url = (path: string) => new URL(path, siteConfig.url).href

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const posts = await getPosts()
	const lastPost = posts[0]?.modifiedAt

	return [
		{ url: url("/"), changeFrequency: "weekly", priority: 1 },
		...navItems.map((item) => ({
			url: url(item.href),
			changeFrequency: "weekly" as const,
			priority: 0.8,
			lastModified: item.href === "/blog" ? lastPost : undefined,
		})),
		...tools.map((tool) => ({ url: url(`/tools/${tool.slug}`), priority: 0.6 })),
		...posts.map((post) => ({
			url: url(`/blog/${post.slug}`),
			lastModified: post.modifiedAt,
			changeFrequency: "monthly" as const,
			priority: 0.7,
			images: post.cover ? [post.cover.url] : undefined,
		})),
	]
}
