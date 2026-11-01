// Formats and scans large input off the main thread so typing stays responsive.

import { type AnalyzeOptions, analyze } from "./analyze"

export type WorkerRequest = { id: number; text: string; options: AnalyzeOptions }

self.addEventListener("message", (event: MessageEvent<WorkerRequest>) => {
	// Messages from the page that owns a worker have an empty origin; refuse anything else.
	if (event.origin !== "" && event.origin !== self.location.origin) return
	const { id, text, options } = event.data
	self.postMessage({ id, analysis: analyze(text, options) })
})
