import { ImageResponse } from "next/og"
import { siteConfig } from "@/lib/site-config"

// The social card for pages without one of their own (lib/seo.ts pageImage).
// Same look as the blog card in og/blog/[slug]/route.tsx.

const paper = "#fbfaf6"
const ink = "#020617"
const muted = "#64748b"
const brand = "#2563eb"

const clip = (text: string, max: number) =>
	text.length > max ? `${text.slice(0, max - 1)}…` : text

export function GET(request: Request) {
	const params = new URL(request.url).searchParams
	const title = clip(params.get("title") || siteConfig.name, 90)
	const description = clip(params.get("description") || siteConfig.description, 160)
	const section = clip(params.get("section") || "", 24).toUpperCase()
	const host = new URL(siteConfig.url).host.toUpperCase()

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
				{section ? `${host} / ${section}` : host}
			</div>
			<div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
				<div
					style={{ fontSize: 68, lineHeight: 1.1, fontWeight: 600, letterSpacing: -1.5 }}
				>
					{title}
				</div>
				<div style={{ fontSize: 30, lineHeight: 1.4, color: muted }}>{description}</div>
			</div>
			<div style={{ display: "flex", fontSize: 26, color: muted }}>{siteConfig.name}</div>
		</div>,
		{ width: 1200, height: 630 },
	)
}
