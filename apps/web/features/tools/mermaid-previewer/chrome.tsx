"use client"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import {
	DownloadIcon,
	HandIcon,
	ImageDownIcon,
	MaximizeIcon,
	MinusIcon,
	PlusIcon,
} from "lucide-react"
import { Pill } from "../tool-chrome"

/** The diagram kind, read from the first keyword of the code. */
export function diagramKind(code: string) {
	const first = code
		.split("\n")
		.map((line) => line.trim())
		.find((line) => line && !line.startsWith("%%"))
	const word = first?.split(/[\s{]/)[0]?.toLowerCase()
	const kinds: Record<string, string> = {
		flowchart: "Flowchart",
		graph: "Flowchart",
		sequencediagram: "Sequence",
		erdiagram: "ER diagram",
		statediagram: "State",
		"statediagram-v2": "State",
		classdiagram: "Class",
		gantt: "Gantt",
		pie: "Pie",
		journey: "Journey",
		mindmap: "Mind map",
		timeline: "Timeline",
		gitgraph: "Git graph",
		quadrantchart: "Quadrant",
		requirementdiagram: "Requirement",
		c4context: "C4",
		sankey: "Sankey",
		"xychart-beta": "XY chart",
	}
	return word ? kinds[word] : undefined
}

const pillButton = "rounded-full"

export function ZoomPill({
	scale,
	disabled,
	onZoomIn,
	onZoomOut,
	onFit,
}: {
	scale: number
	disabled: boolean
	onZoomIn: () => void
	onZoomOut: () => void
	onFit: () => void
}) {
	return (
		<Pill>
			<Button
				size="icon-sm"
				variant="ghost"
				className={pillButton}
				aria-label="Zoom out"
				title="Zoom out"
				disabled={disabled}
				onClick={onZoomOut}
			>
				<MinusIcon />
			</Button>
			<span className="w-12 text-center font-mono text-xs tabular-nums" aria-live="polite">
				{Math.round(scale * 100)}%
			</span>
			<Button
				size="icon-sm"
				variant="ghost"
				className={pillButton}
				aria-label="Zoom in"
				title="Zoom in"
				disabled={disabled}
				onClick={onZoomIn}
			>
				<PlusIcon />
			</Button>
			<span aria-hidden className="mx-1 h-4 w-px bg-line" />
			<Button
				size="icon-sm"
				variant="ghost"
				className={pillButton}
				aria-label="Fit diagram to the preview"
				title="Fit to screen"
				disabled={disabled}
				onClick={onFit}
			>
				<MaximizeIcon />
			</Button>
		</Pill>
	)
}

export function ExportPill({
	disabled,
	onSvg,
	onPng,
}: {
	disabled: boolean
	onSvg: () => void
	onPng: () => void
}) {
	return (
		<Pill>
			<Button
				size="sm"
				variant="ghost"
				className={cn(pillButton, "px-3")}
				disabled={disabled}
				onClick={onSvg}
			>
				<DownloadIcon />
				SVG
			</Button>
			<span aria-hidden className="h-4 w-px bg-line" />
			<Button
				size="sm"
				variant="ghost"
				className={cn(pillButton, "px-3")}
				disabled={disabled}
				onClick={onPng}
			>
				<ImageDownIcon />
				PNG
			</Button>
		</Pill>
	)
}

export function CanvasHint() {
	return (
		<p className="hidden items-center gap-1.5 rounded-full bg-background/70 px-2.5 py-1 text-xs text-muted-foreground backdrop-blur xl:flex">
			<HandIcon className="size-3.5" />
			Drag to pan · Ctrl + scroll to zoom
		</p>
	)
}

export function PreviewLabel() {
	return (
		<span className="rounded-full border border-line bg-background/90 px-2.5 py-1 font-mono text-xs text-muted-foreground uppercase shadow-sm backdrop-blur">
			Preview
		</span>
	)
}
