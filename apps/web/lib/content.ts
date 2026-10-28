// Site content, from Siddhant's resume (Oct 2026), the v1 site and his public
// profiles. Blog posts live in the database (lib/blog.ts); tools move to their
// own data source when that section is built (docs/site-structure.md: content model).

export const blobUrl = "https://utxifjblgzbxujxp.public.blob.vercel-storage.com/siddsingh_dev"

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
		image: `${blobUrl}/work/rca_agent_tile.png`,
		name: "RCA agents",
		client: "Optum",
		type: "AI agents",
		year: "2026",
		title: "Multi-agent root-cause analysis that writes incident reports before tickets are opened",
		outcome: "$500K-700K / yr",
		stack: ["FastAPI", "Google ADK", "GKE", "Celery"],
	},
	{
		slug: "snapnode",
		image: `${blobUrl}/work/snapnode_tile.png`,
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
	{
		slug: "llm-token-cost",
		name: "LLM token & cost calculator",
		description:
			"Count tokens in a prompt and compare the cost across Claude, GPT and Gemini models.",
		category: "AI",
		steps: [
			"Paste your prompt, document or code.",
			"Set the expected output length and how many requests you will make.",
			"Compare tokens, context window fit and cost for each model.",
		],
		faq: [
			{
				question: "How accurate are the token counts?",
				answer: "OpenAI counts use OpenAI's published tokenizer and should be very close. Anthropic and Google do not publish theirs, so those counts are estimates marked with ≈.",
			},
			{
				question: "Are the prices up to date?",
				answer: "They are starting values and can go stale. Every price is editable, and you should check the provider's pricing page before budgeting.",
			},
			{
				question: "Is my prompt sent anywhere?",
				answer: "No. Counting happens in your browser, so your text never leaves your device.",
			},
		],
	},
	{
		slug: "prompt-playground",
		name: "Prompt template playground",
		description:
			"Write prompts with {{variables}}, fill them in and copy plain text or API-ready messages.",
		category: "AI",
		steps: [
			"Write a system and user prompt with {{variables}} where the content changes.",
			"Fill in a value for each variable the tool detects.",
			"Copy the result as plain text, Anthropic messages or OpenAI messages.",
		],
		faq: [
			{
				question: "Does it call a model?",
				answer: "No. It builds the final prompt and request body so you can paste them into your own code or API client.",
			},
			{
				question: "What happens to a variable I leave empty?",
				answer: "It stays as a {{placeholder}} in the output, and the tool lists which ones are still missing.",
			},
			{
				question: "Is my prompt stored?",
				answer: "No. Everything stays in your browser tab and is gone when you close it.",
			},
		],
	},
	{
		slug: "tool-schema-converter",
		name: "Tool schema converter",
		description:
			"Convert a JSON Schema into an Anthropic tool or OpenAI function definition, and back.",
		category: "AI",
		steps: [
			"Paste a JSON Schema, an Anthropic tool or an OpenAI function.",
			"Pick the format you need. The tool detects what you pasted.",
			"Copy the converted definition and fix anything the checks flag.",
		],
		faq: [
			{
				question: "Which formats are supported?",
				answer: "Plain JSON Schema, Anthropic tools, OpenAI Chat Completions functions and OpenAI Responses functions.",
			},
			{
				question: "What does strict mode do?",
				answer: "For OpenAI it lists every property as required and forbids extra properties, which strict function calling needs.",
			},
			{
				question: "Is my schema uploaded?",
				answer: "No. The conversion runs in your browser.",
			},
		],
	},
	{
		slug: "diff-checker",
		name: "Diff checker",
		description: "Compare two pieces of text or code side by side, by line, word or character.",
		category: "Developer",
		steps: [
			"Paste the original text on the left and the changed text on the right.",
			"Choose lines, words or characters, and a split or unified view.",
			"Copy the result as a unified patch.",
		],
		faq: [
			{
				question: "Can I ignore whitespace or case?",
				answer: "Yes. Both options are on the toolbar.",
			},
			{
				question: "Is my text uploaded?",
				answer: "No. The comparison runs in your browser, so code and secrets stay on your device.",
			},
			{
				question: "What is the copied patch?",
				answer: "A standard unified diff, the same format git diff produces, that you can apply with patch or git apply.",
			},
		],
	},
	{
		slug: "mermaid-previewer",
		name: "Mermaid diagram previewer",
		description: "Write Mermaid code, preview the diagram live and export it as SVG or PNG.",
		category: "Developer",
		steps: [
			"Write or paste Mermaid code, or start from an example.",
			"Watch the diagram update as you type, and fix any error shown below the code.",
			"Export as SVG or PNG.",
		],
		faq: [
			{
				question: "Which diagrams can I draw?",
				answer: "Flowcharts, sequence, ER, state, Gantt, class diagrams and the other types Mermaid supports.",
			},
			{
				question: "Is my diagram uploaded?",
				answer: "No. Rendering happens in your browser.",
			},
			{
				question: "Why does the preview follow my light or dark theme?",
				answer: "The diagram is drawn with the matching Mermaid theme, so it reads well on the page. PNG exports use a solid background.",
			},
		],
	},
	{
		slug: "json-formatter",
		name: "JSON formatter & validator",
		description:
			"Format, validate and minify JSON, convert it to YAML, and redact any secrets before you share it.",
		category: "Developer",
		steps: [
			"Paste JSON or YAML. Errors are marked on the line they happen.",
			"Pick formatted, minified or YAML output, and click any value to copy its path.",
			"Redact any keys or passwords the tool finds, then copy, download or share.",
		],
		faq: [
			{
				question: "Is my JSON sent anywhere?",
				answer: "No. Formatting and the secret scan run in your browser. Open DevTools → Network and paste to check: no requests are made.",
			},
			{
				question: "What secrets does it look for?",
				answer: "Private keys, cloud and API keys (AWS, GitHub, OpenAI, Anthropic, Stripe, Slack, Google), JWTs and passwords in connection strings by default. You can also turn on checks for values under keys like password or token, card numbers, emails and random-looking strings.",
			},
			{
				question: "What does a share link contain?",
				answer: "The redacted JSON, inside the part of the link after #, which browsers never send to a server. Secrets are always removed from share links.",
			},
			{
				question: "Can it convert YAML to JSON?",
				answer: "Yes. Paste YAML and the formatted and minified tabs give you JSON.",
			},
		],
	},
]
