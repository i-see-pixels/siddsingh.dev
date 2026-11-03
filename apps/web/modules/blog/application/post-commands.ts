import type { Clock, IdGenerator } from "@/modules/shared/ports"
import {
	applyEdit,
	draftFields,
	type Post,
	type PostFields,
	PostNotFoundError,
	PostValidationError,
	publish,
	unpublish,
} from "../domain/post"
import { SLUG_TAKEN } from "../domain/slug"
import type { PostRepository } from "./ports"

// Each use case loads the post, applies a domain rule and saves the result.
// Callers get the saved post back, so they can refresh caches by slug.

async function load(posts: PostRepository, id: string) {
	const post = await posts.findById(id)
	if (!post) throw new PostNotFoundError()
	return post
}

export class CreatePost {
	constructor(
		private readonly posts: PostRepository,
		private readonly ids: IdGenerator,
	) {}

	execute(): Promise<Post> {
		return this.posts.create(draftFields(this.ids.uuid().slice(0, 8)))
	}
}

export type SaveIntent = "save" | "publish" | "unpublish"

/**
 * Applies the author's fields and, when asked, a status change, then saves once:
 * a publish that fails validation leaves the post as it was. Unpublishing goes
 * first, so a published post can be taken down even while its fields are
 * incomplete.
 */
export class SavePost {
	constructor(
		private readonly posts: PostRepository,
		private readonly clock: Clock,
	) {}

	/** Returns the saved post and the post as it was, whose slug and status the caches need. */
	async execute(id: string, fields: PostFields, intent: SaveIntent) {
		const previous = await load(this.posts, id)
		let post = applyEdit(intent === "unpublish" ? unpublish(previous) : previous, fields)
		if (intent === "publish") post = publish(post, this.clock.now())
		if (post.slug !== previous.slug) {
			const existing = await this.posts.findBySlug(post.slug)
			if (existing && existing.id !== id) throw new PostValidationError({ slug: SLUG_TAKEN })
		}
		return { post: await this.posts.save(post), previous }
	}
}

export type PublishFailure = { id: string; title: string; reason: string }

/**
 * Publishes each post on its own, so one incomplete draft doesn't hold back the
 * rest. Posts that are already published are left alone.
 */
export class PublishPosts {
	constructor(
		private readonly posts: PostRepository,
		private readonly clock: Clock,
	) {}

	async execute(ids: string[]) {
		const published: Post[] = []
		const failed: PublishFailure[] = []
		for (const id of ids) {
			const post = await load(this.posts, id)
			if (post.status === "published") continue
			try {
				published.push(await this.posts.save(publish(post, this.clock.now())))
			} catch (error) {
				if (!(error instanceof PostValidationError)) throw error
				const [reason = error.message] = Object.values(error.issues)
				failed.push({ id, title: post.title, reason })
			}
		}
		return { published, failed }
	}
}

export class SetPostsIndexed {
	constructor(private readonly posts: PostRepository) {}

	execute(ids: string[], indexed: boolean): Promise<void> {
		return this.posts.setIndexed(ids, indexed)
	}
}

export class DeletePost {
	constructor(private readonly posts: PostRepository) {}

	async execute(id: string): Promise<Post> {
		const post = await load(this.posts, id)
		await this.posts.delete(id)
		return post
	}
}
