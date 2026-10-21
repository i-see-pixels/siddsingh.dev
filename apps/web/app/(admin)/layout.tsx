import type { Metadata } from "next"

// Every admin page depends on the session cookie; never prerender one.
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
	title: "Admin",
	robots: { index: false, follow: false },
}

/** Full-screen shell for the admin area: no site frame, footer or bottom nav. */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex min-h-svh max-w-screen flex-col overflow-x-clip bg-background">
			{children}
		</div>
	)
}
