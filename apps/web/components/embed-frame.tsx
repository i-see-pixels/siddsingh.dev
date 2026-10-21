import { cn } from "@workspace/ui/lib/utils"
import type { Embed } from "@/modules/blog/domain/embeds"

/** A provider's player (YouTube, Vimeo, CodePen…) inside a post. */
export function EmbedFrame({ embed }: { embed: Embed }) {
	return (
		<div
			className={cn(
				"mt-4 overflow-hidden rounded-xl border bg-muted",
				embed.aspectRatio === "9 / 16" && "mx-auto max-w-xs",
			)}
			style={{ aspectRatio: embed.aspectRatio, height: embed.height }}
		>
			<iframe
				src={embed.src}
				title={embed.title}
				loading="lazy"
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture"
				// YouTube refuses to play (error 153) when the referrer is withheld.
				referrerPolicy="strict-origin-when-cross-origin"
				className="size-full border-0"
			/>
		</div>
	)
}
