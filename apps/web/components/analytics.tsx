"use client"

import { GoogleAnalytics } from "@next/third-parties/google"
import { usePathname } from "next/navigation"
import * as React from "react"

function isTracked(pathname: string) {
	return pathname !== "/admin" && !pathname.startsWith("/admin/")
}

/**
 * Google Analytics everywhere but /admin. Client navigation keeps gtag loaded
 * across routes, so leaving it out of the admin layout is not enough: the
 * opt-out flag stops gtag sending hits while an admin page is showing.
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

	return loaded ? <GoogleAnalytics gaId={gaId} /> : null
}

export { Analytics }
