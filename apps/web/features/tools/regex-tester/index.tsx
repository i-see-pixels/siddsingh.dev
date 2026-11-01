"use client"

import { lazyTool } from "../lazy-tool"

const Tool = lazyTool(() => import("./tool").then((mod) => ({ default: mod.RegexTesterTool })))

export function RegexTester() {
	return <Tool />
}
