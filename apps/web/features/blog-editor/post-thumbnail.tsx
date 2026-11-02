"use client"

import Image from "next/image"
import { useState } from "react"
import { blobUrl } from "@/lib/content"

/** A picture frame with a hill and a sun, drawn in the text colour. */
function Placeholder() {
	return (
		<svg
			viewBox="0 0 64 34"
			aria-hidden
			className="size-full text-muted-foreground/50"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<circle cx="40" cy="11" r="3" />
			<path d="m18 27 8-9 6 6 4-4 10 7" />
		</svg>
	)
}

/**
 * A post's cover at the social-card ratio, small enough for a table row. The
 * title sits beside it, so the image is decorative here. A missing or broken
 * cover shows the placeholder instead.
 */
export function PostThumbnail({ url }: { url: string | null }) {
	const [failed, setFailed] = useState<string | null>(null)
	const usable = url && failed !== url

	return (
		<div className="relative aspect-[1200/630] w-16 shrink-0 overflow-hidden rounded-md border bg-muted">
			{usable ? (
				<Image
					src={url}
					alt=""
					fill
					sizes="64px"
					unoptimized={!url.startsWith(`${blobUrl}/`)}
					onError={() => setFailed(url)}
					className="object-cover"
				/>
			) : (
				<Placeholder />
			)}
		</div>
	)
}
