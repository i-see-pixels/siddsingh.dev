import Script from "next/script"

import { Mailchimp } from "@/components"
import { Posts } from "@/components/blog/Posts"
import { baseURL, blog, newsletter, person, toolsHub, work } from "@/resources"
import { getPosts } from "@/utils/utils"
import { Button, Column, Heading, Meta, Row, Schema, Text } from "@once-ui-system/core"

export async function generateMetadata() {
	return Meta.generate({
		title: blog.title,
		description: blog.description,
		baseURL: baseURL,
		image: `/api/og/generate?title=${encodeURIComponent(blog.title)}`,
		path: blog.path,
	})
}

export default function Blog() {
	const latestPosts = getPosts(["src", "app", "blog", "posts"])
		.sort(
			(a, b) =>
				new Date(b.metadata.publishedAt).getTime() -
				new Date(a.metadata.publishedAt).getTime(),
		)
		.slice(0, 4)

	const blogStructuredData = [
		{
			"@context": "https://schema.org",
			"@type": "Blog",
			name: blog.title,
			description: blog.description,
			url: `${baseURL}${blog.path}`,
			publisher: {
				"@type": "Person",
				name: person.name,
				url: baseURL,
			},
		},
		{
			"@context": "https://schema.org",
			"@type": "ItemList",
			name: "Latest blog posts",
			itemListElement: latestPosts.map((post, index) => ({
				"@type": "ListItem",
				position: index + 1,
				name: post.metadata.title,
				url: `${baseURL}/blog/${post.slug}`,
				description: post.metadata.summary,
			})),
		},
	]

	return (
		<Column maxWidth="m" paddingTop="24">
			<Script id="blog-structured-data" type="application/ld+json">
				{JSON.stringify(blogStructuredData)}
			</Script>
			<Schema
				as="webPage"
				baseURL={baseURL}
				title={blog.title}
				description={blog.description}
				path={blog.path}
				image={`/api/og/generate?title=${encodeURIComponent(blog.title)}`}
				author={{
					name: person.name,
					url: `${baseURL}/blog`,
					image: `${baseURL}${person.avatar}`,
				}}
			/>
			<Column gap="16" marginBottom="l" paddingX="24">
				<Heading variant="heading-strong-xl">{blog.title}</Heading>
				<Text onBackground="neutral-weak" variant="body-default-l">
					I write about AI workflows, developer tools, side projects, and product
					engineering decisions from the work of building useful software in public.
				</Text>
				<Row gap="12" wrap>
					<Button href={work.path} variant="secondary" size="m" arrowIcon>
						See project case studies
					</Button>
					<Button href={toolsHub.path} variant="secondary" size="m" arrowIcon>
						Browse free builder tools
					</Button>
				</Row>
			</Column>
			<Column fillWidth flex={1} gap="40">
				<Posts range={[1, 1]} thumbnail />
				<Posts range={[2, 3]} columns="2" thumbnail direction="column" />
				<Mailchimp marginBottom="l" />
				<Heading as="h2" variant="heading-strong-xl" marginLeft="l">
					Earlier posts
				</Heading>
				<Posts range={[4]} columns="2" />
			</Column>
		</Column>
	)
}
