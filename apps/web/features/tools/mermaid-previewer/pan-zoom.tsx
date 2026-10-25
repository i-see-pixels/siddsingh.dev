"use client"

import { cn } from "@workspace/ui/lib/utils"
import {
	type PointerEvent,
	type Ref,
	useCallback,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from "react"

type View = { x: number; y: number; scale: number }

export type PanZoomHandle = {
	zoomBy: (factor: number) => void
	fit: () => void
	scale: number
}

const MIN_SCALE = 0.1
const MAX_SCALE = 4
const FIT_PADDING_X = 48
/** Extra room top and bottom for the floating export and zoom controls. */
const FIT_PADDING_Y = 120

/** Natural size of a Mermaid SVG, read from its viewBox. */
export function naturalSize(svg: string) {
	const match = svg.match(/viewBox="[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)"/)
	return match ? { width: Number(match[1]), height: Number(match[2]) } : null
}

/**
 * A fixed viewport the diagram is panned and zoomed inside. Drag to pan, wheel
 * to pan, Ctrl/Cmd + wheel (or a trackpad pinch) to zoom. The diagram never
 * changes the size of the viewport.
 */
export function PanZoom({
	svg,
	fitKey,
	onScaleChange,
	controlRef,
}: {
	svg: string
	/** Increments when the view should be re-fitted, e.g. a new example was loaded. */
	fitKey: number
	onScaleChange: (scale: number) => void
	controlRef: Ref<PanZoomHandle>
}) {
	const viewportRef = useRef<HTMLDivElement>(null)
	const [view, setView] = useState<View>({ x: 0, y: 0, scale: 1 })
	const [dragging, setDragging] = useState(false)
	const drag = useRef({ x: 0, y: 0, originX: 0, originY: 0 })
	const size = naturalSize(svg)
	const viewRef = useRef(view)
	viewRef.current = view
	const needsFit = useRef(true)

	const fit = useCallback(() => {
		const viewport = viewportRef.current
		const natural = naturalSize(svg)
		if (!viewport || !natural) return
		const { width, height } = viewport.getBoundingClientRect()
		const scale = Math.min(
			1,
			(width - FIT_PADDING_X) / natural.width,
			(height - FIT_PADDING_Y) / natural.height,
		)
		setView({
			scale,
			x: (width - natural.width * scale) / 2,
			y: (height - natural.height * scale) / 2,
		})
	}, [svg])

	/** Zoom while keeping the point (cx, cy), in viewport pixels, fixed on screen. */
	const zoomAt = useCallback((factor: number, cx: number, cy: number) => {
		setView((current) => {
			const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, current.scale * factor))
			const ratio = scale / current.scale
			return { scale, x: cx - (cx - current.x) * ratio, y: cy - (cy - current.y) * ratio }
		})
	}, [])

	useImperativeHandle(
		controlRef,
		() => ({
			zoomBy: (factor) => {
				const rect = viewportRef.current?.getBoundingClientRect()
				if (rect) zoomAt(factor, rect.width / 2, rect.height / 2)
			},
			fit,
			get scale() {
				return viewRef.current.scale
			},
		}),
		[fit, zoomAt],
	)

	// Fit the first diagram, and any diagram after a new example is loaded.
	useEffect(() => {
		needsFit.current = true
	}, [fitKey])

	useEffect(() => {
		if (svg && needsFit.current) {
			needsFit.current = false
			fit()
		}
	}, [svg, fit])

	useEffect(() => {
		onScaleChange(view.scale)
	}, [view.scale, onScaleChange])

	// React's onWheel is passive, so the zoom gesture needs a native listener.
	useEffect(() => {
		const viewport = viewportRef.current
		if (!viewport) return
		const onWheel = (event: WheelEvent) => {
			event.preventDefault()
			const rect = viewport.getBoundingClientRect()
			if (event.ctrlKey || event.metaKey) {
				zoomAt(
					Math.exp(-event.deltaY * 0.01),
					event.clientX - rect.left,
					event.clientY - rect.top,
				)
			} else {
				setView((current) => ({
					...current,
					x: current.x - event.deltaX,
					y: current.y - event.deltaY,
				}))
			}
		}
		viewport.addEventListener("wheel", onWheel, { passive: false })
		return () => viewport.removeEventListener("wheel", onWheel)
	}, [zoomAt])

	const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
		if (event.button !== 0) return
		event.currentTarget.setPointerCapture(event.pointerId)
		drag.current = {
			x: event.clientX,
			y: event.clientY,
			originX: viewRef.current.x,
			originY: viewRef.current.y,
		}
		setDragging(true)
	}

	const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
		if (!dragging) return
		const { x, y, originX, originY } = drag.current
		setView((current) => ({
			...current,
			x: originX + event.clientX - x,
			y: originY + event.clientY - y,
		}))
	}

	return (
		<div
			ref={viewportRef}
			role="img"
			aria-label="Diagram preview. Drag to pan, Ctrl and scroll to zoom."
			className={cn(
				"dot-grid relative size-full touch-none overflow-hidden select-none",
				dragging ? "cursor-grabbing" : "cursor-grab",
			)}
			onPointerDown={onPointerDown}
			onPointerMove={onPointerMove}
			onPointerUp={() => setDragging(false)}
			onPointerCancel={() => setDragging(false)}
		>
			{svg ? (
				<div
					className="absolute top-0 left-0"
					style={{
						transform: `translate(${view.x}px, ${view.y}px)`,
					}}
				>
					<div
						className="[&_svg]:size-full [&_svg]:max-w-none!"
						style={
							size
								? {
										width: size.width * view.scale,
										height: size.height * view.scale,
									}
								: undefined
						}
						// The caller passes Mermaid output cleaned by sanitizeSvg.
						// biome-ignore lint/security/noDangerouslySetInnerHtml: sanitised mermaid output
						dangerouslySetInnerHTML={{ __html: svg }}
					/>
				</div>
			) : (
				<p className="p-4 text-sm text-muted-foreground">Your diagram appears here.</p>
			)}
		</div>
	)
}
