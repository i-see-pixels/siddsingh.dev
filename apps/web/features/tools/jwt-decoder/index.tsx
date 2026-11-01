"use client"

import { lazyTool } from "../lazy-tool"

const Tool = lazyTool(() => import("./tool").then((mod) => ({ default: mod.JwtDecoderTool })))

export function JwtDecoder() {
	return <Tool />
}
