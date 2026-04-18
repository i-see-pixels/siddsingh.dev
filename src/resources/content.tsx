import type { About, Blog, Home, Newsletter, Person, Social, ToolsHub, Work } from "@/types"
import { Line, Row, Text } from "@once-ui-system/core"

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
	image: "/images/og/home.jpg",
	label: "Home",
	title: `${person.name} | ${person.role}`,
	description:
		"Portfolio of Siddhant Singh, a software engineer building solo products, developer tools, and practical AI workflows.",
	headline: <>Shipping solo products, developer tools, and practical AI workflows</>,
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
			I'm Siddhant, a software engineer at{" "}
			<Text as="span" size="xl" weight="strong">
				Optum
			</Text>{" "}
			based in Gurugram. Outside work, I build solo ideas, developer tooling, and AI-enabled
			experiments with Next.js, TypeScript, and product-first thinking.
		</>
	),
}

const about: About = {
	path: "/about",
	label: "About",
	title: `About ${person.name}`,
	description: `Meet ${person.name}, a ${person.role.toLowerCase()} based in ${person.location}.`,
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
					I work as a software engineer at Optum and spend my off-hours building
					independent products and developer tools. I enjoy turning rough ideas into
					reliable software, especially when the problem sits at the intersection of
					product thinking, automation, and developer experience.
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
	title: "Notes on building",
	description: `Personal notes from ${person.name} on solo products, developer tools, and practical AI workflows.`,
}

const work: Work = {
	path: "/work",
	label: "Work",
	title: "Selected projects",
	description: `Solo products, experiments, and developer tools by ${person.name}.`,
}

const toolsHub: ToolsHub = {
	path: "/tools",
	label: "Tools",
	title: `Free tools – ${person.name}`,
	description: `Free browser-based tools by ${person.name} for screenshots, visuals, and product assets.`,
}

export { person, social, newsletter, home, about, blog, work, toolsHub }
