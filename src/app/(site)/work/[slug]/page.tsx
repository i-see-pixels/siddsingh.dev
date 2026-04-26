import Script from "next/script"

import { CustomMDX, ScrollToHash } from "@/components"
import { Projects } from "@/components/work/Projects"
import { about, baseURL, person, work } from "@/resources"
import { formatDate } from "@/utils/formatDate"
import { getPosts } from "@/utils/utils"
import {
	Avatar,
	AvatarGroup,
	Button,
	Column,
	Flex,
	Heading,
	Line,
	Media,
	Meta,
	Row,
	Schema,
	SmartLink,
	Text,
} from "@once-ui-system/core"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

export async function generateStaticParams(): Promise<{ slug: string }[]> {
	const posts = getPosts(["src", "app", "work", "projects"])
	return posts.map((post) => ({
		slug: post.slug,
	}))
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string | string[] }>
}): Promise<Metadata> {
	const routeParams = await params
	const slugPath = Array.isArray(routeParams.slug)
		? routeParams.slug.join("/")
		: routeParams.slug || ""

	const posts = getPosts(["src", "app", "work", "projects"])
	const post = posts.find((post) => post.slug === slugPath)

	if (!post) return {}

	const generatedMeta = await Meta.generate({
		title: `${post.metadata.title} | Project Case Study | ${person.name}`,
		description: post.metadata.summary,
		baseURL: baseURL,
		image: post.metadata.image || `/api/og/generate?title=${post.metadata.title}`,
		path: `${work.path}/${post.slug}`,
	})

	return {
		...generatedMeta,
		alternates: {
			canonical: `/work/${post.slug}`,
		},
	}
}

export default async function Project({
	params,
}: {
	params: Promise<{ slug: string | string[] }>
}) {
	const routeParams = await params
	const slugPath = Array.isArray(routeParams.slug)
		? routeParams.slug.join("/")
		: routeParams.slug || ""

	const post = getPosts(["src", "app", "work", "projects"]).find((post) => post.slug === slugPath)

	if (!post) {
		notFound()
	}

	const avatars =
		post.metadata.team?.map((person) => ({
			src: person.avatar,
		})) || []
	const projectStructuredData = [
		{
			"@context": "https://schema.org",
			"@type": "CreativeWork",
			name: post.metadata.title,
			description: post.metadata.summary,
			datePublished: post.metadata.publishedAt,
			dateModified: post.metadata.publishedAt,
			url: `${baseURL}${work.path}/${post.slug}`,
			image:
				post.metadata.images.length > 0
					? `${baseURL}${post.metadata.images[0]}`
					: undefined,
			author: {
				"@type": "Person",
				name: person.name,
				url: `${baseURL}${about.path}`,
			},
		},
		{
			"@context": "https://schema.org",
			"@type": "BreadcrumbList",
			itemListElement: [
				{ "@type": "ListItem", position: 1, name: "Home", item: baseURL },
				{
					"@type": "ListItem",
					position: 2,
					name: work.label,
					item: `${baseURL}${work.path}`,
				},
				{
					"@type": "ListItem",
					position: 3,
					name: post.metadata.title,
					item: `${baseURL}${work.path}/${post.slug}`,
				},
			],
		},
	]

	return (
		<Column as="section" maxWidth="m" horizontal="center" gap="l">
			<Script id={`project-${post.slug}-structured-data`} type="application/ld+json">
				{JSON.stringify(projectStructuredData)}
			</Script>
			<Schema
				as="webPage"
				baseURL={baseURL}
				path={`${work.path}/${post.slug}`}
				title={post.metadata.title}
				description={post.metadata.summary}
				datePublished={post.metadata.publishedAt}
				dateModified={post.metadata.publishedAt}
				image={
					post.metadata.image ||
					`/api/og/generate?title=${encodeURIComponent(post.metadata.title)}`
				}
				author={{
					name: person.name,
					url: `${baseURL}${about.path}`,
					image: `${baseURL}${person.avatar}`,
				}}
			/>
			<Column maxWidth="s" gap="16" horizontal="center" align="center">
				<SmartLink href="/work">
					<Text variant="label-strong-m">Projects</Text>
				</SmartLink>
				<Text variant="body-default-xs" onBackground="neutral-weak" marginBottom="12">
					{post.metadata.publishedAt && formatDate(post.metadata.publishedAt)}
				</Text>
				<Heading variant="display-strong-m">{post.metadata.title}</Heading>
				<Text variant="body-default-l" onBackground="neutral-weak" align="center">
					{post.metadata.summary}
				</Text>
			</Column>
			<Row marginBottom="32" horizontal="center">
				<Row gap="16" vertical="center">
					{post.metadata.team && <AvatarGroup reverse avatars={avatars} size="s" />}
					<Text variant="label-default-m" onBackground="brand-weak">
						{post.metadata.team?.map((member, idx) => (
							<span key={`${member.name}-${idx}`}>
								{idx > 0 && (
									<Text as="span" onBackground="neutral-weak">
										,{" "}
									</Text>
								)}
								<SmartLink href={member.linkedIn}>{member.name}</SmartLink>
							</span>
						))}
					</Text>
				</Row>
			</Row>
			{post.metadata.link && (
				<Button
					href={post.metadata.link}
					variant="secondary"
					size="m"
					weight="default"
					prefixIcon="arrowUpRightFromSquare"
				>
					View live project
				</Button>
			)}
			{post.metadata.images.length > 0 && (
				<Media
					priority
					aspectRatio="16 / 9"
					radius="m"
					alt="image"
					src={post.metadata.images[0]}
				/>
			)}
			<Column style={{ margin: "auto" }} as="article" maxWidth="xs">
				<CustomMDX source={post.content} />
			</Column>
			<Column fillWidth gap="40" horizontal="center" marginTop="40">
				<Line maxWidth="40" />
				<Heading as="h2" variant="heading-strong-xl" marginBottom="24">
					Related projects
				</Heading>
				<Projects exclude={[post.slug]} range={[2]} />
			</Column>
			<ScrollToHash />
		</Column>
	)
}
