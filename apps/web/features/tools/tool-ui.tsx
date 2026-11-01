"use client"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { CheckIcon, CopyIcon } from "lucide-react"
import { type ReactNode, useEffect, useRef, useState } from "react"
import { headerButton } from "./tool-chrome"

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
	const [copied, setCopied] = useState(false)
	const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

	useEffect(() => () => clearTimeout(timer.current), [])

	return (
		<Button
			size="sm"
			variant="outline"
			className={headerButton}
			disabled={!value}
			onClick={async () => {
				try {
					await navigator.clipboard.writeText(value)
					setCopied(true)
					clearTimeout(timer.current)
					timer.current = setTimeout(() => setCopied(false), 1500)
				} catch {
					// Clipboard can be blocked; the text stays selectable on screen.
				}
			}}
		>
			{copied ? <CheckIcon /> : <CopyIcon />}
			{copied ? "Copied" : label}
		</Button>
	)
}

/** Titled column of a two-pane tool: a toolbar row above a body that fills the rest. */
export function Pane({
	title,
	actions,
	children,
	className,
}: {
	title: string
	actions?: ReactNode
	children: ReactNode
	className?: string
}) {
	return (
		<section className={cn("flex min-h-80 min-w-0 flex-col", className)}>
			<div className="screen-line-bottom flex min-h-11 flex-wrap items-center gap-2 px-3 py-1.5">
				<h2 className="mr-auto font-mono text-xs text-muted-foreground uppercase">
					{title}
				</h2>
				{actions}
			</div>
			{children}
		</section>
	)
}

/** Side-by-side on desktop with a divider, stacked on phones. */
export function SplitLayout({ children }: { children: ReactNode }) {
	return (
		<div className="grid flex-1 lg:grid-cols-2 lg:[&>*:first-child]:border-r lg:[&>*:first-child]:border-line max-lg:[&>*:first-child]:border-b max-lg:[&>*:first-child]:border-line">
			{children}
		</div>
	)
}
