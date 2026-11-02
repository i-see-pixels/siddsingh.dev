import { useEffect, useState } from "react"
import type { SlugAvailability } from "@/modules/blog/application/post-queries"
import { INVALID_SLUG, isValidSlug, SLUG_TAKEN } from "@/modules/blog/domain/slug"
import { checkSlugAction } from "./actions"

const DEBOUNCE_MS = 400

export type SlugCheck =
	| { status: "idle" | "checking"; problem?: undefined; suggestion?: undefined }
	| { status: "available"; slug: string; problem?: undefined; suggestion?: undefined }
	| { status: "invalid"; problem: string; suggestion?: undefined }
	| { status: "taken"; problem: string; suggestion: string | null }

/**
 * Checks a slug against the other posts once typing pauses. A failed check reads
 * as idle: saving validates again, so it never needs to block the writer.
 */
export function useSlugCheck(id: string, input: string, savedSlug: string): SlugCheck {
	const slug = input.trim().toLowerCase()
	const valid = isValidSlug(slug)
	const needsCheck = valid && slug !== savedSlug
	const [result, setResult] = useState<{
		slug: string
		availability: SlugAvailability | null
	} | null>(null)

	useEffect(() => {
		if (!needsCheck) return
		let cancelled = false
		const timer = setTimeout(async () => {
			const availability = await checkSlugAction(id, slug).catch(() => null)
			if (!cancelled) setResult({ slug, availability })
		}, DEBOUNCE_MS)
		return () => {
			cancelled = true
			clearTimeout(timer)
		}
	}, [id, slug, needsCheck])

	if (!valid) return { status: "invalid", problem: INVALID_SLUG }
	if (!needsCheck) return { status: "idle" }
	// A result for an older slug says nothing about this one.
	if (result?.slug !== slug) return { status: "checking" }
	if (!result.availability) return { status: "idle" }
	const { available, suggestion } = result.availability
	return available
		? { status: "available", slug }
		: { status: "taken", problem: SLUG_TAKEN, suggestion }
}
