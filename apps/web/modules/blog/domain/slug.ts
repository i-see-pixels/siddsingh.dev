const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const MAX_SLUG_LENGTH = 100

/** "Hello, World!" → "hello-world". */
export function slugify(text: string) {
	return text
		.normalize("NFKD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, MAX_SLUG_LENGTH)
		.replace(/-+$/, "")
}

export function isValidSlug(slug: string) {
	return slug.length <= MAX_SLUG_LENGTH && SLUG.test(slug)
}
