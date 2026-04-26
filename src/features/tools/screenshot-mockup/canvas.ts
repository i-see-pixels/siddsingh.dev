import { gradientPresets } from "./constants"
import type { ExportFormat, ScreenshotMockupState, ShadowPreset } from "./types"

type RenderMockupCanvasArgs = {
	canvas: HTMLCanvasElement
	image: HTMLImageElement
	state: ScreenshotMockupState
	scale?: number
	format?: ExportFormat
}

const ASPECT_RATIOS: Record<string, number> = {
	"16:9": 16 / 9,
	"4:3": 4 / 3,
	"1:1": 1,
	"9:16": 9 / 16,
}

function getShadowPreset(shadowPreset: ShadowPreset) {
	switch (shadowPreset) {
		case "lifted":
			return {
				blur: 20,
				offsetX: 10,
				offsetY: 20,
				color: "rgba(15, 23, 42, 0.44)",
			}
		case "float":
			return {
				blur: 28,
				offsetX: 20,
				offsetY: 28,
				color: "rgba(15, 23, 42, 0.5)",
			}
		case "none":
			return { blur: 0, offsetX: 0, offsetY: 0, color: "rgba(0, 0, 0, 0)" }
		case "soft":
			return {
				blur: 20,
				offsetX: 15,
				offsetY: 18,
				color: "rgba(15, 23, 42, 0.28)",
			}
		default:
			return {
				blur: 34,
				offsetX: 15,
				offsetY: 18,
				color: "rgba(15, 23, 42, 0.18)",
			}
	}
}

function createRoundedRectPath(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	radius: number,
) {
	const safeRadius = Math.max(0, Math.min(radius, width / 2, height / 2))

	ctx.beginPath()
	ctx.moveTo(x + safeRadius, y)
	ctx.lineTo(x + width - safeRadius, y)
	ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius)
	ctx.lineTo(x + width, y + height - safeRadius)
	ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height)
	ctx.lineTo(x + safeRadius, y + height)
	ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius)
	ctx.lineTo(x, y + safeRadius)
	ctx.quadraticCurveTo(x, y, x + safeRadius, y)
	ctx.closePath()
}

function getBackgroundFill(
	ctx: CanvasRenderingContext2D,
	state: ScreenshotMockupState,
	width: number,
	height: number,
) {
	if (state.backgroundStyle === "solid") {
		return state.solidColor
	}

	const preset = gradientPresets.find((item) => item.id === state.gradientPresetId)
	const angle =
		state.backgroundStyle === "preset"
			? (state.gradientAngle ?? preset?.angle)
			: state.gradientAngle
	const radians = (angle - 90) * (Math.PI / 180)
	const halfWidth = width / 2
	const halfHeight = height / 2
	const gradient = ctx.createLinearGradient(
		halfWidth - Math.cos(radians) * halfWidth,
		halfHeight - Math.sin(radians) * halfHeight,
		halfWidth + Math.cos(radians) * halfWidth,
		halfHeight + Math.sin(radians) * halfHeight,
	)
	const start =
		state.backgroundStyle === "preset"
			? (preset?.start ?? "#0f172a")
			: state.customGradientStart
	const end =
		state.backgroundStyle === "preset" ? (preset?.end ?? "#22d3ee") : state.customGradientEnd

	gradient.addColorStop(0, start)
	gradient.addColorStop(1, end)

	return gradient
}

function drawBrowserChrome(
	ctx: CanvasRenderingContext2D,
	state: ScreenshotMockupState,
	x: number,
	y: number,
	width: number,
	frameHeight: number,
) {
	if (state.frameStyle === "none") {
		return
	}

	const isDark = state.frameStyle === "dark"
	const isMinimal = state.frameStyle === "minimal"
	const chromeFill = isDark ? "#111827" : "#f8fafc"
	const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.1)"
	const pillFill = isDark ? "rgba(255,255,255,0.16)" : "rgba(15,23,42,0.12)"
	const dotColors = ["#fb7185", "#fbbf24", "#34d399"]

	ctx.fillStyle = chromeFill
	ctx.fillRect(x, y, width, frameHeight)
	ctx.strokeStyle = borderColor
	ctx.lineWidth = 1
	ctx.beginPath()
	ctx.moveTo(x, y + frameHeight)
	ctx.lineTo(x + width, y + frameHeight)
	ctx.stroke()

	if (isMinimal) {
		ctx.fillStyle = pillFill
		createRoundedRectPath(
			ctx,
			x + width * 0.35,
			y + frameHeight * 0.34,
			width * 0.3,
			frameHeight * 0.3,
			frameHeight * 0.16,
		)
		ctx.fill()
		return
	}

	dotColors.forEach((color, index) => {
		ctx.fillStyle = color
		ctx.beginPath()
		ctx.arc(x + 22 + index * 15, y + frameHeight / 2, 4.5, 0, Math.PI * 2)
		ctx.fill()
	})

	ctx.fillStyle = pillFill
	createRoundedRectPath(
		ctx,
		x + width * 0.26,
		y + frameHeight * 0.26,
		width * 0.48,
		frameHeight * 0.46,
		frameHeight * 0.18,
	)
	ctx.fill()
}

export function renderMockupCanvas({
	canvas,
	image,
	state,
	scale = 1,
	format = "png",
}: RenderMockupCanvasArgs) {
	const maxContentWidth = 1040
	const maxContentHeight = 780
	const imageScale = Math.min(
		maxContentWidth / image.naturalWidth,
		maxContentHeight / image.naturalHeight,
		1.15,
	)
	const imageWidth = Math.max(220, image.naturalWidth * imageScale)
	const imageHeight = Math.max(140, image.naturalHeight * imageScale)
	const isIphone = state.frameStyle === "iphone"
	const sf = imageWidth / 400
	const bezel = isIphone ? Math.max(12, imageWidth * 0.04) : 0
	const frameHeight =
		state.frameStyle === "none"
			? 0
			: state.frameStyle === "minimal"
				? 30
				: isIphone
					? bezel
					: 46
	const frameWidth = imageWidth + (isIphone ? bezel * 2 : 0)
	const frameContentHeight = imageHeight + frameHeight + (isIphone ? bezel : 0)
	const outerRadius = isIphone ? state.cornerRadius + bezel : state.cornerRadius
	const baseWidth = frameWidth + state.paddingX * 2
	const baseHeight = frameContentHeight + state.paddingY * 2
	const explicitRatio = state.aspectRatio === "auto" ? null : ASPECT_RATIOS[state.aspectRatio]

	let canvasWidth = baseWidth
	let canvasHeight = baseHeight

	if (explicitRatio) {
		if (baseWidth / baseHeight > explicitRatio) {
			canvasHeight = baseWidth / explicitRatio
		} else {
			canvasWidth = baseHeight * explicitRatio
		}
	}

	canvas.width = Math.round(canvasWidth * scale)
	canvas.height = Math.round(canvasHeight * scale)

	const ctx = canvas.getContext("2d")

	if (!ctx) {
		throw new Error("Canvas 2D context is not available.")
	}

	ctx.setTransform(scale, 0, 0, scale, 0, 0)
	ctx.clearRect(0, 0, canvasWidth, canvasHeight)

	if (!(state.backgroundStyle === "transparent" && format === "png")) {
		ctx.fillStyle =
			state.backgroundStyle === "transparent"
				? "#f8fafc"
				: getBackgroundFill(ctx, state, canvasWidth, canvasHeight)
		ctx.fillRect(0, 0, canvasWidth, canvasHeight)
	}

	const frameX = (canvasWidth - frameWidth) / 2
	const frameY = (canvasHeight - frameContentHeight) / 2
	const shadow = getShadowPreset(state.shadowPreset)
	const containerFill =
		state.frameStyle === "dark" || state.frameStyle === "iphone"
			? "#111827"
			: state.frameStyle === "light"
				? "#ffffff"
				: state.frameStyle === "minimal"
					? "rgba(255,255,255,0.92)"
					: "#ffffff"

	ctx.save()

	if (isIphone) {
		ctx.shadowBlur = shadow.blur
		ctx.shadowOffsetY = shadow.offsetY
		ctx.shadowOffsetX = shadow.offsetX
		ctx.shadowColor = shadow.color
		ctx.fillStyle = containerFill

		const bw = Math.max(3, imageWidth * 0.01)
		const drawButton = (bx: number, by: number, w: number, h: number) => {
			createRoundedRectPath(ctx, bx, by, w, h, bw / 2)
			ctx.fill()
		}

		drawButton(frameX - bw, frameY + 80 * sf, bw, 24 * sf)
		drawButton(frameX - bw, frameY + 120 * sf, bw, 48 * sf)
		drawButton(frameX - bw, frameY + 176 * sf, bw, 48 * sf)
		drawButton(frameX + frameWidth, frameY + 140 * sf, bw, 72 * sf)
	}

	ctx.shadowBlur = shadow.blur
	ctx.shadowOffsetY = shadow.offsetY
	ctx.shadowOffsetX = shadow.offsetX
	ctx.shadowColor = shadow.color
	ctx.fillStyle = containerFill
	createRoundedRectPath(ctx, frameX, frameY, frameWidth, frameContentHeight, outerRadius)
	ctx.fill()
	ctx.restore()

	ctx.save()
	createRoundedRectPath(ctx, frameX, frameY, frameWidth, frameContentHeight, outerRadius)
	ctx.clip()

	if (state.frameStyle !== "none" && !isIphone) {
		drawBrowserChrome(ctx, state, frameX, frameY, frameWidth, frameHeight)
	}

	const imageX = frameX + (isIphone ? bezel : 0)
	const imageY = frameY + frameHeight

	if (isIphone) {
		ctx.save()
		createRoundedRectPath(ctx, imageX, imageY, imageWidth, imageHeight, state.cornerRadius)
		ctx.clip()
		ctx.drawImage(image, imageX, imageY, imageWidth, imageHeight)
		ctx.restore()

		const islandWidth = Math.min(imageWidth * 0.35, 160)
		const islandHeight = Math.max(24, imageWidth * 0.08)
		const islandY = imageY + Math.max(8, imageWidth * 0.03)
		const islandX = imageX + (imageWidth - islandWidth) / 2

		ctx.fillStyle = "#000000"
		createRoundedRectPath(ctx, islandX, islandY, islandWidth, islandHeight, islandHeight / 2)
		ctx.fill()
	} else {
		ctx.drawImage(image, imageX, imageY, imageWidth, imageHeight)
	}
	ctx.restore()
}
