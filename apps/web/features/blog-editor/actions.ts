"use server"

import { revalidatePath, updateTag } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { type ActionState, toActionState } from "@/lib/action-state"
import { requireAdmin } from "@/lib/auth/session"
import { POSTS_TAG } from "@/lib/blog"
import { blog } from "@/lib/server/container"
import type { PublishFailure, SaveIntent } from "@/modules/blog/application/post-commands"
import type { SlugAvailability } from "@/modules/blog/application/post-queries"
import { fieldsOf, type Post, type PostField, type PostFields } from "@/modules/blog/domain/post"

/** The editor's view of a saved post. Dates are ISO strings so they cross to the client. */
export type SavedPost = {
	slug: string
	status: Post["status"]
	publishedAt: string | null
	updatedAt: string
}

/** On success, `fields` are the stored values: trimmed, lowercased and de-duplicated. */
export type SaveState = ActionState<PostField> & { post?: SavedPost; fields?: PostFields }

function toSaved(post: Post): SavedPost {
	return {
		slug: post.slug,
		status: post.status,
		publishedAt: post.publishedAt?.toISOString() ?? null,
		updatedAt: post.updatedAt.toISOString(),
	}
}

/** Readers only see published posts, so a draft's edits leave the public cache alone. */
function revalidateBlog(...slugs: string[]) {
	updateTag(POSTS_TAG)
	for (const path of ["/", "/blog", "/blog/rss.xml", "/sitemap.xml", "/llms.txt"])
		revalidatePath(path)
	// Tool pages link to their guide once it's published.
	revalidatePath("/tools/[slug]", "page")
	for (const slug of new Set(slugs)) {
		revalidatePath(`/blog/${slug}`)
		revalidatePath(`/og/blog/${slug}`)
	}
}

export async function createPostAction() {
	await requireAdmin()
	const post = await blog().createPost.execute()
	redirect(`/admin/posts/${post.id}`)
}

const postFields = z.object({
	title: z.string(),
	slug: z.string(),
	summary: z.string(),
	content: z.string(),
	tags: z.array(z.string()),
	coverImageUrl: z.string().nullable(),
	coverImageAlt: z.string(),
	seoTitle: z.string(),
	seoDescription: z.string(),
})

/** Saves the editor's fields, then publishes or unpublishes when asked to. */
export async function savePostAction(
	id: string,
	input: z.input<typeof postFields>,
	intent: SaveIntent,
): Promise<SaveState> {
	await requireAdmin()
	const fields = postFields.parse(input)
	let state: SaveState
	try {
		const { post, previous } = await blog().savePost.execute(id, fields, intent)
		if (previous.status === "published" || post.status === "published")
			revalidateBlog(previous.slug, post.slug)
		state = { ok: true, post: toSaved(post), fields: fieldsOf(post) }
	} catch (error) {
		return toActionState(error)
	}
	// Outside the try: redirect throws.
	if (intent === "publish") redirect("/admin")
	return state
}

/** The editor's live check; `savePostAction` still has the final say. */
export async function checkSlugAction(id: string, slug: string): Promise<SlugAvailability> {
	await requireAdmin()
	return blog().checkSlug.execute(z.string().parse(slug), id)
}

const postIds = z.array(z.uuid())

export type PublishManyResult = { published: number; failed: PublishFailure[] }

export async function publishPostsAction(ids: string[]): Promise<PublishManyResult> {
	await requireAdmin()
	const { published, failed } = await blog().publishPosts.execute(postIds.parse(ids))
	if (published.length > 0) revalidateBlog(...published.map((post) => post.slug))
	return { published: published.length, failed }
}

export async function setPostsIndexedAction(ids: string[], indexed: boolean) {
	await requireAdmin()
	await blog().setPostsIndexed.execute(postIds.parse(ids), z.boolean().parse(indexed))
	revalidatePath("/admin")
}

export async function deletePostAction(id: string) {
	await requireAdmin()
	const post = await blog().deletePost.execute(id)
	if (post.status === "published") revalidateBlog(post.slug)
	redirect("/admin")
}
