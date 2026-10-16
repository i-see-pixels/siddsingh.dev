"use client"

import { cn } from "@workspace/ui/lib/utils"
import Image from "next/image"
import { useState } from "react"

const frame = "aspect-16/10 w-full shrink-0 self-start rounded-md ring-1 ring-foreground/10 sm:w-32"

/** Project screenshot; falls back to a hatched placeholder until the image exists. */
export function ProjectCover({ src, name }: { src: string; name: string }) {
	const [failed, setFailed] = useState(false)

	if (failed) {
		return (
			<div
				aria-hidden
				className={cn(
					frame,
					"diagonal-stripes flex items-center justify-center bg-muted p-2 font-mono text-xs text-muted-foreground",
				)}
			>
				<span className="rounded bg-background px-1.5 py-0.5 text-center text-[0.625rem]/4">
					{name}
				</span>
			</div>
		)
	}

	return (
		<Image
			src={src}
			alt={`${name} screenshot`}
			width={1600}
			height={1000}
			sizes="(min-width: 640px) 8rem, 100vw"
			onError={() => setFailed(true)}
			// The image can fail before hydration, when onError isn't attached yet.
			ref={(img) => {
				if (img?.complete && img.naturalWidth === 0) setFailed(true)
			}}
			className={cn(
				frame,
				"bg-muted object-cover grayscale transition-[filter] duration-300 ease-out group-hover:grayscale-0",
			)}
		/>
	)
}
