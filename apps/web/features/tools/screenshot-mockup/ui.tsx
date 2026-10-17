"use client"

import { ToggleGroup, ToggleGroupItem } from "@workspace/ui/components/toggle-group"
import { cn } from "@workspace/ui/lib/utils"

/** Single-choice toggle group (a selected item can't be switched off). */
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
		<ToggleGroup
			aria-label={label}
			value={[value]}
			onValueChange={(next) => {
				const picked = next[0]
				if (picked) onValueChange(picked as T)
			}}
			variant="outline"
			size="sm"
			spacing={1}
			className={cn("w-full flex-wrap", className)}
		>
			{options.map((option) => (
				<ToggleGroupItem key={option.value} value={option.value}>
					{option.label}
				</ToggleGroupItem>
			))}
		</ToggleGroup>
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
