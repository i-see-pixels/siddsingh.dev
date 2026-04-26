"use client"

import { useEffect } from "react"

function syncThemeClass() {
	const root = document.documentElement
	const theme = root.getAttribute("data-theme")
	root.classList.toggle("dark", theme === "dark")
}

export function ThemeClassSync() {
	useEffect(() => {
		syncThemeClass()

		const observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (mutation.type === "attributes" && mutation.attributeName === "data-theme") {
					syncThemeClass()
				}
			}
		})

		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["data-theme"],
		})

		return () => observer.disconnect()
	}, [])

	return null
}
