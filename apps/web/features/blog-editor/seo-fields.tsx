"use client"

import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import { cn } from "@workspace/ui/lib/utils"
import { ChevronRightIcon } from "lucide-react"
import { siteConfig } from "@/lib/site-config"
import { POST_LIMITS } from "@/modules/blog/domain/post"

function Counter({ length, max }: { length: number; max: number }) {
	return (
		<span
			className={cn(
				"ml-auto font-mono text-xs tabular-nums text-muted-foreground",
				length > max && "text-destructive",
			)}
		>
			{length}/{max}
		</span>
	)
}

/**
 * Optional overrides for how the post appears in search results and link
 * previews, with a preview of the result. Empty fields fall back to the title
 * and summary, which is what most posts want.
 */
export function SeoFields({
	title,
	summary,
	slug,
	seoTitle,
	seoDescription,
	onChange,
	errors,
}: {
	title: string
	summary: string
	slug: string
	seoTitle: string
	seoDescription: string
	onChange: (patch: { seoTitle?: string; seoDescription?: string }) => void
	errors: { seoTitle?: string; seoDescription?: string }
}) {
	const shownTitle = seoTitle || title || "Untitled"
	const shownDescription = seoDescription || summary
	const host = new URL(siteConfig.url).host

	return (
		<details
			className="group rounded-lg border"
			open={Boolean(errors.seoTitle || errors.seoDescription) || undefined}
		>
			<summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm font-medium select-none">
				<ChevronRightIcon className="size-4 text-muted-foreground transition-transform group-open:rotate-90" />
				Search &amp; social
				<span className="font-normal text-muted-foreground">
					{seoTitle || seoDescription ? "· customised" : "· uses title and summary"}
				</span>
			</summary>
			<div className="flex flex-col gap-4 border-t px-3 py-4">
				<figure className="rounded-lg bg-muted/50 p-3" aria-label="Search result preview">
					<p className="truncate text-xs text-muted-foreground">
						{host} › blog › {slug}
					</p>
					<p className="mt-1 line-clamp-1 text-base text-brand">{shownTitle}</p>
					<p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
						{shownDescription || "Add a summary or a meta description."}
					</p>
				</figure>
				<Field data-invalid={Boolean(errors.seoTitle) || undefined}>
					<div className="flex items-center">
						<FieldLabel htmlFor="seo-title">Meta title</FieldLabel>
						<Counter length={shownTitle.length} max={POST_LIMITS.seoTitle} />
					</div>
					<Input
						id="seo-title"
						value={seoTitle}
						onChange={(event) => onChange({ seoTitle: event.target.value })}
						placeholder={title || "Defaults to the post title"}
						aria-invalid={Boolean(errors.seoTitle) || undefined}
					/>
					<FieldError>{errors.seoTitle}</FieldError>
				</Field>
				<Field data-invalid={Boolean(errors.seoDescription) || undefined}>
					<div className="flex items-center">
						<FieldLabel htmlFor="seo-description">Meta description</FieldLabel>
						<Counter
							length={shownDescription.length}
							max={POST_LIMITS.seoDescription}
						/>
					</div>
					<Textarea
						id="seo-description"
						rows={3}
						value={seoDescription}
						onChange={(event) => onChange({ seoDescription: event.target.value })}
						placeholder={summary || "Defaults to the summary"}
						aria-invalid={Boolean(errors.seoDescription) || undefined}
					/>
					<FieldError>{errors.seoDescription}</FieldError>
				</Field>
			</div>
		</details>
	)
}
