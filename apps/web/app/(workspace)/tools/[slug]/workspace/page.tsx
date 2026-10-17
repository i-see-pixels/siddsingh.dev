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
	return { title: tool ? `${tool.name} editor` : "Tool", robots: { index: false } }
}

export default async function ToolWorkspacePage({ params }: Props) {
	const { slug } = await params
	const Tool = toolComponents[slug]
	if (!Tool) notFound()
	return <Tool />
}
