// Saves tool output as a file through a temporary link.

export function download(href: string, filename: string) {
	const link = document.createElement("a")
	link.href = href
	link.download = filename
	link.click()
}

/** Saves `blob`. The object URL is revoked after the click has been handled, not during it. */
export function downloadBlob(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob)
	download(url, filename)
	setTimeout(() => URL.revokeObjectURL(url), 0)
}
