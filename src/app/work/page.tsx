import Script from "next/script"

import { Projects } from "@/components/work/Projects"
import { about, baseURL, blog, person, toolsHub, work } from "@/resources"
import { getPosts } from "@/utils/utils"
import { Button, Column, Heading, Meta, Row, Schema, Text } from "@once-ui-system/core"

export async function generateMetadata() {
	return Meta.generate({
		title: work.title,
		description: work.description,
		baseURL: baseURL,
		image: `/api/og/generate?title=${encodeURIComponent(work.title)}`,
		path: work.path,
	})
}

export default function Work() {
	const projects = getPosts(["src", "app", "work", "projects"]).sort(
		(a, b) =>
			new Date(b.metadata.publishedAt).getTime() - new Date(a.metadata.publishedAt).getTime(),
	)

	const workStructuredData = [
		{
			"@context": "https://schema.org",
			"@type": "CollectionPage",
			name: work.title,
			description: work.description,
			url: `${baseURL}${work.path}`,
		},
		{
			"@context": "https://schema.org",
			"@type": "ItemList",
			name: "Project case studies",
			itemListElement: projects.map((project, index) => ({
				"@type": "ListItem",
				position: index + 1,
				name: project.metadata.title,
				url: `${baseURL}/work/${project.slug}`,
				description: project.metadata.summary,
			})),
		},
	]

	return (
		<Column maxWidth="m" paddingTop="24">
			<Script id="work-structured-data" type="application/ld+json">
				{JSON.stringify(workStructuredData)}
			</Script>
			<Schema
				as="webPage"
				baseURL={baseURL}
				path={work.path}
				title={work.title}
				description={work.description}
				image={`/api/og/generate?title=${encodeURIComponent(work.title)}`}
				author={{
					name: person.name,
					url: `${baseURL}${about.path}`,
					image: `${baseURL}${person.avatar}`,
				}}
			/>
			<Column gap="16" marginBottom="l" paddingX="24">
				<Heading variant="heading-strong-xl" align="center">
					{work.title}
				</Heading>
				<Text onBackground="neutral-weak" variant="body-default-l" align="center">
					These case studies cover AI tools, browser extensions, developer tooling, and
					solo product experiments, with a focus on product thinking, implementation
					details, and time-to-value.
				</Text>
				<Row gap="12" wrap horizontal="center">
					<Button href={toolsHub.path} variant="secondary" size="m" arrowIcon>
						Open free builder tools
					</Button>
					<Button href={blog.path} variant="secondary" size="m" arrowIcon>
						Read related build notes
					</Button>
				</Row>
			</Column>
			<Projects />
		</Column>
	)
}
