import { readdirSync } from "node:fs"
import path from "node:path"
import { cn } from "@workspace/ui/lib/utils"
import Link from "next/link"
import { caseStudies, posts, products, tools } from "@/lib/placeholder-content"
import { getStack } from "@/lib/stack"

/*
 * Fig. 1: an exploded isometric drawing of the site (docs/design.md §5 Hero).
 * Three plates — design system, web app, content — with product subdomains
 * beside them. Callouts carry live counts from the content sources.
 *
 * Build-up animation: the plates start as one solid block that splits apart,
 * the page blocks rise out of the top plate, then the products slide out of
 * the stack. With reduced motion, the final drawing shows at once.
 */

type Point = [number, number]

// Isometric projection: world (x, y, z) → screen. +x runs right-down, +y left-down.
const COS30 = 0.866
const ORIGIN = { x: 330, y: 135 }
function iso(x: number, y: number, z: number): Point {
	return [ORIGIN.x + (x - y) * COS30, ORIGIN.y + (x + y) * 0.5 - z]
}

function toPath(points: Point[], close = true) {
	return `M${points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L")}${close ? "Z" : ""}`
}

/** The three visible faces of a box: top, left (y = max) and right (x = max). */
function box(x: number, y: number, z: number, w: number, d: number, h: number) {
	const [x1, y1, z1] = [x + w, y + d, z + h]
	return {
		top: toPath([iso(x, y, z1), iso(x1, y, z1), iso(x1, y1, z1), iso(x, y1, z1)]),
		left: toPath([iso(x, y1, z), iso(x1, y1, z), iso(x1, y1, z1), iso(x, y1, z1)]),
		right: toPath([iso(x1, y, z), iso(x1, y1, z), iso(x1, y1, z1), iso(x1, y, z1)]),
	}
}

// Text lying flat on a top face, running along the x axis.
function flatText(x: number, y: number, z: number) {
	const [sx, sy] = iso(x, y, z)
	return `matrix(${COS30} 0.5 ${-COS30} 0.5 ${sx.toFixed(1)} ${sy.toFixed(1)})`
}

const PLATE = 168
const THICK = 6
const LAYER = { ui: 0, web: 52, content: 104 }
const CONTENT_TOP = LAYER.content + THICK
// Collapsed, the plates touch: content sits on the web plate, ui sits under it.
const SPLIT = LAYER.content - (LAYER.web + THICK)

const BLOCK = { w: 52, d: 52, h: 18 }
const work = { label: "Work", href: "/work", x: 16, y: 16 }
const toolsBlock = { label: "Tools", href: "/tools", x: 100, y: 16 }
const blog = { label: "Blog", href: "/blog", x: 16, y: 100 }
const blocks = [work, toolsBlock, blog]
const SLOT = { x: 100, y: 100 }

const PRODUCT = { w: 48, d: 48, h: 12, startX: 112 }
const productBlocks = [
	{ x: 204, y: 0 },
	{ x: 268, y: 0 },
]

// Seconds from page load.
const T = {
	split: 1.0,
	labels: 1.7,
	rise: 1.8,
	slot: 2.2,
	products: 2.3,
	callouts: 2.9,
}

// Counted from packages/ui at build time, like the footer's stack.
function countUiComponents() {
	try {
		const dir = path.join(process.cwd(), "../../packages/ui/src/components")
		return readdirSync(dir).filter((file) => file.endsWith(".tsx")).length
	} catch {
		return 0
	}
}

function delay(seconds: number, extra?: Record<string, string>) {
	return { "--d": `${seconds}s`, ...extra } as React.CSSProperties
}

const faceClass = {
	top: "fill-background",
	left: "fill-[color-mix(in_oklab,var(--brand)_7%,var(--background))]",
	right: "fill-[color-mix(in_oklab,var(--brand)_14%,var(--background))]",
}

function Box({
	faces,
	draw,
	dashed,
}: {
	faces: ReturnType<typeof box>
	draw?: boolean
	dashed?: boolean
}) {
	return (
		<g
			className="stroke-brand"
			strokeWidth="1"
			strokeLinejoin="round"
			strokeDasharray={dashed ? "3 3" : undefined}
		>
			{(["left", "right", "top"] as const).map((face) => (
				<path
					key={face}
					d={faces[face]}
					pathLength={draw ? 1 : undefined}
					className={cn(
						dashed ? "fill-transparent" : faceClass[face],
						draw && "fig-draw",
					)}
				/>
			))}
		</g>
	)
}

/** Dashed alignment lines between two plates, at the four corners. */
function Guides({ from, to }: { from: number; to: number }) {
	const corners: Point[] = [
		[0, 0],
		[PLATE, 0],
		[PLATE, PLATE],
		[0, PLATE],
	]
	return (
		<g className="fig-fade stroke-brand/40" strokeDasharray="2 3" style={delay(T.labels)}>
			{corners.map(([x, y]) => {
				const [ax, ay] = iso(x, y, from)
				const [, by] = iso(x, y, to)
				return <path key={`${x}-${y}`} d={`M${ax} ${ay}V${by}`} />
			})}
		</g>
	)
}

/** A page block that rises out of the content plate, clipped at the plate surface. */
function RisingBlock({ block, index }: { block: (typeof blocks)[number]; index: number }) {
	const id = `fig-clip-${block.label.toLowerCase()}`
	const [x1, y1] = [block.x + BLOCK.w, block.y + BLOCK.d]
	const left = iso(block.x, y1, CONTENT_TOP)
	const right = iso(x1, block.y, CONTENT_TOP)
	// Everything above the footprint's two front edges: the part of the block
	// that has come "out of" the plate.
	const clip = toPath([left, iso(x1, y1, CONTENT_TOP), right, [right[0], -100], [left[0], -100]])
	return (
		<Link href={block.href} className="group/layer">
			<clipPath id={id}>
				<path d={clip} />
			</clipPath>
			<g clipPath={`url(#${id})`}>
				<g
					className="fig-rise"
					style={delay(T.rise + index * 0.12, { "--rise": `${BLOCK.h}px` })}
				>
					<g className="transition-transform duration-300 ease-out group-hover/layer:-translate-y-1">
						<Box
							faces={box(block.x, block.y, CONTENT_TOP, BLOCK.w, BLOCK.d, BLOCK.h)}
						/>
						<text
							transform={flatText(block.x + 8, block.y + 30, CONTENT_TOP + BLOCK.h)}
							className="fill-foreground"
						>
							{block.label}
						</text>
					</g>
				</g>
			</g>
		</Link>
	)
}

type CalloutProps = {
	title: string
	detail: string
	href?: string
	/** A corner of the shape the callout points at. */
	anchor: Point
	/** 1 = label to the right, -1 = to the left. */
	dir: 1 | -1
	/** How far the leader climbs (negative drops), along the isometric 30° slope. */
	rise: number
	/** x of the label column the leader lands on. */
	column: number
}

/** Angled leader from a corner, landing on a short shelf between title and count. */
function Callout({
	title,
	detail,
	href,
	anchor,
	dir,
	rise,
	column,
	index,
}: CalloutProps & { index: number }) {
	const [ax, ay] = anchor
	const elbow: Point = [ax + dir * Math.abs(rise) * 1.732, ay - rise]
	const textX = column + dir * 4
	const label = (
		<text textAnchor={dir === 1 ? "start" : "end"} className="fill-foreground">
			<tspan x={textX} y={elbow[1] - 4}>
				{title}
			</tspan>
			<tspan x={textX} y={elbow[1] + 11} className="fill-muted-foreground">
				{detail}
			</tspan>
		</text>
	)
	return (
		<g className="fig-fade max-sm:hidden" style={delay(T.callouts + index * 0.08)}>
			<path
				d={toPath([anchor, elbow, [column, elbow[1]]], false)}
				className="stroke-muted-foreground/60"
				fill="none"
			/>
			<circle cx={ax} cy={ay} r="2" className="fill-brand" />
			{href ? (
				<Link href={href} className="hover:[&_tspan:first-child]:underline">
					{label}
				</Link>
			) : (
				label
			)}
		</g>
	)
}

export function BlueprintFigure() {
	const next = getStack().find((entry) => entry.startsWith("next@")) ?? "next"
	const betaCount = products.filter((product) => product.status === "Beta").length
	const lastProduct = productBlocks[productBlocks.length - 1] ?? { x: 0, y: 0 }

	const callouts: CalloutProps[] = [
		{
			title: "Work",
			detail: `${caseStudies.length} case studies`,
			href: "/work",
			anchor: iso(work.x + BLOCK.w, work.y, CONTENT_TOP + BLOCK.h),
			dir: 1,
			rise: 20,
			column: 496,
		},
		{
			title: "Tools",
			detail: `${tools.length} free tools`,
			href: "/tools",
			anchor: iso(toolsBlock.x + BLOCK.w, toolsBlock.y, CONTENT_TOP + BLOCK.h),
			dir: 1,
			rise: 12,
			column: 496,
		},
		{
			title: "Blog",
			detail: `${posts.length} posts`,
			href: "/blog",
			anchor: iso(blog.x, blog.y + BLOCK.d, CONTENT_TOP + BLOCK.h),
			dir: -1,
			rise: 14,
			column: 136,
		},
		{
			title: "Web app",
			detail: next,
			anchor: iso(0, PLATE, LAYER.web + THICK),
			dir: -1,
			rise: 14,
			column: 136,
		},
		{
			title: "Design system",
			detail: `${countUiComponents()} components`,
			anchor: iso(0, PLATE, LAYER.ui + THICK),
			dir: -1,
			rise: 14,
			column: 136,
		},
		{
			title: "Products",
			detail: `${products.length} apps${betaCount ? `, ${betaCount} beta` : ""}`,
			href: "/products",
			anchor: iso(lastProduct.x + PRODUCT.w, lastProduct.y + PRODUCT.d, LAYER.web),
			dir: -1,
			rise: -18,
			column: 510,
		},
	]

	return (
		<>
			<svg
				viewBox="0 0 640 320"
				className="blueprint-figure h-auto w-full font-mono text-[11px]"
				role="img"
				aria-labelledby="fig1-title"
			>
				<title id="fig1-title">
					Exploded drawing of siddsingh.dev: design system, web app, and content layers,
					with products on subdomains
				</title>
				<style>{`
					@media (prefers-reduced-motion: no-preference) {
						.blueprint-figure .fig-draw {
							stroke-dasharray: 1;
							animation: fig-draw 1s var(--expo-out) both;
						}
						.blueprint-figure .fig-fade {
							animation: fig-fade 0.5s ease-out both;
							animation-delay: var(--d, 0s);
						}
						.blueprint-figure .fig-split {
							animation: fig-split 0.8s var(--expo-out) both;
							animation-delay: var(--d, 0s);
						}
						.blueprint-figure .fig-rise {
							animation: fig-rise 0.7s var(--expo-out) both;
							animation-delay: var(--d, 0s);
						}
						.blueprint-figure .fig-slide {
							animation: fig-slide 0.8s var(--expo-out) both;
							animation-delay: var(--d, 0s);
						}
					}
					@keyframes fig-draw {
						0% { stroke-dashoffset: 1; fill-opacity: 0; }
						70% { stroke-dashoffset: 0; fill-opacity: 0; }
						100% { stroke-dashoffset: 0; fill-opacity: 1; }
					}
					@keyframes fig-fade { from { opacity: 0; } to { opacity: 1; } }
					@keyframes fig-split { from { transform: translateY(var(--from)); } to { transform: none; } }
					@keyframes fig-rise {
						from { transform: translateY(var(--rise)); opacity: 0; }
						15% { opacity: 1; }
						to { transform: none; opacity: 1; }
					}
					@keyframes fig-slide {
						from { transform: translate(var(--from-x), var(--from-y)); opacity: 0; }
						30% { opacity: 1; }
						to { transform: none; opacity: 1; }
					}
					@media (max-width: 639px) {
						.blueprint-figure .fig-body { transform: translate(-113px, -19px) scale(1.1); }
					}
				`}</style>

				<g className="fig-body">
					{/* Plates: drawn as one solid block, then split apart. */}
					<g className="fig-split" style={delay(T.split, { "--from": `${-SPLIT}px` })}>
						<Box faces={box(0, 0, LAYER.ui, PLATE, PLATE, THICK)} draw />
					</g>
					<Box faces={box(0, 0, LAYER.web, PLATE, PLATE, THICK)} draw />

					{/* Products slide out of the web plate along the x axis. */}
					{productBlocks.map((product, index) => {
						const dx = PRODUCT.startX - product.x
						return (
							<Link key={product.x} href="/products" className="group/layer">
								<g
									className="fig-slide"
									style={delay(T.products + index * 0.15, {
										"--from-x": `${(dx * COS30).toFixed(1)}px`,
										"--from-y": `${(dx * 0.5).toFixed(1)}px`,
									})}
								>
									<g className="transition-transform duration-300 ease-out group-hover/layer:-translate-y-1">
										<Box
											faces={box(
												product.x,
												product.y,
												LAYER.web,
												PRODUCT.w,
												PRODUCT.d,
												PRODUCT.h,
											)}
											dashed={index > 0}
										/>
									</g>
								</g>
							</Link>
						)
					})}

					<g className="fig-split" style={delay(T.split, { "--from": `${SPLIT}px` })}>
						<Box faces={box(0, 0, LAYER.content, PLATE, PLATE, THICK)} draw />
					</g>

					{/* Revealed once the plates have split. */}
					<Guides from={LAYER.ui + THICK} to={LAYER.web} />
					<Guides from={LAYER.web + THICK} to={LAYER.content} />
					<g className="fig-fade fill-brand" style={delay(T.labels)}>
						<text transform={flatText(10, 150, LAYER.ui + THICK)}>packages/ui</text>
						<text transform={flatText(10, 150, LAYER.web + THICK)}>siddsingh.dev</text>
					</g>

					{blocks.map((block, index) => (
						<RisingBlock key={block.label} block={block} index={index} />
					))}
					{/* An empty slot: the next thing being built. */}
					<g className="fig-fade" style={delay(T.slot)}>
						<Box
							faces={box(SLOT.x, SLOT.y, CONTENT_TOP, BLOCK.w, BLOCK.d, BLOCK.h)}
							dashed
						/>
					</g>

					{callouts.map((callout, index) => (
						<Callout key={callout.title} {...callout} index={index} />
					))}
				</g>
			</svg>
			{/* Phones: the callouts would be ~6px, so their counts move here. */}
			<dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-xs sm:hidden">
				{callouts.map((callout) => (
					<div key={callout.title}>
						<dt>
							{callout.href ? (
								<Link className="link" href={callout.href}>
									{callout.title}
								</Link>
							) : (
								callout.title
							)}
						</dt>
						<dd className="text-muted-foreground">{callout.detail}</dd>
					</div>
				))}
			</dl>
		</>
	)
}
