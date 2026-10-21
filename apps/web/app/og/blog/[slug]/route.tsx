import { ImageResponse } from "next/og"
import { formatDate, getPost } from "@/lib/blog"
import { siteConfig } from "@/lib/site-config"

// The social card for a post without a cover image (lib/structured-data.ts
// socialImage). Colours are the theme's paper, ink and drafting blue as hex,
// since the renderer does not read oklch.

const paper = "#fbfaf6"
const ink = "#020617"
const muted = "#64748b"
const brand = "#2563eb"

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
	const post = await getPost((await params).slug)
	if (!post) return new Response("Not found", { status: 404 })

	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
				padding: 72,
				backgroundColor: paper,
				backgroundImage: `radial-gradient(${muted}33 1.5px, transparent 1.5px)`,
				backgroundSize: "28px 28px",
				color: ink,
				borderTop: `12px solid ${brand}`,
			}}
		>
			<div style={{ display: "flex", fontSize: 28, color: brand, letterSpacing: 2 }}>
				{new URL(siteConfig.url).host.toUpperCase()} / BLOG
			</div>
			<div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
				<div
					style={{ fontSize: 68, lineHeight: 1.1, fontWeight: 600, letterSpacing: -1.5 }}
				>
					{post.title}
				</div>
				{post.summary && (
					<div style={{ fontSize: 30, lineHeight: 1.4, color: muted }}>
						{post.summary.length > 160
							? `${post.summary.slice(0, 157)}…`
							: post.summary}
					</div>
				)}
			</div>
			<div style={{ display: "flex", fontSize: 26, color: muted }}>
				{`${siteConfig.name} · ${formatDate(post.date)} · ${post.readingMinutes} min read`}
			</div>
		</div>,
		{ width: 1200, height: 630 },
	)
}
