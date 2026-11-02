"use client"

import { Field, FieldLabel } from "@workspace/ui/components/field"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@workspace/ui/components/input-group"
import { cn } from "@workspace/ui/lib/utils"
import { CircleCheckIcon, CircleXIcon, LoaderCircleIcon } from "lucide-react"
import type { SlugCheck } from "./use-slug-check"

/** The slug input, with its availability shown the way a username picker does. */
export function SlugField({
	value,
	check,
	error,
	onChange,
}: {
	value: string
	check: SlugCheck
	/** The last save's verdict, for problems the live check doesn't cover. */
	error?: string
	onChange: (slug: string) => void
}) {
	const problem = check.problem ?? error

	return (
		<Field data-invalid={Boolean(problem) || undefined}>
			<FieldLabel htmlFor="slug">Slug</FieldLabel>
			<InputGroup className={cn(check.status === "available" && "border-success")}>
				<InputGroupInput
					id="slug"
					value={value}
					onChange={(event) => onChange(event.target.value)}
					spellCheck={false}
					autoComplete="off"
					className="font-mono"
					aria-invalid={Boolean(problem) || undefined}
					aria-describedby="slug-status"
				/>
				<InputGroupAddon align="inline-end">
					{problem ? (
						<CircleXIcon className="text-destructive" />
					) : check.status === "checking" ? (
						<LoaderCircleIcon className="motion-safe:animate-spin" />
					) : check.status === "available" ? (
						<CircleCheckIcon className="text-success" />
					) : null}
				</InputGroupAddon>
			</InputGroup>
			{/* Always takes a line, so the form doesn't jump as the status comes and goes. */}
			<p id="slug-status" aria-live="polite" className="min-h-5 text-sm">
				{problem ? (
					<span className="text-destructive">{problem}</span>
				) : check.status === "checking" ? (
					<span className="text-muted-foreground">Checking availability…</span>
				) : check.status === "available" ? (
					<span className="text-success">
						<span className="font-mono">{check.slug}</span> is available
					</span>
				) : null}
			</p>
		</Field>
	)
}
