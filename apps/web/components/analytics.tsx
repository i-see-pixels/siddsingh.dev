"use client"

import { usePathname } from "next/navigation"
import Script from "next/script"
import * as React from "react"
import { CookieBanner } from "@/components/cookie-banner"
import { consentStorageKey } from "@/lib/consent"

function isTracked(pathname: string) {
	return pathname !== "/admin" && !pathname.startsWith("/admin/")
}

/**
 * Google Analytics with Consent Mode v2, everywhere but /admin. Client
 * navigation keeps gtag loaded across routes, so leaving it out of the admin
 * layout is not enough: the opt-out flag stops gtag sending hits while an
 * admin page is showing.
 */
function Analytics({ gaId }: { gaId: string }) {
	const tracked = isTracked(usePathname())
	// Load gtag on the first tracked page, then keep it for the visit.
	const [loaded, setLoaded] = React.useState(tracked)
	if (tracked && !loaded) setLoaded(true)

	// Set during render, before the router updates history, so the page_view
	// that GA sends on that history change already sees the flag.
	if (typeof window !== "undefined") {
		;(window as unknown as Record<string, boolean>)[`ga-disable-${gaId}`] = !tracked
	}

	if (!loaded) return null

	// Everything is denied until the visitor accepts. The default has to be
	// queued before `config`, so a returning visitor who accepted is read
	// from storage here rather than updated later.
	const init = `
		window.dataLayer = window.dataLayer || [];
		function gtag(){dataLayer.push(arguments);}
		window.gtag = gtag;
		var consent = null;
		try { consent = localStorage.getItem(${JSON.stringify(consentStorageKey)}); } catch (e) {}
		gtag('consent', 'default', {
			ad_storage: 'denied',
			ad_user_data: 'denied',
			ad_personalization: 'denied',
			analytics_storage: consent === 'granted' ? 'granted' : 'denied',
		});
		gtag('js', new Date());
		gtag('config', ${JSON.stringify(gaId)});
	`

	return (
		<>
			<Script id="ga-init">{init}</Script>
			<Script id="ga" src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
			{tracked && <CookieBanner />}
		</>
	)
}

export { Analytics }
