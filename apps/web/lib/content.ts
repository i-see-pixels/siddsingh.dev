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
		seoTitle: "Screenshot Mockup Generator: Free, No Watermark",
		guide: "free-screenshot-mockup-generator",
		overview: [
			"Paste a screenshot and turn it into a product shot: a gradient or image background, a macOS, Windows, browser or iPhone frame, rounded corners and a soft shadow. Export it as a PNG or JPG at 1x or 2x, or copy it straight to your clipboard.",
			"It's free, with no account and no watermark. Your screenshot is edited in your browser and never uploaded, so unreleased features and customer data stay on your machine.",
		],
		features: [
			"Paste with Ctrl or Cmd + V, drag and drop, or upload, then crop with free or fixed ratios.",
			"14 gradient presets, a multi-stop gradient editor, image backgrounds with tint and blur, solid colours or transparent.",
			"macOS, macOS Unified, Windows 11, browser and iPhone frames in light or dark, with an editable address bar.",
			"Canvas ratios for X, LinkedIn and Instagram, plus padding, corner radius, border and shadow presets.",
			"3D tilt, rotation and a stack effect that layers copies behind your screenshot.",
			"Undo and redo, and export at 1x or 2x from a full-size render, not the preview.",
		],
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
		seoTitle: "LLM Token Calculator: Claude, GPT & Gemini Cost",
		guide: "llm-token-cost-calculator",
		overview: [
			"Paste a prompt, document or code and see how many tokens it uses and what it costs on ten Claude, GPT and Gemini models side by side. Set the expected output length and the number of requests to budget a whole feature, not one call.",
			"OpenAI counts use OpenAI's published o200k_base tokenizer. Anthropic and Google don't publish theirs, so those counts are estimates and marked with ≈. Counting happens in your browser, so your prompt is never sent anywhere.",
		],
		features: [
			"Token counts for every model, exact for OpenAI and estimated for Claude and Gemini.",
			"Cost per request and in total, with separate input and output prices.",
			"Context window fit for each model, flagged when the prompt is too long.",
			"Every price is editable, for negotiated rates or price changes.",
			"Prices are dated, so you know when they were last checked.",
		],
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
		seoTitle: "Prompt Template Playground with {{Variables}}",
		guide: "prompt-template-playground",
		overview: [
			"Write a system prompt and a user prompt with {{variables}} where the content changes. The playground finds every variable, gives you a field for each and fills them in as you type.",
			"Copy the result as plain text, as an Anthropic Messages request body or as an OpenAI Chat Completions body. It never calls a model and needs no API key, and nothing is stored once you close the tab.",
		],
		features: [
			"Variables detected in both prompts as you type, with autocomplete for names you've already used.",
			"A list of variables still empty, so nothing ships with a {{placeholder}} in it.",
			"Output as plain text, Anthropic messages JSON or OpenAI messages JSON.",
			"No account, no API key and no storage.",
		],
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
		seoTitle: "Convert OpenAI Functions to Anthropic Tools",
		guide: "openai-function-to-anthropic-tool",
		overview: [
			"Paste a JSON Schema, an Anthropic tool or an OpenAI function and convert it to any of the others. The converter detects what you pasted, moves the schema between parameters and input_schema and adds or removes the right wrapper.",
			"Turn on strict mode for OpenAI and it marks every property as required and sets additionalProperties to false at every level. Checks flag the mistakes that make a provider reject a tool, with the path where each one happens.",
		],
		features: [
			"JSON Schema, Anthropic tools, OpenAI Chat Completions functions and OpenAI Responses functions.",
			"Detects the input format automatically.",
			"OpenAI strict mode applied for you, including nested objects.",
			"Checks for tool names, descriptions, the root object type and required fields that don't exist.",
			"Runs in your browser; nothing is uploaded.",
		],
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
		seoTitle: "Diff Checker: Compare Text Online, Privately",
		guide: "private-diff-checker",
		overview: [
			"Paste two versions of a text or code and see what changed, by line, word or character. Read it side by side or as a unified diff, and ignore case or whitespace when they're just noise.",
			"The comparison runs in your browser, so config files, contracts and code with secrets in them stay on your device. Copy the result as a standard unified patch and apply it with git apply or patch.",
		],
		features: [
			"Line, word and character comparison.",
			"Split and unified views with line numbers.",
			"Ignore case and ignore whitespace options.",
			"Copy a unified patch in the same format as git diff.",
			"Swap the two sides and see added and removed counts at a glance.",
			"Nothing is uploaded or saved.",
		],
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
		seoTitle: "Mermaid Live Editor & Viewer: SVG and PNG Export",
		guide: "best-mermaid-viewer",
		overview: [
			"Write Mermaid code and watch the diagram render as you type. When something breaks, the line Mermaid complains about is highlighted and the last good diagram stays on screen while you fix it.",
			"Pan and zoom around large diagrams, then export a clean SVG or a 2x PNG with a solid background. It runs the real Mermaid library in your browser, so your diagrams are never uploaded.",
		],
		features: [
			"Live preview with line-level errors.",
			"Flowcharts, sequence, ER, state, class, Gantt and every other Mermaid diagram type.",
			"Pan, zoom and fit to screen for large diagrams.",
			"SVG export and 2x PNG export with a solid background.",
			"A clean theme for light and dark mode, with no changes to your code.",
			"Diagrams on this blog open in the editor with one click.",
		],
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
		seoTitle: "JSON Formatter & Validator Online (No Upload)",
		guide: "safe-json-formatter",
		overview: [
			"Paste JSON to format, validate or minify it, or convert it to YAML. Errors are marked on the exact line and column, and you can click any value to copy its path as JSONPath, jq, JavaScript or Python.",
			"Before you copy, download or share, the formatter scans for secrets such as API keys, private keys, JWTs and passwords in connection strings, and offers to redact them. Formatting and the scan run in your browser, so your JSON is never uploaded.",
		],
		features: [
			"Format with 2 spaces, 4 spaces or tabs, minify, or sort keys.",
			"JSON to YAML and YAML to JSON.",
			"Secret scan modelled on gitleaks, with one-click redaction.",
			"Share links that carry the redacted JSON in the URL fragment, never on a server.",
			"Warnings for large numbers that lose precision in JavaScript.",
			"Handles files up to 20 MB in a background worker.",
		],
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
	{
		slug: "jwt-decoder",
		name: "JWT decoder & security check",
		description:
			"Decode a JWT, read its claims in plain English, verify its signature and check it for common security mistakes.",
		category: "Developer",
		seoTitle: "JWT Decoder & Security Checker (Free, Private)",
		guide: "jwt-decoder-security-check",
		overview: [
			"Paste a JSON Web Token to split and decode its header, payload and signature, with every claim explained in plain English and timestamps shown as real dates.",
			"A 15-check audit flags unsigned tokens, HMAC secrets found in a public list of about 104,000 leaked JWT secrets, missing expiry, risky jku, x5u and kid headers and personal data in the payload. Verify the signature with your secret or public key, all in your browser.",
		],
		features: [
			"Decodes HS, RS, PS, ES and EdDSA tokens and shows JWE headers.",
			"15 security checks, each with a plain-English fix.",
			"Signature verification with a secret, PEM, JWK or JWKS.",
			"Share links with the signature removed, so they can't be used to log in.",
			"Strips Bearer prefixes and quotes from pasted tokens.",
		],
		steps: [
			"Paste a token. The header, payload and signature are split and decoded.",
			"Read the audit: it flags unsigned tokens, weak secrets, missing expiry and risky headers.",
			"Verify the signature with your secret or public key, or share a link with the signature removed.",
		],
		faq: [
			{
				question: "Is my token sent anywhere?",
				answer: "No. Decoding, verification and the audit run in your browser. Open DevTools → Network and paste to check: the only request is the public list of known secrets, which never includes your token.",
			},
			{
				question: "Why does the share link drop the signature?",
				answer: "A full token works as a login until it expires. Without the signature, the link shows what's inside but can't be used.",
			},
			{
				question: "How does the weak-secret check work?",
				answer: "For HMAC tokens, it tries about 104,000 publicly known JWT secrets from SecLists in your browser. A match means anyone can forge tokens. No match doesn't prove the secret is strong.",
			},
			{
				question: "Can it decode encrypted tokens (JWE)?",
				answer: "It shows the header. The payload needs the private key, which this tool doesn't ask for.",
			},
		],
	},
	{
		slug: "cron-expression",
		name: "Cron expression explainer & generator",
		description:
			"Explain cron expressions in plain English, build them from a sentence, and check them for GitHub Actions, Kubernetes, AWS EventBridge, Vercel and Quartz.",
		category: "Developer",
		seoTitle: "Cron Expression Generator & Explainer",
		guide: "cron-expression-generator",
		overview: [
			"Paste a cron expression to read it in plain English, or type a schedule like 'every weekday at 9:30' and get the expression. See the next runs in your time zone and in UTC, with daylight-saving traps marked up to a year ahead.",
			"Cron isn't the same everywhere, so pick your platform: standard crontab, GitHub Actions, Kubernetes, AWS EventBridge, Vercel or Quartz. The checks flag what that platform rejects or handles differently, and the convert tab rewrites the schedule for another platform.",
		],
		features: [
			"Plain-English explanations and a sentence-to-cron builder that runs in your browser.",
			"Next run times in any IANA time zone and UTC.",
			"Platform checks for GitHub Actions, Kubernetes, EventBridge, Vercel and Quartz.",
			"Conversion between dialects, checked by comparing the next 50 runs.",
			"Copy-ready config snippets for each platform.",
		],
		steps: [
			"Pick your platform and paste an expression, or type a schedule like 'every weekday at 9am'.",
			"Read it in plain English and see the next runs in your time and UTC.",
			"Fix anything the platform checks flag, then copy the config snippet.",
		],
		faq: [
			{
				question: "Why didn't my GitHub Actions schedule run on time?",
				answer: "Schedules run in UTC unless you set timezone:, only from the default branch, and jobs at the top of the hour are often delayed. The checks tab flags each of these for your expression.",
			},
			{
				question: "Why is the day of week different in AWS EventBridge?",
				answer: "EventBridge and Quartz number days 1–7 starting at Sunday, so 2 is Monday. Crontab counts from 0 for Sunday, so 1 is Monday. The convert tab renumbers them for you.",
			},
			{
				question: "Does it handle daylight saving time?",
				answer: "Yes. Runs that fall in a skipped or repeated hour in the schedule's time zone are marked, up to a year ahead.",
			},
			{
				question: "Is anything sent to a server?",
				answer: "No. Parsing, the sentence builder and run times all work in your browser.",
			},
		],
	},
	{
		slug: "regex-tester",
		name: "Regex tester",
		description:
			"Test regular expressions live, see if they work in JavaScript, Python, Go, Java, Rust and PHP, and get code for each.",
		category: "Developer",
		seoTitle: "Regex Tester for JS, Python, Go, Java, Rust & PHP",
		guide: "regex-tester-every-language",
		overview: [
			"Write a pattern, pick flags and paste test text. Matches and capture groups highlight as you type, and every token of the pattern is explained in plain English.",
			"The Languages tab checks the same pattern against Python, Go, Java, Rust and PHP, rewrites it where the syntax differs and gives you ready-to-paste code for each. Patterns that can backtrack catastrophically are flagged, and any test that runs longer than a second is stopped.",
		],
		features: [
			"Live matching with groups highlighted, using your browser's JavaScript engine.",
			"Plain-English explanation of every token.",
			"Portability checks and rewrites for Python, Go, Java, Rust and PHP.",
			"Code generation for each language, including replacements.",
			"ReDoS detection and a one-second time limit.",
			"Share links that keep everything in the URL fragment.",
		],
		steps: [
			"Write a pattern, pick flags and paste some test text. Matches and groups highlight as you type.",
			"Read the plain-English explanation, and check for patterns that can hang a server.",
			"Open Languages to see what works where and copy ready-to-use code for your language.",
		],
		faq: [
			{
				question: "Which regex engine does it use?",
				answer: "Your browser's JavaScript engine runs the matches. Python, Go, Java, Rust and PHP are checked against their known differences, not run.",
			},
			{
				question: "Why does my regex work here but not in Go?",
				answer: "Go's engine has no lookahead, lookbehind or backreferences. The Languages tab lists exactly which part of your pattern Go can't run.",
			},
			{
				question: "What is catastrophic backtracking?",
				answer: "Some patterns take exponentially longer on certain inputs, enough to freeze a server. The tool flags those patterns and stops any test that runs longer than a second.",
			},
			{
				question: "Is my text sent anywhere?",
				answer: "No. Everything runs in your browser.",
			},
		],
	},
]
