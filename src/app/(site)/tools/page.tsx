import Script from "next/script"

import { ToolsHubView } from "@/features/tools/ToolsHubView"
import { getLiveToolEntries } from "@/features/tools/registry"
import { baseURL, person, toolsHub } from "@/resources"
import { Column, Meta, Schema, Text } from "@once-ui-system/core"

export async function generateMetadata() {
	const generatedMeta = await Meta.generate({
		title: toolsHub.title,
		description: toolsHub.description,
		baseURL,
		image: `/api/og/generate?title=${encodeURIComponent(toolsHub.title)}`,
		path: toolsHub.path,
	})

	return {
		...generatedMeta,
		alternates: {
			canonical: "/tools",
		},
	}
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
		<Column maxWidth="l" fillWidth align="center">
			<Script id="tools-structured-data" type="application/ld+json">
				{JSON.stringify(toolsStructuredData)}
			</Script>
			<Schema
				as="webPage"
				baseURL={baseURL}
				title={toolsHub.title}
				description={toolsHub.description}
				path={toolsHub.path}
				image={`/api/og/generate?title=${encodeURIComponent("Free Tools")}`}
				author={{
					name: person.name,
					url: `${baseURL}${toolsHub.path}`,
					image: `${baseURL}${person.avatar}`,
				}}
			/>
			<Column gap="16" marginBottom="48" paddingX="24" align="center" fillWidth>
				<Text as="h1" variant="display-strong-s" align="center">
					Free tools for builders
				</Text>
				<Text
					onBackground="neutral-weak"
					variant="body-default-xl"
					align="center"
					paddingX="160"
				>
					{toolsHub.description}
				</Text>
			</Column>
			<ToolsHubView />
		</Column>
	)
}
