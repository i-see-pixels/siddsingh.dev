import { cn } from "@workspace/ui/lib/utils"
import Image from "next/image"
import { blobUrl } from "@/lib/content"

/**
 * A post's cover at the social-card ratio (1200 × 630). Uploads come from the
 * site's Blob store, which next.config.ts allows the image optimiser to fetch;
 * anything else is served as-is.
 */
export function CoverImage({
	cover,
	sizes,
	preload,
	className,
}: {
	cover: { url: string; alt: string }
	sizes: string
	/** For the article's header, which is the page's largest image. */
	preload?: boolean
	className?: string
}) {
	return (
		<div className={cn("relative aspect-[1200/630] overflow-hidden bg-muted", className)}>
			<Image
				src={cover.url}
				alt={cover.alt}
				fill
				sizes={sizes}
				preload={preload}
				unoptimized={!cover.url.startsWith(`${blobUrl}/`)}
				className="object-cover"
			/>
		</div>
	)
}
