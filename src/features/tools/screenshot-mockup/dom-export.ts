import { renderMockupCanvas } from "./canvas"
import type { ExportFormat, ScreenshotMockupState } from "./types"

type ExportMockupElementArgs = {
	image: HTMLImageElement | HTMLCanvasElement
	backgroundImage?: HTMLImageElement | HTMLCanvasElement | null
	state: ScreenshotMockupState
	format: ExportFormat
	scale: number
	quality?: number
}

function canvasToBlob(
	canvas: HTMLCanvasElement,
	type: "image/png" | "image/jpeg",
	quality?: number,
) {
	return new Promise<Blob>((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (!blob) {
					reject(new Error("Export failed."))
					return
				}

				resolve(blob)
			},
			type,
			quality,
		)
	})
}

export async function exportMockupElement({
	image,
	backgroundImage,
	state,
	format,
	scale,
	quality,
}: ExportMockupElementArgs) {
	const canvas = document.createElement("canvas")

	renderMockupCanvas({
		canvas,
		image,
		backgroundImage,
		state,
		scale,
		format,
	})

	if (format === "jpg") {
		return canvasToBlob(canvas, "image/jpeg", quality)
	}

	return canvasToBlob(canvas, "image/png")
}
