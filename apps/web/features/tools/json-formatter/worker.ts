// Formats and scans large input off the main thread so typing stays responsive.

import { type AnalyzeOptions, analyze } from "./analyze"

export type WorkerRequest = { id: number; text: string; options: AnalyzeOptions }

self.addEventListener("message", (event: MessageEvent<WorkerRequest>) => {
	const { id, text, options } = event.data
	self.postMessage({ id, analysis: analyze(text, options) })
})
