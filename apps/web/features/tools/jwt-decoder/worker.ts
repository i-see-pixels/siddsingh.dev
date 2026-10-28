// Checks an HS* token against the known-secrets wordlist off the main thread.

import type { HmacAlg } from "./verify"
import { findWeakSecret, parseWordlist, WORDLIST_URL } from "./weak-secrets"

/** `cancel` stops any check in progress without starting another. */
export type WorkerRequest =
	| { type: "check"; id: number; alg: HmacAlg; signingInput: string; signature: string }
	| { type: "cancel"; id: number }
export type WorkerReply =
	| { id: number; type: "progress"; checked: number; total: number }
	| { id: number; type: "done"; secret: string | null; total: number }
	| { id: number; type: "error"; message: string }

let wordlist: Promise<string[]> | null = null
let latest = 0

const post = (reply: WorkerReply) => self.postMessage(reply)

class Superseded extends Error {}

self.addEventListener("message", async (event: MessageEvent<WorkerRequest>) => {
	const request = event.data
	latest = request.id
	if (request.type === "cancel") return
	const { id, alg, signingInput, signature } = request

	let secrets: string[]
	try {
		wordlist ??= fetch(WORDLIST_URL).then(async (response) => {
			if (!response.ok) throw new Error(`HTTP ${response.status}`)
			return parseWordlist(await response.text())
		})
		secrets = await wordlist
	} catch {
		// Forget the failed load so the next token tries again.
		wordlist = null
		if (latest === id) {
			post({ id, type: "error", message: "Couldn't load the list of known secrets." })
		}
		return
	}

	try {
		let lastReport = 0
		const secret = await findWeakSecret(
			{ alg, signingInput, signature },
			secrets,
			(checked) => {
				// Stop early when a newer token has arrived, and report a few times a second.
				if (latest !== id) throw new Superseded()
				const now = performance.now()
				if (now - lastReport > 150) {
					lastReport = now
					post({ id, type: "progress", checked, total: secrets.length })
				}
			},
		)
		post({ id, type: "done", secret, total: secrets.length })
	} catch (error) {
		if (error instanceof Superseded) return
		post({ id, type: "error", message: "Couldn't check this token against known secrets." })
	}
})
