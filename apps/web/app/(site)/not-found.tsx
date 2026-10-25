import { NotFound } from "@/components/not-found"

// notFound() from a site page (an unknown blog post, say) renders inside the
// site layout, which already draws the frame.
export default function SiteNotFound() {
	return <NotFound />
}
