import { ToolsHubView } from "@/features/tools/ToolsHubView"
import { baseURL, person, toolsHub } from "@/resources"
import { Column, Meta, Schema } from "@once-ui-system/core"

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
	return (
		<Column maxWidth="l" fillWidth>
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
			<ToolsHubView />
		</Column>
	)
}
