import { Button } from "@workspace/ui/components/button"
import { PenToolIcon, PlusIcon } from "lucide-react"
import { IconTile } from "@/components/badges"
import { createPostAction } from "@/features/blog-editor/actions"
import { parseView, toPostRow } from "@/features/blog-editor/post-filters"
import { PostsTable } from "@/features/blog-editor/posts-table"
import { requireAdmin } from "@/lib/auth/session"
import { blog } from "@/lib/server/container"

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function AdminPostsPage({ searchParams }: Props) {
	await requireAdmin()
	const posts = await blog().listPosts.execute()
	const published = posts.filter((post) => post.status === "published").length
	const indexed = posts.filter((post) => post.indexed).length

	return (
		<div className="mx-auto w-full max-w-6xl px-4 py-10">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="text-3xl font-medium tracking-tight">Posts</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						{published} published · {posts.length - published} drafts · {indexed}{" "}
						indexed
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
				<PostsTable
					posts={posts.map(toPostRow)}
					initialView={parseView(await searchParams)}
				/>
			)}
		</div>
	)
}
