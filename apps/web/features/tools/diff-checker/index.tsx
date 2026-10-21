"use client"

import { lazyTool } from "../lazy-tool"

const Tool = lazyTool(() => import("./tool").then((mod) => ({ default: mod.DiffCheckerTool })))

export function DiffChecker() {
	return <Tool />
}
