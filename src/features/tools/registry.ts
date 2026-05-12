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
		image: {
			path: "/images/screenshot_mockup.png",
			alt: "Screenshot Mockup Generator",
		},
	},
	{
		slug: "plenz-ai-prompt-refiner",
		name: "plenz - ai prompt refiner",
		label: "Plenz",
		path: "https://plenz.siddsingh.dev/",
		status: "live",
		category: "ai",
		icon: "sparkle",
		featured: true,
		summary:
			"plenz turns simple ideas into detailed, structured AI prompts for ChatGPT, Claude, and Gemini.",
		description:
			"A free AI prompt refiner that transforms basic instructions into rich, layered prompts with context, persona, format, and tone. Designed for quick iteration on ChatGPT, Claude, and Gemini.",
		highlights: [
			"Refines prompts with context, role, format, constraints, and tone",
			"One-click export to ChatGPT, Claude, and Gemini",
			"Useful for social posts, emails, articles, and scripts",
		],
		hero: {
			eyebrow: "AI prompt assistant",
			heading: "Make your AI prompts sharper in seconds",
			intro: "A lightweight prompt refiner for ChatGPT, Claude, and Gemini users who want clearer, more detailed instructions without the manual rewriting.",
		},
		image: {
			path: "/images/projects/plenz/plenz_screenshot-01.png",
			alt: "plenz - ai prompt refiner",
		},
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
