import { PageHeading, Panel, PanelHeader, PanelTitle, Separator } from "@/components/panel"
import { tools } from "@/lib/content"
import { ToolsBrowser } from "./tools-browser"

export default function ToolsPage() {
	return (
		<>
			<PageHeading
				tagline="Tools"
				title="Free tools"
				description="Small, fast tools that run in your browser. No sign-up, nothing uploaded."
			/>
			<Separator />
			<Panel id="tools">
				<PanelHeader>
					<PanelTitle sheet="01" count={tools.length} anchor="tools">
						All tools
					</PanelTitle>
				</PanelHeader>
				<ToolsBrowser />
			</Panel>
		</>
	)
}
