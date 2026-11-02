import { type BloomFilter, createBloomFilter } from "../domain/bloom"
import type { Post, PostStatus } from "../domain/post"
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

/** A post can always keep its own slug. */
export class CheckSlug {
	constructor(private readonly posts: PostReader) {}

	async execute(slug: string, postId: string): Promise<boolean> {
		const post = await this.posts.findBySlug(slug)
		return !post || post.id === postId
	}
}

/**
 * Every other post's slug, as a Bloom filter for the editor: a slug it doesn't
 * contain is free without asking the server. The post's own slug is left out,
 * since keeping it is always allowed.
 */
export class GetSlugFilter {
	constructor(private readonly posts: PostReader) {}

	async execute(postId: string): Promise<BloomFilter> {
		const slugs = await this.posts.listSlugs()
		return createBloomFilter(
			slugs.filter((post) => post.id !== postId).map((post) => post.slug),
		)
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
