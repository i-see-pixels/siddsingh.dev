import { describe, expect, it } from "vitest"
import type { PostRepository } from "@/modules/blog/application/ports"
import { PublishPosts } from "@/modules/blog/application/post-commands"
import { CheckSlug } from "@/modules/blog/application/post-queries"
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
	const { posts } = repository(
		post("a", { slug: "taken" }),
		post("c", { slug: "taken-2" }),
		post("d", { slug: "x".repeat(100) }),
	)
	const check = new CheckSlug(posts)

	it("suggests the next free slug when another post has it", async () => {
		expect(await check.execute("taken", "b")).toEqual({
			available: false,
			suggestion: "taken-3",
		})
	})

	it("suggests nothing when the suffix wouldn't fit", async () => {
		expect(await check.execute("x".repeat(100), "b")).toEqual({
			available: false,
			suggestion: null,
		})
	})

	it("is available for a free slug and for the post's own", async () => {
		const available = { available: true, suggestion: null }
		expect(await check.execute("free", "b")).toEqual(available)
		expect(await check.execute("taken", "a")).toEqual(available)
	})
})
