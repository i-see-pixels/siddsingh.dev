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

/** Drafts are invisible to readers, even when the slug is known. */
export class GetPublishedPost {
	constructor(private readonly posts: PostReader) {}

	async execute(slug: string): Promise<Post | null> {
		const post = await this.posts.findBySlug(slug)
		return post?.status === "published" ? post : null
	}
}
