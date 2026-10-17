"use client"

import dynamic from "next/dynamic"

const ScreenshotMockupTool = dynamic(
	() => import("./ScreenshotMockupTool").then((mod) => mod.ScreenshotMockupTool),
	{
		ssr: false,
		loading: () => (
			<div className="dot-grid flex min-h-72 items-center justify-center p-8">
				<p className="font-mono text-xs text-muted-foreground uppercase">Loading editor</p>
			</div>
		),
	},
)

export function ScreenshotMockup() {
	return <ScreenshotMockupTool />
}
