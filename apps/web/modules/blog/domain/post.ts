import { NotFoundError, ValidationError } from "@/modules/shared/domain-error"
import { isValidSlug, MAX_SLUG_LENGTH } from "./slug"

export type PostStatus = "draft" | "published"

export type Post = {
	id: string
	slug: string
	title: string
	summary: string
	/** Markdown source. */
	content: string
	tags: string[]
	status: PostStatus
	/** Header image on the article, its banner on /blog and its social card. */
	coverImageUrl: string | null
	coverImageAlt: string
	/** Search and social overrides; empty falls back to the title and summary. */
	seoTitle: string
	seoDescription: string
	publishedAt: Date | null
	createdAt: Date
	updatedAt: Date
}

/** The fields an author edits; everything else is managed by the post's lifecycle. */
export type PostFields = Pick<
	Post,
	| "slug"
	| "title"
	| "summary"
	| "content"
	| "tags"
	| "coverImageUrl"
	| "coverImageAlt"
	| "seoTitle"
	| "seoDescription"
>

export type PostField = keyof PostFields

/** The editable part of a post, without its lifecycle fields. */
export function fieldsOf(post: Post): PostFields {
	return {
		slug: post.slug,
		title: post.title,
		summary: post.summary,
		content: post.content,
		tags: post.tags,
		coverImageUrl: post.coverImageUrl,
		coverImageAlt: post.coverImageAlt,
		seoTitle: post.seoTitle,
		seoDescription: post.seoDescription,
	}
}

/** seoTitle and seoDescription follow what search results show before truncating. */
export const POST_LIMITS = {
	title: 200,
	summary: 500,
	tags: 10,
	tag: 32,
	coverImageAlt: 200,
	seoTitle: 70,
	seoDescription: 160,
} as const

export class PostNotFoundError extends NotFoundError {
	constructor() {
		super("Post not found.")
	}
}

export class PostValidationError extends ValidationError<PostField> {}

/** A fresh draft with a placeholder title and a slug that is unique enough to retry rarely. */
export function draftFields(suffix: string): PostFields {
	return {
		slug: `untitled-${suffix}`,
		title: "Untitled",
		summary: "",
		content: "",
		tags: [],
		coverImageUrl: null,
		coverImageAlt: "",
		seoTitle: "",
		seoDescription: "",
	}
}

function isHttpsUrl(value: string) {
	return URL.canParse(value) && new URL(value).protocol === "https:"
}

/** Trims and normalises author input, throwing PostValidationError when it breaks a rule. */
export function normalizeFields(input: PostFields): PostFields {
	const fields: PostFields = {
		slug: input.slug.trim().toLowerCase(),
		title: input.title.trim(),
		summary: input.summary.trim(),
		content: input.content.replace(/\s+$/, ""),
		tags: [...new Set(input.tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))],
		coverImageUrl: input.coverImageUrl?.trim() || null,
		coverImageAlt: input.coverImageAlt.trim(),
		seoTitle: input.seoTitle.trim(),
		seoDescription: input.seoDescription.trim(),
	}

	const issues: Partial<Record<PostField, string>> = {}
	if (!fields.title) issues.title = "Add a title."
	else if (fields.title.length > POST_LIMITS.title)
		issues.title = `Keep the title under ${POST_LIMITS.title} characters.`
	if (!isValidSlug(fields.slug))
		issues.slug = `Use lowercase letters, numbers and single hyphens (up to ${MAX_SLUG_LENGTH} characters).`
	if (fields.summary.length > POST_LIMITS.summary)
		issues.summary = `Keep the summary under ${POST_LIMITS.summary} characters.`
	if (fields.tags.length > POST_LIMITS.tags) issues.tags = `Use at most ${POST_LIMITS.tags} tags.`
	else if (fields.tags.some((tag) => tag.length > POST_LIMITS.tag))
		issues.tags = `Keep each tag under ${POST_LIMITS.tag} characters.`
	if (fields.coverImageUrl && !isHttpsUrl(fields.coverImageUrl))
		issues.coverImageUrl = "Use an https image URL."
	if (fields.coverImageAlt.length > POST_LIMITS.coverImageAlt)
		issues.coverImageAlt = `Keep the alt text under ${POST_LIMITS.coverImageAlt} characters.`
	if (fields.seoTitle.length > POST_LIMITS.seoTitle)
		issues.seoTitle = `Search results cut titles after about ${POST_LIMITS.seoTitle} characters.`
	if (fields.seoDescription.length > POST_LIMITS.seoDescription)
		issues.seoDescription = `Search results cut descriptions after about ${POST_LIMITS.seoDescription} characters.`

	if (Object.keys(issues).length > 0) throw new PostValidationError(issues)
	return fields
}

/** A published post must stay complete enough to read, so edits to one are held to this too. */
export function assertPublishable(post: PostFields) {
	const issues: Partial<Record<PostField, string>> = {}
	if (!post.summary) issues.summary = "Add a summary before publishing."
	if (!post.content.trim()) issues.content = "Write the post before publishing."
	// The cover is shown to every reader and every crawler; it needs describing.
	if (post.coverImageUrl && !post.coverImageAlt)
		issues.coverImageAlt = "Describe the cover image before publishing."
	if (Object.keys(issues).length > 0) throw new PostValidationError(issues)
}

export function applyEdit(post: Post, input: PostFields): Post {
	const fields = normalizeFields(input)
	if (post.status === "published") assertPublishable(fields)
	return { ...post, ...fields }
}

/** Publishing again keeps the original date, so unpublish-and-republish does not bump a post. */
export function publish(post: Post, now: Date): Post {
	assertPublishable(post)
	return { ...post, status: "published", publishedAt: post.publishedAt ?? now }
}

export function unpublish(post: Post): Post {
	return { ...post, status: "draft" }
}
