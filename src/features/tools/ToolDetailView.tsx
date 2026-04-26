import { ScreenshotMockupTool } from "./screenshot-mockup/ScreenshotMockupTool"
import type { LiveToolEntry } from "./types"

function renderTool(tool: LiveToolEntry) {
	switch (tool.slug) {
		case "screenshot-mockup":
			return <ScreenshotMockupTool tool={tool} />
		default:
			return null
	}
}

export function ToolDetailView({ tool }: { tool: LiveToolEntry }) {
	return <>{renderTool(tool)}</>
}
