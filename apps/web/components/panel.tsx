import { cn } from "@workspace/ui/lib/utils"
import { LinkIcon } from "lucide-react"

/** A section of the page (docs/design.md §5 Panel). */
export function Panel({
	className,
	children,
	marks = true,
	...props
}: React.ComponentProps<"section"> & { marks?: boolean }) {
	return (
		<section
			data-slot="panel"
			className={cn(
				"screen-line-top screen-line-bottom screen-line-bottom-border",
				className,
			)}
			{...props}
		>
			{marks && <RegistrationMarks />}
			{children}
		</section>
	)
}

/** "+" crosshairs where the panel's top line meets the column edges. */
export function RegistrationMarks() {
	return (
		<>
			<span aria-hidden className="registration-mark -top-1 -left-[5px]" />
			<span aria-hidden className="registration-mark -top-1 -right-[5px]" />
		</>
	)
}

export function PanelHeader({ className, ...props }: React.ComponentProps<"header">) {
	return <header className={cn("screen-line-bottom px-4 py-3", className)} {...props} />
}

/** Sheet number + title + count; the title links to its own anchor. */
export function PanelTitle({
	sheet,
	count,
	anchor,
	className,
	children,
}: {
	sheet?: string
	count?: number
	anchor?: string
	className?: string
	children: React.ReactNode
}) {
	return (
		<div className={cn("group/panel-title", className)}>
			{sheet && (
				<p className="font-mono text-sm text-muted-foreground tabular-nums">{sheet}</p>
			)}
			<h2 className="font-heading text-3xl font-medium tracking-tight text-balance">
				{anchor ? <a href={`#${anchor}`}>{children}</a> : children}
				{count !== undefined && (
					<sup className="top-[-0.75em] ml-1 text-sm font-medium tracking-normal text-muted-foreground">
						({count})
					</sup>
				)}
				{anchor && (
					<a
						href={`#${anchor}`}
						aria-label="Link to this section"
						className="ml-2 inline-flex align-middle text-muted-foreground opacity-0 transition-opacity group-hover/panel-title:opacity-100 focus-visible:opacity-100"
					>
						<LinkIcon className="size-4" />
					</a>
				)}
			</h2>
		</div>
	)
}

export function PanelDescription({ className, ...props }: React.ComponentProps<"p">) {
	return (
		<p
			className={cn(
				"screen-line-bottom p-4 text-base text-balance text-muted-foreground",
				className,
			)}
			{...props}
		/>
	)
}

export function PanelContent({ className, ...props }: React.ComponentProps<"div">) {
	return <div className={cn("p-4", className)} {...props} />
}

export function PanelFooter({ className, ...props }: React.ComponentProps<"div">) {
	return <div className={cn("screen-line-top flex justify-center py-4", className)} {...props} />
}

/** Hatched band between panels; its stripes span the full screen width. */
export function Separator({ className }: { className?: string }) {
	return <div aria-hidden className={cn("stripe-divider w-full", className)} />
}

/** Top of an inner page: tagline, title between screen lines, optional description. */
export function PageHeading({
	tagline,
	title,
	description,
}: {
	tagline: string
	title: string
	description?: string
}) {
	return (
		<div className="pt-12">
			<p className="px-4 pb-2 text-sm/none font-medium tracking-wider text-muted-foreground">
				{tagline}
			</p>
			<h1 className="screen-line-top screen-line-bottom px-4 text-4xl font-medium tracking-tight text-balance">
				{title}
			</h1>
			{description && (
				<p className="screen-line-bottom p-4 text-base text-balance text-muted-foreground">
					{description}
				</p>
			)}
		</div>
	)
}
