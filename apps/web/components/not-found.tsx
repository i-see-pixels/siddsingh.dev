import { Button } from "@workspace/ui/components/button"
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react"
import Link from "next/link"
import { PageHeading, Panel, PanelHeader, PanelTitle, Separator } from "@/components/panel"
import { navItems } from "@/lib/site-config"

/*
 * Fig. 404: the content plate from Fig. 1 with one sheet missing. Three page
 * blocks sit on the plate; the fourth slot is an empty dashed outline, and the
 * page that should fill it hovers above, drawn in dashes.
 */

type Point = [number, number]

const COS30 = 0.866
const ORIGIN = { x: 320, y: 100 }
function iso(x: number, y: number, z: number): Point {
	return [ORIGIN.x + (x - y) * COS30, ORIGIN.y + (x + y) * 0.5 - z]
}

function toPath(points: Point[], close = true) {
	return `M${points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L")}${close ? "Z" : ""}`
}

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
const BLOCK = { w: 52, d: 52, h: 18 }
const blocks = [
	{ label: "Tools", x: 100, y: 16 },
	{ label: "Blog", x: 16, y: 100 },
	{ label: "Work", x: 100, y: 100 },
]
// The back slot, so the missing page floats clear of the other blocks.
const SLOT = { x: 16, y: 16 }
const LIFT = 46

const faceClass = {
	top: "fill-background",
	left: "fill-[color-mix(in_oklab,var(--brand)_7%,var(--background))]",
	right: "fill-[color-mix(in_oklab,var(--brand)_14%,var(--background))]",
}

function Box({ faces, dashed = false }: { faces: ReturnType<typeof box>; dashed?: boolean }) {
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
					className={dashed ? "fill-background/60" : faceClass[face]}
				/>
			))}
		</g>
	)
}

function NotFoundFigure() {
	const plate = box(0, 0, 0, PLATE, PLATE, THICK)
	const slot = toPath([
		iso(SLOT.x, SLOT.y, THICK),
		iso(SLOT.x + BLOCK.w, SLOT.y, THICK),
		iso(SLOT.x + BLOCK.w, SLOT.y + BLOCK.d, THICK),
		iso(SLOT.x, SLOT.y + BLOCK.d, THICK),
	])
	const missing = box(SLOT.x, SLOT.y, THICK + LIFT, BLOCK.w, BLOCK.d, BLOCK.h)

	// Dimension line above the plate, between its left and right corners.
	const [leftX] = iso(0, PLATE, 0)
	const [rightX] = iso(PLATE, 0, 0)
	const [, sideY] = iso(0, PLATE, THICK)
	const dimY = 22

	// Callout from the missing block's right corner.
	const [ax, ay] = iso(SLOT.x + BLOCK.w, SLOT.y, THICK + LIFT + BLOCK.h)
	const elbow: Point = [ax + 64, ay + 30]
	const shelfEnd = elbow[0] + 64

	// Handwritten note pointing at the empty slot.
	const [slotX, slotY] = iso(SLOT.x, SLOT.y + BLOCK.d / 2, THICK)
	const note: Point = [96, 100]
	const tip: Point = [slotX - 6, slotY - 2]

	return (
		<figure className="dot-grid relative">
			<svg
				viewBox="0 0 640 330"
				role="img"
				aria-labelledby="fig-404-title"
				className="h-auto w-full font-mono text-[11px]"
			>
				<title id="fig-404-title">
					Isometric drawing of the site's content plate with one page missing from its
					slot
				</title>
				<style>{`
					@media (prefers-reduced-motion: no-preference) {
						.fig-404-float {
							animation: fig-404-float 3.2s ease-in-out infinite alternate;
						}
					}
					@keyframes fig-404-float {
						from { transform: translateY(0); }
						to { transform: translateY(-6px); }
					}
				`}</style>

				{/* Dimension line: the plate's width, labelled 404. */}
				<g className="stroke-muted-foreground/60" strokeWidth="1">
					<path
						d={`M${leftX} ${sideY - 6}V${dimY - 6}M${rightX} ${sideY - 6}V${dimY - 6}`}
						strokeDasharray="2 3"
					/>
					<path d={`M${leftX} ${dimY}H${300}M${340} ${dimY}H${rightX}`} />
					<path
						d={`M${leftX - 4} ${dimY + 4}l8 -8M${rightX - 4} ${dimY + 4}l8 -8`}
						className="stroke-foreground/70"
					/>
				</g>
				<text
					x="320"
					y={dimY + 4}
					textAnchor="middle"
					className="fill-foreground text-[12px] font-medium"
				>
					404
				</text>

				{/* Plate and the three pages that exist. */}
				<Box faces={plate} />
				<path
					d={slot}
					className="fill-brand/5 stroke-brand"
					strokeDasharray="3 3"
					strokeWidth="1"
				/>
				{blocks.map((block) => (
					<g key={block.label}>
						<Box faces={box(block.x, block.y, THICK, BLOCK.w, BLOCK.d, BLOCK.h)} />
						<text
							transform={flatText(block.x + 8, block.y + 30, THICK + BLOCK.h)}
							className="fill-foreground"
						>
							{block.label}
						</text>
					</g>
				))}

				{/* Guides from the slot up to the missing page. */}
				<g className="stroke-brand/40" strokeDasharray="2 3" strokeWidth="1">
					{(
						[
							[SLOT.x, SLOT.y + BLOCK.d],
							[SLOT.x + BLOCK.w, SLOT.y + BLOCK.d],
							[SLOT.x + BLOCK.w, SLOT.y],
						] as const
					).map(([x, y]) => {
						const [x1, y1] = iso(x, y, THICK)
						const [, y2] = iso(x, y, THICK + LIFT)
						return <path key={`${x}-${y}`} d={`M${x1} ${y1}V${y2}`} />
					})}
				</g>

				<g className="fig-404-float">
					<Box faces={missing} dashed />
					<text
						transform={flatText(SLOT.x + 20, SLOT.y + 34, THICK + LIFT + BLOCK.h)}
						className="fill-brand text-[16px] font-medium"
					>
						?
					</text>
					<g className="max-sm:hidden">
						<path
							d={`M${ax} ${ay}L${elbow[0]} ${elbow[1]}H${shelfEnd}`}
							className="stroke-muted-foreground/60"
							fill="none"
						/>
						<circle cx={ax} cy={ay} r="2" className="fill-brand" />
						<text x={shelfEnd + 6} y={elbow[1] - 2} className="fill-foreground">
							Requested page
						</text>
						<text x={shelfEnd + 6} y={elbow[1] + 11} className="fill-muted-foreground">
							not on this sheet
						</text>
					</g>
				</g>

				{/* Margin note in the drafter's hand. */}
				<g className="text-brand max-sm:hidden">
					<text
						x={note[0]}
						y={note[1]}
						className="fill-current font-handwritten text-[15px]"
						transform={`rotate(-6 ${note[0]} ${note[1]})`}
					>
						should be here
					</text>
					<path
						d={`M${note[0] + 108} ${note[1] - 16}C${note[0] + 150} ${note[1] - 24} ${tip[0] - 30} ${tip[1] - 20} ${tip[0]} ${tip[1]}`}
						className="stroke-current"
						fill="none"
						strokeLinecap="round"
					/>
					<path
						d={`M${tip[0] - 8} ${tip[1] - 4}L${tip[0]} ${tip[1]}L${tip[0] - 9} ${tip[1] + 3}`}
						className="stroke-current"
						fill="none"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</g>

				<text
					x="628"
					y="320"
					textAnchor="end"
					className="fill-muted-foreground text-[12px] tracking-wide"
				>
					Fig. 404.
				</text>
			</svg>
		</figure>
	)
}

/** Body of the 404 page; the surrounding frame comes from the caller. */
export function NotFound() {
	return (
		<>
			<PageHeading
				tagline="Error 404"
				title="This page isn't in the drawing set"
				description="The link may be old, the page may have moved, or the address has a typo. These sheets are all still here."
			/>
			<Panel aria-label="Figure 404">
				<NotFoundFigure />
			</Panel>
			<Separator />
			<Panel id="sheets">
				<PanelHeader>
					<PanelTitle sheet="01" count={navItems.length}>
						Sheets in this set
					</PanelTitle>
				</PanelHeader>
				<ul className="grid gap-px bg-line sm:grid-cols-2">
					{navItems.map((item, index) => (
						<li key={item.href} className="bg-background">
							<Link
								href={item.href}
								className="group flex items-center gap-3 p-4 transition-[background-color] ease-out hover:bg-accent-muted"
							>
								<span className="font-mono text-sm text-muted-foreground tabular-nums">
									{String(index + 1).padStart(2, "0")}
								</span>
								<span className="flex-1 font-medium">{item.title}</span>
								<span className="font-mono text-xs text-muted-foreground">
									{item.href}
								</span>
								<ArrowRightIcon className="size-4 text-muted-foreground transition-[translate,color] ease-out group-hover:translate-x-0.5 group-hover:text-brand" />
							</Link>
						</li>
					))}
					{navItems.length % 2 === 1 && <li aria-hidden className="bg-background" />}
				</ul>
			</Panel>
			<div className="screen-line-bottom flex justify-center py-6">
				<Button variant="outline" nativeButton={false} render={<Link href="/" />}>
					<ArrowLeftIcon data-icon="inline-start" />
					Back to the home page
				</Button>
			</div>
		</>
	)
}
