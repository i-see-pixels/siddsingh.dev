import { ArrowLeftIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Joined, Tag } from "@/components/badges"
import { CoverImage } from "@/components/cover-image"
import { Contact } from "@/components/home/sections"
import { JsonLd } from "@/components/json-ld"
import { Markdown } from "@/components/markdown"
import { Panel, PanelContent, Separator } from "@/components/panel"
import { formatDate, getPost, getPosts } from "@/lib/blog"
import { siteConfig } from "@/lib/site-config"
import { blogPostingJsonLd, breadcrumbJsonLd, socialImage } from "@/lib/structured-data"

type Props = { params: Promise<{ slug: string }> }

// Published posts are prerendered; one published later renders on its first
// visit and is cached from then on.
export async function generateStaticParams() {
	return (await getPosts()).map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const post = await getPost((await params).slug)
	if (!post) return {}
	const path = `/blog/${post.slug}`
	const image = {
		url: socialImage(post),
		width: 1200,
		height: 630,
		alt: post.cover?.alt || post.title,
	}
	return {
		title: post.seoTitle,
		description: post.seoDescription,
		keywords: post.tags,
		authors: [{ name: siteConfig.name, url: siteConfig.url }],
		alternates: { canonical: path },
		openGraph: {
			type: "article",
			url: path,
			title: post.seoTitle,
			description: post.seoDescription,
			publishedTime: post.publishedAt,
			modifiedTime: post.modifiedAt,
			authors: [siteConfig.url],
			tags: post.tags,
			images: [image],
		},
		twitter: {
			card: "summary_large_image",
			title: post.seoTitle,
			description: post.seoDescription,
			images: [image],
		},
	}
}

export default async function BlogPostPage({ params }: Props) {
	const post = await getPost((await params).slug)
	if (!post) notFound()
	const dates = [formatDate(post.date)]
	if (post.updated) dates.push(`Updated ${formatDate(post.updated)}`)
	dates.push(`${post.readingMinutes} min read`)

	return (
		<>
			<article>
				<JsonLd data={blogPostingJsonLd(post)} />
				<JsonLd
					data={breadcrumbJsonLd([
						{ name: "Home", path: "/" },
						{ name: "Blog", path: "/blog" },
						{ name: post.title, path: `/blog/${post.slug}` },
					])}
				/>
				<header className="pt-12">
					<nav aria-label="Breadcrumb">
						<p className="px-4 pb-2 text-sm/none font-medium tracking-wider text-muted-foreground">
							<Link
								href="/blog"
								className="inline-flex items-center gap-1 transition-[color] ease-out hover:text-foreground"
							>
								<ArrowLeftIcon className="size-3.5" />
								Blog
							</Link>
						</p>
					</nav>
					<h1 className="screen-line-top screen-line-bottom px-4 text-4xl font-medium tracking-tight text-balance">
						{post.title}
					</h1>
					<p className="screen-line-bottom p-4 text-base text-balance text-muted-foreground">
						{post.summary}
					</p>
					<div className="screen-line-bottom flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
						<p className="font-mono text-xs text-muted-foreground tabular-nums">
							<time dateTime={post.publishedAt}>
								<Joined text={dates.join(" · ")} />
							</time>
						</p>
						{post.tags.map((tag) => (
							<Tag key={tag}>{tag}</Tag>
						))}
					</div>
					{post.cover && (
						<CoverImage
							cover={post.cover}
							sizes="(min-width: 768px) 768px, 100vw"
							preload
							className="screen-line-bottom"
						/>
					)}
				</header>
				<Panel marks={false} className="screen-line-top-none">
					<PanelContent className="py-8">
						<Markdown>{post.content}</Markdown>
					</PanelContent>
				</Panel>
			</article>
			<Separator />
			<Contact sheet="01" />
		</>
	)
}
