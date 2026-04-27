"use client"

import {
	type ChangeEvent,
	type ClipboardEvent as ReactClipboardEvent,
	type DragEvent as ReactDragEvent,
	type PointerEvent as ReactPointerEvent,
	startTransition,
	useDeferredValue,
	useEffect,
	useEffectEvent,
	useReducer,
	useRef,
	useState,
} from "react"

import {
	DownloadIcon,
	ExpandIcon,
	ImagePlusIcon,
	MinusIcon,
	RefreshCcwIcon,
	ScanSearchIcon,
	SparklesIcon,
	UploadIcon,
	ZoomInIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ToolWorkspaceSection, ToolWorkspaceShell } from "@/features/tools/ToolWorkspaceShell"
import type { LiveToolEntry } from "@/features/tools/types"
import { cn } from "@/lib/utils"
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
import type {
	AspectRatioOption,
	BackgroundStyle,
	BrowserFrameStyle,
	ExportFormat,
	ScreenshotMockupState,
	ShadowPreset,
} from "./types"

type LoadedImageState = {
	image: HTMLImageElement | null
	previewImage: HTMLCanvasElement | null
	isLoading: boolean
	error: string | null
}

type PreviewOffset = {
	x: number
	y: number
}

const ZOOM_LEVELS = [0.75, 1, 1.25, 1.5, 2] as const

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

function getSingleValue(value: number | readonly number[]) {
	return Array.isArray(value) ? (value[0] ?? 0) : value
}

function getSingleSelection<T extends string>(value: T[] | string[] | null | undefined) {
	if (!value?.length) {
		return null
	}

	return value[0] as T
}

type SelectOption<T extends string> = {
	value: T
	label: string
}

type SelectFieldProps<T extends string> = {
	id: string
	label: string
	value: T
	options: SelectOption<T>[]
	description?: string
	onValueChange: (value: T) => void
}

function SelectField<T extends string>({
	id,
	label,
	value,
	options,
	description,
	onValueChange,
}: SelectFieldProps<T>) {
	return (
		<Field>
			<FieldLabel htmlFor={id}>{label}</FieldLabel>
			<FieldContent>
				<Select
					items={options}
					value={value}
					onValueChange={(nextValue) => {
						if (typeof nextValue === "string") {
							onValueChange(nextValue as T)
						}
					}}
				>
					<SelectTrigger id={id} className="w-full" aria-label={label}>
						<SelectValue placeholder={label} />
					</SelectTrigger>
					<SelectContent align="start">
						<SelectGroup>
							{options.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
				{description ? <FieldDescription>{description}</FieldDescription> : null}
			</FieldContent>
		</Field>
	)
}

type SliderFieldProps = {
	id: string
	label: string
	value: number
	min: number
	max: number
	step?: number
	description?: string
	onValueChange: (value: number) => void
}

function SliderField({
	id,
	label,
	value,
	min,
	max,
	step = 1,
	description,
	onValueChange,
}: SliderFieldProps) {
	const [localValue, setLocalValue] = useState(value)
	const pendingValueRef = useRef(value)
	const animationFrameRef = useRef<number | null>(null)

	useEffect(() => {
		setLocalValue(value)
		pendingValueRef.current = value
	}, [value])

	useEffect(() => {
		return () => {
			if (animationFrameRef.current !== null) {
				cancelAnimationFrame(animationFrameRef.current)
			}
		}
	}, [])

	const handleValueChange = (nextValue: number) => {
		pendingValueRef.current = nextValue
		setLocalValue(nextValue)

		if (animationFrameRef.current !== null) {
			return
		}

		animationFrameRef.current = requestAnimationFrame(() => {
			animationFrameRef.current = null
			onValueChange(pendingValueRef.current)
		})
	}

	return (
		<Field>
			<div className="flex items-center justify-between gap-3">
				<FieldLabel htmlFor={id}>{label}</FieldLabel>
				<Badge variant="outline">{localValue}</Badge>
			</div>
			<FieldContent>
				<Slider
					id={id}
					min={min}
					max={max}
					step={step}
					value={localValue}
					onValueChange={(nextValue) => handleValueChange(getSingleValue(nextValue))}
				/>
				{description ? <FieldDescription>{description}</FieldDescription> : null}
			</FieldContent>
		</Field>
	)
}

type ColorFieldProps = {
	id: string
	label: string
	value: string
	description?: string
	onChange: (value: string) => void
}

function ColorField({ id, label, value, description, onChange }: ColorFieldProps) {
	return (
		<Field>
			<FieldLabel htmlFor={id}>{label}</FieldLabel>
			<FieldContent>
				<div className="flex items-center gap-3 rounded-lg border border-input bg-background px-3 py-2">
					<Input
						id={id}
						type="color"
						value={value}
						onChange={(event) => onChange(event.target.value)}
						className=""
					/>
					<div className="min-w-0">
						<p className="text-sm font-medium uppercase text-foreground">{value}</p>
					</div>
				</div>
				{description ? <FieldDescription>{description}</FieldDescription> : null}
			</FieldContent>
		</Field>
	)
}

export function ScreenshotMockupTool({ tool }: { tool: LiveToolEntry }) {
	const [state, dispatch] = useReducer(screenshotMockupReducer, DEFAULT_SCREENSHOT_MOCKUP_STATE)
	const deferredState = useDeferredValue(state)
	const [loadedImage, setLoadedImage] = useState<LoadedImageState>({
		image: null,
		previewImage: null,
		isLoading: true,
		error: null,
	})
	const [isDragging, setIsDragging] = useState(false)
	const [isExporting, setIsExporting] = useState(false)
	const [previewScale, setPreviewScale] = useState<number>(1)
	const [previewOffset, setPreviewOffset] = useState<PreviewOffset>({
		x: 0,
		y: 0,
	})
	const [isPanningPreview, setIsPanningPreview] = useState(false)
	const previewCanvasRef = useRef<HTMLCanvasElement | null>(null)
	const previewViewportRef = useRef<HTMLDivElement | null>(null)
	const previewOffsetLayerRef = useRef<HTMLDivElement | null>(null)
	const fileInputRef = useRef<HTMLInputElement | null>(null)
	const ownedObjectUrlRef = useRef<string | null>(null)
	const previewOffsetRef = useRef(previewOffset)
	const previewPanFrameRef = useRef<number | null>(null)
	const dragStateRef = useRef<{
		pointerId: number
		startX: number
		startY: number
		startOffset: PreviewOffset
	} | null>(null)

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

		setPreviewOffset({
			x: 0,
			y: 0,
		})
	}

	const patchState = (patch: Partial<ScreenshotMockupState>) => {
		startTransition(() => {
			dispatch({
				type: "patch",
				patch,
			})
		})
	}

	const clampPreviewOffset = (
		nextOffset: PreviewOffset,
		scale: number = previewScale,
	): PreviewOffset => {
		const viewport = previewViewportRef.current
		const canvas = previewCanvasRef.current

		if (!viewport || !canvas || scale <= 1) {
			return {
				x: 0,
				y: 0,
			}
		}

		const baseWidth = canvas.offsetWidth || canvas.width
		const baseHeight = canvas.offsetHeight || canvas.height
		const maxOffsetX = Math.max(0, (baseWidth * scale - viewport.clientWidth) / 2)
		const maxOffsetY = Math.max(0, (baseHeight * scale - viewport.clientHeight) / 2)

		return {
			x: Math.min(maxOffsetX, Math.max(-maxOffsetX, nextOffset.x)),
			y: Math.min(maxOffsetY, Math.max(-maxOffsetY, nextOffset.y)),
		}
	}

	const applyPreviewOffset = (nextOffset: PreviewOffset) => {
		previewOffsetRef.current = nextOffset

		if (previewPanFrameRef.current !== null) {
			return
		}

		previewPanFrameRef.current = requestAnimationFrame(() => {
			previewPanFrameRef.current = null
			const layer = previewOffsetLayerRef.current

			if (!layer) {
				return
			}

			const offset = previewOffsetRef.current
			layer.style.transform = `translate3d(${offset.x}px, ${offset.y}px, 0)`
		})
	}

	const applyImageFile = useEffectEvent(async (file: File) => {
		if (!file.type.startsWith("image/")) {
			toast.error("Only PNG, JPG, or WebP images are supported.")
			return
		}

		const objectUrl = URL.createObjectURL(file)
		replaceImageSource(objectUrl, file.name, true)
		toast.success("Screenshot loaded.")
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

			if (previewPanFrameRef.current !== null) {
				cancelAnimationFrame(previewPanFrameRef.current)
			}
		}
	}, [])

	useEffect(() => {
		applyPreviewOffset(previewOffset)
	}, [previewOffset])

	useEffect(() => {
		if (!state.imageSrc) {
			setLoadedImage({
				image: null,
				previewImage: null,
				isLoading: false,
				error: "Upload or paste a screenshot to start styling it.",
			})
			return
		}

		let isActive = true
		const image = new Image()

		setLoadedImage({
			image: null,
			previewImage: null,
			isLoading: true,
			error: null,
		})

		image.onload = () => {
			if (!isActive) {
				return
			}

			const maxContentWidth = 1040
			const maxContentHeight = 780
			const imageScale = Math.min(
				maxContentWidth / image.naturalWidth,
				maxContentHeight / image.naturalHeight,
				1.15,
			)
			const previewWidth = Math.max(220, image.naturalWidth * imageScale)
			const previewHeight = Math.max(140, image.naturalHeight * imageScale)

			const previewCanvas = document.createElement("canvas")
			previewCanvas.width = previewWidth
			previewCanvas.height = previewHeight
			const pCtx = previewCanvas.getContext("2d")

			if (pCtx) {
				pCtx.drawImage(image, 0, 0, previewWidth, previewHeight)
			}

			startTransition(() => {
				setLoadedImage({
					image,
					previewImage: previewCanvas,
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
				previewImage: null,
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

		const previewImage = loadedImage.previewImage
		if (!previewImage) {
			const context = canvas.getContext("2d")
			context?.clearRect(0, 0, canvas.width, canvas.height)
			return
		}

		const render = () => {
			renderMockupCanvas({
				canvas,
				image: previewImage,
				state: deferredState,
				scale: 1,
				format: "png",
			})
		}

		const animationFrameId = requestAnimationFrame(render)

		return () => {
			cancelAnimationFrame(animationFrameId)
		}
	}, [deferredState, loadedImage.previewImage])

	useEffect(() => {
		if (!loadedImage.image || previewScale <= 1) {
			setPreviewOffset((currentOffset) =>
				currentOffset.x === 0 && currentOffset.y === 0
					? currentOffset
					: {
							x: 0,
							y: 0,
						},
			)
			return
		}

		setPreviewOffset((currentOffset) => {
			const nextOffset = clampPreviewOffset(currentOffset)

			if (nextOffset.x === currentOffset.x && nextOffset.y === currentOffset.y) {
				return currentOffset
			}

			return nextOffset
		})
	}, [previewScale, deferredState, loadedImage.image])

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
		setPreviewScale(1)
		setPreviewOffset({
			x: 0,
			y: 0,
		})
		toast.success("Defaults restored.")
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

			toast.success(`Exported ${format.toUpperCase()} at ${scale}x.`)
		} catch (error) {
			console.error(error)
			toast.error("Export failed. Try again with a different screenshot.")
		} finally {
			setIsExporting(false)
		}
	}

	const handleQuickZoom = (direction: "in" | "out") => {
		const currentIndex = ZOOM_LEVELS.findIndex((level) => level === previewScale)
		const safeIndex = currentIndex === -1 ? 1 : currentIndex
		const nextIndex =
			direction === "in"
				? Math.min(ZOOM_LEVELS.length - 1, safeIndex + 1)
				: Math.max(0, safeIndex - 1)

		setPreviewScale(ZOOM_LEVELS[nextIndex])
	}

	const handlePreviewPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
		if (!loadedImage.image || previewScale <= 1) {
			return
		}

		event.preventDefault()
		event.currentTarget.setPointerCapture(event.pointerId)
		dragStateRef.current = {
			pointerId: event.pointerId,
			startX: event.clientX,
			startY: event.clientY,
			startOffset: previewOffsetRef.current,
		}
		setIsPanningPreview(true)
	}

	const handlePreviewPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
		const dragState = dragStateRef.current

		if (!dragState || dragState.pointerId !== event.pointerId) {
			return
		}

		event.preventDefault()
		const deltaX = event.clientX - dragState.startX
		const deltaY = event.clientY - dragState.startY
		const nextOffset = clampPreviewOffset({
			x: dragState.startOffset.x + deltaX,
			y: dragState.startOffset.y + deltaY,
		})

		applyPreviewOffset(nextOffset)
	}

	const endPreviewPan = (event?: ReactPointerEvent<HTMLDivElement>) => {
		if (event && dragStateRef.current?.pointerId === event.pointerId) {
			event.currentTarget.releasePointerCapture(event.pointerId)
		}

		dragStateRef.current = null
		setPreviewOffset(previewOffsetRef.current)
		setIsPanningPreview(false)
	}

	const toolbar = (
		<>
			<Badge variant="outline">{state.imageName}</Badge>
			<Button
				type="button"
				variant="outline"
				size="sm"
				onClick={() => {
					setPreviewScale(1)
					setPreviewOffset({
						x: 0,
						y: 0,
					})
				}}
			>
				<ScanSearchIcon data-icon="inline-start" />
				Fit
			</Button>
			<Button
				type="button"
				variant="outline"
				size="icon-sm"
				onClick={() => handleQuickZoom("out")}
				aria-label="Zoom out"
			>
				<MinusIcon />
			</Button>
			<Badge variant="secondary">{Math.round(previewScale * 100)}%</Badge>
			<Button
				type="button"
				variant="outline"
				size="icon-sm"
				onClick={() => handleQuickZoom("in")}
				aria-label="Zoom in"
			>
				<ZoomInIcon />
			</Button>
		</>
	)

	const sidebarFooter = (
		<div className="flex flex-col gap-2">
			<div className="grid grid-cols-2 gap-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => replaceImageSource(DEMO_IMAGE.src, DEMO_IMAGE.name, false)}
				>
					<SparklesIcon data-icon="inline-start" />
					Demo
				</Button>
				<Button type="button" variant="outline" size="sm" onClick={handleReset}>
					<RefreshCcwIcon data-icon="inline-start" />
					Reset
				</Button>
			</div>
			<Button
				type="button"
				onClick={() => void handleExport("png", 2)}
				disabled={!loadedImage.image || isExporting}
			>
				<DownloadIcon data-icon="inline-start" />
				Quick export PNG 2x
			</Button>
		</div>
	)

	return (
		<ToolWorkspaceShell
			tool={tool}
			toolbar={toolbar}
			sidebarFooter={sidebarFooter}
			sidebarContent={
				<>
					<ToolWorkspaceSection
						title="Image"
						description="Drop, upload, or paste a screenshot to start styling."
					>
						<FieldGroup>
							<Field>
								<FieldContent>
									<div
										className={cn(
											"flex flex-col gap-4 rounded-xl border border-dashed border-border bg-muted/30 p-4 transition-colors",
											isDragging && "border-primary bg-primary/5",
										)}
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
									>
										<div className="flex items-start gap-3">
											<div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground">
												<ImagePlusIcon />
											</div>
											<div className="min-w-0">
												<p className="text-sm font-medium">
													PNG, JPG, and WebP supported
												</p>
												<p className="text-xs leading-relaxed text-muted-foreground">
													Paste with Ctrl/Cmd + V or drag a screenshot
													straight onto this panel.
												</p>
											</div>
										</div>
										<div className="flex flex-wrap gap-2">
											<Button
												type="button"
												variant="secondary"
												size="sm"
												onClick={() => fileInputRef.current?.click()}
											>
												<UploadIcon data-icon="inline-start" />
												Upload
											</Button>
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() =>
													replaceImageSource(
														DEMO_IMAGE.src,
														DEMO_IMAGE.name,
														false,
													)
												}
											>
												<SparklesIcon data-icon="inline-start" />
												Use demo image
											</Button>
										</div>
										<div className="flex flex-wrap items-center gap-2">
											<Badge variant="outline">{state.imageName}</Badge>
											<Badge variant="secondary">Client-side only</Badge>
										</div>
									</div>
									<input
										ref={fileInputRef}
										type="file"
										accept="image/png,image/jpeg,image/webp"
										className="hidden"
										onChange={handleFileChange}
									/>
								</FieldContent>
							</Field>
						</FieldGroup>
					</ToolWorkspaceSection>

					<ToolWorkspaceSection
						title="Background"
						description="Choose a transparent export, a flat solid, or a layered gradient."
					>
						<FieldGroup>
							<Field>
								<FieldLabel>Background mode</FieldLabel>
								<FieldContent>
									<ToggleGroup
										value={[state.backgroundStyle]}
										onValueChange={(nextValue) => {
											const nextStyle =
												getSingleSelection<BackgroundStyle>(nextValue)

											if (!nextStyle) {
												return
											}

											patchState({ backgroundStyle: nextStyle })
										}}
										variant="outline"
										size="sm"
										spacing={1}
										className="w-full flex-wrap"
									>
										{backgroundOptions.map((option) => (
											<ToggleGroupItem
												key={option.value}
												value={option.value}
											>
												{option.label}
											</ToggleGroupItem>
										))}
									</ToggleGroup>
								</FieldContent>
							</Field>

							{state.backgroundStyle === "preset" ? (
								<SelectField
									id="gradient-preset"
									label="Gradient preset"
									value={state.gradientPresetId}
									options={gradientPresets.map((preset) => ({
										label: preset.label,
										value: preset.id,
									}))}
									onValueChange={(nextValue) =>
										patchState({ gradientPresetId: nextValue })
									}
								/>
							) : null}

							{state.backgroundStyle === "custom" ? (
								<div className="grid gap-4 sm:grid-cols-2">
									<ColorField
										id="custom-start"
										label="Gradient start"
										value={state.customGradientStart}
										onChange={(nextValue) =>
											patchState({ customGradientStart: nextValue })
										}
									/>
									<ColorField
										id="custom-end"
										label="Gradient end"
										value={state.customGradientEnd}
										onChange={(nextValue) =>
											patchState({ customGradientEnd: nextValue })
										}
									/>
								</div>
							) : null}

							{state.backgroundStyle === "solid" ? (
								<ColorField
									id="solid-color"
									label="Solid background"
									value={state.solidColor}
									onChange={(nextValue) => patchState({ solidColor: nextValue })}
								/>
							) : null}

							{state.backgroundStyle !== "solid" &&
							state.backgroundStyle !== "transparent" ? (
								<SliderField
									id="gradient-angle"
									label="Gradient angle"
									min={0}
									max={360}
									value={state.gradientAngle}
									description="Controls the direction of the gradient wash."
									onValueChange={(nextValue) =>
										patchState({ gradientAngle: nextValue })
									}
								/>
							) : null}
						</FieldGroup>
					</ToolWorkspaceSection>

					<ToolWorkspaceSection
						title="Layout"
						description="Tune the frame, spacing, crop ratio, corners, and shadow."
					>
						<FieldGroup>
							<div className="grid gap-4 sm:grid-cols-2">
								<SelectField
									id="aspect-ratio"
									label="Canvas ratio"
									value={state.aspectRatio}
									options={
										aspectRatioOptions as SelectOption<AspectRatioOption>[]
									}
									onValueChange={(nextValue) =>
										patchState({ aspectRatio: nextValue })
									}
								/>
								<SelectField
									id="frame-style"
									label="Browser frame"
									value={state.frameStyle}
									options={frameStyleOptions as SelectOption<BrowserFrameStyle>[]}
									onValueChange={(nextValue) =>
										patchState({ frameStyle: nextValue })
									}
								/>
							</div>

							<SelectField
								id="shadow-style"
								label="Shadow preset"
								value={state.shadowPreset}
								options={shadowOptions as SelectOption<ShadowPreset>[]}
								onValueChange={(nextValue) =>
									patchState({ shadowPreset: nextValue })
								}
							/>

							<SliderField
								id="padding-x"
								label="Horizontal padding"
								min={0}
								max={220}
								value={state.paddingX}
								onValueChange={(nextValue) => patchState({ paddingX: nextValue })}
							/>
							<SliderField
								id="padding-y"
								label="Vertical padding"
								min={0}
								max={180}
								value={state.paddingY}
								onValueChange={(nextValue) => patchState({ paddingY: nextValue })}
							/>
							<SliderField
								id="corner-radius"
								label="Corner radius"
								min={0}
								max={48}
								value={state.cornerRadius}
								onValueChange={(nextValue) =>
									patchState({ cornerRadius: nextValue })
								}
							/>
						</FieldGroup>
					</ToolWorkspaceSection>

					<ToolWorkspaceSection
						title="Export"
						description="Use PNG for transparency. JPG fills transparent backgrounds with a light canvas."
					>
						<div className="grid gap-2 sm:grid-cols-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => void handleExport("png", 1)}
								disabled={!loadedImage.image || isExporting}
							>
								<DownloadIcon data-icon="inline-start" />
								PNG 1x
							</Button>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => void handleExport("png", 2)}
								disabled={!loadedImage.image || isExporting}
							>
								<DownloadIcon data-icon="inline-start" />
								PNG 2x
							</Button>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => void handleExport("jpg", 1)}
								disabled={!loadedImage.image || isExporting}
							>
								<DownloadIcon data-icon="inline-start" />
								JPG 1x
							</Button>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => void handleExport("jpg", 2)}
								disabled={!loadedImage.image || isExporting}
							>
								<DownloadIcon data-icon="inline-start" />
								JPG 2x
							</Button>
						</div>
					</ToolWorkspaceSection>
				</>
			}
		>
			<div
				onDragEnter={(event) => {
					event.preventDefault()
					setIsDragging(true)
				}}
				onDragOver={(event) => event.preventDefault()}
			>
				{isDragging ? (
					<div
						className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
						onDragLeave={(event) => {
							event.preventDefault()
							setIsDragging(false)
						}}
						onDragOver={(event) => event.preventDefault()}
						onDrop={handleDrop}
					>
						<div className="pointer-events-none flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-primary bg-background p-8 text-center shadow-lg">
							<div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
								<ImagePlusIcon className="size-8" />
							</div>
							<div>
								<p className="text-lg font-semibold">Drop image here</p>
								<p className="text-sm text-muted-foreground">PNG, JPG, or WebP</p>
							</div>
						</div>
					</div>
				) : null}
				<ScrollArea className="min-h-0">
					{loadedImage.image ? (
						<div className="flex flex-col items-center gap-4">
							<div
								ref={previewViewportRef}
								className={cn(
									"flex min-h-80 w-full items-center justify-center overflow-hidden border border-border/60 bg-background/80 p-4",
									previewScale > 1 ? "cursor-grab touch-none" : "cursor-default",
									isPanningPreview && "cursor-grabbing",
								)}
								onPointerDown={handlePreviewPointerDown}
								onPointerMove={handlePreviewPointerMove}
								onPointerUp={endPreviewPan}
								onPointerCancel={endPreviewPan}
							>
								<div
									ref={previewOffsetLayerRef}
									className={cn(
										"will-change-transform",
										!isPanningPreview && "transition-transform duration-200",
									)}
									style={{
										transform: `translate3d(${previewOffset.x}px, ${previewOffset.y}px, 0)`,
									}}
								>
									<div
										className={cn(
											"origin-center will-change-transform",
											!isPanningPreview &&
												"transition-transform duration-200",
										)}
										style={{ transform: `scale(${previewScale})` }}
									>
										<canvas
											ref={previewCanvasRef}
											className="h-auto max-w-full border border-border/60 bg-background shadow-xl"
										/>
									</div>
								</div>
							</div>
							<div className="flex items-center justify-center gap-2 text-xs text-muted-foreground px-10">
								<ExpandIcon className="size-3" />
								<span>
									Preview zoom is UI-only and does not affect exports. Drag to pan
									when zoomed in past 100%.
								</span>
							</div>
						</div>
					) : (
						<div className="flex w-full h-[calc(100dvh-69px)] items-center justify-center">
							<div className="flex max-w-lg flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-background px-8 py-10 text-center shadow-sm">
								<div className="flex size-12 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground">
									{loadedImage.isLoading ? <SparklesIcon /> : <ImagePlusIcon />}
								</div>
								<div className="space-y-2">
									<p className="text-lg font-semibold">
										{loadedImage.isLoading
											? "Loading preview..."
											: "Add a screenshot"}
									</p>
									<p className="text-sm leading-relaxed text-muted-foreground">
										{loadedImage.error}
									</p>
								</div>
								<div className="flex flex-wrap justify-center gap-2">
									<Button
										type="button"
										variant="secondary"
										onClick={() => fileInputRef.current?.click()}
									>
										<UploadIcon data-icon="inline-start" />
										Upload screenshot
									</Button>
									<Button
										type="button"
										variant="outline"
										onClick={() =>
											replaceImageSource(
												DEMO_IMAGE.src,
												DEMO_IMAGE.name,
												false,
											)
										}
									>
										<SparklesIcon data-icon="inline-start" />
										Use demo image
									</Button>
								</div>
							</div>
						</div>
					)}
				</ScrollArea>
			</div>
		</ToolWorkspaceShell>
	)
}
