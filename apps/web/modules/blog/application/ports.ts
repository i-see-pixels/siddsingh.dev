import type { Post, PostFields, PostStatus } from "../domain/post"

// Split by direction so read-only callers (the public blog) never depend on writes.

export interface PostReader {
	findById(id: string): Promise<Post | null>
	findBySlug(slug: string): Promise<Post | null>
	/** Published posts newest first by publish date; otherwise most recently edited first. */
	list(filter?: { status?: PostStatus }): Promise<Post[]>
}

export interface PostWriter {
	create(fields: PostFields): Promise<Post>
	/** Persists every field of an existing post. Throws PostValidationError if the slug is taken. */
	save(post: Post): Promise<Post>
	delete(id: string): Promise<void>
}

export type PostRepository = PostReader & PostWriter
