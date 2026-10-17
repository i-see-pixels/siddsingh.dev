// Site content, from Siddhant's resume (Oct 2026), the v1 site and his public
// profiles. Blog posts live in content/blog (lib/blog.ts); tools move to their
// own data source when that section is built (docs/site-structure.md: content model).

const blobUrl = "https://utxifjblgzbxujxp.public.blob.vercel-storage.com/siddsingh_dev"

export const avatarUrl = `${blobUrl}/avatar.png`
// Full-length halftone cut-out (399×1076, transparent background).
export const halftoneUrl = `${blobUrl}/halftone_hero.png`

export const pitch = {
	headline: "I build AI-powered products and production-grade web platforms.",
	support:
		"Senior Software Engineer at Optum (UnitedHealth Group). 3+ years across full-stack, cloud-native systems and AI agents.",
	flipSentence: "Building solutions for real problems.",
}

export const proof = [
	{ value: "3+", label: "Years experience" },
	{ value: "$500K+", label: "Projected savings / yr" },
	{ value: "200+", label: "plenz installs" },
	{ value: "1K", label: "Client monthly visitors" },
]

export type CaseStudy = {
	slug: string
	name: string
	client: string
	type: string
	year: string
	title: string
	outcome?: string
	/** Set while the project isn't fully live yet. */
	status?: "Beta" | "Waitlist"
	/** Cover screenshot in Vercel Blob, 16:10 (1600×1000). */
	image: string
	stack: string[]
	href?: string
}

export const caseStudies: CaseStudy[] = [
	{
		slug: "doctors-divine",
		image: `${blobUrl}/work/doctorsdivine_tile.png`,
		name: "Doctors Divine",
		client: "Doctors Divine",
		type: "Healthcare platform",
		year: "2023, redesigned 2026",
		title: "Hospital platform with doctor discovery, online booking and patient dashboards",
		outcome: "1K visitors / mo",
		stack: ["Next.js 16", "React 19", "Supabase", "TypeScript"],
		href: "https://www.doctorsdivine.com/",
	},
	{
		slug: "ai-rca-orchestrator",
		image: `${blobUrl}/work/ai-rca-orchestrator.png`,
		name: "RCA agents",
		client: "Optum",
		type: "AI agents",
		year: "2026",
		title: "Multi-agent root-cause analysis that writes incident reports before tickets are opened",
		outcome: "$500K–700K / yr",
		stack: ["FastAPI", "Google ADK", "GKE", "Celery"],
	},
	{
		slug: "snapnode",
		image: `${blobUrl}/work/snapnode.png`,
		name: "SnapNode",
		client: "Own product",
		type: "Browser extension",
		year: "2026",
		title: "Chrome extension for crisp, element-level screenshots of any web page",
		status: "Beta",
		stack: ["Preact", "TypeScript", "Vite", "Tailwind CSS"],
		href: "https://github.com/i-see-pixels/snapnode",
	},
]

export const services = [
	{
		name: "Full-stack web apps",
		description: "Production-grade products with Next.js, React, FastAPI and Postgres.",
		includes: [
			"Architecture, build and deployment",
			"Auth, payments and dashboards",
			"Supabase and PostgreSQL backends",
		],
	},
	{
		name: "AI features and agents",
		description:
			"LLM features that do real work, from single prompts to multi-agent workflows.",
		includes: [
			"LLM integrations across providers",
			"Agentic and multi-agent workflows",
			"RAG and context-aware analysis",
		],
	},
	{
		name: "Browser extensions",
		description: "Chrome extensions from first prototype to the Web Store.",
		includes: [
			"Manifest V3, content scripts and popups",
			"Privacy-first, bring-your-own-key designs",
			"Chrome Web Store publishing",
		],
	},
	{
		name: "SEO-driven websites",
		description: "Fast marketing and content sites built to rank.",
		includes: [
			"Server-rendered Next.js",
			"Structured data and metadata",
			"Analytics and performance tuning",
		],
	},
]

export const products = [
	{
		name: "plenz",
		pitch: "Open-source extension that rewrites weak AI prompts before you send them.",
		status: "Live" as const,
		metric: "200+ installs",
		stack: ["TypeScript", "Vite", "Next.js", "Firebase"],
		href: "https://plenz.siddsingh.dev",
	},
	{
		name: "admin-boil",
		pitch: "Admin dashboard you install with one CLI command, for Next.js and more.",
		status: "Live" as const,
		stack: ["Next.js", "shadcn/ui", "Drizzle", "PostgreSQL"],
		href: "https://admin-boil.vercel.app",
	},
	{
		name: "SnapNode",
		pitch: "Chrome extension for crisp, element-level screenshots of any web page.",
		status: "Beta" as const,
		stack: ["Preact", "TypeScript", "Vite", "Tailwind CSS"],
		href: "https://github.com/i-see-pixels/snapnode",
	},
]

export const experience = [
	{
		company: "Optum",
		role: "Senior Software Engineer",
		period: "Mar 2026 — now",
		current: true,
		highlights: [
			"Architected a FastAPI and Google ADK multi-agent root-cause analysis workflow, projected to save $500K–700K a year and cut defect-resolution time by 20–30%.",
			"Generated RCA reports before tickets were opened by combining GKE logs, repository context, static analysis and Celery workers.",
			"Designed agents that map defect triggers and cluster logs to code-level regression candidates, with secure access to internal repos and production logs.",
		],
		skills: ["FastAPI", "Google ADK", "GKE", "Celery", "Python"],
	},
	{
		company: "Optum",
		role: "Software Engineer",
		period: "Sep 2023 — Feb 2026",
		current: false,
		highlights: [
			"Built internal healthcare applications with Java Spring Boot microservices, MuleSoft, React, Kafka and the Stargate API gateway on Google Cloud.",
			"Shipped through Agile delivery, GitHub Actions CI/CD and spec-driven development.",
		],
		skills: ["Java", "Spring Boot", "React", "Kafka", "GCP"],
	},
	{
		company: "Optum",
		role: "Software Developer Intern",
		period: "Jun — Jul 2022",
		current: false,
		highlights: [
			"Built a Django and Pandas tool that automated manual review steps for client insurance data.",
		],
		skills: ["Django", "Pandas"],
	},
]

export const education = {
	school: "Delhi Technological University",
	degree: "B.Tech, Computer Science",
	period: "2019 — 2023",
	detail: "GPA 8.67 / 10",
}

export const publication = {
	title: "LTSum: Legal Text Summarizer",
	venue: "ICCCNT 2023 · IEEE",
	detail: "6 citations",
	href: "https://ieeexplore.ieee.org/document/10308123",
}

export const certification = {
	title: "Google Cloud Digital Leader",
	issuer: "Google Cloud",
	period: "2024 — 2027",
	href: "https://www.credly.com/badges/1c701f9e-74d5-4632-b430-57a624ca3669/public_url",
}

export const achievements = [
	"Contributed to 10+ open-source projects: bug fixes, docs and features.",
	"Mentoring, code reviews, production incident triage and internal runbooks.",
]

export const skills = [
	{
		group: "Languages",
		items: ["Python", "TypeScript", "JavaScript", "C++", "SQL", "Java", "Bash"],
	},
	{
		group: "Frameworks",
		items: ["Next.js", "React", "FastAPI", "Django", "Tailwind CSS", "Google ADK", "Celery"],
	},
	{
		group: "Cloud and data",
		items: [
			"GCP",
			"GKE",
			"Kubernetes",
			"Docker",
			"Supabase",
			"Firebase",
			"PostgreSQL",
			"MongoDB",
		],
	},
	{
		group: "AI",
		items: [
			"LLM integrations",
			"Agentic workflows",
			"Multi-agent systems",
			"Prompt engineering",
			"RAG",
		],
	},
]

export const tools = [
	{
		slug: "screenshot-mockup",
		name: "Screenshot mockup",
		description: "Turn raw screenshots into polished product visuals, exported as PNG or JPG.",
		category: "Images",
		steps: [
			"Drop in a screenshot, or paste one from your clipboard.",
			"Pick a background, padding, corner radius and shadow.",
			"Export as PNG or JPG.",
		],
		faq: [
			{
				question: "Is my screenshot uploaded anywhere?",
				answer: "No. The editing happens in your browser, so your image stays on your device.",
			},
			{
				question: "What can I export?",
				answer: "PNG or JPG, at the size you set on the canvas.",
			},
			{
				question: "Does it cost anything?",
				answer: "No. It's free, with no sign-up and no watermark.",
			},
		],
	},
]
