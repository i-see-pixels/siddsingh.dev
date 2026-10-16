import { PageHeading } from "@/components/panel"

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params
	return <PageHeading tagline="Blog" title={slug} />
}
