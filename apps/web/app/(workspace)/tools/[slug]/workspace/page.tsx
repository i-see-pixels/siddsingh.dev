import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { toolComponents } from "@/features/tools/registry"
import { tools } from "@/lib/content"

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
	return tools.map((tool) => ({ slug: tool.slug }))
}

export const dynamicParams = false

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params
	const tool = tools.find((item) => item.slug === slug)
	// Not indexed: /tools/<slug> is the page meant to rank, and it links here.
	return {
		title: tool ? `${tool.name} editor` : "Tool",
		description: tool?.description,
		robots: { index: false },
	}
}

export default async function ToolWorkspacePage({ params }: Props) {
	const { slug } = await params
	const Tool = toolComponents[slug]
	const tool = tools.find((item) => item.slug === slug)
	if (!Tool || !tool) notFound()
	return (
		<>
			<h1 className="sr-only">{tool.name}</h1>
			<Tool />
		</>
	)
}
