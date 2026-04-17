import { Column } from "@once-ui-system/core"

import { ScreenshotMockupTool } from "./screenshot-mockup/ScreenshotMockupTool"
import type { LiveToolEntry } from "./types"

function renderTool(tool: LiveToolEntry) {
	switch (tool.slug) {
		case "screenshot-mockup":
			return <ScreenshotMockupTool />
		default:
			return null
	}
}

export function ToolDetailView({ tool }: { tool: LiveToolEntry }) {
	return (
		<Column fillWidth paddingTop="24">
			{renderTool(tool)}
		</Column>
	)
}
