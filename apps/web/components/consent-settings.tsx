"use client"

import { Button } from "@workspace/ui/components/button"
import { setConsent, useConsent } from "@/lib/consent"

const status = {
	granted: "Accepted: Google Analytics may set its cookies.",
	denied: "Declined: no analytics cookies are set.",
	none: "Not chosen yet: no analytics cookies are set.",
}

/** Current choice plus buttons to change it, for the privacy page. */
export function ConsentSettings() {
	const consent = useConsent()

	return (
		<div className="flex flex-col gap-3">
			<p className="font-mono text-sm" aria-live="polite">
				{consent === undefined ? " " : status[consent ?? "none"]}
			</p>
			<div className="flex flex-wrap gap-2">
				<Button
					variant="outline"
					size="sm"
					disabled={consent === "denied"}
					onClick={() => setConsent("denied")}
				>
					Decline analytics
				</Button>
				<Button
					size="sm"
					disabled={consent === "granted"}
					onClick={() => setConsent("granted")}
				>
					Accept analytics
				</Button>
			</div>
		</div>
	)
}
