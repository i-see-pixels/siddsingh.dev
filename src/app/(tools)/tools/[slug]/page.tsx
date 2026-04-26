import Script from "next/script"

import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ToolDetailView } from "@/features/tools/ToolDetailView"
import { getLiveToolEntries, getToolBySlug } from "@/features/tools/registry"
import type { LiveToolEntry } from "@/features/tools/types"
import { baseURL, person } from "@/resources"
import { Meta, Schema } from "@once-ui-system/core"

export async function generateStaticParams(): Promise<{ slug: string }[]> {
	return getLiveToolEntries().map((tool) => ({
		slug: tool.slug,
	}))
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string | string[] }>
}): Promise<Metadata> {
	const routeParams = await params
	const slugPath = Array.isArray(routeParams.slug)
		? routeParams.slug.join("/")
		: routeParams.slug || ""
	const tool = getToolBySlug(slugPath)

	if (!tool || tool.status !== "live") {
		return {}
	}

	const generatedMeta = await Meta.generate({
		title: `${tool.name} | Free Browser-Based Tool | ${person.name}`,
		description: tool.description,
		baseURL,
		image: `/api/og/generate?title=${encodeURIComponent(tool.name)}`,
		path: tool.path,
	})

	return {
		...generatedMeta,
		alternates: {
			canonical: `/tools/${tool.slug}`,
		},
	}
}

export default async function ToolPage({
	params,
}: {
	params: Promise<{ slug: string | string[] }>
}) {
	const routeParams = await params
	const slugPath = Array.isArray(routeParams.slug)
		? routeParams.slug.join("/")
		: routeParams.slug || ""
	const tool = getToolBySlug(slugPath)

	if (!tool || tool.status !== "live") {
		notFound()
	}

	const liveTool = tool as LiveToolEntry
	const toolStructuredData = [
		{
			"@context": "https://schema.org",
			"@type": "WebApplication",
			name: liveTool.name,
			description: liveTool.description,
			url: `${baseURL}${liveTool.path}`,
			applicationCategory: "UtilitiesApplication",
			operatingSystem: "Web Browser",
			creator: {
				"@type": "Person",
				name: person.name,
				url: baseURL,
			},
		},
		{
			"@context": "https://schema.org",
			"@type": "BreadcrumbList",
			itemListElement: [
				{ "@type": "ListItem", position: 1, name: "Home", item: baseURL },
				{ "@type": "ListItem", position: 2, name: "Tools", item: `${baseURL}/tools` },
				{
					"@type": "ListItem",
					position: 3,
					name: liveTool.name,
					item: `${baseURL}${liveTool.path}`,
				},
			],
		},
	]

	return (
		<>
			<Script id={`tool-${liveTool.slug}-structured-data`} type="application/ld+json">
				{JSON.stringify(toolStructuredData)}
			</Script>
			<Schema
				as="webPage"
				baseURL={baseURL}
				title={liveTool.name}
				description={liveTool.description}
				path={liveTool.path}
				image={`/api/og/generate?title=${encodeURIComponent(liveTool.name)}`}
				author={{
					name: person.name,
					url: `${baseURL}${liveTool.path}`,
					image: `${baseURL}${person.avatar}`,
				}}
			/>
			<ToolDetailView tool={liveTool} />
		</>
	)
}
