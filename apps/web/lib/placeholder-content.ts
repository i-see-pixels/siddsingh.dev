// PLACEHOLDER content for the home page until the real data sources exist
// (docs/site-structure.md: content model). Every value here is made up and
// must be replaced before launch.

export const pitch = {
	headline: "I build fast, polished web products for teams and founders.",
	support: "Full-stack developer. I design, build and ship — from first sketch to production.",
	flipSentence: "Currently building tools for developers · Open to new projects",
}

export const proof = [
	{ value: "0+", label: "Years experience" },
	{ value: "00", label: "Projects shipped" },
	{ value: "0", label: "Products launched" },
	{ value: "0k", label: "Users reached" },
]

export const caseStudies = [
	{
		slug: "client-project-one",
		client: "Client name",
		type: "Web app",
		year: "2026",
		title: "Case study title that says what changed",
		outcome: "-00% load time",
		stack: ["Next.js", "TypeScript", "Postgres"],
	},
	{
		slug: "client-project-two",
		client: "Client name",
		type: "Landing page",
		year: "2025",
		title: "Another case study with a measurable result",
		outcome: "0x signups",
		stack: ["React", "Tailwind CSS"],
	},
]

export const services = [
	{
		name: "Web apps",
		description: "Product-grade apps from idea to launch, built to scale.",
		includes: [
			"Architecture and build",
			"Auth, payments, dashboards",
			"Deployment and handover",
		],
		terms: "from $0 · 4-8 weeks",
	},
	{
		name: "Landing pages",
		description: "Fast, polished marketing sites that convert.",
		includes: ["Design to code", "SEO and analytics", "CMS if needed"],
		terms: "from $0 · 1-2 weeks",
	},
]

export const products = [
	{
		name: "Product one",
		pitch: "One line about what it does and for whom.",
		status: "Beta" as const,
		href: "https://siddsingh.dev",
	},
	{
		name: "Product two",
		pitch: "One line about what it does and for whom.",
		status: "Waitlist" as const,
		href: "https://siddsingh.dev",
	},
]

export const experience = [
	{ company: "Company name", role: "Role title", period: "2024 — now", current: true },
	{ company: "Previous company", role: "Role title", period: "2022 — 2024", current: false },
]

export const posts = [
	{ slug: "post-one", title: "Blog post title goes here", date: "1 Oct 2026" },
	{ slug: "post-two", title: "Another post title, a bit longer", date: "12 Sep 2026" },
]

export const tools = [
	{
		slug: "screenshot-mockup",
		name: "Screenshot mockup",
		description: "Frame screenshots in device mockups.",
		category: "Images",
	},
	{
		slug: "og-preview",
		name: "OG preview",
		description: "Preview how links look when shared.",
		category: "Web",
	},
]
