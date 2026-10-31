// Runs matches off the main thread. "started" tells the page when the regex actually begins,
// so the time budget doesn't count the worker's own start-up.

import { type RunInput, type RunResult, runRegex } from "./run"

export type WorkerRequest = RunInput & { id: number }
export type WorkerReply =
	| { id: number; type: "started" }
	| { id: number; type: "done"; result: RunResult }
	| { id: number; type: "error"; message: string }

const post = (reply: WorkerReply) => self.postMessage(reply)

self.addEventListener("message", (event: MessageEvent<WorkerRequest>) => {
	const { id, ...input } = event.data
	post({ id, type: "started" })
	try {
		post({ id, type: "done", result: runRegex(input) })
	} catch (error) {
		post({ id, type: "error", message: error instanceof Error ? error.message : String(error) })
	}
})
