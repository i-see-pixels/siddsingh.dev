import Script from "next/script"

import { Mailchimp } from "@/components"
import { Posts } from "@/components/blog/Posts"
import { Projects } from "@/components/work/Projects"
import { getFeaturedTool } from "@/features/tools/registry"
import { about, baseURL, blog, home, person, routes, toolsHub, work } from "@/resources"
import { getPosts } from "@/utils/utils"
import {
	Avatar,
	Badge,
	Button,
	Column,
	Heading,
	Line,
	Meta,
	RevealFx,
	Row,
	Schema,
	Text,
} from "@once-ui-system/core"

export async function generateMetadata() {
	const generatedMeta = await Meta.generate({
		title: home.title,
		description: home.description,
		baseURL: baseURL,
		path: home.path,
		image: home.image,
	})

	return {
		...generatedMeta,
		alternates: {
			canonical: "/",
		},
	}
}

export default function Home() {
	const featuredTool = getFeaturedTool()
	const featuredProjects = getPosts(["src", "app", "work", "projects"])
		.sort(
			(a, b) =>
				new Date(b.metadata.publishedAt).getTime() -
				new Date(a.metadata.publishedAt).getTime(),
		)
		.slice(0, 2)
	const latestPosts = getPosts(["src", "app", "blog", "posts"])
		.sort(
			(a, b) =>
				new Date(b.metadata.publishedAt).getTime() -
				new Date(a.metadata.publishedAt).getTime(),
		)
		.slice(0, 2)

	const homepageStructuredData = [
		{
			"@context": "https://schema.org",
			"@type": "WebSite",
			name: person.name,
			url: baseURL,
			description: home.description,
			inLanguage: "en",
			keywords: [
				"AI workflows",
				"developer tools",
				"solo products",
				"product engineering",
				"Next.js",
				"TypeScript",
			],
		},
		{
			"@context": "https://schema.org",
			"@type": "Person",
			name: person.name,
			url: baseURL,
			image: `${baseURL}${person.avatar}`,
			jobTitle: person.role,
			description: home.description,
			email: person.email,
			homeLocation: {
				"@type": "Place",
				name: person.location,
			},
			worksFor: {
				"@type": "Organization",
				name: "Optum",
			},
			alumniOf: {
				"@type": "CollegeOrUniversity",
				name: "Delhi Technological University",
			},
			sameAs: [
				"https://github.com/i-see-pixels",
				"https://www.linkedin.com/in/sidd-singh/",
				"https://x.com/creatorsidd",
			],
			knowsAbout: [
				"AI workflows",
				"developer tools",
				"Next.js",
				"TypeScript",
				"product engineering",
				"solo product development",
			],
		},
		{
			"@context": "https://schema.org",
			"@type": "ItemList",
			name: "Featured resources from siddsingh.dev",
			itemListElement: [
				{
					"@type": "ListItem",
					position: 1,
					name: featuredTool.name,
					url: `${baseURL}${featuredTool.path}`,
					description: featuredTool.description,
				},
				...featuredProjects.map((project, index) => ({
					"@type": "ListItem",
					position: index + 2,
					name: project.metadata.title,
					url: `${baseURL}/work/${project.slug}`,
					description: project.metadata.summary,
				})),
				...latestPosts.map((post, index) => ({
					"@type": "ListItem",
					position: index + 2 + featuredProjects.length,
					name: post.metadata.title,
					url: `${baseURL}/blog/${post.slug}`,
				})),
			],
		},
	]

	return (
		<Column maxWidth="m" gap="xl" paddingY="12" horizontal="center">
			<Script id="homepage-structured-data" type="application/ld+json">
				{JSON.stringify(homepageStructuredData)}
			</Script>
			<Schema
				as="webPage"
				baseURL={baseURL}
				path={home.path}
				title={home.title}
				description={home.description}
				image={`/api/og/generate?title=${encodeURIComponent(home.title)}`}
				author={{
					name: person.name,
					url: `${baseURL}${about.path}`,
					image: `${baseURL}${person.avatar}`,
				}}
			/>
			<Column fillWidth horizontal="center" gap="m">
				<Column maxWidth="s" horizontal="center" align="center">
					{home.featured.display && (
						<RevealFx
							fillWidth
							horizontal="center"
							paddingTop="16"
							paddingBottom="32"
							paddingLeft="12"
						>
							<Badge
								background="brand-alpha-weak"
								paddingX="12"
								paddingY="4"
								onBackground="neutral-strong"
								textVariant="label-default-s"
								arrow={false}
								href={home.featured.href}
							>
								<Row paddingY="2">{home.featured.title}</Row>
							</Badge>
						</RevealFx>
					)}
					<RevealFx translateY="4" fillWidth horizontal="center" paddingBottom="16">
						<Heading wrap="balance" variant="display-strong-l">
							{home.headline}
						</Heading>
					</RevealFx>
					<RevealFx
						translateY="8"
						delay={0.2}
						fillWidth
						horizontal="center"
						paddingBottom="32"
					>
						<Text
							wrap="balance"
							onBackground="neutral-weak"
							variant="heading-default-xl"
						>
							{home.subline}
						</Text>
					</RevealFx>
					<RevealFx paddingTop="12" delay={0.4} horizontal="center" paddingLeft="12">
						<Button
							id="about"
							data-border="rounded"
							href={about.path}
							variant="secondary"
							size="m"
							weight="default"
							arrowIcon
						>
							<Row gap="8" vertical="center" paddingRight="4">
								{about.avatar.display && (
									<Avatar
										marginRight="8"
										style={{ marginLeft: "-0.75rem" }}
										src={person.avatar}
										size="m"
									/>
								)}
								{about.label}
							</Row>
						</Button>
					</RevealFx>
					<RevealFx translateY="12" delay={0.5} fillWidth paddingTop="24">
						<Column
							fillWidth
							maxWidth="m"
							padding="24"
							radius="xl"
							border="neutral-alpha-weak"
							background="neutral-alpha-weak"
							gap="20"
						>
							<Column gap="8">
								<Text variant="label-default-m" onBackground="brand-weak">
									What you&apos;ll find here
								</Text>
								<Text onBackground="neutral-weak" variant="body-default-l">
									I publish practical work across three tracks: browser-based
									tools for builders, case studies from shipped product
									experiments, and notes on AI workflows, side projects, and
									product engineering.
								</Text>
							</Column>
							<Row gap="12" wrap>
								<Button
									href={toolsHub.path}
									variant="secondary"
									size="m"
									weight="default"
									arrowIcon
								>
									Explore browser-based tools
								</Button>
								<Button
									href={work.path}
									variant="secondary"
									size="m"
									weight="default"
									arrowIcon
								>
									See product case studies
								</Button>
								<Button
									href={blog.path}
									variant="secondary"
									size="m"
									weight="default"
									arrowIcon
								>
									Read notes on shipping side projects
								</Button>
							</Row>
						</Column>
					</RevealFx>
				</Column>
			</Column>
			<RevealFx translateY="16" delay={0.6} fillWidth>
				<Column fillWidth gap="24">
					<Column fillWidth paddingX="l" gap="12">
						<Text variant="label-default-m" onBackground="brand-weak">
							Credibility snapshot
						</Text>
						<Heading as="h2" variant="display-strong-xs" wrap="balance">
							Proof of work across AI tooling, solo products, and product engineering
						</Heading>
						<Column gap="12">
							<Text onBackground="neutral-weak" variant="body-default-l">
								Based in Gurugram, I work on software at Optum and use independent
								projects to deepen my hands-on experience with Next.js, TypeScript,
								browser extensions, and AI-assisted product workflows.
							</Text>
							<Text onBackground="neutral-weak" variant="body-default-m">
								Built <strong>plenz</strong>, an open-source AI prompt refiner that
								works across ChatGPT, Claude, Gemini, and Perplexity.
							</Text>
							<Text onBackground="neutral-weak" variant="body-default-m">
								Created <strong>{featuredTool.name}</strong>, a browser-based
								screenshot tool for launch visuals, changelogs, docs, and portfolio
								assets.
							</Text>
							<Text onBackground="neutral-weak" variant="body-default-m">
								Write about finishing side projects, evaluating ideas, and building
								practical AI and developer tooling in public.
							</Text>
						</Column>
					</Column>
					<Column fillWidth paddingX="l" gap="12">
						<Text variant="label-default-m" onBackground="brand-weak">
							Featured tool
						</Text>
						<Heading as="h2" variant="display-strong-xs" wrap="balance">
							A browser-based screenshot tool for faster launch-ready visuals
						</Heading>
						<Text onBackground="neutral-weak" variant="body-default-l">
							{featuredTool.name} helps founders, engineers, and product teams turn
							raw screenshots into polished assets without opening a heavyweight
							design tool. It stays close to the real job to be done: create cleaner
							visuals for product posts, changelogs, docs, and case studies.
						</Text>
						<Row gap="12" wrap>
							<Button
								href={featuredTool.path}
								variant="secondary"
								size="m"
								weight="default"
								arrowIcon
							>
								Open browser-based screenshot tool
							</Button>
							<Button
								href={toolsHub.path}
								variant="secondary"
								size="m"
								weight="default"
								arrowIcon
							>
								Browse all builder tools
							</Button>
						</Row>
					</Column>
					<Column fillWidth gap="12">
						<Column paddingX="l" gap="8">
							<Text variant="label-default-m" onBackground="brand-weak">
								Featured project work
							</Text>
							<Heading as="h2" variant="display-strong-xs" wrap="balance">
								Case studies from products and experiments shipped in public
							</Heading>
							<Text onBackground="neutral-weak" variant="body-default-l">
								These projects show how I approach AI product UX, developer tooling,
								and pragmatic implementation from idea to shipped experience.
							</Text>
						</Column>
						<Projects range={[1, 1]} />
					</Column>
				</Column>
			</RevealFx>
			{routes["/blog"] && (
				<Column fillWidth gap="24" marginBottom="l">
					<Row fillWidth paddingRight="64">
						<Line maxWidth={48} />
					</Row>
					<Row fillWidth gap="24" marginTop="40" s={{ direction: "column" }}>
						<Row flex={1} paddingLeft="l" paddingTop="24">
							<Column gap="8">
								<Text variant="label-default-m" onBackground="brand-weak">
									Writing
								</Text>
								<Heading as="h2" variant="display-strong-xs" wrap="balance">
									Notes on AI workflows, side projects, and product decisions
								</Heading>
								<Text onBackground="neutral-weak" variant="body-default-m">
									Recent writing covers how I evaluate side projects, build AI
									tools, and think through product engineering tradeoffs in
									public.
								</Text>
							</Column>
						</Row>
						<Row flex={3} paddingX="20">
							<Posts range={[1, 2]} columns="2" />
						</Row>
					</Row>
					<Row fillWidth paddingLeft="64" horizontal="end">
						<Line maxWidth={48} />
					</Row>
				</Column>
			)}
			<Column fillWidth gap="12">
				<Column paddingX="l" gap="8">
					<Text variant="label-default-m" onBackground="brand-weak">
						More project work
					</Text>
					<Heading as="h2" variant="display-strong-xs" wrap="balance">
						More solo products, experiments, and developer tooling
					</Heading>
					<Text onBackground="neutral-weak" variant="body-default-l">
						Explore additional product experiments, implementation details, and build
						choices across AI, developer experience, and launch-focused utilities.
					</Text>
				</Column>
				<Projects range={[2]} />
			</Column>
			<Mailchimp />
		</Column>
	)
}
