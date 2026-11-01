import type { Metadata } from "next"
import { siteConfig } from "@/lib/site-config"

type PageSeo = {
	/** The full title, shown as is: the root layout's " · Siddhant Singh" suffix is skipped. */
	title: string
	description: string
	/** Path of the page, used for the canonical URL and og:url. */
	path: string
	/** A label for the social card, like "TOOLS". */
	section?: string
}

/** The social card for a page without an image of its own (app/og/route.tsx). */
export function pageImage({ title, description, section }: Omit<PageSeo, "path">) {
	const params = new URLSearchParams({ title, description })
	if (section) params.set("section", section)
	return { url: `/og?${params}`, width: 1200, height: 630, alt: title }
}

/**
 * Title, description, canonical URL and social card for a page. Next replaces
 * openGraph and twitter per segment rather than merging them, so the
 * site-wide fields from app/layout.tsx are repeated here.
 */
export function pageMetadata(page: PageSeo): Metadata {
	const image = pageImage(page)
	return {
		title: { absolute: page.title },
		description: page.description,
		alternates: { canonical: page.path },
		openGraph: {
			type: "website",
			siteName: siteConfig.name,
			locale: "en_GB",
			url: page.path,
			title: page.title,
			description: page.description,
			images: [image],
		},
		twitter: {
			card: "summary_large_image",
			creator: "@creatorsidd",
			title: page.title,
			description: page.description,
			images: [image],
		},
	}
}
