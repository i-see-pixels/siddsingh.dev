import type { LiveToolEntry, ToolEntry } from "./types"

const toolEntries: ToolEntry[] = [
	{
		slug: "screenshot-mockup",
		name: "Screenshot Mockup Generator",
		label: "Screenshot Mockup",
		path: "/tools/screenshot-mockup",
		status: "live",
		category: "image",
		icon: "sparkle",
		featured: true,
		summary:
			"Turn raw screenshots into polished product visuals with gradients, browser chrome, rounded corners, and fast exports.",
		description:
			"A free browser-based screenshot mockup generator with customizable backgrounds, padding, shadows, browser frames, and fast PNG or JPG export for launch visuals, docs, and changelogs.",
		highlights: [
			"Upload, drag and drop, or paste screenshots instantly",
			"Customize gradients, padding, chrome, corner radius, and shadow depth",
			"Export crisp PNG or JPG assets at 1x and 2x without leaving the browser",
		],
		hero: {
			eyebrow: "Free design utility",
			heading: "Make screenshots look polished in seconds",
			intro: "Built for product posts, changelog visuals, launch assets, and portfolio updates when a raw screenshot needs a bit more presence.",
		},
		faq: [
			{
				question: "Does it upload screenshots to a server?",
				answer: "No. The v1 editor keeps image handling in the browser so screenshots stay local to your device.",
			},
			{
				question: "What can I customize?",
				answer: "You can switch between transparent, solid, and gradient backgrounds, adjust padding, choose browser chrome styles, set rounded corners, tune shadow depth, and export at 1x or 2x.",
			},
			{
				question: "Who is this tool for?",
				answer: "It is useful for indie makers, engineers, product teams, and anyone posting screenshots to social media, docs, launch pages, or case studies.",
			},
		],
	},
	{
		slug: "code-to-image",
		name: "Code to Image",
		label: "Code to Image",
		path: "/tools/code-to-image",
		status: "comingSoon",
		category: "content",
		icon: "document",
		summary:
			"Convert code snippets into polished visual cards for social posts, changelogs, docs, and blog embeds.",
		description:
			"A lightweight browser-based code screenshot generator tuned for readable snippets, simple themes, and share-ready exports.",
		highlights: [
			"Syntax-highlighted snippet cards",
			"Theme presets for social posts and docs",
			"Exports sized for timelines and articles",
		],
		hero: {
			eyebrow: "Coming soon",
			heading: "Share code without fighting screenshots",
			intro: "Designed for snippets that should feel intentional, readable, and on-brand instead of pasted into a generic screenshot tool.",
		},
		faq: [],
	},
	{
		slug: "open-graph-generator",
		name: "Open Graph Generator",
		label: "Open Graph Generator",
		path: "/tools/open-graph-generator",
		status: "comingSoon",
		category: "marketing",
		icon: "rocket",
		summary:
			"Create lightweight Open Graph cards for product launches, blog posts, changelogs, and landing pages.",
		description:
			"A focused Open Graph image generator for fast announcement graphics, social cards, and branded previews.",
		highlights: [
			"Title-first social card layouts",
			"Fast preset-based composition",
			"Useful for blog posts, products, and launches",
		],
		hero: {
			eyebrow: "Coming soon",
			heading: "Generate sharper social previews",
			intro: "Built for people who want quick, consistent OG cards without opening a full design tool every time they publish.",
		},
		faq: [],
	},
]

export function getAllTools() {
	return toolEntries
}

export function getFeaturedTool() {
	return toolEntries.find((tool) => tool.featured) ?? toolEntries[0]
}

export function getLiveToolEntries(): LiveToolEntry[] {
	return toolEntries.filter((tool): tool is LiveToolEntry => tool.status === "live")
}

export function getToolBySlug(slug: string) {
	return toolEntries.find((tool) => tool.slug === slug)
}
