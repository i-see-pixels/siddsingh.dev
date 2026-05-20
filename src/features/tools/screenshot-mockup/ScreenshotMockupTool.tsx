"use client"

import {
	type ChangeEvent,
	type ClipboardEvent as ReactClipboardEvent,
	type DragEvent as ReactDragEvent,
	type PointerEvent as ReactPointerEvent,
	startTransition,
	useEffect,
	useEffectEvent,
	useReducer,
	useRef,
	useState,
} from "react"

import {
	CopyIcon,
	CropIcon,
	DownloadIcon,
	FlipHorizontalIcon,
	FlipVerticalIcon,
	ImagePlusIcon,
	LayersIcon,
	MinusIcon,
	Redo2Icon,
	RefreshCcwIcon,
	RotateCcwIcon,
	RotateCwIcon,
	ScanSearchIcon,
	SparklesIcon,
	Undo2Icon,
	UploadIcon,
	ZoomInIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldContent, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ToolWorkspaceSection, ToolWorkspaceShell } from "@/features/tools/ToolWorkspaceShell"
import type { LiveToolEntry } from "@/features/tools/types"
import { cn } from "@/lib/utils"
import {
	DEMO_IMAGE,
	aspectRatioOptions,
	backgroundOptions,
	frameStyleOptions,
	gradientPresets,
	shadowOptions,
} from "./constants"
import { type ControlGroupId, ControlGroupRail } from "./control-groups"
import { CropTool } from "./crop-tool"
import { exportMockupElement } from "./dom-export"
import { ColorField, SelectField, type SelectOption, SliderField } from "./fields"
import { GradientEditor } from "./gradient-editor"
import { MockupRenderer, getCanvasSize, getMetrics } from "./mockup-renderer"
import { DEFAULT_SCREENSHOT_MOCKUP_STATE, screenshotMockupReducer } from "./reducer"
import type {
	AspectRatioOption,
	BackgroundStyle,
	BrowserFrameStyle,
	ExportFormat,
	GradientConfig,
	ScreenshotMockupState,
	ShadowPreset,
	StackEffect,
} from "./types"

type LoadedImageState = {
	image: HTMLImageElement | null
	isLoading: boolean
	error: string | null
}

type LoadedBackgroundState = {
	image: HTMLImageElement | null
	isLoading: boolean
}

type PreviewOffset = {
	x: number
	y: number
}

type PreviewDragState =
	| {
			mode: "pan"
			pointerId: number
			startX: number
			startY: number
			startOffset: PreviewOffset
	  }
	| {
			mode: "move"
			pointerId: number
			startX: number
			startY: number
			startPositionX: number
			startPositionY: number
			startState: ScreenshotMockupState
			hasHistory: boolean
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

function readFileAsDataUrl(file: File) {
	return new Promise<string>((resolve, reject) => {
		const reader = new FileReader()

		reader.onload = () => {
			if (typeof reader.result === "string") {
				resolve(reader.result)
				return
			}

			reject(new Error("Image could not be read."))
		}

		reader.onerror = () => reject(reader.error ?? new Error("Image could not be read."))
		reader.readAsDataURL(file)
	})
}

function sanitizeFilename(value: string) {
	return value
		.toLowerCase()
		.replace(/\.[a-z0-9]+$/i, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
}

function shouldUseAnonymousCrossOrigin(src: string) {
	return /^https?:\/\//i.test(src)
}

function getSingleSelection<T extends string>(value: T[] | string[] | null | undefined) {
	if (!value?.length) {
		return null
	}

	return value[0] as T
}

export function ScreenshotMockupTool({ tool }: { tool: LiveToolEntry }) {
	const [state, dispatch] = useReducer(screenshotMockupReducer, DEFAULT_SCREENSHOT_MOCKUP_STATE)
	const [loadedImage, setLoadedImage] = useState<LoadedImageState>({
		image: null,
		isLoading: true,
		error: null,
	})
	const [loadedBackground, setLoadedBackground] = useState<LoadedBackgroundState>({
		image: null,
		isLoading: false,
	})
	const [isDragging, setIsDragging] = useState(false)
	const [isExporting, setIsExporting] = useState(false)
	const [isCropToolOpen, setIsCropToolOpen] = useState(false)
	const [historyVersion, setHistoryVersion] = useState(0)
	const [activeControlTab, setActiveControlTab] = useState<ControlGroupId>("background")
	const [previewScale, setPreviewScale] = useState<number>(1)
	const [previewFitScale, setPreviewFitScale] = useState<number>(1)
	const [previewOffset, setPreviewOffset] = useState<PreviewOffset>({
		x: 0,
		y: 0,
	})
	const [isPanningPreview, setIsPanningPreview] = useState(false)
	const mockupExportRef = useRef<HTMLDivElement | null>(null)
	const previewViewportRef = useRef<HTMLDivElement | null>(null)
	const previewOffsetLayerRef = useRef<HTMLDivElement | null>(null)
	const fileInputRef = useRef<HTMLInputElement | null>(null)
	const backgroundInputRef = useRef<HTMLInputElement | null>(null)
	const ownedObjectUrlRef = useRef<string | null>(null)
	const historyRef = useRef<{
		past: ScreenshotMockupState[]
		future: ScreenshotMockupState[]
	}>({
		past: [],
		future: [],
	})
	const stateRef = useRef(state)
	const previewOffsetRef = useRef(previewOffset)
	const previewPanFrameRef = useRef<number | null>(null)
	const dragStateRef = useRef<PreviewDragState | null>(null)
	const effectivePreviewScale = Math.min(previewScale, previewFitScale)

	const pushHistorySnapshot = (snapshot: ScreenshotMockupState) => {
		historyRef.current = {
			past: [...historyRef.current.past.slice(-49), snapshot],
			future: [],
		}
		setHistoryVersion((version) => version + 1)
	}

	const pushHistory = () => {
		pushHistorySnapshot(state)
	}

	const replaceImageSource = (nextSrc: string | null, nextName: string, ownsSource: boolean) => {
		if (ownedObjectUrlRef.current) {
			URL.revokeObjectURL(ownedObjectUrlRef.current)
			ownedObjectUrlRef.current = null
		}

		if (ownsSource && nextSrc) {
			ownedObjectUrlRef.current = nextSrc
		}

		pushHistory()
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
		pushHistory()
		startTransition(() => {
			dispatch({
				type: "patch",
				patch,
			})
		})
	}

	const applyStatePatch = (patch: Partial<ScreenshotMockupState>) => {
		startTransition(() => {
			dispatch({
				type: "patch",
				patch,
			})
		})
	}

	const replaceState = (nextState: ScreenshotMockupState) => {
		startTransition(() => {
			dispatch({
				type: "replace",
				state: nextState,
			})
		})
	}

	const handleUndo = () => {
		const previous = historyRef.current.past.at(-1)

		if (!previous) {
			return
		}

		historyRef.current = {
			past: historyRef.current.past.slice(0, -1),
			future: [...historyRef.current.future, state],
		}
		setHistoryVersion((version) => version + 1)
		replaceState(previous)
	}

	const handleRedo = () => {
		const next = historyRef.current.future.at(-1)

		if (!next) {
			return
		}

		historyRef.current = {
			past: [...historyRef.current.past, state],
			future: historyRef.current.future.slice(0, -1),
		}
		setHistoryVersion((version) => version + 1)
		replaceState(next)
	}

	const clampPreviewOffset = (
		nextOffset: PreviewOffset,
		scale: number = effectivePreviewScale,
	): PreviewOffset => {
		const viewport = previewViewportRef.current
		const mockup = mockupExportRef.current

		if (!viewport || !mockup || scale <= 1) {
			return {
				x: 0,
				y: 0,
			}
		}

		const baseWidth = mockup.offsetWidth
		const baseHeight = mockup.offsetHeight
		const maxOffsetX = Math.max(0, (baseWidth * scale - viewport.clientWidth) / 2)
		const maxOffsetY = Math.max(0, (baseHeight * scale - viewport.clientHeight) / 2)

		return {
			x: Math.min(maxOffsetX, Math.max(-maxOffsetX, nextOffset.x)),
			y: Math.min(maxOffsetY, Math.max(-maxOffsetY, nextOffset.y)),
		}
	}

	useEffect(() => {
		const viewport = previewViewportRef.current
		const mockup = mockupExportRef.current

		if (!loadedImage.image || !viewport || !mockup) {
			setPreviewFitScale(1)
			return
		}

		const updatePreviewFitScale = () => {
			const baseWidth = mockup.offsetWidth
			const baseHeight = mockup.offsetHeight
			const availableWidth = Math.max(1, viewport.clientWidth - 32)
			const availableHeight = Math.max(1, viewport.clientHeight - 96)
			const nextScale = Math.min(
				1,
				availableWidth / Math.max(1, baseWidth),
				availableHeight / Math.max(1, baseHeight),
			)

			setPreviewFitScale(Number.isFinite(nextScale) ? nextScale : 1)
		}

		updatePreviewFitScale()

		const resizeObserver = new ResizeObserver(updatePreviewFitScale)
		resizeObserver.observe(viewport)
		resizeObserver.observe(mockup)
		window.addEventListener("resize", updatePreviewFitScale)

		return () => {
			resizeObserver.disconnect()
			window.removeEventListener("resize", updatePreviewFitScale)
		}
	}, [loadedImage.image])

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
		stateRef.current = state
	}, [state])

	useEffect(() => {
		applyPreviewOffset(previewOffset)
	}, [previewOffset])

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
		image.decoding = "async"

		if (shouldUseAnonymousCrossOrigin(state.imageSrc)) {
			image.crossOrigin = "anonymous"
		}

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
		if (!state.backgroundImageSrc) {
			setLoadedBackground({
				image: null,
				isLoading: false,
			})
			return
		}

		let isActive = true
		const image = new Image()
		image.decoding = "async"

		if (shouldUseAnonymousCrossOrigin(state.backgroundImageSrc)) {
			image.crossOrigin = "anonymous"
		}

		setLoadedBackground({
			image: null,
			isLoading: true,
		})

		image.onload = () => {
			if (!isActive) {
				return
			}

			setLoadedBackground({
				image,
				isLoading: false,
			})
		}

		image.onerror = () => {
			if (!isActive) {
				return
			}

			setLoadedBackground({
				image: null,
				isLoading: false,
			})
			toast.error("Background image could not be loaded.")
		}

		image.src = state.backgroundImageSrc

		return () => {
			isActive = false
		}
	}, [state.backgroundImageSrc])

	useEffect(() => {
		if (!loadedImage.image || effectivePreviewScale <= previewFitScale) {
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
	}, [effectivePreviewScale, previewFitScale, state, loadedImage.image])

	useEffect(() => {
		const handlePaste = (event: ClipboardEvent) => {
			handleClipboardItems(event.clipboardData?.items ?? null)
		}

		window.addEventListener("paste", handlePaste)

		return () => {
			window.removeEventListener("paste", handlePaste)
		}
	}, [handleClipboardItems])

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (!(event.ctrlKey || event.metaKey)) {
				return
			}

			if (event.key.toLowerCase() === "z" && event.shiftKey) {
				event.preventDefault()
				handleRedo()
			} else if (event.key.toLowerCase() === "z") {
				event.preventDefault()
				handleUndo()
			}
		}

		window.addEventListener("keydown", handleKeyDown)

		return () => {
			window.removeEventListener("keydown", handleKeyDown)
		}
	}, [state])

	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]

		if (!file) {
			return
		}

		void applyImageFile(file)
		event.target.value = ""
	}

	const handleBackgroundFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]

		if (!file) {
			return
		}

		if (!file.type.startsWith("image/")) {
			toast.error("Only image backgrounds are supported.")
			return
		}

		try {
			const dataUrl = await readFileAsDataUrl(file)
			patchState({
				backgroundStyle: "image",
				backgroundImageSrc: dataUrl,
			})
			toast.success("Background image loaded.")
		} catch (error) {
			console.error(error)
			toast.error("Background image could not be read.")
		} finally {
			event.target.value = ""
		}
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

		pushHistory()
		dispatch({ type: "reset" })
		setPreviewScale(1)
		setPreviewOffset({
			x: 0,
			y: 0,
		})
		toast.success("Defaults restored.")
	}

	const handleCustomGradientChange = (nextGradient: GradientConfig) => {
		const sortedStops = [...nextGradient.stops].sort(
			(firstStop, secondStop) => firstStop.position - secondStop.position,
		)

		patchState({
			gradientAngle: nextGradient.direction,
			customGradientStops: nextGradient.stops,
			customGradientStart: sortedStops[0]?.color ?? state.customGradientStart,
			customGradientEnd: sortedStops.at(-1)?.color ?? state.customGradientEnd,
		})
	}

	const handleCropApply = (croppedImage: string) => {
		setIsCropToolOpen(false)
		replaceImageSource(croppedImage, `${state.imageName}-cropped`, false)
		toast.success("Crop applied.")
	}

	const handleExport = async (format: ExportFormat, scale: number) => {
		if (!loadedImage.image || isExporting) {
			return
		}

		setIsExporting(true)

		try {
			const blob = await exportMockupElement({
				image: loadedImage.image,
				backgroundImage: loadedBackground.image,
				state,
				format,
				scale,
				quality: 0.92,
			})
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

	const handleCopy = async () => {
		if (!loadedImage.image || isExporting) {
			return
		}

		if (!navigator.clipboard || !window.ClipboardItem) {
			toast.error("Image clipboard export is not supported in this browser.")
			return
		}

		setIsExporting(true)

		try {
			const blob = await exportMockupElement({
				image: loadedImage.image,
				backgroundImage: loadedBackground.image,
				state,
				format: "png",
				scale: 2,
			})
			await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
			toast.success("Copied PNG to clipboard.")
		} catch (error) {
			console.error(error)
			toast.error("Copy failed. Try exporting instead.")
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
		if (!loadedImage.image || event.button !== 0) {
			return
		}

		const target = event.target

		if (!(target instanceof HTMLElement) || !target.closest("[data-mockup-export-target]")) {
			return
		}

		event.preventDefault()
		event.currentTarget.setPointerCapture(event.pointerId)

		if (event.altKey && effectivePreviewScale > previewFitScale) {
			dragStateRef.current = {
				mode: "pan",
				pointerId: event.pointerId,
				startX: event.clientX,
				startY: event.clientY,
				startOffset: previewOffsetRef.current,
			}
		} else {
			const currentState = stateRef.current

			dragStateRef.current = {
				mode: "move",
				pointerId: event.pointerId,
				startX: event.clientX,
				startY: event.clientY,
				startPositionX: currentState.positionX,
				startPositionY: currentState.positionY,
				startState: currentState,
				hasHistory: false,
			}
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

		if (dragState.mode === "pan") {
			const nextOffset = clampPreviewOffset({
				x: dragState.startOffset.x + deltaX,
				y: dragState.startOffset.y + deltaY,
			})

			applyPreviewOffset(nextOffset)
			return
		}

		if (!dragState.hasHistory) {
			pushHistorySnapshot(dragState.startState)
			dragStateRef.current = {
				...dragState,
				hasHistory: true,
			}
		}

		let nextX = dragState.startPositionX + deltaX / previewScale
		let nextY = dragState.startPositionY + deltaY / previewScale

		if (loadedImage.image) {
			const metrics = getMetrics(
				dragState.startState,
				loadedImage.image.naturalWidth,
				loadedImage.image.naturalHeight,
			)
			const canvasSize = getCanvasSize(
				dragState.startState,
				loadedImage.image.naturalWidth,
				loadedImage.image.naturalHeight,
			)

			const snapThreshold = 10 / previewScale
			const snapPointsX = [
				0, // Center
				-(canvasSize.width / 2) + metrics.frameWidth / 2, // Left edge
				canvasSize.width / 2 - metrics.frameWidth / 2, // Right edge
			]
			const snapPointsY = [
				0, // Center
				-(canvasSize.height / 2) + metrics.frameContentHeight / 2, // Top edge
				canvasSize.height / 2 - metrics.frameContentHeight / 2, // Bottom edge
			]

			for (const snapPoint of snapPointsX) {
				if (Math.abs(nextX - snapPoint) < snapThreshold) {
					nextX = snapPoint
					break
				}
			}

			for (const snapPoint of snapPointsY) {
				if (Math.abs(nextY - snapPoint) < snapThreshold) {
					nextY = snapPoint
					break
				}
			}
		}

		applyStatePatch({
			positionX: Math.round(nextX),
			positionY: Math.round(nextY),
		})
	}

	const endPreviewPan = (event?: ReactPointerEvent<HTMLDivElement>) => {
		if (event && dragStateRef.current?.pointerId === event.pointerId) {
			event.currentTarget.releasePointerCapture(event.pointerId)
		}

		dragStateRef.current = null
		if (previewOffsetRef.current !== previewOffset) {
			setPreviewOffset(previewOffsetRef.current)
		}
		setIsPanningPreview(false)
	}

	const canUndo = historyVersion >= 0 && historyRef.current.past.length > 0
	const canRedo = historyRef.current.future.length > 0

	const toolbar = (
		<>
			<Badge variant="outline">{state.imageName}</Badge>
			<Button
				type="button"
				variant="outline"
				size="icon-sm"
				onClick={handleUndo}
				disabled={!canUndo}
				aria-label="Undo"
			>
				<Undo2Icon />
			</Button>
			<Button
				type="button"
				variant="outline"
				size="icon-sm"
				onClick={handleRedo}
				disabled={!canRedo}
				aria-label="Redo"
			>
				<Redo2Icon />
			</Button>
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
			<Badge variant="secondary">{Math.round(effectivePreviewScale * 100)}%</Badge>
			<Button
				type="button"
				variant="outline"
				size="icon-sm"
				onClick={() => handleQuickZoom("in")}
				aria-label="Zoom in"
			>
				<ZoomInIcon />
			</Button>
			<Button
				type="button"
				variant="secondary"
				size="sm"
				onClick={handleCopy}
				disabled={!loadedImage.image || isExporting}
			>
				<CopyIcon data-icon="inline-start" />
				Copy
			</Button>
		</>
	)

	const sidebarNavigation = (
		<ControlGroupRail
			activeGroup={activeControlTab}
			onGroupChangeAction={setActiveControlTab}
		/>
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
		<>
			<ToolWorkspaceShell
				tool={tool}
				toolbar={toolbar}
				sidebarNavigation={sidebarNavigation}
				sidebarFooter={sidebarFooter}
				sidebarContent={
					<>
						<input
							ref={fileInputRef}
							type="file"
							accept="image/png,image/jpeg,image/webp"
							className="hidden"
							onChange={handleFileChange}
						/>
						{activeControlTab === "image" ? (
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
															Paste with Ctrl/Cmd + V or drag a
															screenshot straight onto this panel.
														</p>
													</div>
												</div>
												<div className="flex flex-wrap gap-2">
													<Button
														type="button"
														variant="secondary"
														size="sm"
														onClick={() =>
															fileInputRef.current?.click()
														}
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
													<Badge variant="outline">
														{state.imageName}
													</Badge>
													<Badge variant="secondary">
														Client-side only
													</Badge>
												</div>
											</div>
										</FieldContent>
									</Field>
								</FieldGroup>
							</ToolWorkspaceSection>
						) : null}

						{activeControlTab === "background" ? (
							<ToolWorkspaceSection
								title="Background"
								description="Choose a preset, custom gradient, image, solid fill, or transparent export."
							>
								<FieldGroup>
									<Field>
										<FieldLabel>Background mode</FieldLabel>
										<FieldContent>
											<ToggleGroup
												value={[state.backgroundStyle]}
												onValueChange={(nextValue) => {
													const nextStyle =
														getSingleSelection<BackgroundStyle>(
															nextValue,
														)

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

									<input
										ref={backgroundInputRef}
										type="file"
										accept="image/png,image/jpeg,image/webp"
										className="hidden"
										onChange={handleBackgroundFileChange}
									/>

									{state.backgroundStyle === "preset" ? (
										<Field>
											<FieldLabel>Gradient preset</FieldLabel>
											<FieldContent>
												<div className="grid grid-cols-2 gap-2">
													{gradientPresets.map((preset) => (
														<button
															key={preset.id}
															type="button"
															className={cn(
																"flex min-h-12 items-end rounded-lg p-2 text-left text-xs font-medium text-white shadow-sm transition",
																state.gradientPresetId === preset.id
																	? "ring-2 ring-primary/60"
																	: "",
															)}
															style={{
																background: `linear-gradient(${preset.angle}deg, ${preset.start}, ${preset.end})`,
															}}
															onClick={() =>
																patchState({
																	gradientPresetId: preset.id,
																	gradientAngle: preset.angle,
																})
															}
														>
															<span className="rounded bg-black/30 px-1.5 py-0.5">
																{preset.label}
															</span>
														</button>
													))}
												</div>
											</FieldContent>
										</Field>
									) : null}

									{state.backgroundStyle === "custom" ? (
										<GradientEditor
											config={{
												direction: state.gradientAngle,
												stops: state.customGradientStops,
											}}
											onChangeAction={handleCustomGradientChange}
										/>
									) : null}

									{state.backgroundStyle === "solid" ? (
										<ColorField
											id="solid-color"
											label="Solid background"
											value={state.solidColor}
											onChangeAction={(nextValue) =>
												patchState({ solidColor: nextValue })
											}
										/>
									) : null}

									{state.backgroundStyle === "image" ? (
										<>
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => backgroundInputRef.current?.click()}
											>
												<UploadIcon data-icon="inline-start" />
												{state.backgroundImageSrc
													? "Replace background"
													: "Upload background"}
											</Button>
											<div className="grid gap-4 sm:grid-cols-2">
												<ColorField
													id="background-tint"
													label="Tint color"
													value={state.backgroundTintColor}
													onChangeAction={(nextValue) =>
														patchState({
															backgroundTintColor: nextValue,
														})
													}
												/>
												<SliderField
													id="background-tint-opacity"
													label="Tint opacity"
													min={0}
													max={100}
													value={state.backgroundTintOpacity}
													onValueChangeAction={(nextValue) =>
														patchState({
															backgroundTintOpacity: nextValue,
														})
													}
												/>
											</div>
											<SliderField
												id="background-blur"
												label="Background blur"
												min={0}
												max={32}
												value={state.backgroundBlur}
												description={
													loadedBackground.isLoading
														? "Loading background..."
														: undefined
												}
												onValueChangeAction={(nextValue) =>
													patchState({ backgroundBlur: nextValue })
												}
											/>
										</>
									) : null}

									{state.backgroundStyle === "preset" ? (
										<SliderField
											id="gradient-angle"
											label="Gradient angle"
											min={0}
											max={360}
											value={state.gradientAngle}
											description="Controls the direction of the gradient wash."
											onValueChangeAction={(nextValue) =>
												patchState({ gradientAngle: nextValue })
											}
										/>
									) : null}
								</FieldGroup>
							</ToolWorkspaceSection>
						) : null}

						{activeControlTab === "styling" ? (
							<ToolWorkspaceSection
								title="Canvas"
								description="Tune the crop ratio, spacing, rounded corners, and screenshot placement."
							>
								<FieldGroup>
									<SelectField
										id="aspect-ratio"
										label="Canvas ratio"
										value={state.aspectRatio}
										options={
											aspectRatioOptions as SelectOption<AspectRatioOption>[]
										}
										onValueChangeAction={(nextValue) =>
											patchState({ aspectRatio: nextValue })
										}
									/>
									<SliderField
										id="padding-x"
										label="Horizontal padding"
										min={0}
										max={220}
										value={state.paddingX}
										onValueChangeAction={(nextValue) =>
											patchState({ paddingX: nextValue })
										}
									/>
									<SliderField
										id="padding-y"
										label="Vertical padding"
										min={0}
										max={180}
										value={state.paddingY}
										onValueChangeAction={(nextValue) =>
											patchState({ paddingY: nextValue })
										}
									/>
									<SliderField
										id="corner-radius"
										label="Corner radius"
										min={0}
										max={48}
										value={state.cornerRadius}
										onValueChangeAction={(nextValue) =>
											patchState({ cornerRadius: nextValue })
										}
									/>
								</FieldGroup>
							</ToolWorkspaceSection>
						) : null}

						{activeControlTab === "shadow" ? (
							<ToolWorkspaceSection
								title="Shadow"
								description="Pick a preset or build a custom shadow layer."
							>
								<FieldGroup>
									<SelectField
										id="shadow-style"
										label="Shadow preset"
										value={state.shadowPreset}
										options={shadowOptions as SelectOption<ShadowPreset>[]}
										onValueChangeAction={(nextValue) =>
											patchState({ shadowPreset: nextValue })
										}
									/>

									{state.shadowPreset === "custom" ? (
										<>
											<div className="grid gap-4 sm:grid-cols-2">
												<ColorField
													id="shadow-color"
													label="Shadow color"
													value={state.shadowColor}
													onChangeAction={(nextValue) =>
														patchState({ shadowColor: nextValue })
													}
												/>
												<SliderField
													id="shadow-opacity"
													label="Shadow opacity"
													min={0}
													max={100}
													value={state.shadowOpacity}
													onValueChangeAction={(nextValue) =>
														patchState({ shadowOpacity: nextValue })
													}
												/>
											</div>
											<div className="grid gap-4 sm:grid-cols-2">
												<SliderField
													id="shadow-x"
													label="Shadow X"
													min={-80}
													max={80}
													value={state.shadowOffsetX}
													onValueChangeAction={(nextValue) =>
														patchState({ shadowOffsetX: nextValue })
													}
												/>
												<SliderField
													id="shadow-y"
													label="Shadow Y"
													min={-80}
													max={80}
													value={state.shadowOffsetY}
													onValueChangeAction={(nextValue) =>
														patchState({ shadowOffsetY: nextValue })
													}
												/>
											</div>
											<SliderField
												id="shadow-blur"
												label="Shadow blur"
												min={0}
												max={120}
												value={state.shadowBlur}
												onValueChangeAction={(nextValue) =>
													patchState({ shadowBlur: nextValue })
												}
											/>
										</>
									) : null}
								</FieldGroup>
							</ToolWorkspaceSection>
						) : null}

						{activeControlTab === "border" ? (
							<ToolWorkspaceSection
								title="Border"
								description="Add a border around the rendered window or device."
							>
								<FieldGroup>
									<SliderField
										id="border-width"
										label="Border width"
										min={0}
										max={16}
										value={state.borderWidth}
										onValueChangeAction={(nextValue) =>
											patchState({ borderWidth: nextValue })
										}
									/>
									<ColorField
										id="border-color"
										label="Border color"
										value={state.borderColor}
										onChangeAction={(nextValue) =>
											patchState({ borderColor: nextValue })
										}
									/>
								</FieldGroup>
							</ToolWorkspaceSection>
						) : null}

						{activeControlTab === "window" ? (
							<ToolWorkspaceSection
								title="Window"
								description="Choose the frame, theme, and browser address bar."
							>
								<FieldGroup>
									<SelectField
										id="frame-style"
										label="Window frame"
										value={state.frameStyle}
										options={
											frameStyleOptions as SelectOption<BrowserFrameStyle>[]
										}
										onValueChangeAction={(nextValue) =>
											patchState({ frameStyle: nextValue })
										}
									/>

									<Field>
										<FieldLabel>Frame theme</FieldLabel>
										<FieldContent>
											<ToggleGroup
												value={[state.frameDarkMode ? "dark" : "light"]}
												onValueChange={(nextValue) => {
													const nextTheme = getSingleSelection<
														"dark" | "light"
													>(nextValue)

													if (!nextTheme) {
														return
													}

													patchState({
														frameDarkMode: nextTheme === "dark",
													})
												}}
												variant="outline"
												size="sm"
												spacing={1}
												className="w-full"
											>
												<ToggleGroupItem value="dark">Dark</ToggleGroupItem>
												<ToggleGroupItem value="light">
													Light
												</ToggleGroupItem>
											</ToggleGroup>
										</FieldContent>
									</Field>

									{state.frameStyle === "browser" ? (
										<Field>
											<FieldLabel htmlFor="browser-address">
												Address bar
											</FieldLabel>
											<FieldContent>
												<Input
													id="browser-address"
													value={state.address}
													onChange={(event) =>
														patchState({ address: event.target.value })
													}
												/>
											</FieldContent>
										</Field>
									) : null}
								</FieldGroup>
							</ToolWorkspaceSection>
						) : null}

						{activeControlTab === "styling" ? (
							<ToolWorkspaceSection
								title="Transform"
								description="Rotate, scale, and position the screenshot inside the canvas."
							>
								<FieldGroup>
									<SliderField
										id="image-scale"
										label="Image scale"
										min={40}
										max={180}
										value={state.imageScale}
										onValueChangeAction={(nextValue) =>
											patchState({ imageScale: nextValue })
										}
									/>
									<div className="grid gap-4 sm:grid-cols-2">
										<SliderField
											id="position-x"
											label="Position X"
											min={-240}
											max={240}
											value={state.positionX}
											onValueChangeAction={(nextValue) =>
												patchState({ positionX: nextValue })
											}
										/>
										<SliderField
											id="position-y"
											label="Position Y"
											min={-240}
											max={240}
											value={state.positionY}
											onValueChangeAction={(nextValue) =>
												patchState({ positionY: nextValue })
											}
										/>
									</div>
									<SliderField
										id="rotation"
										label="Rotation"
										min={-180}
										max={180}
										value={state.rotation}
										onValueChangeAction={(nextValue) =>
											patchState({ rotation: nextValue })
										}
									/>
									<div className="grid gap-4 sm:grid-cols-2">
										<SliderField
											id="rotate-x"
											label="3D rotate X"
											min={-45}
											max={45}
											value={state.rotateX}
											onValueChangeAction={(nextValue) =>
												patchState({ rotateX: nextValue })
											}
										/>
										<SliderField
											id="rotate-y"
											label="3D rotate Y"
											min={-45}
											max={45}
											value={state.rotateY}
											onValueChangeAction={(nextValue) =>
												patchState({ rotateY: nextValue })
											}
										/>
									</div>
									<div className="grid grid-cols-2 gap-2">
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() =>
												patchState({
													rotation: state.rotation - 5,
												})
											}
										>
											<RotateCcwIcon data-icon="inline-start" />
											Left
										</Button>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() =>
												patchState({
													rotation: state.rotation + 5,
												})
											}
										>
											<RotateCwIcon data-icon="inline-start" />
											Right
										</Button>
									</div>
								</FieldGroup>
							</ToolWorkspaceSection>
						) : null}

						{activeControlTab === "window" ? (
							<ToolWorkspaceSection
								title="Stack"
								description="Layer duplicate windows behind the main screenshot."
							>
								<FieldGroup>
									<Button
										type="button"
										variant={state.stackEnabled ? "secondary" : "outline"}
										size="sm"
										onClick={() =>
											patchState({ stackEnabled: !state.stackEnabled })
										}
									>
										<LayersIcon data-icon="inline-start" />
										{state.stackEnabled ? "Stack enabled" : "Enable stack"}
									</Button>
									<div className="grid gap-4 sm:grid-cols-2">
										<SliderField
											id="stack-count"
											label="Layer count"
											min={2}
											max={6}
											value={state.stackCount}
											onValueChangeAction={(nextValue) =>
												patchState({ stackCount: nextValue })
											}
										/>
										<SelectField
											id="stack-effect"
											label="Layer effect"
											value={state.stackEffect}
											options={
												[
													{ value: "default", label: "Default" },
													{ value: "silhouette", label: "Silhouette" },
												] as SelectOption<StackEffect>[]
											}
											onValueChangeAction={(nextValue) =>
												patchState({ stackEffect: nextValue })
											}
										/>
									</div>
									<div className="grid gap-4 sm:grid-cols-2">
										<SliderField
											id="stack-offset-x"
											label="Offset X"
											min={-80}
											max={80}
											value={state.stackOffsetX}
											onValueChangeAction={(nextValue) =>
												patchState({ stackOffsetX: nextValue })
											}
										/>
										<SliderField
											id="stack-offset-y"
											label="Offset Y"
											min={-80}
											max={80}
											value={state.stackOffsetY}
											onValueChangeAction={(nextValue) =>
												patchState({ stackOffsetY: nextValue })
											}
										/>
									</div>
									<div className="grid gap-4 sm:grid-cols-2">
										<SliderField
											id="stack-scale"
											label="Layer scale"
											min={70}
											max={100}
											value={state.stackScale}
											onValueChangeAction={(nextValue) =>
												patchState({ stackScale: nextValue })
											}
										/>
										<SliderField
											id="stack-opacity"
											label="Layer opacity"
											min={0}
											max={100}
											value={state.stackOpacity}
											onValueChangeAction={(nextValue) =>
												patchState({ stackOpacity: nextValue })
											}
										/>
									</div>
									<SliderField
										id="stack-blur"
										label="Layer blur"
										min={0}
										max={24}
										value={state.stackBlur}
										onValueChangeAction={(nextValue) =>
											patchState({ stackBlur: nextValue })
										}
									/>
								</FieldGroup>
							</ToolWorkspaceSection>
						) : null}

						{activeControlTab === "export" ? (
							<ToolWorkspaceSection
								title="Export"
								description="Use PNG for transparency. JPG fills transparent backgrounds with a light canvas."
							>
								<div className="grid gap-2 sm:grid-cols-2">
									<Button
										type="button"
										variant="secondary"
										size="sm"
										onClick={handleCopy}
										disabled={!loadedImage.image || isExporting}
										className="col-span-2"
									>
										<CopyIcon data-icon="inline-start" />
										Copy PNG
									</Button>
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
						) : null}
					</>
				}
			>
				<div
					className="relative h-[calc(100dvh-69px)] overflow-hidden"
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
									<p className="text-sm text-muted-foreground">
										PNG, JPG, or WebP
									</p>
								</div>
							</div>
						</div>
					) : null}
					{loadedImage.image ? (
						<div className="flex h-full min-h-0 flex-col items-center">
							<div
								ref={previewViewportRef}
								className={cn(
									"flex h-full min-h-0 w-full items-center justify-center overflow-hidden bg-background/80 px-4 pt-16 pb-8 touch-none",
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
										style={{ transform: `scale(${effectivePreviewScale})` }}
									>
										<div className="relative inline-flex shadow-xl">
											<TooltipProvider>
												<div
													className="absolute top-0 left-1/2 z-10 flex items-center gap-1 rounded-full border border-border/70 bg-background/95 p-1 shadow-lg backdrop-blur"
													style={{
														transform: `translate(-50%, calc(-100% - ${
															8 / effectivePreviewScale
														}px)) scale(${1 / effectivePreviewScale})`,
														transformOrigin: "bottom center",
													}}
												>
													<Tooltip>
														<TooltipTrigger
															render={
																<Button
																	type="button"
																	variant="ghost"
																	size="icon-sm"
																	onClick={() =>
																		setIsCropToolOpen(true)
																	}
																	disabled={!loadedImage.image}
																	aria-label="Crop screenshot"
																>
																	<CropIcon />
																</Button>
															}
														/>
														<TooltipContent>
															Crop screenshot
														</TooltipContent>
													</Tooltip>
													<Tooltip>
														<TooltipTrigger
															render={
																<Button
																	type="button"
																	variant={
																		state.flipX
																			? "secondary"
																			: "ghost"
																	}
																	size="icon-sm"
																	onClick={() =>
																		patchState({
																			flipX: !state.flipX,
																		})
																	}
																	aria-label="Flip horizontally"
																>
																	<FlipHorizontalIcon />
																</Button>
															}
														/>
														<TooltipContent>
															Flip horizontally
														</TooltipContent>
													</Tooltip>
													<Tooltip>
														<TooltipTrigger
															render={
																<Button
																	type="button"
																	variant={
																		state.flipY
																			? "secondary"
																			: "ghost"
																	}
																	size="icon-sm"
																	onClick={() =>
																		patchState({
																			flipY: !state.flipY,
																		})
																	}
																	aria-label="Flip vertically"
																>
																	<FlipVerticalIcon />
																</Button>
															}
														/>
														<TooltipContent>
															Flip vertically
														</TooltipContent>
													</Tooltip>
												</div>
											</TooltipProvider>
											<MockupRenderer
												ref={mockupExportRef}
												state={state}
												imageWidth={loadedImage.image.naturalWidth}
												imageHeight={loadedImage.image.naturalHeight}
												className={cn(
													"h-auto max-w-full touch-none",
													isPanningPreview
														? "cursor-grabbing"
														: "cursor-move",
												)}
											/>
										</div>
									</div>
								</div>
							</div>
						</div>
					) : (
						<div className="flex h-full w-full items-center justify-center">
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
				</div>
			</ToolWorkspaceShell>
			{isCropToolOpen && state.imageSrc ? (
				<CropTool
					imageSrc={state.imageSrc}
					initialRatio={state.aspectRatio}
					onApplyAction={handleCropApply}
					onCancelAction={() => setIsCropToolOpen(false)}
				/>
			) : null}
		</>
	)
}
