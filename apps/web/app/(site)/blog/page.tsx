import { cn } from "@workspace/ui/lib/utils"
import { ArrowRightIcon, PenToolIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { IconTile, Tag } from "@/components/badges"
import { CoverImage } from "@/components/cover-image"
import { PageHeading, Panel, PanelHeader, PanelTitle } from "@/components/panel"
import { formatDate, getPosts, type Post } from "@/lib/blog"

const description = "Notes on what I build and learn: AI agents, web platforms and side projects."

export const metadata: Metadata = {
	title: "Blog",
	description,
	alternates: { canonical: "/blog" },
	openGraph: { url: "/blog", title: "Blog", description },
}

export default async function BlogPage() {
	const posts = await getPosts()
	return (
		<>
			<PageHeading tagline="Blog" title="Writing" description={description} />
			<Panel id="posts">
				<PanelHeader>
					<PanelTitle sheet="01" count={posts.length} anchor="posts">
						All posts
					</PanelTitle>
				</PanelHeader>
				{posts.length === 0 ? (
					<EmptyState />
				) : (
					<ol>
						{posts.map((post, index) => (
							<li key={post.slug} className="screen-line-bottom">
								<PostRow post={post} first={index === 0} />
							</li>
						))}
					</ol>
				)}
			</Panel>
		</>
	)
}

function PostRow({ post, first }: { post: Post; first: boolean }) {
	return (
		<Link
			href={`/blog/${post.slug}`}
			className={cn(
				"group grid gap-x-4 gap-y-1 p-4 sm:grid-cols-[7rem_minmax(0,1fr)_1rem]",
				"transition-[background-color] ease-out hover:bg-accent-muted",
			)}
		>
			{post.cover && (
				<CoverImage
					cover={post.cover}
					sizes="(min-width: 768px) 736px, 100vw"
					// The newest post's banner is usually the first thing on screen.
					preload={first}
					className="mb-3 rounded-lg border sm:col-span-3"
				/>
			)}
			<div className="flex flex-col gap-1">
				<time
					dateTime={post.date}
					className="font-mono text-sm text-muted-foreground tabular-nums"
				>
					{formatDate(post.date)}
				</time>
				<span className="font-mono text-xs text-muted-foreground">
					{post.readingMinutes} min read
				</span>
			</div>
			<div className="flex flex-col gap-1">
				<h2 className="text-lg/snug font-medium text-balance">{post.title}</h2>
				<p className="text-sm text-muted-foreground">{post.summary}</p>
				{post.tags.length > 0 && (
					<div className="mt-1 flex flex-wrap gap-1.5">
						{post.tags.map((tag) => (
							<Tag key={tag}>{tag}</Tag>
						))}
					</div>
				)}
			</div>
			<ArrowRightIcon className="mt-1 size-4 text-muted-foreground transition-[translate,color] ease-out group-hover:translate-x-0.5 group-hover:text-brand max-sm:hidden" />
		</Link>
	)
}

function EmptyState() {
	return (
		<div className="dot-grid flex flex-col items-center gap-3 px-4 py-16 text-center">
			<IconTile>
				<PenToolIcon />
			</IconTile>
			<p className="font-medium">No posts yet</p>
			<p className="max-w-sm text-sm text-balance text-muted-foreground">
				A fresh start. The first post is on the drafting table.
			</p>
		</div>
	)
}
