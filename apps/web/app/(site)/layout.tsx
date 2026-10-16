import { SiteBottomNav } from "@/components/site-bottom-nav"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export default function SiteLayout({ children }: { children: React.ReactNode }) {
	return (
		// `isolate` keeps the frame's z-index -1 lines above the page background.
		<div className="relative isolate flex min-h-svh flex-col">
			<SiteHeader />
			{/* The column's side borders run the full height, so short pages keep the frame. */}
			<main className="flex max-w-screen flex-1 flex-col overflow-x-clip px-2">
				<div className="mx-auto w-full flex-1 border-x border-line md:max-w-3xl">
					{children}
				</div>
			</main>
			<SiteFooter />
			<SiteBottomNav />
		</div>
	)
}
