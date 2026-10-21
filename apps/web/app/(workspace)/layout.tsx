import { WorkspaceHeader } from "@/components/workspace-header"

/** Full-screen shell for tools: no site frame, footer or bottom nav. */
export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
	return (
		// The screen-line rules are 200vw wide; clip them so they never add a horizontal scrollbar.
		<div className="flex min-h-svh max-w-screen flex-col overflow-x-clip bg-background">
			<WorkspaceHeader />
			<main className="flex flex-1 flex-col">{children}</main>
		</div>
	)
}
