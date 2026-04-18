"use client"

import {
	type ChangeEvent,
	type ClipboardEvent as ReactClipboardEvent,
	type DragEvent as ReactDragEvent,
	startTransition,
	useDeferredValue,
	useEffect,
	useEffectEvent,
	useReducer,
	useRef,
	useState,
} from "react"

import {
	Button,
	ColorInput,
	Heading,
	SegmentedControl,
	Select,
	Slider,
	Text,
	useToast,
} from "@once-ui-system/core"

import styles from "./ScreenshotMockupTool.module.scss"
import { renderMockupCanvas } from "./canvas"
import {
	DEMO_IMAGE,
	aspectRatioOptions,
	backgroundOptions,
	frameStyleOptions,
	gradientPresets,
	shadowOptions,
} from "./constants"
import { DEFAULT_SCREENSHOT_MOCKUP_STATE, screenshotMockupReducer } from "./reducer"
import type { ExportFormat } from "./types"

type LoadedImageState = {
	image: HTMLImageElement | null
	isLoading: boolean
	error: string | null
}

function extractImageFile(items: DataTransferItemList | null) {
	if (!items) {
		return null
	}

	for (const item of Array.from(items)) {
		if (item.kind === "file") {
			const file = item.getAsFile()

			if (file?.type.startsWith("image/")) {
				return file
			}
		}
	}

	return null
}

function toBlob(canvas: HTMLCanvasElement, mimeType: string, quality?: number) {
	return new Promise<Blob>((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (!blob) {
					reject(new Error("Export failed."))
					return
				}

				resolve(blob)
			},
			mimeType,
			quality,
		)
	})
}

function sanitizeFilename(value: string) {
	return value
		.toLowerCase()
		.replace(/\.[a-z0-9]+$/i, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
}

export function ScreenshotMockupTool() {
	const [state, dispatch] = useReducer(screenshotMockupReducer, DEFAULT_SCREENSHOT_MOCKUP_STATE)
	const deferredState = useDeferredValue(state)
	const [loadedImage, setLoadedImage] = useState<LoadedImageState>({
		image: null,
		isLoading: true,
		error: null,
	})
	const [isDragging, setIsDragging] = useState(false)
	const [isExporting, setIsExporting] = useState(false)
	const previewCanvasRef = useRef<HTMLCanvasElement | null>(null)
	const fileInputRef = useRef<HTMLInputElement | null>(null)
	const ownedObjectUrlRef = useRef<string | null>(null)
	const { addToast } = useToast()

	const replaceImageSource = (nextSrc: string | null, nextName: string, ownsSource: boolean) => {
		if (ownedObjectUrlRef.current) {
			URL.revokeObjectURL(ownedObjectUrlRef.current)
			ownedObjectUrlRef.current = null
		}

		if (ownsSource && nextSrc) {
			ownedObjectUrlRef.current = nextSrc
		}

		startTransition(() => {
			dispatch({
				type: "set-image-source",
				imageSrc: nextSrc,
				imageName: nextName,
			})
		})
	}

	const applyImageFile = useEffectEvent(async (file: File) => {
		if (!file.type.startsWith("image/")) {
			addToast({
				variant: "danger",
				message: "Only PNG, JPG, or WebP images are supported.",
			})
			return
		}

		const objectUrl = URL.createObjectURL(file)
		replaceImageSource(objectUrl, file.name, true)
		addToast({
			variant: "success",
			message: "Screenshot loaded.",
		})
	})

	const handleClipboardItems = useEffectEvent((items: DataTransferItemList | null) => {
		const imageFile = extractImageFile(items)

		if (!imageFile) {
			return
		}

		void applyImageFile(imageFile)
	})

	useEffect(() => {
		return () => {
			if (ownedObjectUrlRef.current) {
				URL.revokeObjectURL(ownedObjectUrlRef.current)
			}
		}
	}, [])

	useEffect(() => {
		if (!state.imageSrc) {
			setLoadedImage({
				image: null,
				isLoading: false,
				error: "Upload or paste a screenshot to start styling it.",
			})
			return
		}

		let isActive = true
		const image = new Image()

		setLoadedImage({
			image: null,
			isLoading: true,
			error: null,
		})

		image.onload = () => {
			if (!isActive) {
				return
			}

			startTransition(() => {
				setLoadedImage({
					image,
					isLoading: false,
					error: null,
				})
			})
		}

		image.onerror = () => {
			if (!isActive) {
				return
			}

			setLoadedImage({
				image: null,
				isLoading: false,
				error: "That image could not be loaded. Try another screenshot.",
			})
		}

		image.src = state.imageSrc

		return () => {
			isActive = false
		}
	}, [state.imageSrc])

	useEffect(() => {
		const canvas = previewCanvasRef.current

		if (!canvas) {
			return
		}

		if (!loadedImage.image) {
			const context = canvas.getContext("2d")
			context?.clearRect(0, 0, canvas.width, canvas.height)
			return
		}

		renderMockupCanvas({
			canvas,
			image: loadedImage.image,
			state: deferredState,
			scale: 1,
			format: "png",
		})
	}, [deferredState, loadedImage.image])

	useEffect(() => {
		const handlePaste = (event: ClipboardEvent) => {
			handleClipboardItems(event.clipboardData?.items ?? null)
		}

		window.addEventListener("paste", handlePaste)

		return () => {
			window.removeEventListener("paste", handlePaste)
		}
	}, [handleClipboardItems])

	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]

		if (!file) {
			return
		}

		void applyImageFile(file)
		event.target.value = ""
	}

	const handleDrop = (event: ReactDragEvent<HTMLDivElement>) => {
		event.preventDefault()
		setIsDragging(false)

		const file = event.dataTransfer.files?.[0]

		if (!file) {
			return
		}

		void applyImageFile(file)
	}

	const handlePaste = (event: ReactClipboardEvent<HTMLDivElement>) => {
		handleClipboardItems(event.clipboardData.items)
	}

	const handleReset = () => {
		if (ownedObjectUrlRef.current) {
			URL.revokeObjectURL(ownedObjectUrlRef.current)
			ownedObjectUrlRef.current = null
		}

		dispatch({ type: "reset" })
		addToast({
			variant: "success",
			message: "Defaults restored.",
		})
	}

	const handleExport = async (format: ExportFormat, scale: number) => {
		if (!loadedImage.image || isExporting) {
			return
		}

		setIsExporting(true)

		try {
			const canvas = document.createElement("canvas")
			renderMockupCanvas({
				canvas,
				image: loadedImage.image,
				state,
				scale,
				format,
			})

			const mimeType = format === "png" ? "image/png" : "image/jpeg"
			const blob = await toBlob(canvas, mimeType, format === "jpg" ? 0.92 : undefined)
			const link = document.createElement("a")
			const objectUrl = URL.createObjectURL(blob)
			const fileBase = sanitizeFilename(state.imageName || "screenshot-mockup")

			link.href = objectUrl
			link.download = `${fileBase || "screenshot-mockup"}-${scale}x.${format}`
			link.click()
			URL.revokeObjectURL(objectUrl)

			addToast({
				variant: "success",
				message: `Exported ${format.toUpperCase()} at ${scale}x.`,
			})
		} catch (error) {
			console.error(error)
			addToast({
				variant: "danger",
				message: "Export failed. Try again with a different screenshot.",
			})
		} finally {
			setIsExporting(false)
		}
	}

	return (
		<section className={styles.toolLayout}>
			<div className={styles.previewPanel}>
				<div className={styles.previewMeta}>
					<div className={styles.statusRow}>
						<span className={styles.statusPill}>Live preview</span>
						<span className={styles.metaPill}>{state.imageName}</span>
					</div>
					<span className={styles.hintPill}>Paste with Ctrl/Cmd + V</span>
				</div>

				<div className={styles.previewStage}>
					{loadedImage.image ? (
						<canvas ref={previewCanvasRef} className={styles.previewCanvas} />
					) : (
						<div className={styles.emptyState}>
							<Heading as="h3" variant="heading-strong-m">
								{loadedImage.isLoading ? "Loading preview..." : "Add a screenshot"}
							</Heading>
							<Text marginTop="12" onBackground="neutral-weak">
								{loadedImage.error}
							</Text>
						</div>
					)}
				</div>

				<Text className={styles.hintText}>
					The preview updates as you tune the background, padding, browser frame, corners,
					and shadow. Exports are generated client-side from the same canvas composition.
				</Text>
			</div>

			<div className={styles.controlsPanel}>
				<div className={styles.controlsContent}>
					<div className={styles.section}>
						<div className={styles.sectionHeader}>
							<Text variant="label-default-m" onBackground="brand-weak">
								Image input
							</Text>
							<Heading as="h2" variant="heading-strong-m">
								Drop, upload, or paste a screenshot
							</Heading>
						</div>
						<div
							className={`${styles.dropzone} ${isDragging ? styles.dragActive : ""}`}
							onDragEnter={(event) => {
								event.preventDefault()
								setIsDragging(true)
							}}
							onDragLeave={(event) => {
								event.preventDefault()
								setIsDragging(false)
							}}
							onDragOver={(event) => event.preventDefault()}
							onDrop={handleDrop}
							onPaste={handlePaste}
							// tabIndex={0}
						>
							<Text onBackground="neutral-weak">
								Supports PNG, JPG, and WebP. You can also paste directly from the
								clipboard while this page is focused.
							</Text>
							<div className={styles.buttonRow}>
								<Button
									variant="secondary"
									size="m"
									prefixIcon="openLink"
									onClick={() => fileInputRef.current?.click()}
								>
									Upload screenshot
								</Button>
								<Button
									variant="secondary"
									size="m"
									onClick={() =>
										replaceImageSource(DEMO_IMAGE.src, DEMO_IMAGE.name, false)
									}
								>
									Use demo image
								</Button>
								<Button variant="secondary" size="m" onClick={handleReset}>
									Reset defaults
								</Button>
							</div>
						</div>
						<input
							ref={fileInputRef}
							type="file"
							accept="image/png,image/jpeg,image/webp"
							className={styles.hiddenInput}
							onChange={handleFileChange}
						/>
					</div>

					<div className={styles.section}>
						<div className={styles.sectionHeader}>
							<Text variant="label-default-m" onBackground="brand-weak">
								Background
							</Text>
							<Text className={styles.hintText}>
								Choose a transparent export, a flat solid, or a layered gradient.
							</Text>
						</div>
						<SegmentedControl
							buttons={backgroundOptions.map((opt) => ({
								label: opt.label,
								value: opt.value,
							}))}
							selected={state.backgroundStyle}
							onToggle={(value) =>
								dispatch({
									type: "patch",
									patch: {
										backgroundStyle: value as typeof state.backgroundStyle,
									},
								})
							}
							fillWidth
						/>

						{state.backgroundStyle === "preset" && (
							<Select
								id="gradient-preset"
								label="Gradient preset"
								options={gradientPresets.map((preset) => ({
									label: preset.label,
									value: preset.id,
								}))}
								value={state.gradientPresetId}
								onSelect={(value) =>
									dispatch({
										type: "patch",
										patch: { gradientPresetId: value },
									})
								}
							/>
						)}

						{state.backgroundStyle === "custom" && (
							<div className={styles.gridFields}>
								<ColorInput
									id="custom-start"
									label="Gradient start"
									value={state.customGradientStart}
									onChange={(event) =>
										dispatch({
											type: "patch",
											patch: { customGradientStart: event.target.value },
										})
									}
								/>
								<ColorInput
									id="custom-end"
									label="Gradient end"
									value={state.customGradientEnd}
									onChange={(event) =>
										dispatch({
											type: "patch",
											patch: { customGradientEnd: event.target.value },
										})
									}
								/>
							</div>
						)}

						{state.backgroundStyle === "solid" && (
							<ColorInput
								id="solid-color"
								label="Solid background"
								value={state.solidColor}
								onChange={(event) =>
									dispatch({
										type: "patch",
										patch: { solidColor: event.target.value },
									})
								}
							/>
						)}

						{state.backgroundStyle !== "solid" &&
							state.backgroundStyle !== "transparent" && (
								<Slider
									id="gradient-angle"
									label="Gradient angle (deg)"
									min={0}
									max={360}
									value={state.gradientAngle}
									onChange={(value) =>
										dispatch({
											type: "patch",
											patch: { gradientAngle: value },
										})
									}
									showValue
								/>
							)}
					</div>

					<div className={styles.section}>
						<div className={styles.sectionHeader}>
							<Text variant="label-default-m" onBackground="brand-weak">
								Layout and style
							</Text>
						</div>

						<div className={styles.gridFields}>
							<Select
								id="aspect-ratio"
								label="Canvas ratio"
								options={aspectRatioOptions}
								value={state.aspectRatio}
								onSelect={(value) =>
									dispatch({
										type: "patch",
										patch: { aspectRatio: value as typeof state.aspectRatio },
									})
								}
							/>
							<Select
								id="frame-style"
								label="Browser frame"
								options={frameStyleOptions}
								value={state.frameStyle}
								onSelect={(value) =>
									dispatch({
										type: "patch",
										patch: { frameStyle: value as typeof state.frameStyle },
									})
								}
							/>
							<Select
								id="shadow-style"
								label="Shadow preset"
								options={shadowOptions}
								value={state.shadowPreset}
								onSelect={(value) =>
									dispatch({
										type: "patch",
										patch: { shadowPreset: value as typeof state.shadowPreset },
									})
								}
							/>
						</div>

						<Slider
							id="padding-x"
							label="Horizontal padding (px)"
							min={0}
							max={220}
							value={state.paddingX}
							onChange={(value) =>
								dispatch({
									type: "patch",
									patch: { paddingX: value },
								})
							}
							showValue
						/>

						<Slider
							id="padding-y"
							label="Vertical padding (px)"
							min={0}
							max={180}
							value={state.paddingY}
							onChange={(value) =>
								dispatch({
									type: "patch",
									patch: { paddingY: value },
								})
							}
							showValue
						/>

						<Slider
							id="corner-radius"
							label="Corner radius (px)"
							min={0}
							max={48}
							value={state.cornerRadius}
							onChange={(value) =>
								dispatch({
									type: "patch",
									patch: { cornerRadius: value },
								})
							}
							showValue
						/>
					</div>

					<div className={styles.section}>
						<div className={styles.sectionHeader}>
							<Text variant="label-default-m" onBackground="brand-weak">
								Export
							</Text>
							<Text className={styles.hintText}>
								Use PNG when you want transparency. JPG fills transparent
								backgrounds with a light canvas so social posts still look clean.
							</Text>
						</div>
						<div className={styles.exportGrid}>
							<Button
								variant="secondary"
								size="m"
								onClick={() => void handleExport("png", 1)}
								disabled={!loadedImage.image || isExporting}
								fillWidth
							>
								PNG export - 1x
							</Button>
							<Button
								variant="secondary"
								size="m"
								onClick={() => void handleExport("png", 2)}
								disabled={!loadedImage.image || isExporting}
								fillWidth
							>
								PNG export - 2x
							</Button>
							<Button
								variant="secondary"
								size="m"
								onClick={() => void handleExport("jpg", 1)}
								disabled={!loadedImage.image || isExporting}
								fillWidth
							>
								JPG export - 1x
							</Button>
							<Button
								variant="secondary"
								size="m"
								onClick={() => void handleExport("jpg", 2)}
								disabled={!loadedImage.image || isExporting}
								fillWidth
							>
								JPG export - 2x
							</Button>
						</div>
					</div>
				</div>
			</div>
		</section>
	)
}
