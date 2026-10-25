"use client"

import * as React from "react"

export type Consent = "granted" | "denied"

/** The localStorage key. The inline gtag init in components/analytics.tsx reads it too. */
export const consentStorageKey = "analytics-consent"

const changeEvent = "analytics-consent-change"

function readConsent(): Consent | null {
	try {
		const value = localStorage.getItem(consentStorageKey)
		return value === "granted" || value === "denied" ? value : null
	} catch {
		return null
	}
}

function subscribe(onChange: () => void) {
	window.addEventListener(changeEvent, onChange)
	// Another tab made a choice.
	window.addEventListener("storage", onChange)
	return () => {
		window.removeEventListener(changeEvent, onChange)
		window.removeEventListener("storage", onChange)
	}
}

/** The visitor's choice; null when they have not made one, undefined during SSR. */
export function useConsent(): Consent | null | undefined {
	return React.useSyncExternalStore(subscribe, readConsent, () => undefined)
}

/** Stores the choice (null clears it, showing the banner again) and tells gtag. */
export function setConsent(consent: Consent | null) {
	try {
		if (consent) localStorage.setItem(consentStorageKey, consent)
		else localStorage.removeItem(consentStorageKey)
	} catch {
		// Storage blocked: the choice holds for this page view only.
	}
	const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag
	gtag?.("consent", "update", { analytics_storage: consent ?? "denied" })
	window.dispatchEvent(new Event(changeEvent))
}
