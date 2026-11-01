"use client"

import { lazyTool } from "../lazy-tool"

const Tool = lazyTool(() => import("./tool").then((mod) => ({ default: mod.CronExpressionTool })))

export function CronExpression() {
	return <Tool />
}
