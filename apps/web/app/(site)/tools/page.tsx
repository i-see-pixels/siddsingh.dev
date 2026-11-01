import type { Metadata } from "next"
import { PageHeading, Panel, PanelHeader, PanelTitle, Separator } from "@/components/panel"
import { tools } from "@/lib/content"
import { pageMetadata } from "@/lib/seo"
import { ToolsBrowser } from "./tools-browser"

export const metadata: Metadata = pageMetadata({
	title: "Free Developer Tools That Run in Your Browser",
	description:
		"Free tools with no sign-up: JSON formatter, JWT decoder, regex tester, cron generator, diff checker, Mermaid editor and more. Nothing is uploaded.",
	path: "/tools",
	section: "Tools",
})

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
