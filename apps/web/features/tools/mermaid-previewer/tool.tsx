"use client"

import { Button } from "@workspace/ui/components/button"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@workspace/ui/components/select"
import { CopyIcon, LayoutGridIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useId, useRef, useState } from "react"
import { CodeEditor } from "../code-editor"
import { ResizableSplit } from "../resizable-split"
import { ErrorCard, FileTab, headerButton, PaneHeader, StatusBar } from "../tool-chrome"
import { CanvasHint, diagramKind, ExportPill, PreviewLabel, ZoomPill } from "./chrome"
import { naturalSize, PanZoom, type PanZoomHandle } from "./pan-zoom"
import { samples } from "./samples"
import { mermaidConfig } from "./theme"

type RenderState =
	| { status: "idle" }
	| { status: "ready"; svg: string }
	| { status: "error"; message: string; svg?: string }

function download(href: string, filename: string) {
	const link = document.createElement("a")
	link.href = href
	link.download = filename
	link.click()
}

export function MermaidPreviewerTool() {
	const [code, setCode] = useState(samples[0]?.code ?? "")
	const [example, setExample] = useState<string | null>(samples[0]?.name ?? null)
	const [fitKey, setFitKey] = useState(0)
	const [scale, setScale] = useState(1)
	const [state, setState] = useState<RenderState>({ status: "idle" })
	const { resolvedTheme } = useTheme()
	const panZoomRef = useRef<PanZoomHandle>(null)
	const baseId = useId().replace(/:/g, "")
	const counter = useRef(0)

	// Re-render shortly after typing stops, and when the colour theme changes.
	useEffect(() => {
		if (!code.trim()) {
			setState({ status: "idle" })
			return
		}
		let cancelled = false
		const timer = setTimeout(async () => {
			const { default: mermaid } = await import("mermaid")
			mermaid.initialize(mermaidConfig(resolvedTheme === "dark"))
			try {
				const { svg } = await mermaid.render(`${baseId}-${counter.current++}`, code)
				if (!cancelled) setState({ status: "ready", svg })
			} catch (error) {
				if (cancelled) return
				const message =
					error instanceof Error ? error.message : "Could not render the diagram."
				setState((current) => ({
					status: "error",
					message,
					svg:
						current.status === "ready"
							? current.svg
							: current.status === "error"
								? current.svg
								: undefined,
				}))
			}
		}, 350)
		return () => {
			cancelled = true
			clearTimeout(timer)
		}
	}, [code, resolvedTheme, baseId])

	const svg = state.status === "idle" ? "" : (state.svg ?? "")

	const exportSvg = () => {
		const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }))
		download(url, "diagram.svg")
		URL.revokeObjectURL(url)
	}

	const exportPng = async () => {
		const size = naturalSize(svg)
		if (!size) return
		// Draw the SVG itself, not the on-screen view, so the PNG ignores pan and zoom.
		const doc = new DOMParser().parseFromString(svg, "image/svg+xml")
		const root = doc.documentElement
		root.setAttribute("width", String(size.width))
		root.setAttribute("height", String(size.height))
		const source = new XMLSerializer().serializeToString(root)
		const url = URL.createObjectURL(new Blob([source], { type: "image/svg+xml" }))
		try {
			const image = new Image()
			image.src = url
			await image.decode()
			const ratio = 2
			const canvas = document.createElement("canvas")
			canvas.width = Math.ceil(size.width * ratio)
			canvas.height = Math.ceil(size.height * ratio)
			const context = canvas.getContext("2d")
			if (!context) return
			context.fillStyle = resolvedTheme === "dark" ? "#0a0a0a" : "#ffffff"
			context.fillRect(0, 0, canvas.width, canvas.height)
			context.drawImage(image, 0, 0, canvas.width, canvas.height)
			download(canvas.toDataURL("image/png"), "diagram.png")
		} finally {
			URL.revokeObjectURL(url)
		}
	}

	const errorLine =
		state.status === "error"
			? Number(state.message.match(/line (\d+)/i)?.[1]) || undefined
			: undefined
	const statusKey = state.status

	return (
		<ResizableSplit
			left={
				<section className="flex h-full min-h-0 flex-col bg-background">
					<PaneHeader>
						<FileTab name="diagram.mmd" badge={diagramKind(code)} />
						<div className="ml-auto flex items-center gap-1.5">
							<Select
								items={samples.map((sample) => ({
									value: sample.name,
									label: sample.name,
								}))}
								value={example}
								onValueChange={(next) => {
									const sample = samples.find((item) => item.name === next)
									if (!sample) return
									setExample(sample.name)
									setCode(sample.code)
									setFitKey((key) => key + 1)
								}}
							>
								<SelectTrigger
									aria-label="Load an example"
									className={`${headerButton} gap-2 pl-2.5 text-[0.8rem]`}
								>
									<LayoutGridIcon className="size-3.5 text-muted-foreground" />
									<SelectValue placeholder="Examples" />
								</SelectTrigger>
								<SelectContent align="end">
									{samples.map((sample) => (
										<SelectItem key={sample.name} value={sample.name}>
											{sample.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Button
								size="sm"
								variant="outline"
								className={headerButton}
								disabled={!code}
								onClick={() => navigator.clipboard.writeText(code).catch(() => {})}
							>
								<CopyIcon />
								Copy
							</Button>
						</div>
					</PaneHeader>
					<CodeEditor
						label="Mermaid diagram code"
						placeholder="Write or paste Mermaid code"
						value={code}
						errorLine={errorLine}
						onChange={(value) => {
							setCode(value)
							setExample(null)
						}}
					/>
					{state.status === "error" && (
						<ErrorCard title="Couldn't render this diagram" message={state.message} />
					)}
					<StatusBar
						tone={
							statusKey === "ready" ? "ok" : statusKey === "error" ? "error" : "idle"
						}
						label={
							{ idle: "Waiting for code", ready: "Rendered", error: "Syntax error" }[
								statusKey
							]
						}
						detail={`${code ? code.split("\n").length : 0} lines · ${code.length.toLocaleString()} chars`}
					/>
				</section>
			}
			right={
				<section className="relative h-full min-h-0 bg-muted/20">
					<PanZoom
						svg={svg}
						fitKey={fitKey}
						onScaleChange={setScale}
						controlRef={panZoomRef}
					/>
					<div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2 [&>*]:pointer-events-auto">
						<PreviewLabel />
						<ExportPill disabled={!svg} onSvg={exportSvg} onPng={exportPng} />
					</div>
					<div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-end justify-between gap-2 [&>*]:pointer-events-auto">
						<CanvasHint />
						<div className="absolute left-1/2 -translate-x-1/2">
							<ZoomPill
								scale={scale}
								disabled={!svg}
								onZoomIn={() => panZoomRef.current?.zoomBy(1.25)}
								onZoomOut={() => panZoomRef.current?.zoomBy(1 / 1.25)}
								onFit={() => panZoomRef.current?.fit()}
							/>
						</div>
					</div>
				</section>
			}
		/>
	)
}
