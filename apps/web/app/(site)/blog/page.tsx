import { cn } from "@workspace/ui/lib/utils"
import { ArrowRightIcon, PenToolIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { IconTile, Tag } from "@/components/badges"
import { CoverImage } from "@/components/cover-image"
import { PageHeading, Panel, PanelHeader, PanelTitle } from "@/components/panel"
import { formatDate, getPosts, type Post } from "@/lib/blog"

const description =
	"Notes on what I build and what breaks along the way: AI agents, web platforms and side projects I swear I'll finish."

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
				"group grid gap-x-4 gap-y-2 p-4 sm:grid-cols-[minmax(0,1fr)_1rem]",
				"transition-[background-color] ease-out hover:bg-accent-muted",
			)}
		>
			{/* The cover sits beside the text like /work's project tiles, a size up. */}
			<div className="flex flex-col gap-4 sm:flex-row">
				{post.cover && (
					<CoverImage
						cover={post.cover}
						sizes="(min-width: 640px) 10rem, 100vw"
						// The newest post's cover is usually the first image on screen.
						preload={first}
						className="w-full shrink-0 self-start rounded-md ring-1 ring-foreground/10 sm:w-40"
					/>
				)}
				<div className="flex flex-col flex-1 gap-1">
					<h2 className="text-lg/snug font-medium text-balance">{post.title}</h2>
					<p className="text-sm text-muted-foreground">{post.summary}</p>
					<div className="flex flex-row justify-between items-center">
						{post.tags.length > 0 && (
							<div className="mt-1 flex flex-wrap gap-1.5">
								{post.tags.map((tag) => (
									<Tag key={tag}>{tag}</Tag>
								))}
							</div>
						)}
						<time
							dateTime={post.date}
							className="justify-self-end font-mono text-xs text-muted-foreground tabular-nums sm:col-span-2 min-w-20"
						>
							{formatDate(post.date)}
						</time>
					</div>
				</div>
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
			<p className="font-medium">Zero posts. Very minimalist.</p>
			<p className="max-w-sm text-sm text-balance text-muted-foreground">
				The first one is on the drafting table, right next to the side project I'm
				definitely finishing this weekend.
			</p>
		</div>
	)
}
