"use client"

import dynamic from "next/dynamic"
import type { ComponentType } from "react"

/** Code-split a tool so its dependencies only load on its workspace page. */
export function lazyTool(load: () => Promise<{ default: ComponentType }>) {
	return dynamic(load, {
		ssr: false,
		loading: () => (
			<div className="dot-grid flex min-h-72 flex-1 items-center justify-center p-8">
				<p className="font-mono text-xs text-muted-foreground uppercase">Loading tool</p>
			</div>
		),
	})
}
