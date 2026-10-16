import { cn } from "@workspace/ui/lib/utils"
import { Fragment } from "react"
import { availability } from "@/lib/site-config"

/** Framed chip for a leading icon; the layered border + ring is a site-wide signature. */
export function IconTile({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"flex size-6 shrink-0 items-center justify-center rounded-md select-none",
				"border border-muted-foreground/15 bg-muted text-muted-foreground",
				"ring-1 ring-border/50 ring-offset-1 ring-offset-background dark:ring-line",
				"[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
				className,
			)}
			{...props}
		/>
	)
}

export function Tag({ className, ...props }: React.ComponentProps<"span">) {
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full border bg-muted/50 px-1.5 py-0.5 font-mono text-xs text-muted-foreground",
				className,
			)}
			{...props}
		/>
	)
}

const statusStyles = {
	Live: "border-success/30 text-success",
	Beta: "border-info/30 text-info",
	Waitlist: "",
}

export function StatusTag({
	status,
	className,
}: {
	status: keyof typeof statusStyles
	className?: string
}) {
	return <Tag className={cn(statusStyles[status], className)}>{status}</Tag>
}

/** Green dot that pulses while available. */
export function PulseDot({ className }: { className?: string }) {
	return (
		<span className={cn("relative flex size-2", className)} aria-hidden>
			<span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-50 motion-reduce:animate-none" />
			<span className="relative inline-flex size-2 rounded-full bg-success" />
		</span>
	)
}

/**
 * Renders "A · B · C" for narrow screens: each bullet is glued to the word
 * before it with a non-breaking space, so no line starts with "·", and
 * hyphenated words ("full-time") are never split at the hyphen.
 */
export function Joined({ text }: { text: string }) {
	const parts = text.split(" · ")
	return parts.map((part, index) => (
		<Fragment key={part}>
			{part.split(/(\S+-\S+)/).map((chunk, chunkIndex) =>
				chunkIndex % 2 === 1 ? (
					<span key={chunk} className="whitespace-nowrap">
						{chunk}
					</span>
				) : (
					chunk
				),
			)}
			{index < parts.length - 1 && "\u00a0· "}
		</Fragment>
	))
}

export function AvailabilityPill({ className }: { className?: string }) {
	if (!availability.open) return null
	return (
		<p
			className={cn(
				"inline-flex items-center gap-2 rounded-xl bg-brand-muted px-2.5 py-1 font-mono text-xs text-brand",
				className,
			)}
		>
			<PulseDot className="shrink-0" />
			<span>
				<Joined text={availability.label} />
			</span>
		</p>
	)
}
