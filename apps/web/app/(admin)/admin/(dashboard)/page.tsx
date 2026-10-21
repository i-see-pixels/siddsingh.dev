import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { ArrowRightIcon, PenToolIcon, PlusIcon } from "lucide-react"
import Link from "next/link"
import { IconTile } from "@/components/badges"
import { createPostAction } from "@/features/blog-editor/actions"
import { requireAdmin } from "@/lib/auth/session"
import { blog } from "@/lib/server/container"
import type { Post } from "@/modules/blog/domain/post"

const dateTime = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" })

export default async function AdminPostsPage() {
	await requireAdmin()
	const posts = await blog().listPosts.execute()
	const published = posts.filter((post) => post.status === "published").length

	return (
		<div className="mx-auto w-full max-w-4xl px-4 py-10">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="text-3xl font-medium tracking-tight">Posts</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						{published} published · {posts.length - published} drafts
					</p>
				</div>
				<form action={createPostAction}>
					<Button type="submit">
						<PlusIcon data-icon="inline-start" />
						New post
					</Button>
				</form>
			</div>

			{posts.length === 0 ? (
				<div className="dot-grid mt-8 flex flex-col items-center gap-3 rounded-xl border px-4 py-16 text-center">
					<IconTile>
						<PenToolIcon />
					</IconTile>
					<p className="font-medium">No posts yet</p>
					<p className="text-sm text-muted-foreground">
						Start a draft; nothing is public until you publish it.
					</p>
				</div>
			) : (
				<ul className="mt-8 divide-y divide-line overflow-hidden rounded-xl border">
					{posts.map((post) => (
						<li key={post.id}>
							<PostRow post={post} />
						</li>
					))}
				</ul>
			)}
		</div>
	)
}

function PostRow({ post }: { post: Post }) {
	return (
		<Link
			href={`/admin/posts/${post.id}`}
			className={cn(
				"group flex items-center gap-4 p-4",
				"transition-[background-color] ease-out hover:bg-accent-muted",
			)}
		>
			<div className="flex min-w-0 flex-1 flex-col gap-1">
				<div className="flex items-center gap-2">
					<h2 className="truncate font-medium">{post.title}</h2>
					<Badge variant={post.status === "published" ? "default" : "outline"}>
						{post.status === "published" ? "Published" : "Draft"}
					</Badge>
				</div>
				<p className="truncate font-mono text-xs text-muted-foreground">
					/blog/{post.slug} · edited {dateTime.format(post.updatedAt)}
				</p>
			</div>
			<ArrowRightIcon className="size-4 shrink-0 text-muted-foreground transition-[translate,color] ease-out group-hover:translate-x-0.5 group-hover:text-brand" />
		</Link>
	)
}
