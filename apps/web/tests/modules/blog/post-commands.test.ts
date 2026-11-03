import { describe, expect, it } from "vitest"
import type { PostRepository } from "@/modules/blog/application/ports"
import { PublishPosts } from "@/modules/blog/application/post-commands"
import { CheckSlug, GetSlugFilter } from "@/modules/blog/application/post-queries"
import { readBloomFilter } from "@/modules/blog/domain/bloom"
import { draftFields, type Post } from "@/modules/blog/domain/post"

const now = new Date("2026-06-01")

const post = (id: string, overrides: Partial<Post> = {}): Post => ({
	...draftFields(id),
	id,
	title: `Post ${id}`,
	summary: "A summary",
	content: "Some content",
	status: "draft",
	indexed: false,
	publishedAt: null,
	createdAt: now,
	updatedAt: now,
	...overrides,
})

function repository(...seed: Post[]) {
	const stored = new Map(seed.map((item) => [item.id, item]))
	const fake = {
		findById: async (id: string) => stored.get(id) ?? null,
		listSlugs: async () => [...stored.values()].map(({ id, slug }) => ({ id, slug })),
		findBySlug: async (slug: string) =>
			[...stored.values()].find((item) => item.slug === slug) ?? null,
		save: async (item: Post) => {
			stored.set(item.id, item)
			return item
		},
	}
	return { stored, posts: fake as unknown as PostRepository }
}

describe("PublishPosts", () => {
	it("publishes what it can and reports why the rest failed", async () => {
		const { stored, posts } = repository(post("a"), post("b", { summary: "" }))
		const { published, failed } = await new PublishPosts(posts, { now: () => now }).execute([
			"a",
			"b",
		])

		expect(published.map((item) => item.id)).toEqual(["a"])
		expect(stored.get("a")).toMatchObject({ status: "published", publishedAt: now })
		expect(stored.get("b")?.status).toBe("draft")
		expect(failed).toEqual([
			{ id: "b", title: "Post b", reason: "Add a summary before publishing." },
		])
	})

	it("skips posts that are already published", async () => {
		const original = new Date("2025-01-01")
		const { stored, posts } = repository(
			post("a", { status: "published", publishedAt: original }),
		)
		const { published, failed } = await new PublishPosts(posts, { now: () => now }).execute([
			"a",
		])

		expect(published).toEqual([])
		expect(failed).toEqual([])
		expect(stored.get("a")?.publishedAt).toBe(original)
	})
})

describe("CheckSlug", () => {
	const { posts } = repository(post("a", { slug: "taken" }))
	const check = new CheckSlug(posts)

	it("is false when another post has the slug", async () => {
		expect(await check.execute("taken", "b")).toBe(false)
	})

	it("is true for a free slug and for the post's own", async () => {
		expect(await check.execute("free", "b")).toBe(true)
		expect(await check.execute("taken", "a")).toBe(true)
	})
})

describe("GetSlugFilter", () => {
	it("holds the other posts' slugs, not the post's own", async () => {
		const { posts } = repository(post("a", { slug: "mine" }), post("b", { slug: "theirs" }))
		const has = readBloomFilter(await new GetSlugFilter(posts).execute("a"))
		expect(has("theirs")).toBe(true)
		expect(has("mine")).toBe(false)
	})
})
