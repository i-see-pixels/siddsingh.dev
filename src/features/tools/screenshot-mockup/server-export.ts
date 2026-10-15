import { createDefaultScreenshotMockupState, gradientPresets } from "./constants"
import type { ExportFormat, ScreenshotMockupState, ShadowPreset } from "./types"

export type ServerExportFormat = ExportFormat | "svg"

export type ScreenshotImageInput = {
	src: string
	width: number
	height: number
	name?: string
}

type MockupSize = {
	width: number
	height: number
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

type Shadow = {
	blur: number
	offsetX: number
	offsetY: number
	color: string
	opacity: number
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

const ENUM_FIELDS = {
	backgroundStyle: ["transparent", "solid", "preset", "custom", "image"],
	aspectRatio: ["auto", "16:9", "4:3", "3:4", "1:1", "9:16", "3:2", "2:3"],
	shadowPreset: ["none", "soft", "lifted", "float", "custom"],
	frameStyle: ["none", "macos", "macos-unified", "windows", "browser", "iphone"],
	stackEffect: ["default", "silhouette"],
} as const

const NUMERIC_LIMITS = {
	backgroundTintOpacity: [0, 100],
	backgroundBlur: [0, 80],
	gradientAngle: [0, 360],
	paddingX: [0, 600],
	paddingY: [0, 600],
	cornerRadius: [0, 220],
	shadowOffsetX: [-200, 200],
	shadowOffsetY: [-200, 200],
	shadowBlur: [0, 220],
	shadowOpacity: [0, 100],
	borderWidth: [0, 40],
	imageScale: [10, 300],
	rotation: [-180, 180],
	positionX: [-1200, 1200],
	positionY: [-1200, 1200],
	rotateX: [-75, 75],
	rotateY: [-75, 75],
	stackCount: [1, 8],
	stackOffsetX: [-240, 240],
	stackOffsetY: [-240, 240],
	stackScale: [50, 120],
	stackOpacity: [0, 100],
	stackBlur: [0, 80],
} as const

const STRING_FIELDS = [
	"imageName",
	"solidColor",
	"backgroundImageSrc",
	"backgroundTintColor",
	"gradientPresetId",
	"customGradientStart",
	"customGradientEnd",
	"address",
	"borderColor",
	"shadowColor",
] as const

const BOOLEAN_FIELDS = ["frameDarkMode", "flipX", "flipY", "stackEnabled"] as const

function clamp(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value))
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isHexColor(value: string) {
	return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)
}

function normalizeColor(value: unknown, fallback: string) {
	return typeof value === "string" && isHexColor(value) ? value : fallback
}

function pickEnum<T extends readonly string[]>(value: unknown, allowed: T, fallback: T[number]) {
	return typeof value === "string" && allowed.includes(value) ? value : fallback
}

function pickNumber(value: unknown, fallback: number, min: number, max: number) {
	if (typeof value !== "number" || !Number.isFinite(value)) {
		return fallback
	}

	return clamp(value, min, max)
}

function escapeXml(value: string) {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;")
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

function rgbaParts(hex: string, opacity: number) {
	const color = hexToRgb(hex)

	return {
		color: `rgb(${color.r}, ${color.g}, ${color.b})`,
		opacity: clamp(opacity, 0, 1),
	}
}

function parseRgba(value: string): Shadow {
	const match = value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/)

	if (!match) {
		return {
			blur: 0,
			offsetX: 0,
			offsetY: 0,
			color: "rgb(0, 0, 0)",
			opacity: 0,
		}
	}

	return {
		blur: 0,
		offsetX: 0,
		offsetY: 0,
		color: `rgb(${match[1]}, ${match[2]}, ${match[3]})`,
		opacity: Number(match[4] ?? 1),
	}
}

function getShadowPreset(state: ScreenshotMockupState, shadowPreset: ShadowPreset): Shadow {
	switch (shadowPreset) {
		case "lifted":
			return {
				blur: 28,
				offsetX: 10,
				offsetY: 24,
				color: "rgb(15, 23, 42)",
				opacity: 0.44,
			}
		case "float":
			return {
				blur: 38,
				offsetX: 20,
				offsetY: 32,
				color: "rgb(15, 23, 42)",
				opacity: 0.5,
			}
		case "custom": {
			const shadowColor = rgbaParts(state.shadowColor, state.shadowOpacity / 100)

			return {
				blur: state.shadowBlur,
				offsetX: state.shadowOffsetX,
				offsetY: state.shadowOffsetY,
				color: shadowColor.color,
				opacity: shadowColor.opacity,
			}
		}
		case "none":
			return {
				blur: 0,
				offsetX: 0,
				offsetY: 0,
				color: "rgb(0, 0, 0)",
				opacity: 0,
			}
		default:
			return {
				blur: 32,
				offsetX: 0,
				offsetY: 20,
				color: "rgb(15, 23, 42)",
				opacity: 0.28,
			}
	}
}

function getFrameMetrics(
	state: ScreenshotMockupState,
	sourceWidth: number,
	sourceHeight: number,
): FrameMetrics {
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

function getMockupSize(
	state: ScreenshotMockupState,
	sourceWidth: number,
	sourceHeight: number,
): MockupSize {
	const metrics = getFrameMetrics(state, sourceWidth, sourceHeight)
	const baseWidth = metrics.frameWidth + state.paddingX * 2
	const baseHeight = metrics.frameContentHeight + state.paddingY * 2
	const explicitRatio = state.aspectRatio === "auto" ? null : ASPECT_RATIOS[state.aspectRatio]

	if (!explicitRatio) {
		return {
			width: Math.round(baseWidth),
			height: Math.round(baseHeight),
		}
	}

	if (baseWidth / baseHeight > explicitRatio) {
		return {
			width: Math.round(baseWidth),
			height: Math.round(baseWidth / explicitRatio),
		}
	}

	return {
		width: Math.round(baseHeight * explicitRatio),
		height: Math.round(baseHeight),
	}
}

function createRoundedRect(
	x: number,
	y: number,
	width: number,
	height: number,
	radius: number,
	extra = "",
) {
	return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" ry="${radius}" ${extra}/>`
}

function createLinearGradient(state: ScreenshotMockupState, id: string) {
	const preset = gradientPresets.find((item) => item.id === state.gradientPresetId)
	const angle =
		state.backgroundStyle === "preset"
			? (state.gradientAngle ?? preset?.angle)
			: state.gradientAngle
	const stops =
		state.backgroundStyle === "custom"
			? state.customGradientStops.length >= 2
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
			: [
					{
						id: "preset-gradient-start",
						position: 0,
						color: preset?.start ?? "#a8edea",
						opacity: 100,
					},
					{
						id: "preset-gradient-end",
						position: 100,
						color: preset?.end ?? "#fed6e3",
						opacity: 100,
					},
				]

	return `<linearGradient id="${id}" gradientTransform="rotate(${angle})">${stops
		.map((stop) => {
			const color = rgbaParts(stop.color, stop.opacity / 100)

			return `<stop offset="${clamp(stop.position, 0, 100)}%" stop-color="${color.color}" stop-opacity="${color.opacity}"/>`
		})
		.join("")}</linearGradient>`
}

function createShadowFilter(id: string, shadow: Shadow) {
	if (shadow.opacity <= 0 || shadow.blur <= 0) {
		return ""
	}

	return `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="${shadow.offsetX}" dy="${shadow.offsetY}" stdDeviation="${shadow.blur / 2}" flood-color="${shadow.color}" flood-opacity="${shadow.opacity}"/></filter>`
}

function createBlurFilter(id: string, blur: number) {
	if (blur <= 0) {
		return ""
	}

	return `<filter id="${id}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${blur}"/></filter>`
}

function createBrowserChrome(state: ScreenshotMockupState, width: number, frameHeight: number) {
	if (state.frameStyle === "none" || state.frameStyle === "iphone") {
		return ""
	}

	const dark = state.frameDarkMode
	const chromeFill = dark ? "#2d2d2d" : "#f3f4f6"
	const borderColor = dark ? "rgba(255,255,255,0.11)" : "rgba(15,23,42,0.1)"

	if (state.frameStyle === "windows") {
		const buttonY = frameHeight / 2
		const right = width - 24

		return `<g><rect x="0" y="0" width="${width}" height="${frameHeight}" fill="${chromeFill}"/><line x1="0" y1="${frameHeight}" x2="${width}" y2="${frameHeight}" stroke="${borderColor}" stroke-width="1"/><g stroke="${dark ? "#ffffff" : "#111827"}" stroke-width="1.5" fill="none"><line x1="${right - 78}" y1="${buttonY}" x2="${right - 68}" y2="${buttonY}"/><rect x="${right - 42}" y="${buttonY - 5}" width="10" height="10"/><line x1="${right - 8}" y1="${buttonY - 5}" x2="${right + 2}" y2="${buttonY + 5}"/><line x1="${right + 2}" y1="${buttonY - 5}" x2="${right - 8}" y2="${buttonY + 5}"/></g></g>`
	}

	const dotColors =
		state.frameStyle === "macos-unified"
			? ["#a8a8a8", "#a8a8a8", "#a8a8a8"]
			: ["#ff5f57", "#febc2e", "#28c840"]
	const dots = dotColors
		.map(
			(color, index) =>
				`<circle cx="${24 + index * 17}" cy="${frameHeight / 2}" r="5.5" fill="${color}"/>`,
		)
		.join("")
	const address =
		state.frameStyle === "browser"
			? `<rect x="92" y="${frameHeight * 0.24}" width="${Math.max(160, width - 124)}" height="${frameHeight * 0.52}" rx="7" fill="${dark ? "#1e1e1e" : "#ffffff"}"/><text x="104" y="${frameHeight / 2 + 4}" font-family="Inter, Arial, sans-serif" font-size="12" fill="${dark ? "rgba(255,255,255,0.58)" : "rgba(15,23,42,0.64)"}">${escapeXml(state.address || "https://example.com")}</text>`
			: ""

	return `<g><rect x="0" y="0" width="${width}" height="${frameHeight}" fill="${chromeFill}"/><line x1="0" y1="${frameHeight}" x2="${width}" y2="${frameHeight}" stroke="${borderColor}" stroke-width="1"/>${dots}${address}</g>`
}

function createFrame({
	image,
	state,
	metrics,
	idPrefix,
	shadow,
	opacity = 1,
	blur = 0,
	silhouette = false,
}: {
	image: ScreenshotImageInput
	state: ScreenshotMockupState
	metrics: FrameMetrics
	idPrefix: string
	shadow: Shadow
	opacity?: number
	blur?: number
	silhouette?: boolean
}) {
	const isIphone = state.frameStyle === "iphone"
	const containerFill = state.frameDarkMode || isIphone ? "#111827" : "#ffffff"
	const imageX = isIphone ? metrics.bezel : 0
	const imageY = metrics.frameHeight
	const clipId = `${idPrefix}-clip`
	const imageClipId = `${idPrefix}-image-clip`
	const frameFilter =
		shadow.opacity > 0 && shadow.blur > 0 ? `filter="url(#${idPrefix}-shadow)"` : ""
	const blurFilter = blur > 0 ? `filter="url(#stack-blur)"` : ""
	const sideButtons = isIphone
		? (() => {
				const buttonWidth = Math.max(3, metrics.imageWidth * 0.01)
				const buttonRadius = buttonWidth / 2
				const sf = metrics.imageWidth / 400
				const button = (x: number, y: number, width: number, height: number) =>
					createRoundedRect(x, y, width, height, buttonRadius, `fill="${containerFill}"`)

				return [
					button(-buttonWidth, 80 * sf, buttonWidth, 24 * sf),
					button(-buttonWidth, 120 * sf, buttonWidth, 48 * sf),
					button(-buttonWidth, 176 * sf, buttonWidth, 48 * sf),
					button(metrics.frameWidth, 140 * sf, buttonWidth, 72 * sf),
				].join("")
			})()
		: ""

	const border =
		state.borderWidth > 0
			? `stroke="${state.borderColor}" stroke-width="${state.borderWidth}"`
			: ""
	const imageTransform = `translate(${imageX + metrics.imageWidth / 2} ${imageY + metrics.imageHeight / 2}) scale(${state.flipX ? -1 : 1} ${state.flipY ? -1 : 1})`
	const imageElement = silhouette
		? ""
		: `<g clip-path="url(#${clipId})">${createBrowserChrome(
				state,
				metrics.frameWidth,
				metrics.frameHeight,
			)}<clipPath id="${imageClipId}">${createRoundedRect(
				imageX,
				imageY,
				metrics.imageWidth,
				metrics.imageHeight,
				isIphone ? state.cornerRadius : 0,
			)}</clipPath><g clip-path="url(#${imageClipId})" transform="${imageTransform}"><image href="${escapeXml(
				image.src,
			)}" x="${-metrics.imageWidth / 2}" y="${-metrics.imageHeight / 2}" width="${metrics.imageWidth}" height="${metrics.imageHeight}" preserveAspectRatio="none"/></g>${
				isIphone
					? createRoundedRect(
							metrics.bezel +
								(metrics.imageWidth - Math.min(metrics.imageWidth * 0.35, 160)) / 2,
							metrics.frameHeight + Math.max(8, metrics.imageWidth * 0.03),
							Math.min(metrics.imageWidth * 0.35, 160),
							Math.max(24, metrics.imageWidth * 0.08),
							Math.max(24, metrics.imageWidth * 0.08) / 2,
							`fill="#000000"`,
						)
					: ""
			}</g>`

	return `<g opacity="${opacity}" ${blurFilter}>${sideButtons}<clipPath id="${clipId}">${createRoundedRect(
		0,
		0,
		metrics.frameWidth,
		metrics.frameContentHeight,
		metrics.outerRadius,
	)}</clipPath>${createRoundedRect(
		0,
		0,
		metrics.frameWidth,
		metrics.frameContentHeight,
		metrics.outerRadius,
		`fill="${silhouette ? "rgba(15, 23, 42, 0.7)" : containerFill}" ${border} ${frameFilter}`,
	)}${imageElement}</g>`
}

export function normalizeScreenshotMockupState(
	customization: unknown,
	image: ScreenshotImageInput,
	backgroundImage?: ScreenshotImageInput | null,
) {
	const defaults = createDefaultScreenshotMockupState()
	const source = isPlainObject(customization) ? customization : {}
	const state: ScreenshotMockupState = {
		...defaults,
		imageSrc: image.src,
		imageName:
			typeof source.imageName === "string" && source.imageName.trim()
				? source.imageName.slice(0, 120)
				: image.name || defaults.imageName,
	}

	for (const field of BOOLEAN_FIELDS) {
		if (typeof source[field] === "boolean") {
			state[field] = source[field]
		}
	}

	for (const field of STRING_FIELDS) {
		const value = source[field]

		if (typeof value === "string") {
			state[field] = value.slice(0, 500)
		}
	}

	state.solidColor = normalizeColor(source.solidColor, state.solidColor)
	state.backgroundTintColor = normalizeColor(
		source.backgroundTintColor,
		state.backgroundTintColor,
	)
	state.customGradientStart = normalizeColor(
		source.customGradientStart,
		state.customGradientStart,
	)
	state.customGradientEnd = normalizeColor(source.customGradientEnd, state.customGradientEnd)
	state.borderColor = normalizeColor(source.borderColor, state.borderColor)
	state.shadowColor = normalizeColor(source.shadowColor, state.shadowColor)

	for (const [field, limits] of Object.entries(NUMERIC_LIMITS)) {
		state[field as keyof typeof NUMERIC_LIMITS & keyof ScreenshotMockupState] = pickNumber(
			source[field],
			state[field as keyof typeof NUMERIC_LIMITS & keyof ScreenshotMockupState] as number,
			limits[0],
			limits[1],
		) as never
	}

	state.stackCount = Math.round(state.stackCount)
	state.backgroundStyle = pickEnum(
		source.backgroundStyle,
		ENUM_FIELDS.backgroundStyle,
		state.backgroundStyle,
	) as ScreenshotMockupState["backgroundStyle"]
	state.aspectRatio = pickEnum(
		source.aspectRatio,
		ENUM_FIELDS.aspectRatio,
		state.aspectRatio,
	) as ScreenshotMockupState["aspectRatio"]
	state.shadowPreset = pickEnum(
		source.shadowPreset,
		ENUM_FIELDS.shadowPreset,
		state.shadowPreset,
	) as ScreenshotMockupState["shadowPreset"]
	state.frameStyle = pickEnum(
		source.frameStyle,
		ENUM_FIELDS.frameStyle,
		state.frameStyle,
	) as ScreenshotMockupState["frameStyle"]
	state.stackEffect = pickEnum(
		source.stackEffect,
		ENUM_FIELDS.stackEffect,
		state.stackEffect,
	) as ScreenshotMockupState["stackEffect"]

	if (!gradientPresets.some((preset) => preset.id === state.gradientPresetId)) {
		state.gradientPresetId = defaults.gradientPresetId
	}

	if (Array.isArray(source.customGradientStops)) {
		const stops = source.customGradientStops
			.filter(isPlainObject)
			.slice(0, 12)
			.map((stop, index) => ({
				id: typeof stop.id === "string" ? stop.id.slice(0, 80) : `stop-${index}`,
				position: pickNumber(stop.position, index === 0 ? 0 : 100, 0, 100),
				color: normalizeColor(
					stop.color,
					index === 0 ? state.customGradientStart : state.customGradientEnd,
				),
				opacity: pickNumber(stop.opacity, 100, 0, 100),
			}))

		if (stops.length >= 2) {
			state.customGradientStops = stops
		}
	}

	if (backgroundImage) {
		state.backgroundStyle = "image"
		state.backgroundImageSrc = backgroundImage.src
	}

	if (state.backgroundStyle === "image" && !state.backgroundImageSrc) {
		state.backgroundStyle = defaults.backgroundStyle
	}

	return state
}

export function getScreenshotMockupExportSize(
	state: ScreenshotMockupState,
	image: ScreenshotImageInput,
	scale: number,
) {
	const size = getMockupSize(state, image.width, image.height)

	return {
		width: Math.round(size.width * scale),
		height: Math.round(size.height * scale),
	}
}

export function createScreenshotMockupSvg({
	image,
	backgroundImage,
	state,
}: {
	image: ScreenshotImageInput
	backgroundImage?: ScreenshotImageInput | null
	state: ScreenshotMockupState
}) {
	const size = getMockupSize(state, image.width, image.height)
	const metrics = getFrameMetrics(state, image.width, image.height)
	const shadow = getShadowPreset(state, state.shadowPreset)
	const frameX = (size.width - metrics.frameWidth) / 2 + state.positionX
	const frameY = (size.height - metrics.frameContentHeight) / 2 + state.positionY
	const angle = (state.rotation * Math.PI) / 180
	const cos = Math.cos(angle)
	const sin = Math.sin(angle)
	const rotateXScale = Math.max(0.2, Math.cos((state.rotateX * Math.PI) / 180))
	const rotateYScale = Math.max(0.2, Math.cos((state.rotateY * Math.PI) / 180))
	const matrix = `${rotateYScale} ${state.rotateY / 120} ${-state.rotateX / 120} ${rotateXScale} 0 0`
	const defs = [
		state.backgroundStyle === "preset" || state.backgroundStyle === "custom"
			? createLinearGradient(state, "mockup-background")
			: "",
		createShadowFilter("main-frame-shadow", shadow),
		createBlurFilter("background-blur", state.backgroundBlur),
		createBlurFilter("stack-blur", state.stackBlur),
	]
	const background = (() => {
		if (state.backgroundStyle === "transparent") {
			return ""
		}

		if (state.backgroundStyle === "solid") {
			return `<rect width="100%" height="100%" fill="${state.solidColor}"/>`
		}

		if (state.backgroundStyle === "image" && backgroundImage) {
			const tint = rgbaParts(state.backgroundTintColor, state.backgroundTintOpacity / 100)

			return `<image href="${escapeXml(backgroundImage.src)}" x="0" y="0" width="${size.width}" height="${size.height}" preserveAspectRatio="xMidYMid slice" ${
				state.backgroundBlur > 0 ? `filter="url(#background-blur)"` : ""
			}/>${
				state.backgroundTintOpacity > 0
					? `<rect width="100%" height="100%" fill="${tint.color}" opacity="${tint.opacity}"/>`
					: ""
			}`
		}

		return `<rect width="100%" height="100%" fill="url(#mockup-background)"/>`
	})()

	const stack = state.stackEnabled
		? Array.from({ length: Math.max(0, state.stackCount - 1) })
				.map((_, index) => {
					const distance = state.stackCount - 1 - index
					const stackScale = (state.stackScale / 100) ** distance
					const opacity = clamp((state.stackOpacity / 100) * (1 - distance * 0.12), 0, 1)

					return `<g transform="translate(${state.stackOffsetX * distance} ${state.stackOffsetY * distance}) translate(${metrics.frameWidth / 2} ${metrics.frameContentHeight / 2}) scale(${stackScale}) translate(${-metrics.frameWidth / 2} ${-metrics.frameContentHeight / 2})">${createFrame(
						{
							image,
							state,
							metrics,
							idPrefix: `stack-${distance}`,
							shadow: parseRgba("rgba(0, 0, 0, 0)"),
							opacity,
							blur: state.stackBlur,
							silhouette: state.stackEffect === "silhouette",
						},
					)}</g>`
				})
				.join("")
		: ""

	const mainFrame = createFrame({
		image,
		state,
		metrics,
		idPrefix: "main-frame",
		shadow,
	})

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}"><defs>${defs.join("")}</defs>${background}<g transform="translate(${frameX + metrics.frameWidth / 2} ${frameY + metrics.frameContentHeight / 2}) matrix(${cos} ${sin} ${-sin} ${cos} 0 0) matrix(${matrix}) translate(${-metrics.frameWidth / 2} ${-metrics.frameContentHeight / 2})">${stack}${mainFrame}</g></svg>`
}
