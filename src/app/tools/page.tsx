import Script from "next/script"

import { ToolsHubView } from "@/features/tools/ToolsHubView"
import { getLiveToolEntries } from "@/features/tools/registry"
import { baseURL, blog, person, toolsHub, work } from "@/resources"
import { Button, Column, Meta, Row, Schema, Text } from "@once-ui-system/core"

export async function generateMetadata() {
	return Meta.generate({
		title: toolsHub.title,
		description: toolsHub.description,
		baseURL,
		image: `/api/og/generate?title=${encodeURIComponent(toolsHub.title)}`,
		path: toolsHub.path,
	})
}

export default function ToolsPage() {
	const liveTools = getLiveToolEntries()
	const toolsStructuredData = [
		{
			"@context": "https://schema.org",
			"@type": "CollectionPage",
			name: toolsHub.title,
			description: toolsHub.description,
			url: `${baseURL}${toolsHub.path}`,
		},
		{
			"@context": "https://schema.org",
			"@type": "ItemList",
			name: "Free browser-based tools",
			itemListElement: liveTools.map((tool, index) => ({
				"@type": "ListItem",
				position: index + 1,
				name: tool.name,
				url: `${baseURL}${tool.path}`,
				description: tool.description,
			})),
		},
	]

	return (
		<Column maxWidth="l" fillWidth>
			<Script id="tools-structured-data" type="application/ld+json">
				{JSON.stringify(toolsStructuredData)}
			</Script>
			<Schema
				as="webPage"
				baseURL={baseURL}
				title={toolsHub.title}
				description={toolsHub.description}
				path={toolsHub.path}
				image={`/api/og/generate?title=${encodeURIComponent(toolsHub.title)}`}
				author={{
					name: person.name,
					url: `${baseURL}${toolsHub.path}`,
					image: `${baseURL}${person.avatar}`,
				}}
			/>
			<Column gap="16" paddingTop="24" paddingX="24" maxWidth="m">
				<Text variant="display-strong-xs">{toolsHub.title}</Text>
				<Text onBackground="neutral-weak" variant="body-default-l">
					This is where I publish free browser-based tools for screenshots, launch
					visuals, and product assets that help builders move faster without installing a
					full design stack.
				</Text>
				<Row gap="12" wrap>
					<Button href={work.path} variant="secondary" size="m" arrowIcon>
						See tools behind the projects
					</Button>
					<Button href={blog.path} variant="secondary" size="m" arrowIcon>
						Read how these tools get built
					</Button>
				</Row>
			</Column>
			<ToolsHubView />
		</Column>
	)
}
