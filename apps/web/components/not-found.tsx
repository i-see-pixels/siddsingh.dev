import { Button } from "@workspace/ui/components/button"
import { ArrowLeftIcon } from "lucide-react"
import Link from "next/link"
import { Panel } from "@/components/panel"
import { navItems } from "@/lib/site-config"

/*
 * "404" drawn as blueprint linework: each digit is one centreline stroked
 * twice (a wide drafting-blue stroke under a narrower tinted one), so the
 * numerals read as outlined. The zero carries the slash of Geist Mono's
 * zero. Dashed cap and base lines and a dimension line frame the number.
 */

const CAP = 48
const BASE = 188
const DIGIT = 100
const GAP = 40
const LEFT = 130
const RIGHT = LEFT + 3 * DIGIT + 2 * GAP

function four(x: number) {
	return `M${x + 70} ${BASE}V${CAP}L${x} ${CAP + 100}H${x + DIGIT}`
}

function zero(x: number) {
	const r = DIGIT / 2
	return [
		`M${x + r} ${CAP}A${r} ${r} 0 0 1 ${x + DIGIT} ${CAP + r}V${BASE - r}`,
		`A${r} ${r} 0 0 1 ${x} ${BASE - r}V${CAP + r}A${r} ${r} 0 0 1 ${x + r} ${CAP}Z`,
		`M${x + 74} ${CAP + 30}L${x + 26} ${BASE - 30}`,
	].join("")
}

const digits = [four(LEFT), zero(LEFT + DIGIT + GAP), four(LEFT + 2 * (DIGIT + GAP))]

function NotFoundFigure() {
	const dimY = 222

	return (
		<figure className="dot-grid relative">
			<svg
				viewBox="0 0 640 250"
				aria-hidden
				className="mx-auto h-auto w-full max-w-xl font-mono text-[11px]"
			>
				<style>{`
					@media (prefers-reduced-motion: no-preference) {
						.fig-404-digit {
							stroke-dasharray: 1;
							animation: fig-404-draw 1.4s var(--expo-out) both;
						}
					}
					@keyframes fig-404-draw {
						from { stroke-dashoffset: 1; }
						to { stroke-dashoffset: 0; }
					}
				`}</style>

				{/* Cap and base guide lines. */}
				<path
					d={`M${LEFT - 50} ${CAP}H${RIGHT + 50}M${LEFT - 50} ${BASE}H${RIGHT + 50}`}
					className="stroke-brand/30"
					strokeDasharray="3 4"
					strokeWidth="1"
				/>

				{/* Outlined numerals: wide brand stroke, then a tinted core. */}
				<g fill="none" strokeLinejoin="round">
					{digits.map((d, index) => (
						<path
							// biome-ignore lint/suspicious/noArrayIndexKey: the two 4s share a shape
							key={`edge-${index}`}
							d={d}
							pathLength={1}
							className="fig-404-digit stroke-brand"
							strokeWidth="26"
						/>
					))}
					{digits.map((d, index) => (
						<path
							// biome-ignore lint/suspicious/noArrayIndexKey: the two 4s share a shape
							key={`core-${index}`}
							d={d}
							pathLength={1}
							className="fig-404-digit stroke-[color-mix(in_oklab,var(--brand)_8%,var(--background))]"
							strokeWidth="24"
						/>
					))}
				</g>

				{/* Dimension line under the number. */}
				<g className="stroke-muted-foreground/60" strokeWidth="1">
					<path
						d={`M${LEFT} ${BASE + 10}V${dimY + 6}M${RIGHT} ${BASE + 10}V${dimY + 6}`}
						strokeDasharray="2 3"
					/>
					<path d={`M${LEFT} ${dimY}H${276}M${364} ${dimY}H${RIGHT}`} />
					<path
						d={`M${LEFT - 4} ${dimY + 4}l8 -8M${RIGHT - 4} ${dimY + 4}l8 -8`}
						className="stroke-foreground/70"
					/>
				</g>
				<text
					x="320"
					y={dimY + 4}
					textAnchor="middle"
					className="fill-muted-foreground tracking-wider uppercase"
				>
					Not found
				</text>
			</svg>
			<figcaption className="absolute right-4 bottom-3 max-sm:hidden font-mono text-xs tracking-wide text-muted-foreground">
				Fig. 404.
			</figcaption>
		</figure>
	)
}

/** Body of the 404 page; the surrounding frame comes from the caller. */
export function NotFound() {
	return (
		<div className="pt-12">
			<Panel>
				<NotFoundFigure />
			</Panel>
			<Panel className="flex flex-col items-center px-4 py-10 text-center">
				<p className="font-mono text-sm text-muted-foreground">Error 404</p>
				<h1 className="mt-2 text-4xl font-medium tracking-tight text-balance">
					Page not found
				</h1>
				<p className="mt-3 max-w-md text-base text-balance text-muted-foreground">
					The page you're looking for doesn't exist or has moved. Check the address, or
					head back to the home page.
				</p>
				<div className="mt-6 flex flex-wrap justify-center gap-2">
					<Button nativeButton={false} render={<Link href="/" />}>
						<ArrowLeftIcon data-icon="inline-start" />
						Back to home
					</Button>
					<Button variant="outline" nativeButton={false} render={<Link href="/blog" />}>
						Read the blog
					</Button>
				</div>
				<nav aria-label="Site pages" className="mt-8 text-sm text-muted-foreground">
					<p className="font-mono text-xs tracking-wider uppercase">Or try</p>
					<ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
						{navItems.map((item) => (
							<li key={item.href}>
								<Link
									href={item.href}
									className="link-underline hover:text-foreground"
								>
									{item.title}
								</Link>
							</li>
						))}
					</ul>
				</nav>
			</Panel>
		</div>
	)
}
