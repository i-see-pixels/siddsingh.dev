import { useCallback, useEffect, useMemo, useState } from "react"
import { type BloomFilter, readBloomFilter } from "@/modules/blog/domain/bloom"
import { INVALID_SLUG, isValidSlug, SLUG_TAKEN } from "@/modules/blog/domain/slug"
import { checkSlugAction, slugFilterAction } from "./actions"

const DEBOUNCE_MS = 400

export type SlugCheck =
	| { status: "idle" | "checking"; problem?: undefined }
	| { status: "available"; slug: string; problem?: undefined }
	| { status: "invalid" | "taken"; problem: string }

/**
 * Checks a slug against the other posts. The Bloom filter answers "free" at once;
 * only a slug it might contain waits for the server, once typing pauses. A failed
 * check reads as idle: saving validates again, so it never needs to block.
 *
 * The filter is a snapshot from when the editor loaded, so it is rebuilt after
 * each save and whenever the tab regains focus, when another tab may have taken
 * a slug.
 */
export function useSlugCheck(
	id: string,
	input: string,
	savedSlug: string,
	initialFilter: BloomFilter,
) {
	const [filter, setFilter] = useState(initialFilter)
	const mightBeTaken = useMemo(() => readBloomFilter(filter), [filter])
	const [result, setResult] = useState<{ slug: string; available: boolean | null } | null>(null)

	const slug = input.trim().toLowerCase()
	const valid = isValidSlug(slug)
	const needsServer = valid && slug !== savedSlug && mightBeTaken(slug)

	const refreshFilter = useCallback(async () => {
		// A failed refresh keeps the old filter; saving still catches a clash.
		const next = await slugFilterAction(id).catch(() => null)
		if (next) setFilter(next)
	}, [id])

	useEffect(() => {
		window.addEventListener("focus", refreshFilter)
		return () => window.removeEventListener("focus", refreshFilter)
	}, [refreshFilter])

	useEffect(() => {
		if (!needsServer) return
		let cancelled = false
		const timer = setTimeout(async () => {
			const available = await checkSlugAction(id, slug).catch(() => null)
			if (!cancelled) setResult({ slug, available })
		}, DEBOUNCE_MS)
		return () => {
			cancelled = true
			clearTimeout(timer)
		}
	}, [id, slug, needsServer])

	return { check: toCheck(), refreshFilter }

	function toCheck(): SlugCheck {
		if (!valid) return { status: "invalid", problem: INVALID_SLUG }
		if (slug === savedSlug) return { status: "idle" }
		if (!needsServer) return { status: "available", slug }
		// A result for an older slug says nothing about this one.
		if (result?.slug !== slug) return { status: "checking" }
		if (result.available === null) return { status: "idle" }
		return result.available
			? { status: "available", slug }
			: { status: "taken", problem: SLUG_TAKEN }
	}
}
