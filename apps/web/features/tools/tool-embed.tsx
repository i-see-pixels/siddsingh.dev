import { Button } from "@workspace/ui/components/button"
import { Maximize2Icon } from "lucide-react"
import Link from "next/link"
import { toolComponents } from "./registry"

/**
 * The live tool on its /tools/<slug> page, so visitors from search can use it
 * straight away. It breaks out of the site's narrow column to the same width
 * the full-screen workspace gets (capped at 96rem), because every tool lays out
 * by viewport breakpoints. A margin breakout, not a transform, so nothing
 * inside gets a new containing block for fixed positioning.
 */
export function ToolEmbed({ slug, name }: { slug: string; name: string }) {
	const Tool = toolComponents[slug]
	if (!Tool) return null

	return (
		<section
			aria-label={name}
			className="relative ml-[calc(50%-min(50vw-0.5rem,48rem))] w-[min(100vw-1rem,96rem)] border-x border-line bg-background"
		>
			<div className="screen-line-top screen-line-bottom flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1.5">
				<p className="mr-auto font-mono text-xs text-muted-foreground uppercase">
					Live tool · nothing is uploaded
				</p>
				<Button
					variant="outline"
					size="sm"
					nativeButton={false}
					render={<Link href={`/tools/${slug}/workspace`} />}
					className="gap-1.5"
				>
					<Maximize2Icon />
					Open full screen
				</Button>
			</div>
			{/* Tools fill the height the workspace gives them: the viewport under the header. */}
			<div className="flex min-h-[36rem] flex-col lg:min-h-[calc(100svh-var(--header-height))]">
				<Tool />
			</div>
		</section>
	)
}
