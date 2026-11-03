import type { Database } from "@workspace/db/client"
import { posts } from "@workspace/db/schema"
import { desc, eq, inArray, sql } from "drizzle-orm"
import type { PostRepository } from "../application/ports"
import { type Post, type PostFields, type PostStatus, PostValidationError } from "../domain/post"
import { SLUG_TAKEN } from "../domain/slug"

const UNIQUE_VIOLATION = "23505"

/** Translates the slug's unique constraint, the last guard against a race between two saves. */
function rethrowSlugTaken(error: unknown): never {
	const cause = (error as { cause?: { code?: string } })?.cause
	if (cause?.code === UNIQUE_VIOLATION) throw new PostValidationError({ slug: SLUG_TAKEN })
	throw error
}

export class DrizzlePostRepository implements PostRepository {
	constructor(private readonly db: Database) {}

	async findById(id: string): Promise<Post | null> {
		return (await this.db.query.posts.findFirst({ where: eq(posts.id, id) })) ?? null
	}

	async findBySlug(slug: string): Promise<Post | null> {
		return (await this.db.query.posts.findFirst({ where: eq(posts.slug, slug) })) ?? null
	}

	listSlugs() {
		return this.db.select({ id: posts.id, slug: posts.slug }).from(posts)
	}

	list(filter: { status?: PostStatus } = {}): Promise<Post[]> {
		return this.db
			.select()
			.from(posts)
			.where(filter.status ? eq(posts.status, filter.status) : undefined)
			.orderBy(
				filter.status === "published" ? desc(posts.publishedAt) : desc(posts.updatedAt),
			)
	}

	async create(fields: PostFields): Promise<Post> {
		const [post] = await this.db
			.insert(posts)
			.values(fields)
			.returning()
			.catch(rethrowSlugTaken)
		if (!post) throw new Error("Insert returned no row.")
		return post
	}

	async save({ id, createdAt: _, updatedAt: __, ...fields }: Post): Promise<Post> {
		const [post] = await this.db
			.update(posts)
			.set(fields)
			.where(eq(posts.id, id))
			.returning()
			.catch(rethrowSlugTaken)
		if (!post) throw new Error(`Post ${id} vanished while saving.`)
		return post
	}

	async setIndexed(ids: string[], indexed: boolean) {
		await this.db
			.update(posts)
			// Naming updatedAt keeps its $onUpdate from firing.
			.set({ indexed, updatedAt: sql`${posts.updatedAt}` })
			.where(inArray(posts.id, ids))
	}

	async delete(id: string) {
		await this.db.delete(posts).where(eq(posts.id, id))
	}
}
