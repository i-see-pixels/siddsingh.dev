import { describe, expect, it } from "vitest"
import {
	DEFAULT_VIEW,
	filterPosts,
	type PostRow,
	type PostView,
	parseView,
	tagsOf,
	viewToSearch,
} from "@/features/blog-editor/post-filters"

const row = (overrides: Partial<PostRow>): PostRow => ({
	id: "1",
	slug: "a-post",
	title: "A post",
	summary: "",
	tags: [],
	status: "draft",
	indexed: false,
	coverImageUrl: null,
	publishedAt: null,
	updatedAt: new Date("2026-01-01"),
	...overrides,
})

const live = row({
	id: "live",
	title: "Zebra",
	slug: "zebra",
	summary: "Stripes explained",
	tags: ["animals"],
	status: "published",
	indexed: true,
})
const older = row({
	id: "older",
	title: "Mango",
	slug: "mango",
	tags: ["food", "animals"],
	status: "published",
})
const draft = row({ id: "draft", title: "Apple", slug: "apple", tags: ["tech"] })
const all = [live, older, draft]

const ids = (patch: Partial<PostView>) =>
	filterPosts(all, { ...DEFAULT_VIEW, ...patch }).map((item) => item.id)

describe("filterPosts", () => {
	it("searches the title, slug, summary and tags without caring about case", () => {
		expect(ids({ query: "  ZEBRA " })).toEqual(["live"])
		expect(ids({ query: "stripes" })).toEqual(["live"])
		expect(ids({ query: "food" })).toEqual(["older"])
	})

	it("combines the status and indexed filters", () => {
		expect(ids({ status: "draft" })).toEqual(["draft"])
		expect(ids({ indexed: "indexed" })).toEqual(["live"])
		expect(ids({ status: "published", indexed: "not-indexed" })).toEqual(["older"])
	})

	it("keeps posts with any of the chosen tags", () => {
		expect(ids({ tags: ["food", "tech"] })).toEqual(["older", "draft"])
		expect(ids({ tags: ["animals"], indexed: "not-indexed" })).toEqual(["older"])
	})
})

describe("search params", () => {
	it("round-trips the view", () => {
		const view: PostView = {
			query: "a b",
			status: "draft",
			indexed: "not-indexed",
			tags: ["ai", "next js"],
			sort: { id: "title", desc: false },
			page: 3,
			pageSize: 25,
		}
		const search = viewToSearch(view)
		expect(parseView(Object.fromEntries(new URLSearchParams(search)))).toEqual(view)
	})

	it("writes descending sorts with a minus", () => {
		expect(viewToSearch({ ...DEFAULT_VIEW, sort: { id: "title", desc: true } })).toBe(
			"sort=-title",
		)
	})

	it("drops defaults and ignores values it doesn't know", () => {
		expect(viewToSearch(DEFAULT_VIEW)).toBe("")
		expect(
			parseView({
				status: "nope",
				sort: "nope",
				q: ["a", "b"],
				page: "-2",
				size: "7",
			}),
		).toEqual(DEFAULT_VIEW)
	})
})

describe("tagsOf", () => {
	it("lists each tag once, sorted", () => {
		expect(tagsOf(all)).toEqual(["animals", "food", "tech"])
	})
})
