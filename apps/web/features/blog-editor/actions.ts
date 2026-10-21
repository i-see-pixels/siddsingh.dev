"use server"

import { revalidatePath, updateTag } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { type ActionState, toActionState } from "@/lib/action-state"
import { requireAdmin } from "@/lib/auth/session"
import { POSTS_TAG } from "@/lib/blog"
import { blog } from "@/lib/server/container"
import type { SaveIntent } from "@/modules/blog/application/post-commands"
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
	try {
		const { post, previous } = await blog().savePost.execute(id, fields, intent)
		if (previous.status === "published" || post.status === "published")
			revalidateBlog(previous.slug, post.slug)
		return { ok: true, post: toSaved(post), fields: fieldsOf(post) }
	} catch (error) {
		return toActionState(error)
	}
}

export async function deletePostAction(id: string) {
	await requireAdmin()
	const post = await blog().deletePost.execute(id)
	if (post.status === "published") revalidateBlog(post.slug)
	redirect("/admin")
}
