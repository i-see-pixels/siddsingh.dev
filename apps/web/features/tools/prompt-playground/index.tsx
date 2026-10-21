"use client"

import { lazyTool } from "../lazy-tool"

const Tool = lazyTool(() => import("./tool").then((mod) => ({ default: mod.PromptPlaygroundTool })))

export function PromptPlayground() {
	return <Tool />
}
