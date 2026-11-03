import type { Post, PostStatus } from "@/modules/blog/domain/post"

/** What the posts list needs of a post; the Markdown stays on the server. */
export type PostRow = Pick<
	Post,
	| "id"
	| "slug"
	| "title"
	| "summary"
	| "tags"
	| "status"
	| "indexed"
	| "coverImageUrl"
	| "publishedAt"
	| "updatedAt"
>

export function toPostRow(post: Post): PostRow {
	return {
		id: post.id,
		slug: post.slug,
		title: post.title,
		summary: post.summary,
		tags: post.tags,
		status: post.status,
		indexed: post.indexed,
		coverImageUrl: post.coverImageUrl,
		publishedAt: post.publishedAt,
		updatedAt: post.updatedAt,
	}
}

export const PAGE_SIZES = [10, 25, 50] as const

const SORT_COLUMNS = ["title", "status", "indexed", "published", "edited"] as const

export type IndexedFilter = "all" | "indexed" | "not-indexed"
export type PostSort = { id: string; desc: boolean }

/** Everything about how the list is shown; it all lives in the URL. */
export type PostView = {
	query: string
	status: "all" | PostStatus
	indexed: IndexedFilter
	tags: string[]
	sort: PostSort
	page: number
	pageSize: number
}

export const DEFAULT_VIEW: PostView = {
	query: "",
	status: "all",
	indexed: "all",
	tags: [],
	sort: { id: "edited", desc: true },
	page: 1,
	pageSize: PAGE_SIZES[0],
}

const oneOf = <T extends string | number>(value: unknown, options: readonly T[], fallback: T) =>
	options.includes(value as T) ? (value as T) : fallback

/** "-title" sorts by title, descending. */
function parseSort(value: unknown): PostSort {
	if (typeof value !== "string") return DEFAULT_VIEW.sort
	const desc = value.startsWith("-")
	const id = desc ? value.slice(1) : value
	return oneOf<string>(id, SORT_COLUMNS, "") ? { id, desc } : DEFAULT_VIEW.sort
}

/** Reads the view from the page's search params; anything unknown falls back to its default. */
export function parseView(params: Record<string, string | string[] | undefined>): PostView {
	const { q, status, indexed, tags, sort, page, size } = params
	return {
		query: typeof q === "string" ? q : DEFAULT_VIEW.query,
		status: oneOf(status, ["published", "draft"], DEFAULT_VIEW.status),
		indexed: oneOf(indexed, ["indexed", "not-indexed"], DEFAULT_VIEW.indexed),
		// Tags can't contain commas: the editor splits on them.
		tags: typeof tags === "string" ? tags.split(",").filter(Boolean) : DEFAULT_VIEW.tags,
		sort: parseSort(sort),
		page: Math.max(Number.parseInt(String(page), 10) || 1, 1),
		pageSize: oneOf(Number(size), PAGE_SIZES, DEFAULT_VIEW.pageSize),
	}
}

/** The inverse of `parseView`, leaving defaults out so a plain list keeps a plain URL. */
export function viewToSearch(view: PostView) {
	const params = new URLSearchParams()
	const sort = `${view.sort.desc ? "-" : ""}${view.sort.id}`
	if (view.query) params.set("q", view.query)
	if (view.status !== DEFAULT_VIEW.status) params.set("status", view.status)
	if (view.indexed !== DEFAULT_VIEW.indexed) params.set("indexed", view.indexed)
	if (view.tags.length > 0) params.set("tags", view.tags.join(","))
	if (sort !== "-edited") params.set("sort", sort)
	if (view.page !== DEFAULT_VIEW.page) params.set("page", String(view.page))
	if (view.pageSize !== DEFAULT_VIEW.pageSize) params.set("size", String(view.pageSize))
	return params.toString()
}

export function isFiltered({ query, status, indexed, tags }: PostView) {
	return Boolean(query) || status !== "all" || indexed !== "all" || tags.length > 0
}

export function tagsOf(rows: PostRow[]) {
	return [...new Set(rows.flatMap((row) => row.tags))].sort()
}

/** Picking several tags widens the list: a post needs any one of them. */
export function filterPosts(rows: PostRow[], view: PostView) {
	const needle = view.query.trim().toLowerCase()
	return rows.filter(
		(row) =>
			(view.status === "all" || row.status === view.status) &&
			(view.indexed === "all" || row.indexed === (view.indexed === "indexed")) &&
			(view.tags.length === 0 || view.tags.some((tag) => row.tags.includes(tag))) &&
			(!needle ||
				`${row.title} ${row.slug} ${row.summary} ${row.tags.join(" ")}`
					.toLowerCase()
					.includes(needle)),
	)
}
