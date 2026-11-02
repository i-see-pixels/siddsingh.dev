import type { Post, PostStatus } from "../domain/post"
import { isValidSlug } from "../domain/slug"
import type { PostReader } from "./ports"

export class ListPosts {
	constructor(private readonly posts: PostReader) {}

	execute(filter?: { status?: PostStatus }): Promise<Post[]> {
		return this.posts.list(filter)
	}
}

export class GetPost {
	constructor(private readonly posts: PostReader) {}

	execute(id: string): Promise<Post | null> {
		return this.posts.findById(id)
	}
}

const SUGGESTIONS = 5

export type SlugAvailability = { available: boolean; suggestion: string | null }

/** A post can always keep its own slug. A taken slug comes back with a free one to try. */
export class CheckSlug {
	constructor(private readonly posts: PostReader) {}

	async execute(slug: string, postId: string): Promise<SlugAvailability> {
		const post = await this.posts.findBySlug(slug)
		if (!post || post.id === postId) return { available: true, suggestion: null }
		for (let suffix = 2; suffix < 2 + SUGGESTIONS; suffix++) {
			const candidate = `${slug}-${suffix}`
			if (isValidSlug(candidate) && !(await this.posts.findBySlug(candidate)))
				return { available: false, suggestion: candidate }
		}
		return { available: false, suggestion: null }
	}
}

/** Drafts are invisible to readers, even when the slug is known. */
export class GetPublishedPost {
	constructor(private readonly posts: PostReader) {}

	async execute(slug: string): Promise<Post | null> {
		const post = await this.posts.findBySlug(slug)
		return post?.status === "published" ? post : null
	}
}
