import { Button } from "@workspace/ui/components/button"
import { ArrowLeftIcon, BookOpenIcon, MailIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Tag } from "@/components/badges"
import { JsonLd } from "@/components/json-ld"
import { Panel, PanelContent, PanelHeader, PanelTitle, Separator } from "@/components/panel"
import { ToolEmbed } from "@/features/tools/tool-embed"
import { getPost } from "@/lib/blog"
import { tools } from "@/lib/content"
import { pageMetadata } from "@/lib/seo"
import { siteConfig } from "@/lib/site-config"
import { breadcrumbJsonLd, faqPageJsonLd, webApplicationJsonLd } from "@/lib/structured-data"

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
	return tools.map((tool) => ({ slug: tool.slug }))
}

export const dynamicParams = false

async function getTool(params: Props["params"]) {
	const { slug } = await params
	const tool = tools.find((item) => item.slug === slug)
	if (!tool) notFound()
	return tool
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const tool = await getTool(params)
	return pageMetadata({
		title: tool.seoTitle,
		description: tool.description,
		path: `/tools/${tool.slug}`,
		section: "Tools",
	})
}

export default async function ToolPage({ params }: Props) {
	const tool = await getTool(params)
	// Linked only once the guide is published, so the page never points at a 404.
	// A database hiccup shouldn't take the tool page down with it.
	const guide = await getPost(tool.guide).catch(() => null)

	return (
		<>
			<JsonLd data={webApplicationJsonLd(tool)} />
			<JsonLd data={faqPageJsonLd(tool.faq)} />
			<JsonLd
				data={breadcrumbJsonLd([
					{ name: "Home", path: "/" },
					{ name: "Tools", path: "/tools" },
					{ name: tool.name, path: `/tools/${tool.slug}` },
				])}
			/>
			<div className="pt-12">
				<p className="px-4 pb-2 text-sm/none font-medium tracking-wider text-muted-foreground">
					<Link
						href="/tools"
						className="inline-flex items-center gap-1 transition-[color] ease-out hover:text-foreground"
					>
						<ArrowLeftIcon className="size-3.5" />
						Tools
					</Link>
				</p>
				<h1 className="screen-line-top screen-line-bottom px-4 text-4xl font-medium tracking-tight text-balance">
					{tool.name}
				</h1>
				<p className="screen-line-bottom p-4 text-base text-balance text-muted-foreground">
					{tool.description}
				</p>
				<div className="screen-line-bottom flex flex-wrap items-center gap-2 px-4 py-3">
					<Tag>{tool.category}</Tag>
					<Tag>Free</Tag>
					<Tag>Runs in your browser</Tag>
				</div>
			</div>
			<ToolEmbed slug={tool.slug} name={tool.name} />
			<Separator />
			<Panel id="overview">
				<PanelHeader>
					<PanelTitle sheet="01" anchor="overview">
						What it does
					</PanelTitle>
				</PanelHeader>
				<PanelContent className="flex flex-col gap-3">
					{tool.overview.map((paragraph) => (
						<p key={paragraph} className="text-pretty">
							{paragraph}
						</p>
					))}
				</PanelContent>
				<ul>
					{tool.features.map((feature) => (
						<li key={feature} className="screen-line-top flex gap-3 px-4 py-3 text-sm">
							<span aria-hidden className="text-brand">
								+
							</span>
							{feature}
						</li>
					))}
				</ul>
				{guide && (
					<div className="screen-line-top p-4">
						<Link
							href={`/blog/${guide.slug}`}
							className="inline-flex items-center gap-2 text-sm font-medium text-brand hover:underline"
						>
							<BookOpenIcon className="size-4" />
							Read the guide: {guide.title}
						</Link>
					</div>
				)}
			</Panel>
			<Separator />
			<Panel id="how-it-works">
				<PanelHeader>
					<PanelTitle sheet="02" anchor="how-it-works">
						How it works
					</PanelTitle>
				</PanelHeader>
				<ol>
					{tool.steps.map((step, index) => (
						<li key={step} className="screen-line-bottom flex gap-4 p-4">
							<span className="font-mono text-sm text-brand tabular-nums">
								{String(index + 1).padStart(2, "0")}
							</span>
							<p>{step}</p>
						</li>
					))}
				</ol>
			</Panel>
			<Separator />
			<Panel id="faq">
				<PanelHeader>
					<PanelTitle sheet="03" count={tool.faq.length} anchor="faq">
						FAQ
					</PanelTitle>
				</PanelHeader>
				<dl>
					{tool.faq.map((item) => (
						<div key={item.question} className="screen-line-bottom p-4">
							<dt className="font-medium">{item.question}</dt>
							<dd className="mt-1 text-sm text-muted-foreground">{item.answer}</dd>
						</div>
					))}
				</dl>
			</Panel>
			<Separator />
			<Panel id="custom">
				<PanelContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h2 className="font-medium">Built by Sidd. Need a custom tool?</h2>
						<p className="text-sm text-muted-foreground">
							I build small, focused web tools for teams and products.
						</p>
					</div>
					<Button
						nativeButton={false}
						render={<a href={siteConfig.projectMailto} />}
						className="gap-2 self-start bg-brand text-brand-foreground hover:bg-brand/90"
					>
						<MailIcon />
						Start a project
					</Button>
				</PanelContent>
			</Panel>
		</>
	)
}
