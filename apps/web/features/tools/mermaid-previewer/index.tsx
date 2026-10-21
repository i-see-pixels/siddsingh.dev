"use client"

import { lazyTool } from "../lazy-tool"

const Tool = lazyTool(() => import("./tool").then((mod) => ({ default: mod.MermaidPreviewerTool })))

export function MermaidPreviewer() {
	return <Tool />
}
