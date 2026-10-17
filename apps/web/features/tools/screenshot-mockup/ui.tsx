"use client"

import { cn } from "@workspace/ui/lib/utils"
import { ChevronDownIcon } from "lucide-react"

/** Small form primitives for the editor, built on native controls. */

export function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
	return <div className={cn("flex flex-col gap-4", className)} {...props} />
}

export function Field({ className, ...props }: React.ComponentProps<"div">) {
	return <div className={cn("flex flex-col gap-2", className)} {...props} />
}

export function FieldContent({ className, ...props }: React.ComponentProps<"div">) {
	return <div className={cn("flex flex-col gap-1.5", className)} {...props} />
}

/** Field label (docs/design.md §3: mono, 10px, uppercase). */
export function FieldLabel({ className, ...props }: React.ComponentProps<"label">) {
	return (
		// biome-ignore lint/a11y/noLabelWithoutControl: callers pass htmlFor or wrap a control
		<label
			className={cn(
				"font-mono text-[0.625rem]/4 font-medium tracking-wider text-muted-foreground uppercase",
				className,
			)}
			{...props}
		/>
	)
}

export function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
	return <p className={cn("text-xs text-muted-foreground", className)} {...props} />
}

export function Badge({
	variant = "outline",
	className,
	...props
}: React.ComponentProps<"span"> & { variant?: "outline" | "secondary" }) {
	return (
		<span
			className={cn(
				"inline-flex max-w-full items-center truncate rounded-full border px-2 py-0.5 font-mono text-xs text-muted-foreground tabular-nums",
				variant === "secondary" ? "border-transparent bg-muted" : "border-border",
				className,
			)}
			{...props}
		/>
	)
}

export function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
	return (
		<div className="relative">
			<select
				className={cn(
					"h-8 w-full appearance-none rounded-lg border border-input bg-background py-1 pr-8 pl-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
					className,
				)}
				{...props}
			/>
			<ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-muted-foreground" />
		</div>
	)
}

export function RangeInput({ className, ...props }: Omit<React.ComponentProps<"input">, "type">) {
	return (
		<input
			type="range"
			className={cn("h-5 w-full cursor-pointer accent-brand", className)}
			{...props}
		/>
	)
}

/** Single-choice button group. */
export function Segmented<T extends string>({
	value,
	options,
	onValueChange,
	label,
	className,
}: {
	value: T
	options: ReadonlyArray<{ value: T; label: string }>
	onValueChange: (value: T) => void
	label: string
	className?: string
}) {
	return (
		<div role="radiogroup" aria-label={label} className={cn("flex flex-wrap gap-1", className)}>
			{options.map((option) => {
				const active = option.value === value
				return (
					// biome-ignore lint/a11y/useSemanticElements: button group styled as segmented radios
					<button
						key={option.value}
						type="button"
						role="radio"
						aria-checked={active}
						onClick={() => onValueChange(option.value)}
						className={cn(
							"h-7 rounded-lg border px-2.5 text-[0.8rem] font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
							active
								? "border-brand bg-brand-muted text-foreground"
								: "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
						)}
					>
						{option.label}
					</button>
				)
			})}
		</div>
	)
}

export function ToolWorkspaceSection({
	title,
	description,
	children,
}: {
	title: string
	description?: string
	children: React.ReactNode
}) {
	return (
		<section className="flex flex-col gap-4">
			<header>
				<h3 className="font-medium">{title}</h3>
				{description ? (
					<p className="text-sm text-muted-foreground">{description}</p>
				) : null}
			</header>
			{children}
		</section>
	)
}
