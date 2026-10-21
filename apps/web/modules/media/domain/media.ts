import { ValidationError } from "@/modules/shared/domain-error"

export type Media = {
	id: string
	url: string
	pathname: string
	contentType: string
	size: number
	alt: string
	createdAt: Date
}

export type MediaUpload = {
	contentType: string
	size: number
	alt: string
	data: Blob
}

/** Raster formats only: an SVG can carry script, and these are served from a public URL. */
const EXTENSIONS: Record<string, string> = {
	"image/png": "png",
	"image/jpeg": "jpg",
	"image/webp": "webp",
	"image/gif": "gif",
	"image/avif": "avif",
}

/** The file inputs' `accept` value, so pickers offer exactly what uploads allow. */
export const MEDIA_ACCEPT = Object.keys(EXTENSIONS).join(",")

/** Vercel Functions accept request bodies up to 4.5 MB. */
export const MAX_MEDIA_BYTES = 4 * 1024 * 1024

export class MediaValidationError extends ValidationError<"file"> {}

export function assertUploadable(upload: MediaUpload) {
	if (!(upload.contentType in EXTENSIONS))
		throw new MediaValidationError({ file: "Upload a PNG, JPEG, WebP, GIF or AVIF image." })
	if (upload.size === 0) throw new MediaValidationError({ file: "The file is empty." })
	if (upload.size > MAX_MEDIA_BYTES)
		throw new MediaValidationError({
			file: `Keep images under ${MAX_MEDIA_BYTES / 1024 / 1024} MB.`,
		})
}

/** Storage path for a new upload, e.g. "blog/2026/10/3f2a….webp". */
export function mediaPathname(id: string, contentType: string, now: Date) {
	const month = String(now.getUTCMonth() + 1).padStart(2, "0")
	return `blog/${now.getUTCFullYear()}/${month}/${id}.${EXTENSIONS[contentType]}`
}
