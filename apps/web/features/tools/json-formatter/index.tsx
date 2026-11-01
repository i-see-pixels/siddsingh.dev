"use client"

import { lazyTool } from "../lazy-tool"

const Tool = lazyTool(() => import("./tool").then((mod) => ({ default: mod.JsonFormatterTool })))

export function JsonFormatter() {
	return <Tool />
}
