// Checks an HS* token against the known-secrets wordlist off the main thread.

import type { HmacAlg } from "./verify"
import { findWeakSecret, parseWordlist, WORDLIST_URL } from "./weak-secrets"

export type WorkerRequest = { id: number; alg: HmacAlg; signingInput: string; signature: string }
export type WorkerReply =
	| { id: number; type: "progress"; checked: number; total: number }
	| { id: number; type: "done"; secret: string | null; total: number }
	| { id: number; type: "error"; message: string }

let wordlist: Promise<string[]> | null = null
let latest = 0

const post = (reply: WorkerReply) => self.postMessage(reply)

self.addEventListener("message", async (event: MessageEvent<WorkerRequest>) => {
	const { id, ...token } = event.data
	latest = id
	try {
		wordlist ??= fetch(WORDLIST_URL).then(async (response) => {
			if (!response.ok) throw new Error(`HTTP ${response.status}`)
			return parseWordlist(await response.text())
		})
		const secrets = await wordlist
		let lastReport = 0
		const secret = await findWeakSecret(token, secrets, (checked) => {
			// Stop early when a newer token has arrived, and report a few times a second.
			if (latest !== id) throw new Error("superseded")
			const now = performance.now()
			if (now - lastReport > 150) {
				lastReport = now
				post({ id, type: "progress", checked, total: secrets.length })
			}
		})
		post({ id, type: "done", secret, total: secrets.length })
	} catch (error) {
		if (error instanceof Error && error.message === "superseded") return
		wordlist = null
		post({ id, type: "error", message: "Couldn't load the list of known secrets." })
	}
})
