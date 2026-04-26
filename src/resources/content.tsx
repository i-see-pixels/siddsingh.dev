import type { About, Blog, Home, Newsletter, Person, Social, ToolsHub, Work } from "@/types"
import { Column, Row, Text } from "@once-ui-system/core"

const person: Person = {
	firstName: "Siddhant",
	lastName: "Singh",
	name: "Siddhant Singh",
	role: "Software Engineer",
	avatar: "/images/avatar.png",
	email: "siddhant06137@gmail.com",
	location: "Gurugram, India",
	timeZone: "Asia/Calcutta",
	languages: [
		{ key: "en", value: "English" },
		{ key: "hi", value: "Hindi" },
	],
}

const newsletter: Newsletter = {
	display: false,
	title: <>Subscribe to {person.firstName}'s Newsletter</>,
	description: <>Occasional notes on product building, AI workflows, and developer tools.</>,
}

const social: Social = [
	{
		name: "GitHub",
		icon: "github",
		link: "https://github.com/i-see-pixels",
		essential: true,
	},
	{
		name: "LinkedIn",
		icon: "linkedin",
		link: "https://www.linkedin.com/in/sidd-singh/",
		essential: true,
	},
	{
		name: "X",
		icon: "x",
		link: "https://x.com/creatorsidd",
		essential: true,
	},
	{
		name: "Email",
		icon: "email",
		link: `mailto:${person.email}`,
		essential: true,
	},
]

const home: Home = {
	path: "/",
	image: "/images/og/home.png",
	label: "Home",
	title: `${person.name} | AI Workflows, Developer Tools, and Solo Product Engineering`,
	description:
		"Siddhant Singh is a software engineer building AI workflows, developer tools, and solo products with Next.js, TypeScript, and product-first engineering.",
	headline: (
		<>AI workflows, developer tools, and solo products built with product-first engineering</>
	),
	featured: {
		display: true,
		title: (
			<Row gap="12" vertical="center">
				<Text marginRight="4" onBackground="brand-medium">
					Featured project
				</Text>
			</Row>
		),
		href: "/work/plenz",
	},
	subline: (
		<>
			I'm Siddhant, a software engineer, living in Gurugram. I build browser-based tools,
			AI-assisted workflows, and solo product experiments with Next.js, TypeScript, and a
			practical product engineering mindset for builders who want useful software, not demo
			ware.
		</>
	),
}

const about: About = {
	path: "/about",
	label: "About",
	title: `About ${person.name} | Software Engineer, AI Workflows, and Developer Tools`,
	description: `${person.name} is a ${person.role.toLowerCase()} based in ${person.location} building AI workflows, developer tools, browser extensions, and solo products with Next.js and TypeScript.`,
	tableOfContent: {
		display: true,
		subItems: false,
	},
	avatar: {
		display: true,
	},
	calendar: {
		display: true,
		link: "https://cal.com/sidd-singh/15min",
	},
	intro: {
		display: true,
		title: "Introduction",
		description: (
			<>
				<Text as="p">
					I work as a software engineer and spend my off-hours building independent
					products and developer tools. I enjoy turning rough ideas into reliable
					software, especially when the problem sits at the intersection of product
					thinking, automation, and developer experience.
				</Text>
				<Text as="p">
					Recent work has centered on AI-assisted workflows, browser extensions, Next.js
					applications, and tools that help people move from idea to implementation
					faster. I care about simple interfaces, fast feedback loops, and building things
					that are genuinely useful.
				</Text>
			</>
		),
	},
	work: {
		display: true,
		title: "Work",
		experiences: [
			{
				company: "Optum",
				timeframe: "Current",
				role: "Software Engineer",
				achievements: [
					{
						key: "01",
						value: (
							<>
								Contribute to product engineering work with a focus on practical
								implementation, maintainable code, and dependable user-facing
								experiences.
							</>
						),
					},
					{
						key: "02",
						value: (
							<>
								Bring a maker mindset into day-to-day engineering by exploring
								better workflows, automation opportunities, and sharper developer
								experience.
							</>
						),
					},
				],
				images: [],
			},
			{
				company: "Independent",
				timeframe: "Ongoing",
				role: "Solo products and developer tools",
				achievements: [
					{
						key: "01",
						value: (
							<>
								Build and iterate on projects like plenz, admin-boil, and
								multi-server MCP tooling to explore new product ideas in public.
							</>
						),
					},
					{
						key: "02",
						value: (
							<>
								Use side projects to deepen hands-on experience with browser
								extensions, AI integrations, Next.js applications, TypeScript, and
								distribution-first product development.
							</>
						),
					},
				],
				images: [],
			},
		],
	},
	studies: {
		display: true,
		title: "Studies",
		institutions: [
			{
				name: "Delhi Technological University",
				description: <>Bachelor of Technology in Computer Science and Engineering</>,
			},
		],
	},
	technical: {
		display: true,
		title: "Focus Areas",
		skills: [
			{
				title: "Product engineering",
				description: (
					<>
						Building full-stack product experiences with TypeScript, Next.js, and modern
						frontend tooling.
					</>
				),
				tags: [
					{
						name: "JavaScript",
						icon: "javascript",
					},
					{
						name: "Next.js",
						icon: "nextjs",
					},
				],
				images: [],
			},
			{
				title: "AI and developer tooling",
				description: (
					<>
						Prototyping AI-assisted workflows, browser extensions, and internal tools
						that help ideas ship faster.
					</>
				),
				tags: [
					{
						name: "JavaScript",
						icon: "javascript",
					},
					{
						name: "Next.js",
						icon: "nextjs",
					},
				],
				images: [],
			},
		],
	},
}

const blog: Blog = {
	path: "/blog",
	label: "Blog",
	title: "Blog | AI Workflows, Developer Tools, and Solo Product Notes",
	description: `Essays and build notes from ${person.name} on AI workflows, developer tools, product engineering, and finishing side projects.`,
}

const work: Work = {
	path: "/work",
	label: "Work",
	title: "Projects | AI Tools, Developer Tools, and Solo Product Case Studies",
	description: `Case studies and project breakdowns from ${person.name} covering AI tools, browser extensions, developer tooling, and solo product experiments.`,
}

const toolsHub: ToolsHub = {
	path: "/tools",
	label: "Tools",
	title: "Free Tools | Screenshot Mockups, Launch Visuals, and Product Asset Utilities",
	description: `Free browser-based tools by ${person.name} for screenshot mockups, launch visuals, product assets, and fast workflows for builders.`,
}

export { person, social, newsletter, home, about, blog, work, toolsHub }
