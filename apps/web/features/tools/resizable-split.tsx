"use client"

import { cn } from "@workspace/ui/lib/utils"
import {
	type CSSProperties,
	type KeyboardEvent,
	type PointerEvent,
	type ReactNode,
	useRef,
	useState,
} from "react"

const MIN = 20
const MAX = 80
const STEP = 5

const clamp = (value: number) => Math.min(MAX, Math.max(MIN, value))

/**
 * Two panes with a draggable divider on desktop. On phones the panes stack at
 * fixed heights and the divider is hidden. The desktop height is the viewport
 * minus the 3.5rem workspace header, so neither pane grows with its content.
 */
export function ResizableSplit({ left, right }: { left: ReactNode; right: ReactNode }) {
	const [percent, setPercent] = useState(50)
	const containerRef = useRef<HTMLDivElement>(null)

	const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
		event.currentTarget.setPointerCapture(event.pointerId)
	}

	const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
		if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
		const rect = containerRef.current?.getBoundingClientRect()
		if (!rect) return
		setPercent(clamp(((event.clientX - rect.left) / rect.width) * 100))
	}

	const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (event.key === "ArrowLeft") setPercent((value) => clamp(value - STEP))
		else if (event.key === "ArrowRight") setPercent((value) => clamp(value + STEP))
		else if (event.key === "Home") setPercent(MIN)
		else if (event.key === "End") setPercent(MAX)
		else return
		event.preventDefault()
	}

	return (
		<div
			ref={containerRef}
			className="flex flex-1 flex-col lg:grid lg:h-[calc(100svh-3.5rem)] lg:flex-none lg:grid-cols-[var(--split)_0.5rem_minmax(0,1fr)]"
			style={{ "--split": `${percent}%` } as CSSProperties}
		>
			<div className="h-80 min-h-0 min-w-0 overflow-hidden max-lg:border-b max-lg:border-line lg:h-auto">
				{left}
			</div>
			{/* biome-ignore lint/a11y/useSemanticElements: a focusable window splitter, which <hr> cannot be */}
			<div
				role="separator"
				aria-orientation="vertical"
				aria-label="Resize panes"
				aria-valuemin={MIN}
				aria-valuemax={MAX}
				aria-valuenow={Math.round(percent)}
				tabIndex={0}
				onPointerDown={onPointerDown}
				onPointerMove={onPointerMove}
				onKeyDown={onKeyDown}
				onDoubleClick={() => setPercent(50)}
				className={cn(
					"group relative hidden cursor-col-resize touch-none select-none lg:block",
					"border-x border-line bg-background transition-colors hover:bg-accent-muted",
					"focus-visible:bg-accent-muted focus-visible:outline-none",
				)}
			>
				<span className="absolute top-1/2 left-1/2 h-8 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-muted-foreground/40 transition-colors group-hover:bg-brand group-focus-visible:bg-brand" />
			</div>
			<div className="h-[70svh] min-h-0 min-w-0 overflow-hidden lg:h-auto">{right}</div>
		</div>
	)
}
