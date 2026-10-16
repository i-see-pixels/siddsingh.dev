import { PageHeading } from "@/components/panel"

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params
	return <PageHeading tagline="Tools" title={slug} />
}
