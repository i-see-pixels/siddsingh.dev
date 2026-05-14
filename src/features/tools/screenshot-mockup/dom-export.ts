import { toPng } from "html-to-image"

import type { ExportFormat } from "./types"

type ExportMockupElementArgs = {
	element: HTMLElement
	format: ExportFormat
	scale: number
	quality?: number
}

async function dataUrlToBlob(dataUrl: string) {
	const response = await fetch(dataUrl)

	return response.blob()
}

async function pngDataUrlToJpegBlob(dataUrl: string, quality = 0.92) {
	const image = new Image()
	image.src = dataUrl
	await image.decode()

	const canvas = document.createElement("canvas")
	const context = canvas.getContext("2d")

	canvas.width = image.naturalWidth
	canvas.height = image.naturalHeight

	if (!context) {
		throw new Error("Canvas 2D context is not available.")
	}

	context.fillStyle = "#ffffff"
	context.fillRect(0, 0, canvas.width, canvas.height)
	context.drawImage(image, 0, 0)

	return new Promise<Blob>((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (!blob) {
					reject(new Error("Export failed."))
					return
				}

				resolve(blob)
			},
			"image/jpeg",
			quality,
		)
	})
}

async function renderElementToPngDataUrl(element: HTMLElement, scale: number) {
	return toPng(element, {
		cacheBust: true,
		pixelRatio: scale,
		skipFonts: true,
		filter: (node) => {
			const style = window.getComputedStyle(node as Element)

			return style.display !== "none" && style.opacity !== "0"
		},
		canvasWidth: element.offsetWidth * scale,
		canvasHeight: element.offsetHeight * scale,
	})
}

export async function exportMockupElement({
	element,
	format,
	scale,
	quality,
}: ExportMockupElementArgs) {
	const dataUrl = await renderElementToPngDataUrl(element, scale)

	if (format === "jpg") {
		return pngDataUrlToJpegBlob(dataUrl, quality)
	}

	return dataUrlToBlob(dataUrl)
}
