"use client"

import { Button } from "@workspace/ui/components/button"
import Link from "next/link"
import { setConsent, useConsent } from "@/lib/consent"

/** Asks once for analytics consent; both answers are one click and look alike. */
export function CookieBanner() {
	const consent = useConsent()
	// undefined until hydrated, so the server never renders it.
	if (consent !== null) return null

	return (
		<section
			aria-label="Cookie consent"
			// On phones it clears the floating bottom nav.
			className="fixed inset-x-2 bottom-[calc(--spacing(16)+env(safe-area-inset-bottom,0px))] z-50 flex flex-col gap-3 rounded-xl bg-popover p-4 text-popover-foreground shadow-md ring-1 ring-foreground/10 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 md:inset-x-auto md:bottom-4 md:left-4 md:max-w-sm"
		>
			<p className="font-mono text-[0.625rem]/4 font-medium tracking-wider text-muted-foreground uppercase">
				Cookies
			</p>
			<p className="text-sm text-pretty">
				Can I count your visit with Google Analytics? It sets cookies only if you say yes.
				No ads, no selling, just which pages get read.{" "}
				<Link className="link-underline" href="/privacy">
					Privacy note
				</Link>
			</p>
			<div className="grid grid-cols-2 gap-2">
				<Button variant="outline" size="sm" onClick={() => setConsent("denied")}>
					No thanks
				</Button>
				<Button size="sm" onClick={() => setConsent("granted")}>
					Accept
				</Button>
			</div>
		</section>
	)
}
