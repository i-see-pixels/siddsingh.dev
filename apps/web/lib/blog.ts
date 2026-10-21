import "server-only"
import { unstable_cache } from "next/cache"
import { blog } from "@/lib/server/container"
import type { Post as PostEntity } from "@/modules/blog/domain/post"
import { readingStats } from "@/modules/blog/domain/reading"

// Read model for the public blog. Results are cached under one tag, so readers
// get static pages and the database is only queried again after the admin
// changes a post (see revalidateBlog in features/blog-editor/actions.ts).

export const POSTS_TAG = "posts"

export type Post = {
	slug: string
	title: string
	summary: string
	/** ISO date, e.g. "2026-10-17". */
	date: string
	updated?: string
	tags: string[]
	cover: { url: string; alt: string } | null
	readingMinutes: number
	/** Full ISO timestamps, for structured data, feeds and the sitemap. */
	publishedAt: string
	modifiedAt: string
}

export type PostWithContent = Post & {
	content: string
	wordCount: number
	/** Search and social title and description, with the overrides applied. */
	seoTitle: string
	seoDescription: string
}

const isoDay = (iso: string) => iso.slice(0, 10)

// unstable_cache stores JSON, so the view model holds strings rather than Dates.
function toView(post: PostEntity): PostWithContent {
	const publishedAt = (post.publishedAt ?? post.createdAt).toISOString()
	const modifiedAt = post.updatedAt.toISOString()
	const { wordCount, minutes } = readingStats(post.content)
	return {
		slug: post.slug,
		title: post.title,
		summary: post.summary,
		content: post.content,
		date: isoDay(publishedAt),
		updated: isoDay(modifiedAt) > isoDay(publishedAt) ? isoDay(modifiedAt) : undefined,
		tags: post.tags,
		cover: post.coverImageUrl ? { url: post.coverImageUrl, alt: post.coverImageAlt } : null,
		readingMinutes: minutes,
		wordCount,
		publishedAt,
		modifiedAt,
		seoTitle: post.seoTitle || post.title,
		seoDescription: post.seoDescription || post.summary,
	}
}

// The "-v2" keys retire entries cached before covers and SEO fields existed;
// Vercel keeps the data cache across deployments.

/** Newest first. */
export const getPosts = unstable_cache(
	async (): Promise<Post[]> => {
		const posts = await blog().listPosts.execute({ status: "published" })
		return posts.map((post) => {
			const {
				content: _,
				wordCount: __,
				seoTitle: ___,
				seoDescription: ____,
				...view
			} = toView(post)
			return view
		})
	},
	["published-posts-v2"],
	{ tags: [POSTS_TAG] },
)

export const getPost = unstable_cache(
	async (slug: string): Promise<PostWithContent | null> => {
		const post = await blog().getPublishedPost.execute(slug)
		return post ? toView(post) : null
	},
	["published-post-v2"],
	{ tags: [POSTS_TAG] },
)

/** "17 Oct 2026". */
export function formatDate(date: string) {
	return new Date(date).toLocaleDateString("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
		timeZone: "UTC",
	})
}
