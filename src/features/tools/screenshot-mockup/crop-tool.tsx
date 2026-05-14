"use client"

import { CheckIcon, XIcon } from "lucide-react"
import {
	type PointerEvent as ReactPointerEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react"

import { Button } from "@/components/ui/button"
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import type { AspectRatioOption } from "./types"

type CropRegion = {
	x: number
	y: number
	width: number
	height: number
}

type CropHandle =
	| "move"
	| "top-left"
	| "top-right"
	| "bottom-left"
	| "bottom-right"
	| "top"
	| "bottom"
	| "left"
	| "right"

type CropToolProps = {
	imageSrc: string
	initialRatio: AspectRatioOption
	onApplyAction: (croppedImage: string) => void
	onCancelAction: () => void
}

const cropRatios: Array<{
	label: string
	value: AspectRatioOption
	ratio: number | null
}> = [
	{ label: "Free", value: "auto", ratio: null },
	{ label: "1:1", value: "1:1", ratio: 1 },
	{ label: "4:3", value: "4:3", ratio: 4 / 3 },
	{ label: "3:4", value: "3:4", ratio: 3 / 4 },
	{ label: "16:9", value: "16:9", ratio: 16 / 9 },
	{ label: "9:16", value: "9:16", ratio: 9 / 16 },
	{ label: "3:2", value: "3:2", ratio: 3 / 2 },
	{ label: "2:3", value: "2:3", ratio: 2 / 3 },
]

function clamp(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value))
}

function getRatio(value: AspectRatioOption) {
	return cropRatios.find((item) => item.value === value)?.ratio ?? null
}

function clampCrop(crop: CropRegion, imageRect: { width: number; height: number }) {
	const minSize = 20
	const width = clamp(crop.width, minSize, imageRect.width)
	const height = clamp(crop.height, minSize, imageRect.height)

	return {
		x: clamp(crop.x, 0, Math.max(0, imageRect.width - width)),
		y: clamp(crop.y, 0, Math.max(0, imageRect.height - height)),
		width,
		height,
	}
}

function getInitialCrop(imageRect: { width: number; height: number }, ratio: number | null) {
	const inset = 0.1
	let width = imageRect.width * (1 - inset * 2)
	let height = imageRect.height * (1 - inset * 2)

	if (ratio) {
		if (width / height > ratio) {
			width = height * ratio
		} else {
			height = width / ratio
		}
	}

	return clampCrop(
		{
			x: (imageRect.width - width) / 2,
			y: (imageRect.height - height) / 2,
			width,
			height,
		},
		imageRect,
	)
}

function resizeCrop(
	handle: CropHandle,
	startCrop: CropRegion,
	deltaX: number,
	deltaY: number,
	imageRect: { width: number; height: number },
) {
	if (handle === "move") {
		return clampCrop(
			{
				...startCrop,
				x: startCrop.x + deltaX,
				y: startCrop.y + deltaY,
			},
			imageRect,
		)
	}

	let { x, y, width, height } = startCrop

	if (handle.includes("left")) {
		x = startCrop.x + deltaX
		width = startCrop.width - deltaX
	}

	if (handle.includes("right")) {
		width = startCrop.width + deltaX
	}

	if (handle.includes("top")) {
		y = startCrop.y + deltaY
		height = startCrop.height - deltaY
	}

	if (handle.includes("bottom")) {
		height = startCrop.height + deltaY
	}

	if (x < 0) {
		width += x
		x = 0
	}

	if (y < 0) {
		height += y
		y = 0
	}

	if (x + width > imageRect.width) {
		width = imageRect.width - x
	}

	if (y + height > imageRect.height) {
		height = imageRect.height - y
	}

	return clampCrop({ x, y, width, height }, imageRect)
}

function fitCropToRatio(
	crop: CropRegion,
	ratio: number | null,
	imageRect: { width: number; height: number },
) {
	if (!ratio) {
		return clampCrop(crop, imageRect)
	}

	let { width, height } = crop

	if (width / height > ratio) {
		width = height * ratio
	} else {
		height = width / ratio
	}

	return clampCrop(
		{
			x: crop.x + (crop.width - width) / 2,
			y: crop.y + (crop.height - height) / 2,
			width,
			height,
		},
		imageRect,
	)
}

export function CropTool({ imageSrc, initialRatio, onApplyAction, onCancelAction }: CropToolProps) {
	const imageRef = useRef<HTMLImageElement | null>(null)
	const [imageRect, setImageRect] = useState({ width: 0, height: 0 })
	const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 })
	const [selectedRatio, setSelectedRatio] = useState<AspectRatioOption>(initialRatio)
	const [crop, setCrop] = useState<CropRegion>({
		x: 0,
		y: 0,
		width: 0,
		height: 0,
	})
	const [dragState, setDragState] = useState<{
		handle: CropHandle
		startX: number
		startY: number
		startCrop: CropRegion
	} | null>(null)

	const updateImageMeasurements = useCallback(() => {
		const image = imageRef.current

		if (!image) {
			return
		}

		const rect = image.getBoundingClientRect()
		const nextRect = {
			width: rect.width,
			height: rect.height,
		}

		setImageRect(nextRect)
		setNaturalSize({
			width: image.naturalWidth,
			height: image.naturalHeight,
		})
		setCrop(getInitialCrop(nextRect, getRatio(selectedRatio)))
	}, [selectedRatio])

	useEffect(() => {
		const handleResize = () => updateImageMeasurements()

		window.addEventListener("resize", handleResize)

		return () => window.removeEventListener("resize", handleResize)
	}, [updateImageMeasurements])

	useEffect(() => {
		if (imageRect.width <= 0) {
			return
		}

		setCrop((currentCrop) => fitCropToRatio(currentCrop, getRatio(selectedRatio), imageRect))
	}, [selectedRatio, imageRect])

	useEffect(() => {
		if (!dragState) {
			return
		}

		const handlePointerMove = (event: PointerEvent) => {
			const deltaX = event.clientX - dragState.startX
			const deltaY = event.clientY - dragState.startY

			setCrop(resizeCrop(dragState.handle, dragState.startCrop, deltaX, deltaY, imageRect))
		}

		const handlePointerUp = () => setDragState(null)

		document.addEventListener("pointermove", handlePointerMove)
		document.addEventListener("pointerup", handlePointerUp)
		document.addEventListener("pointercancel", handlePointerUp)

		return () => {
			document.removeEventListener("pointermove", handlePointerMove)
			document.removeEventListener("pointerup", handlePointerUp)
			document.removeEventListener("pointercancel", handlePointerUp)
		}
	}, [dragState, imageRect])

	const startDrag = (event: ReactPointerEvent<HTMLElement>, handle: CropHandle) => {
		event.preventDefault()
		event.stopPropagation()
		setDragState({
			handle,
			startX: event.clientX,
			startY: event.clientY,
			startCrop: crop,
		})
	}

	const handleApply = () => {
		const image = imageRef.current

		if (!image || imageRect.width <= 0 || imageRect.height <= 0) {
			return
		}

		const scaleX = naturalSize.width / imageRect.width
		const scaleY = naturalSize.height / imageRect.height
		const sourceX = Math.round(crop.x * scaleX)
		const sourceY = Math.round(crop.y * scaleY)
		const sourceWidth = Math.round(crop.width * scaleX)
		const sourceHeight = Math.round(crop.height * scaleY)
		const canvas = document.createElement("canvas")
		const context = canvas.getContext("2d")

		canvas.width = sourceWidth
		canvas.height = sourceHeight

		if (!context) {
			return
		}

		context.drawImage(
			image,
			sourceX,
			sourceY,
			sourceWidth,
			sourceHeight,
			0,
			0,
			canvas.width,
			canvas.height,
		)
		onApplyAction(canvas.toDataURL("image/png"))
	}

	const thirdWidth = crop.width / 3
	const thirdHeight = crop.height / 3
	const outputWidth = imageRect.width
		? Math.round(crop.width * (naturalSize.width / imageRect.width))
		: 0
	const outputHeight = imageRect.height
		? Math.round(crop.height * (naturalSize.height / imageRect.height))
		: 0

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/80 p-4 backdrop-blur-sm">
			<div className="absolute top-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-border/60 bg-background/95 px-3 py-2 shadow-2xl backdrop-blur">
				<Select
					value={selectedRatio}
					onValueChange={(nextValue) => {
						if (typeof nextValue === "string") {
							setSelectedRatio(nextValue as AspectRatioOption)
						}
					}}
				>
					<SelectTrigger className="h-8 w-28" aria-label="Crop ratio">
						<SelectValue placeholder="Free" />
					</SelectTrigger>
					<SelectContent align="center">
						<SelectGroup>
							{cropRatios.map((ratio) => (
								<SelectItem key={ratio.value} value={ratio.value}>
									{ratio.label}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
				<Button type="button" variant="ghost" size="sm" onClick={onCancelAction}>
					<XIcon data-icon="inline-start" />
					Cancel
				</Button>
				<Button type="button" size="sm" onClick={handleApply}>
					<CheckIcon data-icon="inline-start" />
					Apply crop
				</Button>
			</div>

			<div className="relative select-none" style={{ touchAction: "none" }}>
				<img
					ref={imageRef}
					src={imageSrc}
					alt="Crop preview"
					className="block max-h-[80vh] max-w-[88vw] object-contain"
					draggable={false}
					onLoad={updateImageMeasurements}
				/>

				{imageRect.width > 0 ? (
					<>
						<div
							className="pointer-events-none absolute inset-x-0 top-0 bg-foreground/60"
							style={{ height: crop.y }}
						/>
						<div
							className="pointer-events-none absolute inset-x-0 bottom-0 bg-foreground/60"
							style={{ height: imageRect.height - (crop.y + crop.height) }}
						/>
						<div
							className="pointer-events-none absolute left-0 bg-foreground/60"
							style={{ top: crop.y, width: crop.x, height: crop.height }}
						/>
						<div
							className="pointer-events-none absolute right-0 bg-foreground/60"
							style={{
								top: crop.y,
								width: imageRect.width - (crop.x + crop.width),
								height: crop.height,
							}}
						/>
						<div
							className="absolute cursor-grab active:cursor-grabbing"
							style={{
								left: crop.x,
								top: crop.y,
								width: crop.width,
								height: crop.height,
							}}
							onPointerDown={(event) => startDrag(event, "move")}
						>
							<div className="pointer-events-none absolute inset-0 border-2 border-background" />
							<svg
								className="pointer-events-none absolute inset-0 size-full opacity-40"
								aria-hidden="true"
							>
								<line
									x1={thirdWidth}
									y1={0}
									x2={thirdWidth}
									y2={crop.height}
									stroke="white"
								/>
								<line
									x1={thirdWidth * 2}
									y1={0}
									x2={thirdWidth * 2}
									y2={crop.height}
									stroke="white"
								/>
								<line
									x1={0}
									y1={thirdHeight}
									x2={crop.width}
									y2={thirdHeight}
									stroke="white"
								/>
								<line
									x1={0}
									y1={thirdHeight * 2}
									x2={crop.width}
									y2={thirdHeight * 2}
									stroke="white"
								/>
							</svg>
							<div className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-foreground/80 px-2 py-0.5 font-mono text-[10px] text-background">
								{outputWidth} x {outputHeight}
							</div>
						</div>
						{[
							["top-left", "nwse-resize", crop.x - 10, crop.y - 10],
							["top-right", "nesw-resize", crop.x + crop.width - 10, crop.y - 10],
							["bottom-left", "nesw-resize", crop.x - 10, crop.y + crop.height - 10],
							[
								"bottom-right",
								"nwse-resize",
								crop.x + crop.width - 10,
								crop.y + crop.height - 10,
							],
							["top", "ns-resize", crop.x + crop.width / 2 - 10, crop.y - 10],
							[
								"bottom",
								"ns-resize",
								crop.x + crop.width / 2 - 10,
								crop.y + crop.height - 10,
							],
							["left", "ew-resize", crop.x - 10, crop.y + crop.height / 2 - 10],
							[
								"right",
								"ew-resize",
								crop.x + crop.width - 10,
								crop.y + crop.height / 2 - 10,
							],
						].map(([handle, cursor, left, top]) => (
							<button
								key={handle}
								type="button"
								className="absolute size-5 rounded-full border border-background bg-background/80 shadow"
								style={{
									left: Number(left),
									top: Number(top),
									cursor: String(cursor),
								}}
								onPointerDown={(event) => startDrag(event, handle as CropHandle)}
								aria-label={`Resize crop ${handle}`}
							/>
						))}
					</>
				) : null}
			</div>
		</div>
	)
}
