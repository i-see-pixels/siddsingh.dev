import { WorkspaceHeader } from "@/components/workspace-header"

/** Full-screen shell for tools: no site frame, footer or bottom nav. */
export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex min-h-svh flex-col bg-background">
			<WorkspaceHeader />
			<main className="flex flex-1 flex-col">{children}</main>
		</div>
	)
}
