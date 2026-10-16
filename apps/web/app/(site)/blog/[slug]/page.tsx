import { ArrowLeftIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { Joined, Tag } from "@/components/badges"
import { Contact } from "@/components/home/sections"
import { Panel, PanelContent, Separator } from "@/components/panel"
import { formatDate, getPost, getPostSlugs } from "@/lib/blog"

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
	return getPostSlugs().map((slug) => ({ slug }))
}

export const dynamicParams = false

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { post } = await getPost((await params).slug)
	return { title: post.title, description: post.summary }
}

export default async function BlogPostPage({ params }: Props) {
	const { Content, post } = await getPost((await params).slug)
	const dates = [formatDate(post.date)]
	if (post.updated) dates.push(`Updated ${formatDate(post.updated)}`)

	return (
		<>
			<div className="pt-12">
				<p className="px-4 pb-2 text-sm/none font-medium tracking-wider text-muted-foreground">
					<Link
						href="/blog"
						className="inline-flex items-center gap-1 transition-[color] ease-out hover:text-foreground"
					>
						<ArrowLeftIcon className="size-3.5" />
						Blog
					</Link>
				</p>
				<h1 className="screen-line-top screen-line-bottom px-4 text-4xl font-medium tracking-tight text-balance">
					{post.title}
				</h1>
				<p className="screen-line-bottom p-4 text-base text-balance text-muted-foreground">
					{post.summary}
				</p>
				<div className="screen-line-bottom flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
					<p className="font-mono text-xs text-muted-foreground tabular-nums">
						<Joined text={dates.join(" · ")} />
					</p>
					{post.tags?.map((tag) => (
						<Tag key={tag}>{tag}</Tag>
					))}
				</div>
			</div>
			<Panel marks={false} className="screen-line-top-none">
				<PanelContent className="py-8">
					<article>
						<Content />
					</article>
				</PanelContent>
			</Panel>
			<Separator />
			<Contact sheet="01" />
		</>
	)
}
