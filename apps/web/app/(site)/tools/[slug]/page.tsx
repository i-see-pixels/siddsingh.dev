import { Button } from "@workspace/ui/components/button"
import { ArrowLeftIcon, MailIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Tag } from "@/components/badges"
import { Panel, PanelContent, PanelHeader, PanelTitle, Separator } from "@/components/panel"
import { tools } from "@/lib/content"
import { siteConfig } from "@/lib/site-config"

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
	return { title: tool.name, description: tool.description }
}

export default async function ToolPage({ params }: Props) {
	const tool = await getTool(params)

	return (
		<>
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
			<Panel marks={false} className="screen-line-top-none">
				{/* Tool UI slot: each tool's component loads here once it is ported. */}
				<div className="dot-grid flex min-h-72 flex-col items-center justify-center gap-2 p-8 text-center">
					<p className="font-mono text-xs text-muted-foreground uppercase">Coming soon</p>
					<p className="max-w-sm text-balance text-muted-foreground">
						The editor is being moved over from the old site. It will appear here.
					</p>
				</div>
			</Panel>
			<Separator />
			<Panel id="how-it-works">
				<PanelHeader>
					<PanelTitle sheet="01" anchor="how-it-works">
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
					<PanelTitle sheet="02" count={tool.faq.length} anchor="faq">
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
						render={<a href={`mailto:${siteConfig.email}`} />}
						className="gap-2 self-start bg-brand text-brand-foreground hover:bg-brand/90"
					>
						<MailIcon />
						Hire me
					</Button>
				</PanelContent>
			</Panel>
		</>
	)
}
