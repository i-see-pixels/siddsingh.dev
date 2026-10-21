import { useState } from "react"

/** "my-screenshot_2.png" → "my screenshot 2", a starting point for alt text. */
export function altFromFileName(name: string) {
	return name
		.replace(/\.[^.]+$/, "")
		.replace(/[-_]+/g, " ")
		.trim()
}

/** Sends an image to /api/admin/media and resolves to its public URL. */
export async function uploadImage(file: File): Promise<{ url: string; alt: string }> {
	const body = new FormData()
	body.set("file", file)
	body.set("alt", altFromFileName(file.name))
	const response = await fetch("/api/admin/media", { method: "POST", body })
	const json = (await response.json().catch(() => ({}))) as {
		url?: string
		alt?: string
		error?: string
	}
	if (!response.ok || !json.url) throw new Error(json.error ?? "The upload failed.")
	return { url: json.url, alt: json.alt ?? "" }
}

/**
 * Uploads with an `uploading` flag for the UI. `upload` resolves to null on
 * failure, after passing the reason to `onError`.
 */
export function useImageUpload(onError: (message: string) => void) {
	const [uploading, setUploading] = useState(false)

	async function upload(file: File) {
		setUploading(true)
		try {
			return await uploadImage(file)
		} catch (error) {
			onError(error instanceof Error ? error.message : "The upload failed.")
			return null
		} finally {
			setUploading(false)
		}
	}

	return { uploading, upload }
}
