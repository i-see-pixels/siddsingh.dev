import type { IconName } from "@/resources/icons"

export type ToolStatus = "live" | "comingSoon"
export type ToolCategory = "image" | "content" | "marketing" | "ai"

export type ToolEntry = {
	slug: string
	name: string
	label: string
	path: `/tools/${string}` | `${string}`
	status: ToolStatus
	category: ToolCategory
	icon: IconName
	summary: string
	description: string
	featured?: boolean
	highlights: string[]
	hero: {
		eyebrow: string
		heading: string
		intro: string
	}
	image?: {
		path: string
		alt: string
	}
}

export type LiveToolEntry = ToolEntry & {
	status: "live"
}
