"use client"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { AlertCircleIcon, CheckIcon, FileCodeIcon } from "lucide-react"
import type { ComponentProps, ReactNode } from "react"

/** Classes for the outlined, rounded buttons used in every tool's header. */
export const headerButton = "h-8 rounded-lg bg-background shadow-xs"

/** Fixed-height strip at the top of a pane: file tab on the left, actions on the right. */
export function PaneHeader({ children, className }: { children: ReactNode; className?: string }) {
	return (
		<div
			className={cn(
				"flex min-h-12 shrink-0 flex-wrap items-center gap-2 border-b border-line px-3 py-2",
				className,
			)}
		>
			{children}
		</div>
	)
}

/** A sub-bar under a header, for secondary controls. */
export function SubBar({ children, className }: { children: ReactNode; className?: string }) {
	return (
		<div
			className={cn(
				"flex shrink-0 flex-wrap items-center gap-2 border-b border-line bg-muted/30 px-3 py-2",
				className,
			)}
		>
			{children}
		</div>
	)
}

type Tone = "neutral" | "brand" | "success" | "destructive" | "warning"

const chipTones: Record<Tone, string> = {
	neutral: "bg-muted text-muted-foreground",
	brand: "bg-brand/10 text-brand",
	success: "bg-success/15 text-success",
	destructive: "bg-destructive/10 text-destructive",
	warning: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
}

/** Small tinted pill for a count or a label. */
export function Chip({
	tone = "neutral",
	className,
	children,
}: {
	tone?: Tone
	className?: string
	children: ReactNode
}) {
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
				chipTones[tone],
				className,
			)}
		>
			{children}
		</span>
	)
}

/** File-tab style label: icon, file name and an optional chip. */
export function FileTab({
	name,
	badge,
	badgeTone = "brand",
}: {
	name: string
	badge?: ReactNode
	badgeTone?: Tone
}) {
	return (
		<div className="flex min-w-0 items-center gap-2">
			<span className="flex items-center gap-1.5 rounded-md border border-line bg-background px-2 py-1 font-mono text-xs shadow-xs">
				<FileCodeIcon className="size-3.5 text-muted-foreground" />
				{name}
			</span>
			{badge && (
				<Chip tone={badgeTone} className="truncate">
					{badge}
				</Chip>
			)}
		</div>
	)
}

/** A pill-shaped on/off button, used for options such as "Ignore case". */
export function ToggleChip({
	pressed,
	onPressedChange,
	children,
	...props
}: {
	pressed: boolean
	onPressedChange: (pressed: boolean) => void
} & Omit<ComponentProps<typeof Button>, "onClick" | "variant">) {
	return (
		<Button
			size="sm"
			variant="outline"
			aria-pressed={pressed}
			onClick={() => onPressedChange(!pressed)}
			className={cn(
				"h-7 rounded-full px-2.5 shadow-xs",
				pressed
					? "border-brand/40 bg-brand/10 text-brand hover:bg-brand/15"
					: "bg-background",
			)}
			{...props}
		>
			{pressed && <CheckIcon />}
			{children}
		</Button>
	)
}

const dotTones = {
	idle: "bg-muted-foreground/40",
	ok: "bg-success",
	warn: "bg-amber-500",
	error: "bg-destructive",
}

/** Bottom bar of a pane: a status dot and label on the left, detail on the right. */
export function StatusBar({
	tone,
	label,
	detail,
}: {
	tone: keyof typeof dotTones
	label: string
	detail?: ReactNode
}) {
	return (
		<div className="flex h-9 shrink-0 items-center gap-2 border-t border-line bg-muted/30 px-3 text-xs text-muted-foreground">
			<span className={cn("size-1.5 rounded-full", dotTones[tone])} />
			<span role="status">{label}</span>
			{detail && <span className="ml-auto tabular-nums">{detail}</span>}
		</div>
	)
}

export function ErrorCard({
	title = "Something went wrong",
	message,
}: {
	title?: string
	message: string
}) {
	return (
		<div
			role="alert"
			className="mx-3 mb-3 flex max-h-40 gap-2 overflow-auto rounded-lg border border-destructive/30 bg-destructive/5 p-3"
		>
			<AlertCircleIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
			<div className="min-w-0">
				<p className="text-sm font-medium text-destructive">{title}</p>
				<pre className="mt-1 font-mono text-xs whitespace-pre-wrap text-muted-foreground">
					{message}
				</pre>
			</div>
		</div>
	)
}

/** Floating rounded container for canvas controls. */
export function Pill({ className, children }: { className?: string; children: ReactNode }) {
	return (
		<div
			className={cn(
				"flex items-center gap-0.5 rounded-full border border-line bg-background/90 p-1 shadow-md backdrop-blur",
				className,
			)}
		>
			{children}
		</div>
	)
}
