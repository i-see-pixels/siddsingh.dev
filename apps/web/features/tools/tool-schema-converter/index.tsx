"use client"

import { lazyTool } from "../lazy-tool"

const Tool = lazyTool(() =>
	import("./tool").then((mod) => ({ default: mod.ToolSchemaConverterTool })),
)

export function ToolSchemaConverter() {
	return <Tool />
}
