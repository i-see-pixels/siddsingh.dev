import type { About, Blog, Gallery, Home, Newsletter, Person, Social, Work } from "@/types"
import { Line, Row, Text } from "@once-ui-system/core"

const person: Person = {
	firstName: "Siddhant",
	lastName: "Singh",
	name: "Siddhant Singh",
	role: "Software Engineer",
	avatar: "/images/avatar.png",
	email: "siddhant06137@gmail.com",
	location: "Asia/Calcutta", // Expecting the IANA time zone identifier, e.g., 'Europe/Vienna'
	languages: [
		{ key: "en", value: "English" },
		{ key: "hi", value: "Hindi" },
	], // optional: Leave the array empty if you don't want to display languages
}

const newsletter: Newsletter = {
	display: true,
	title: <>Subscribe to {person.firstName}'s Newsletter</>,
	description: <>My weekly newsletter about creativity and engineering</>,
}

const social: Social = [
	// Links are automatically displayed.
	// Import new icons in /once-ui/icons.ts
	// Set essentials: true for links you want to show on the about page
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
		name: "Instagram",
		icon: "instagram",
		link: "https://www.instagram.com/http.sidd.sin/",
		essential: false,
	},
	{
		name: "x.com",
		icon: "x",
		link: "https://www.x.com/creatorsidd",
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
	title: `${person.name}'s Portfolio`,
	description: `Portfolio website showcasing my work as a ${person.role}`,
	headline: <>Building bridges between design and code</>,
	featured: {
		display: true,
		title: (
			<Row gap="12" vertical="center">
				<Text marginRight="4" onBackground="brand-medium">
					Featured work
				</Text>
			</Row>
		),
		href: "/work/building-once-ui-a-customizable-design-system",
	},
	subline: (
		<>
			I'm Siddhant, a software engineer at{" "}
			<Text as="span" size="xl" weight="strong">
				Optum
			</Text>
			, where I craft intuitive <br /> software solutions. After hours, I build my own
			projects.
		</>
	),
}

const about: About = {
	path: "/about",
	label: "About",
	title: `About - ${person.name}`,
	description: `Meet ${person.name}, ${person.role} from ${person.location}`,
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
				Siddhant is a software engineer at Optum with a passion for transforming complex
				challenges into simple, elegant design solutions. His work spans digital interfaces,
				interactive experiences, and the convergence of design and technology.
			</>
		),
	},
	work: {
		display: true, // set to false to hide this section
		title: "Work Experience",
		experiences: [
			{
				company: "FLY",
				timeframe: "2022 - Present",
				role: "Senior Design Engineer",
				achievements: [
					{
						key: "01",
						value: (
							<>
								Redesigned the UI/UX for the FLY platform, resulting in a 20%
								increase in user engagement and 30% faster load times.
							</>
						),
					},
					{
						key: "02",
						value: (
							<>
								Spearheaded the integration of AI tools into design workflows,
								enabling designers to iterate 50% faster.
							</>
						),
					},
				],
				images: [
					// optional: leave the array empty if you don't want to display images
					{
						src: "/images/projects/project-01/cover-01.jpg",
						alt: "Once UI Project",
						width: 16,
						height: 9,
					},
				],
			},
			{
				company: "Creativ3",
				timeframe: "2018 - 2022",
				role: "Lead Designer",
				achievements: [
					{
						key: "01",
						value: (
							<>
								Developed a design system that unified the brand across multiple
								platforms, improving design consistency by 40%.
							</>
						),
					},
					{
						key: "02",
						value: (
							<>
								Led a cross-functional team to launch a new product line,
								contributing to a 15% increase in overall company revenue.
							</>
						),
					},
				],
				images: [],
			},
		],
	},
	studies: {
		display: true, // set to false to hide this section
		title: "Studies",
		institutions: [
			{
				name: "Delhi Technological University",
				description: <>Bachelor of Technology in Computer Science and Engineering</>,
			},
		],
	},
	technical: {
		display: true, // set to false to hide this section
		title: "Technical skills",
		skills: [
			{
				title: "Figma",
				description: <>Able to prototype in Figma with Once UI with unnatural speed.</>,
				tags: [
					{
						name: "Figma",
						icon: "figma",
					},
				],
				// optional: leave the array empty if you don't want to display images
				images: [
					{
						src: "/images/projects/project-01/cover-02.jpg",
						alt: "Project image",
						width: 16,
						height: 9,
					},
					{
						src: "/images/projects/project-01/cover-03.jpg",
						alt: "Project image",
						width: 16,
						height: 9,
					},
				],
			},
			{
				title: "Next.js",
				description: <>Building next gen apps with Next.js + Once UI + Supabase.</>,
				tags: [
					{
						name: "JavaScript",
						icon: "javascript",
					},
					{
						name: "Next.js",
						icon: "nextjs",
					},
					{
						name: "Supabase",
						icon: "supabase",
					},
				],
				// optional: leave the array empty if you don't want to display images
				images: [
					{
						src: "/images/projects/project-01/cover-04.jpg",
						alt: "Project image",
						width: 16,
						height: 9,
					},
				],
			},
		],
	},
}

const blog: Blog = {
	path: "/blog",
	label: "Blog",
	title: "Writing about design and tech...",
	description: `Read what ${person.name} has been up to recently`,
	// Create new blog posts by adding a new .mdx file to app/blog/posts
	// All posts will be listed on the /blog route
}

const work: Work = {
	path: "/work",
	label: "Work",
	title: `Projects – ${person.name}`,
	description: `Design and dev projects by ${person.name}`,
	// Create new project pages by adding a new .mdx file to app/blog/posts
	// All projects will be listed on the /home and /work routes
}

const gallery: Gallery = {
	path: "/gallery",
	label: "Gallery",
	title: `Photo gallery – ${person.name}`,
	description: `A photo collection by ${person.name}`,
	// Images by https://lorant.one
	// These are placeholder images, replace with your own
	images: [
		{
			src: "/images/gallery/horizontal-1.jpg",
			alt: "image",
			orientation: "horizontal",
		},
		{
			src: "/images/gallery/vertical-4.jpg",
			alt: "image",
			orientation: "vertical",
		},
		{
			src: "/images/gallery/horizontal-3.jpg",
			alt: "image",
			orientation: "horizontal",
		},
		{
			src: "/images/gallery/vertical-1.jpg",
			alt: "image",
			orientation: "vertical",
		},
		{
			src: "/images/gallery/vertical-2.jpg",
			alt: "image",
			orientation: "vertical",
		},
		{
			src: "/images/gallery/horizontal-2.jpg",
			alt: "image",
			orientation: "horizontal",
		},
		{
			src: "/images/gallery/horizontal-4.jpg",
			alt: "image",
			orientation: "horizontal",
		},
		{
			src: "/images/gallery/vertical-3.jpg",
			alt: "image",
			orientation: "vertical",
		},
	],
}

export { person, social, newsletter, home, about, blog, work, gallery }
