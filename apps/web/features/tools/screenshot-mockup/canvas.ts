import { gradientPresets } from "./constants"
import type { ExportFormat, ScreenshotMockupState, ShadowPreset } from "./types"

type RenderMockupCanvasArgs = {
	canvas: HTMLCanvasElement
	image: HTMLImageElement | HTMLCanvasElement
	backgroundImage?: HTMLImageElement | HTMLCanvasElement | null
	state: ScreenshotMockupState
	scale?: number
	format?: ExportFormat
}

const ASPECT_RATIOS: Record<string, number> = {
	"16:9": 16 / 9,
	"4:3": 4 / 3,
	"3:4": 3 / 4,
	"1:1": 1,
	"9:16": 9 / 16,
	"3:2": 3 / 2,
	"2:3": 2 / 3,
}

function hexToRgb(hex: string) {
	const value = hex.replace("#", "")
	const expanded =
		value.length === 3
			? value
					.split("")
					.map((char) => char + char)
					.join("")
			: value

	return {
		r: Number.parseInt(expanded.slice(0, 2), 16) || 0,
		g: Number.parseInt(expanded.slice(2, 4), 16) || 0,
		b: Number.parseInt(expanded.slice(4, 6), 16) || 0,
	}
}

function rgba(hex: string, opacity: number) {
	const color = hexToRgb(hex)

	return `rgba(${color.r}, ${color.g}, ${color.b}, ${Math.max(0, Math.min(1, opacity))})`
}

function getShadowPreset(state: ScreenshotMockupState, shadowPreset: ShadowPreset) {
	switch (shadowPreset) {
		case "lifted":
			return {
				blur: 28,
				offsetX: 10,
				offsetY: 24,
				color: "rgba(15, 23, 42, 0.44)",
			}
		case "float":
			return {
				blur: 38,
				offsetX: 20,
				offsetY: 32,
				color: "rgba(15, 23, 42, 0.5)",
			}
		case "custom":
			return {
				blur: state.shadowBlur,
				offsetX: state.shadowOffsetX,
				offsetY: state.shadowOffsetY,
				color: rgba(state.shadowColor, state.shadowOpacity / 100),
			}
		case "none":
			return { blur: 0, offsetX: 0, offsetY: 0, color: "rgba(0, 0, 0, 0)" }
		default:
			return {
				blur: 32,
				offsetX: 0,
				offsetY: 20,
				color: "rgba(15, 23, 42, 0.28)",
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

	if (state.backgroundStyle === "custom") {
		const stops =
			state.customGradientStops.length >= 2
				? [...state.customGradientStops].sort(
						(firstStop, secondStop) => firstStop.position - secondStop.position,
					)
				: [
						{
							id: "custom-gradient-start",
							position: 0,
							color: state.customGradientStart,
							opacity: 100,
						},
						{
							id: "custom-gradient-end",
							position: 100,
							color: state.customGradientEnd,
							opacity: 100,
						},
					]

		for (const stop of stops) {
			gradient.addColorStop(
				Math.max(0, Math.min(1, stop.position / 100)),
				rgba(stop.color, stop.opacity / 100),
			)
		}

		return gradient
	}

	const start = preset?.start ?? "#a8edea"
	const end = preset?.end ?? "#fed6e3"

	gradient.addColorStop(0, start)
	gradient.addColorStop(1, end)

	return gradient
}

function drawCoverImage(
	ctx: CanvasRenderingContext2D,
	image: HTMLImageElement | HTMLCanvasElement,
	x: number,
	y: number,
	width: number,
	height: number,
) {
	const sourceWidth = image instanceof HTMLImageElement ? image.naturalWidth : image.width
	const sourceHeight = image instanceof HTMLImageElement ? image.naturalHeight : image.height
	const sourceRatio = sourceWidth / sourceHeight
	const targetRatio = width / height
	let sx = 0
	let sy = 0
	let sw = sourceWidth
	let sh = sourceHeight

	if (sourceRatio > targetRatio) {
		sw = sourceHeight * targetRatio
		sx = (sourceWidth - sw) / 2
	} else {
		sh = sourceWidth / targetRatio
		sy = (sourceHeight - sh) / 2
	}

	ctx.drawImage(image, sx, sy, sw, sh, x, y, width, height)
}

function drawBackground(
	ctx: CanvasRenderingContext2D,
	state: ScreenshotMockupState,
	width: number,
	height: number,
	format: ExportFormat,
	backgroundImage?: HTMLImageElement | HTMLCanvasElement | null,
) {
	if (state.backgroundStyle === "transparent" && format === "png") {
		return
	}

	if (state.backgroundStyle === "image" && backgroundImage) {
		ctx.save()
		ctx.filter = state.backgroundBlur > 0 ? `blur(${state.backgroundBlur}px)` : "none"
		drawCoverImage(ctx, backgroundImage, 0, 0, width, height)
		ctx.restore()

		if (state.backgroundTintOpacity > 0) {
			ctx.fillStyle = rgba(state.backgroundTintColor, state.backgroundTintOpacity / 100)
			ctx.fillRect(0, 0, width, height)
		}

		return
	}

	ctx.fillStyle =
		state.backgroundStyle === "transparent"
			? "#f8fafc"
			: getBackgroundFill(ctx, state, width, height)
	ctx.fillRect(0, 0, width, height)
}

function drawBrowserChrome(
	ctx: CanvasRenderingContext2D,
	state: ScreenshotMockupState,
	x: number,
	y: number,
	width: number,
	frameHeight: number,
) {
	if (state.frameStyle === "none" || state.frameStyle === "iphone") {
		return
	}

	const dark = state.frameDarkMode
	const chromeFill = dark ? "#2d2d2d" : "#f3f4f6"
	const borderColor = dark ? "rgba(255,255,255,0.11)" : "rgba(15,23,42,0.1)"
	const textColor = dark ? "rgba(255,255,255,0.58)" : "rgba(15,23,42,0.64)"

	ctx.fillStyle = chromeFill
	ctx.fillRect(x, y, width, frameHeight)
	ctx.strokeStyle = borderColor
	ctx.lineWidth = 1
	ctx.beginPath()
	ctx.moveTo(x, y + frameHeight)
	ctx.lineTo(x + width, y + frameHeight)
	ctx.stroke()

	if (state.frameStyle === "windows") {
		ctx.strokeStyle = dark ? "#ffffff" : "#111827"
		ctx.lineWidth = 1.5
		const buttonY = y + frameHeight / 2
		const right = x + width - 24
		ctx.beginPath()
		ctx.moveTo(right - 78, buttonY)
		ctx.lineTo(right - 68, buttonY)
		ctx.stroke()
		ctx.strokeRect(right - 42, buttonY - 5, 10, 10)
		ctx.beginPath()
		ctx.moveTo(right - 8, buttonY - 5)
		ctx.lineTo(right + 2, buttonY + 5)
		ctx.moveTo(right + 2, buttonY - 5)
		ctx.lineTo(right - 8, buttonY + 5)
		ctx.stroke()
		return
	}

	const dotColors =
		state.frameStyle === "macos-unified"
			? ["#a8a8a8", "#a8a8a8", "#a8a8a8"]
			: ["#ff5f57", "#febc2e", "#28c840"]

	dotColors.forEach((color, index) => {
		ctx.fillStyle = color
		ctx.beginPath()
		ctx.arc(x + 24 + index * 17, y + frameHeight / 2, 5.5, 0, Math.PI * 2)
		ctx.fill()
	})

	if (state.frameStyle === "browser") {
		const addressX = x + 92
		const addressWidth = Math.max(160, width - 124)
		ctx.fillStyle = dark ? "#1e1e1e" : "#ffffff"
		createRoundedRectPath(
			ctx,
			addressX,
			y + frameHeight * 0.24,
			addressWidth,
			frameHeight * 0.52,
			7,
		)
		ctx.fill()
		ctx.fillStyle = textColor
		ctx.font = "12px Inter, ui-sans-serif, system-ui, sans-serif"
		ctx.textBaseline = "middle"
		const address = state.address || "https://example.com"
		ctx.fillText(address, addressX + 12, y + frameHeight / 2, addressWidth - 24)
	}
}

type FrameMetrics = {
	imageWidth: number
	imageHeight: number
	frameWidth: number
	frameHeight: number
	frameContentHeight: number
	outerRadius: number
	bezel: number
}

function getFrameMetrics(state: ScreenshotMockupState, sourceWidth: number, sourceHeight: number) {
	const maxContentWidth = 1040
	const maxContentHeight = 780
	const imageFitScale = Math.min(
		maxContentWidth / sourceWidth,
		maxContentHeight / sourceHeight,
		1.15,
	)
	const imageScale = imageFitScale * (state.imageScale / 100)
	const imageWidth = Math.max(80, sourceWidth * imageScale)
	const imageHeight = Math.max(80, sourceHeight * imageScale)
	const isIphone = state.frameStyle === "iphone"
	const bezel = isIphone ? Math.max(12, imageWidth * 0.04) : 0
	const frameHeight =
		state.frameStyle === "none"
			? 0
			: isIphone
				? bezel
				: state.frameStyle === "windows"
					? 34
					: 40
	const frameWidth = imageWidth + (isIphone ? bezel * 2 : 0)
	const frameContentHeight = imageHeight + frameHeight + (isIphone ? bezel : 0)
	const outerRadius = isIphone
		? state.cornerRadius + bezel
		: state.cornerRadius + state.borderWidth

	return {
		imageWidth,
		imageHeight,
		frameWidth,
		frameHeight,
		frameContentHeight,
		outerRadius,
		bezel,
	}
}

function drawFrame(
	ctx: CanvasRenderingContext2D,
	image: HTMLImageElement | HTMLCanvasElement,
	state: ScreenshotMockupState,
	metrics: FrameMetrics,
	x: number,
	y: number,
	shadow: ReturnType<typeof getShadowPreset>,
	options?: { opacity?: number; blur?: number; silhouette?: boolean },
) {
	const isIphone = state.frameStyle === "iphone"
	const containerFill =
		state.frameDarkMode || isIphone
			? "#111827"
			: state.frameStyle === "none"
				? "#ffffff"
				: "#ffffff"
	const opacity = options?.opacity ?? 1

	ctx.save()
	ctx.globalAlpha = opacity
	ctx.filter = options?.blur ? `blur(${options.blur}px)` : "none"

	if (isIphone) {
		ctx.shadowBlur = shadow.blur
		ctx.shadowOffsetY = shadow.offsetY
		ctx.shadowOffsetX = shadow.offsetX
		ctx.shadowColor = shadow.color
		ctx.fillStyle = containerFill
		const buttonWidth = Math.max(3, metrics.imageWidth * 0.01)
		const sideButton = (bx: number, by: number, w: number, h: number) => {
			createRoundedRectPath(ctx, bx, by, w, h, buttonWidth / 2)
			ctx.fill()
		}
		const sf = metrics.imageWidth / 400
		sideButton(x - buttonWidth, y + 80 * sf, buttonWidth, 24 * sf)
		sideButton(x - buttonWidth, y + 120 * sf, buttonWidth, 48 * sf)
		sideButton(x - buttonWidth, y + 176 * sf, buttonWidth, 48 * sf)
		sideButton(x + metrics.frameWidth, y + 140 * sf, buttonWidth, 72 * sf)
	}

	ctx.shadowBlur = shadow.blur
	ctx.shadowOffsetY = shadow.offsetY
	ctx.shadowOffsetX = shadow.offsetX
	ctx.shadowColor = shadow.color
	ctx.fillStyle = options?.silhouette ? "rgba(15, 23, 42, 0.7)" : containerFill
	createRoundedRectPath(
		ctx,
		x,
		y,
		metrics.frameWidth,
		metrics.frameContentHeight,
		metrics.outerRadius,
	)
	ctx.fill()
	ctx.shadowColor = "rgba(0, 0, 0, 0)"

	if (state.borderWidth > 0) {
		ctx.strokeStyle = state.borderColor
		ctx.lineWidth = state.borderWidth
		createRoundedRectPath(
			ctx,
			x + state.borderWidth / 2,
			y + state.borderWidth / 2,
			metrics.frameWidth - state.borderWidth,
			metrics.frameContentHeight - state.borderWidth,
			Math.max(0, metrics.outerRadius - state.borderWidth / 2),
		)
		ctx.stroke()
	}

	if (!options?.silhouette) {
		ctx.save()
		createRoundedRectPath(
			ctx,
			x,
			y,
			metrics.frameWidth,
			metrics.frameContentHeight,
			metrics.outerRadius,
		)
		ctx.clip()
		drawBrowserChrome(ctx, state, x, y, metrics.frameWidth, metrics.frameHeight)

		const imageX = x + (isIphone ? metrics.bezel : 0)
		const imageY = y + metrics.frameHeight

		if (isIphone) {
			createRoundedRectPath(
				ctx,
				imageX,
				imageY,
				metrics.imageWidth,
				metrics.imageHeight,
				state.cornerRadius,
			)
			ctx.clip()
		}

		ctx.save()
		ctx.translate(imageX + metrics.imageWidth / 2, imageY + metrics.imageHeight / 2)
		ctx.scale(state.flipX ? -1 : 1, state.flipY ? -1 : 1)
		ctx.drawImage(
			image,
			-metrics.imageWidth / 2,
			-metrics.imageHeight / 2,
			metrics.imageWidth,
			metrics.imageHeight,
		)
		ctx.restore()
		ctx.restore()

		if (isIphone) {
			const islandWidth = Math.min(metrics.imageWidth * 0.35, 160)
			const islandHeight = Math.max(24, metrics.imageWidth * 0.08)
			const islandY = y + metrics.frameHeight + Math.max(8, metrics.imageWidth * 0.03)
			const islandX = x + metrics.bezel + (metrics.imageWidth - islandWidth) / 2
			ctx.fillStyle = "#000000"
			createRoundedRectPath(
				ctx,
				islandX,
				islandY,
				islandWidth,
				islandHeight,
				islandHeight / 2,
			)
			ctx.fill()
		}
	}

	ctx.restore()
}

export function renderMockupCanvas({
	canvas,
	image,
	backgroundImage,
	state,
	scale = 1,
	format = "png",
}: RenderMockupCanvasArgs) {
	const sourceWidth = image instanceof HTMLImageElement ? image.naturalWidth : image.width
	const sourceHeight = image instanceof HTMLImageElement ? image.naturalHeight : image.height
	const metrics = getFrameMetrics(state, sourceWidth, sourceHeight)
	const baseWidth = metrics.frameWidth + state.paddingX * 2
	const baseHeight = metrics.frameContentHeight + state.paddingY * 2
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

	const scaledCanvasWidth = Math.round(canvasWidth * scale)
	const scaledCanvasHeight = Math.round(canvasHeight * scale)

	if (canvas.width !== scaledCanvasWidth) {
		canvas.width = scaledCanvasWidth
	}

	if (canvas.height !== scaledCanvasHeight) {
		canvas.height = scaledCanvasHeight
	}

	const ctx = canvas.getContext("2d")

	if (!ctx) {
		throw new Error("Canvas 2D context is not available.")
	}

	ctx.setTransform(scale, 0, 0, scale, 0, 0)
	ctx.clearRect(0, 0, canvasWidth, canvasHeight)
	drawBackground(ctx, state, canvasWidth, canvasHeight, format, backgroundImage)

	const frameX = (canvasWidth - metrics.frameWidth) / 2 + state.positionX
	const frameY = (canvasHeight - metrics.frameContentHeight) / 2 + state.positionY
	const shadow = getShadowPreset(state, state.shadowPreset)
	const angle = (state.rotation * Math.PI) / 180
	const rotateXScale = Math.max(0.2, Math.cos((state.rotateX * Math.PI) / 180))
	const rotateYScale = Math.max(0.2, Math.cos((state.rotateY * Math.PI) / 180))

	ctx.save()
	ctx.translate(frameX + metrics.frameWidth / 2, frameY + metrics.frameContentHeight / 2)
	ctx.rotate(angle)
	ctx.transform(rotateYScale, state.rotateY / 120, -state.rotateX / 120, rotateXScale, 0, 0)
	ctx.translate(-metrics.frameWidth / 2, -metrics.frameContentHeight / 2)

	if (state.stackEnabled) {
		for (let index = state.stackCount - 1; index >= 1; index -= 1) {
			const distance = index
			const stackScale = state.stackScale / 100
			const opacity = Math.max(
				0,
				Math.min(1, (state.stackOpacity / 100) * (1 - index * 0.12)),
			)
			const layerScale = stackScale ** distance

			ctx.save()
			ctx.translate(
				metrics.frameWidth / 2 + state.stackOffsetX * distance,
				metrics.frameContentHeight / 2 + state.stackOffsetY * distance,
			)
			ctx.scale(layerScale, layerScale)
			drawFrame(
				ctx,
				image,
				state,
				metrics,
				-metrics.frameWidth / 2,
				-metrics.frameContentHeight / 2,
				{ blur: 0, offsetX: 0, offsetY: 0, color: "rgba(0,0,0,0)" },
				{
					opacity,
					blur: state.stackBlur,
					silhouette: state.stackEffect === "silhouette",
				},
			)
			ctx.restore()
		}
	}

	drawFrame(ctx, image, state, metrics, 0, 0, shadow)
	ctx.restore()
}
