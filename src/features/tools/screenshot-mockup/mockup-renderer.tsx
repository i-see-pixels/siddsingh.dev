"use client"

import { forwardRef } from "react"

import { CopyIcon, MinusIcon, XIcon } from "lucide-react"
import { gradientPresets } from "./constants"
import type { ScreenshotMockupState, ShadowPreset } from "./types"

type MockupRendererProps = {
	state: ScreenshotMockupState
	imageWidth: number
	imageHeight: number
	className?: string
}

type Metrics = {
	imageWidth: number
	imageHeight: number
	frameWidth: number
	frameHeight: number
	frameContentHeight: number
	outerRadius: number
	bezel: number
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

function getMetrics(
	state: ScreenshotMockupState,
	sourceWidth: number,
	sourceHeight: number,
	imageScalePercent = state.imageScale,
): Metrics {
	const maxContentWidth = 1040
	const maxContentHeight = 780
	const imageFitScale = Math.min(
		maxContentWidth / sourceWidth,
		maxContentHeight / sourceHeight,
		1.15,
	)
	const imageScale = imageFitScale * (imageScalePercent / 100)
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

function getCanvasSize(state: ScreenshotMockupState, sourceWidth: number, sourceHeight: number) {
	const metrics = getMetrics(state, sourceWidth, sourceHeight, 100)
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

function getBackgroundStyle(state: ScreenshotMockupState) {
	if (state.backgroundStyle === "transparent") {
		return undefined
	}

	if (state.backgroundStyle === "solid") {
		return state.solidColor
	}

	if (state.backgroundStyle === "image") {
		return undefined
	}

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
		const cssStops = stops
			.map((stop) => `${rgba(stop.color, stop.opacity / 100)} ${stop.position}%`)
			.join(", ")

		return `linear-gradient(${state.gradientAngle}deg, ${cssStops})`
	}

	const preset = gradientPresets.find((item) => item.id === state.gradientPresetId)

	return `linear-gradient(${state.gradientAngle ?? preset?.angle ?? 135}deg, ${
		preset?.start ?? "#a8edea"
	}, ${preset?.end ?? "#fed6e3"})`
}

function getShadow(state: ScreenshotMockupState, shadowPreset: ShadowPreset) {
	switch (shadowPreset) {
		case "lifted":
			return "10px 24px 28px rgba(15, 23, 42, 0.44)"
		case "float":
			return "20px 32px 38px rgba(15, 23, 42, 0.5)"
		case "custom":
			return `${state.shadowOffsetX}px ${state.shadowOffsetY}px ${state.shadowBlur}px ${rgba(
				state.shadowColor,
				state.shadowOpacity / 100,
			)}`
		case "none":
			return "none"
		default:
			return "0 20px 32px rgba(15, 23, 42, 0.28)"
	}
}

function BrowserChrome({
	state,
	width,
	height,
}: { state: ScreenshotMockupState; width: number; height: number }) {
	if (state.frameStyle === "none" || state.frameStyle === "iphone") {
		return null
	}

	const dark = state.frameDarkMode
	const dotColors: Array<{ id: string; color: string }> =
		state.frameStyle === "macos-unified"
			? [
					{ id: "unified-close", color: "#a8a8a8" },
					{ id: "unified-minimize", color: "#a8a8a8" },
					{ id: "unified-zoom", color: "#a8a8a8" },
				]
			: [
					{ id: "close", color: "#ff5f57" },
					{ id: "minimize", color: "#febc2e" },
					{ id: "zoom", color: "#28c840" },
				]

	if (state.frameStyle === "windows") {
		return (
			<div
				className="flex items-center justify-end border-b"
				style={{
					height,
					backgroundColor: dark ? "#2d2d2d" : "#f3f4f6",
					color: dark ? "#fff" : "#000",
					borderColor: dark ? "rgba(255,255,255,0.11)" : "rgba(15,23,42,0.1)",
				}}
			>
				<div className="flex h-full items-center">
					<span className="flex h-full w-11 items-center justify-center"><MinusIcon className="size-4"/></span>
					<span className="flex h-full w-11 items-center justify-center"><CopyIcon className="transform -scale-x-100 size-4"/></span>
					<span className="flex h-full w-11 items-center justify-center"><XIcon className="size-4"/></span>
				</div>
			</div>
		)
	}

	return (
		<div
			className="flex items-center border-b px-5"
			style={{
				width,
				height,
				backgroundColor: dark ? "#2d2d2d" : "#f3f4f6",
				borderColor: dark ? "rgba(255,255,255,0.11)" : "rgba(15,23,42,0.1)",
			}}
		>
			<div className="flex items-center gap-1.5">
				{dotColors.map((dot) => (
					<span
						key={dot.id}
						className="size-2.5 rounded-full"
						style={{ backgroundColor: dot.color }}
					/>
				))}
			</div>
			{state.frameStyle === "browser" ? (
				<div
					className="ml-6 flex h-5 min-w-40 flex-1 items-center truncate rounded-md px-3 text-[11px]"
					style={{
						backgroundColor: dark ? "#1e1e1e" : "#ffffff",
						color: dark ? "rgba(255,255,255,0.58)" : "rgba(15,23,42,0.64)",
					}}
				>
					{state.address || "https://example.com"}
				</div>
			) : null}
		</div>
	)
}

function Frame({
	state,
	metrics,
	opacity = 1,
	blur = 0,
	silhouette = false,
}: {
	state: ScreenshotMockupState
	metrics: Metrics
	opacity?: number
	blur?: number
	silhouette?: boolean
}) {
	const isIphone = state.frameStyle === "iphone"
	const containerFill = state.frameDarkMode || isIphone ? "#111827" : "#ffffff"
	const imageX = isIphone ? metrics.bezel : 0
	const imageY = metrics.frameHeight

	return (
		<div
			className="relative overflow-visible"
			style={{
				width: metrics.frameWidth,
				height: metrics.frameContentHeight,
				opacity,
				filter: blur ? `blur(${blur}px)` : undefined,
			}}
		>
			<div
				className="relative overflow-hidden"
				style={{
					width: metrics.frameWidth,
					height: metrics.frameContentHeight,
					backgroundColor: silhouette ? "rgba(15, 23, 42, 0.7)" : containerFill,
					borderRadius: metrics.outerRadius,
					border:
						state.borderWidth > 0
							? `${state.borderWidth}px solid ${state.borderColor}`
							: undefined,
					boxSizing: "border-box",
				}}
			>
				{silhouette ? null : (
					<>
						<BrowserChrome
							state={state}
							width={metrics.frameWidth}
							height={metrics.frameHeight}
						/>
						<div
							className="absolute overflow-hidden"
							style={{
								left: imageX,
								top: imageY,
								width: metrics.imageWidth,
								height: metrics.imageHeight,
								borderRadius: isIphone ? state.cornerRadius : 0,
							}}
						>
							<img
								src={state.imageSrc ?? ""}
								alt="Screenshot"
								className="block size-full object-fill"
								draggable={false}
								style={{
									transform: `scaleX(${state.flipX ? -1 : 1}) scaleY(${
										state.flipY ? -1 : 1
									})`,
								}}
							/>
						</div>
						{isIphone ? (
							<div
								className="absolute left-1/2 rounded-full bg-black"
								style={{
									top:
										metrics.frameHeight +
										Math.max(8, metrics.imageWidth * 0.03),
									width: Math.min(metrics.imageWidth * 0.35, 160),
									height: Math.max(24, metrics.imageWidth * 0.08),
									transform: "translateX(-50%)",
								}}
							/>
						) : null}
					</>
				)}
			</div>
		</div>
	)
}

export const MockupRenderer = forwardRef<HTMLDivElement, MockupRendererProps>(
	({ state, imageWidth, imageHeight, className }, ref) => {
		const metrics = getMetrics(state, imageWidth, imageHeight)
		const canvasSize = getCanvasSize(state, imageWidth, imageHeight)
		const has3D = state.rotateX !== 0 || state.rotateY !== 0
		const background = getBackgroundStyle(state)
		const shadow = getShadow(state, state.shadowPreset)

		return (
			<div
				ref={ref}
				data-mockup-export-target="true"
				className={className}
				style={{
					position: "relative",
					width: canvasSize.width,
					height: canvasSize.height,
					overflow: "hidden",
					background,
					perspective: has3D ? "1000px" : undefined,
					transformStyle: has3D ? "preserve-3d" : undefined,
					touchAction: "none",
				}}
			>
				{state.backgroundStyle === "image" && state.backgroundImageSrc ? (
					<div
						className="absolute inset-0"
						style={{
							background: `url("${state.backgroundImageSrc}") center / cover no-repeat`,
							filter:
								state.backgroundBlur > 0
									? `blur(${state.backgroundBlur}px)`
									: undefined,
							inset: state.backgroundBlur > 0 ? -state.backgroundBlur : 0,
						}}
					/>
				) : null}
				{state.backgroundStyle === "image" && state.backgroundTintOpacity > 0 ? (
					<div
						className="absolute inset-0"
						style={{
							backgroundColor: state.backgroundTintColor,
							opacity: state.backgroundTintOpacity / 100,
						}}
					/>
				) : null}
				<div
					className="absolute"
					style={{
						left: `calc(50% + ${state.positionX}px)`,
						top: `calc(50% + ${state.positionY}px)`,
						width: metrics.frameWidth,
						height: metrics.frameContentHeight,
						transform: `translate(-50%, -50%) rotate(${state.rotation}deg)${
							has3D
								? ` rotateX(${state.rotateX}deg) rotateY(${state.rotateY}deg)`
								: ""
						}`,
						transformOrigin: "center center",
						transformStyle: has3D ? "preserve-3d" : undefined,
					}}
				>
					{state.stackEnabled
						? Array.from({ length: state.stackCount - 1 }).map((_, index) => {
								const distance = state.stackCount - 1 - index
								const scale = (state.stackScale / 100) ** distance
								const opacity = Math.max(
									0,
									Math.min(1, (state.stackOpacity / 100) * (1 - distance * 0.12)),
								)

								return (
									<div
										key={distance}
										className="pointer-events-none absolute inset-0"
										style={{
											transform: `translate(${state.stackOffsetX * distance}px, ${
												state.stackOffsetY * distance
											}px) scale(${scale})`,
											transformOrigin: "center center",
										}}
									>
										<Frame
											state={state}
											metrics={metrics}
											opacity={opacity}
											blur={state.stackBlur}
											silhouette={state.stackEffect === "silhouette"}
										/>
									</div>
								)
							})
						: null}
					<div
						className="relative"
						style={{
							width: metrics.frameWidth,
							height: metrics.frameContentHeight,
							boxShadow: shadow,
							borderRadius: metrics.outerRadius,
						}}
					>
						<Frame state={state} metrics={metrics} />
					</div>
				</div>
			</div>
		)
	},
)

MockupRenderer.displayName = "MockupRenderer"
