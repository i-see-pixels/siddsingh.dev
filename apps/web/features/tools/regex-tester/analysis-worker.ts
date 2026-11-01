// Analyses a pattern off the main thread, apart from the matching worker so each can be
// stopped alone. "started" tells the page when to start the budget, as in worker.ts.

import { type Analysis, type AnalysisInput, analyzePattern } from "./analyze"

export type AnalysisRequest = AnalysisInput & { id: number }
export type AnalysisReply =
	| { id: number; type: "started" }
	| { id: number; type: "done"; analysis: Analysis | null }
	| { id: number; type: "error" }

const post = (reply: AnalysisReply) => self.postMessage(reply)

self.addEventListener("message", (event: MessageEvent<AnalysisRequest>) => {
	// Messages from the page that owns a worker have an empty origin; refuse anything else.
	if (event.origin !== "" && event.origin !== self.location.origin) return
	const { id, ...input } = event.data
	post({ id, type: "started" })
	try {
		post({ id, type: "done", analysis: analyzePattern(input) })
	} catch {
		post({ id, type: "error" })
	}
})
