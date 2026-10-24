import type { Metadata } from "next"
import { NotFound } from "@/components/not-found"
import { SiteFrame } from "@/components/site-frame"

export const metadata: Metadata = { title: "Page not found" }

// URLs that match no route render here, outside every route group's layout,
// so this page brings the site frame itself.
export default function RootNotFound() {
	return (
		<SiteFrame>
			<NotFound />
		</SiteFrame>
	)
}
