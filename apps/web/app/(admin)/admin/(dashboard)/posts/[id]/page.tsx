import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PostEditor } from "@/features/blog-editor/post-editor"
import { requireAdmin } from "@/lib/auth/session"
import { blog } from "@/lib/server/container"
import { fieldsOf } from "@/modules/blog/domain/post"

type Props = { params: Promise<{ id: string }> }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const metadata: Metadata = { title: "Edit post" }

export default async function EditPostPage({ params }: Props) {
	await requireAdmin()
	const { id } = await params
	// Postgres rejects a malformed uuid with an error; treat it as a missing post.
	const post = UUID.test(id) ? await blog().getPost.execute(id) : null
	if (!post) notFound()

	return (
		<PostEditor
			id={post.id}
			initial={fieldsOf(post)}
			saved={{
				slug: post.slug,
				status: post.status,
				publishedAt: post.publishedAt?.toISOString() ?? null,
				updatedAt: post.updatedAt.toISOString(),
			}}
		/>
	)
}
