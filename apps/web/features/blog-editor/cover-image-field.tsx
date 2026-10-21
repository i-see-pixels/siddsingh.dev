"use client"

import { Button } from "@workspace/ui/components/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import { ImagePlusIcon, Loader2Icon, RefreshCwIcon, XIcon } from "lucide-react"
import { useRef } from "react"
import { MEDIA_ACCEPT } from "@/modules/media/domain/media"
import { useImageUpload } from "./upload-image"

export type Cover = { url: string | null; alt: string }

/** The post's cover: header image on the article, banner on /blog and social card. */
export function CoverImageField({
	value,
	onChange,
	onError,
	errors,
}: {
	value: Cover
	onChange: (cover: Cover) => void
	onError: (message: string) => void
	errors: { url?: string; alt?: string }
}) {
	const fileInput = useRef<HTMLInputElement>(null)
	const { uploading, upload: uploadFile } = useImageUpload(onError)

	async function upload(file: File) {
		const image = await uploadFile(file)
		if (image) onChange({ url: image.url, alt: value.alt || image.alt })
	}

	const pick = () => fileInput.current?.click()

	return (
		<div className="flex flex-col gap-3">
			<Field data-invalid={Boolean(errors.url) || undefined}>
				<FieldLabel>Cover image</FieldLabel>
				{value.url ? (
					<div className="group relative overflow-hidden rounded-lg border bg-muted">
						{/* biome-ignore lint/performance/noImgElement: an editor preview of any uploaded size. */}
						<img
							src={value.url}
							alt={value.alt}
							className={cn(
								"aspect-[1200/630] w-full object-cover transition-opacity",
								uploading && "opacity-40",
							)}
						/>
						<div className="absolute top-2 right-2 flex gap-1">
							<Button
								type="button"
								size="sm"
								variant="secondary"
								disabled={uploading}
								onClick={pick}
							>
								{uploading ? (
									<Loader2Icon
										data-icon="inline-start"
										className="animate-spin"
									/>
								) : (
									<RefreshCwIcon data-icon="inline-start" />
								)}
								Replace
							</Button>
							<Button
								type="button"
								size="icon-sm"
								variant="secondary"
								aria-label="Remove cover image"
								disabled={uploading}
								onClick={() => onChange({ url: null, alt: "" })}
							>
								<XIcon />
							</Button>
						</div>
					</div>
				) : (
					<button
						type="button"
						onClick={pick}
						disabled={uploading}
						className={cn(
							"dot-grid flex aspect-[1200/630] w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-sm text-muted-foreground",
							"transition-colors hover:border-brand hover:text-foreground disabled:opacity-60",
						)}
					>
						{uploading ? (
							<Loader2Icon className="size-5 animate-spin" />
						) : (
							<ImagePlusIcon className="size-5" />
						)}
						{uploading ? "Uploading…" : "Add a cover image"}
						<span className="text-xs">1200 × 630 works best for social cards</span>
					</button>
				)}
				<FieldError>{errors.url}</FieldError>
				<input
					ref={fileInput}
					type="file"
					accept={MEDIA_ACCEPT}
					className="hidden"
					onChange={(event) => {
						const file = event.target.files?.[0]
						if (file) upload(file)
						event.target.value = ""
					}}
				/>
			</Field>
			{value.url && (
				<Field data-invalid={Boolean(errors.alt) || undefined}>
					<FieldLabel htmlFor="cover-alt">Cover alt text</FieldLabel>
					<Input
						id="cover-alt"
						value={value.alt}
						onChange={(event) => onChange({ ...value, alt: event.target.value })}
						placeholder="What the image shows, for screen readers and search engines"
						aria-invalid={Boolean(errors.alt) || undefined}
					/>
					<FieldDescription>Required to publish.</FieldDescription>
					<FieldError>{errors.alt}</FieldError>
				</Field>
			)}
		</div>
	)
}
