import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import Link from "next/link"
import { PulseDot } from "@/components/badges"
import { BrandMark } from "@/components/brand-mark"
import { availability, siteConfig } from "@/lib/site-config"
import { getStack } from "@/lib/stack"

// Evaluated at build time, so these describe the deployed build.
const commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7)
const buildDate = new Date().toISOString().slice(0, 10)

const stack = getStack()

const inspiredBy = [
	{ name: "chanhdai.com", href: "https://chanhdai.com" },
	{ name: "Josh W. Comeau", href: "https://www.joshwcomeau.com" },
	{ name: "Marc Lou", href: "https://marclou.com" },
	{ name: "it-tools", href: "https://it-tools.tech" },
]

const socials = [
	{ label: "X", href: siteConfig.x },
	{ label: "GitHub", href: siteConfig.github },
	{ label: "LinkedIn", href: siteConfig.linkedin },
	{ label: "Email", href: `mailto:${siteConfig.email}` },
]

/** Footer laid out as the title block of a technical drawing (docs/design.md §5). */
export function SiteFooter() {
	return (
		<footer className="max-w-screen overflow-x-clip px-2">
			<div className="mx-auto border-x border-line md:max-w-3xl">
				<div className="screen-line-top flex flex-wrap items-center justify-between gap-3 px-4 py-6">
					<div>
						<p className="text-lg font-medium tracking-tight">
							Have a project in mind?
						</p>
						<p className="text-sm text-muted-foreground">
							Tell me about it at{" "}
							<a className="link-underline" href={`mailto:${siteConfig.email}`}>
								{siteConfig.email}
							</a>
						</p>
					</div>
					<Button
						nativeButton={false}
						render={<Link href="/work#contact" />}
						className="bg-brand text-brand-foreground hover:bg-brand/90"
					>
						Hire me
					</Button>
				</div>
				<div className="screen-line-top screen-line-bottom">
					<div className="stripe-divider h-12" />
				</div>
				<div className="screen-line-bottom flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3 font-mono text-sm">
					<span className="font-medium">siddsingh.dev</span>
					<span className="font-sans text-muted-foreground">
						{siteConfig.description}
					</span>
				</div>
				<dl className="grid grid-cols-2 gap-px bg-line font-mono md:grid-cols-4">
					<Field label="Hire">
						<Link
							className="inline-flex items-center gap-2 link-underline"
							href="/work#contact"
						>
							{availability.open && <PulseDot />}
							{availability.open ? "Available" : "Booked"}
						</Link>
					</Field>
					<Field label="Built by">{siteConfig.name}</Field>
					<Field label="Build">
						{commit ?? <span className="text-muted-foreground">local</span>}
					</Field>
					<Field label="Date">
						<time dateTime={buildDate}>{buildDate}</time>
					</Field>
					<Field className="col-span-2" label="Stack">
						<ul className="flex flex-col gap-0.5">
							{stack.map((entry) => (
								<li key={entry}>{entry}</li>
							))}
						</ul>
					</Field>
					<Field label="Typeface">Geist</Field>
					<Field label="Source">
						<a className="link-underline" href={siteConfig.sourceCode}>
							GitHub
						</a>
					</Field>
					<Field className="col-span-2 md:col-span-4" label="Inspired by">
						<ol className="grid grid-cols-2 gap-x-4 gap-y-0.5 font-sans md:grid-cols-4">
							{inspiredBy.map((site, index) => (
								<li key={site.name} className="flex gap-2">
									<span
										className="font-mono text-muted-foreground/80"
										aria-hidden
									>
										{String(index + 1).padStart(2, "0")}
									</span>
									<a
										className="link-underline"
										href={site.href}
										target="_blank"
										rel="noopener"
									>
										{site.name}
									</a>
								</li>
							))}
						</ol>
					</Field>
				</dl>
				<div className="screen-line-top h-4" />
				<div className="screen-line-top screen-line-bottom screen-line-bottom-border flex items-center gap-3 px-4 py-3 text-muted-foreground">
					<Link
						href="/"
						aria-label="Home"
						className="mr-auto transition-[color] hover:text-foreground"
					>
						<BrandMark className="text-sm" />
					</Link>
					{socials.map((social, index) => (
						<span key={social.label} className="flex items-center gap-3">
							{index > 0 && <span aria-hidden className="h-4 w-px bg-line" />}
							<a
								href={social.href}
								className="font-mono text-xs transition-[color] hover:text-foreground"
							>
								{social.label}
							</a>
						</span>
					))}
				</div>
			</div>
			<div className="h-(--fade-bottom-height) md:h-12" />
		</footer>
	)
}

function Field({
	label,
	className,
	children,
}: {
	label: string
	className?: string
	children: React.ReactNode
}) {
	return (
		<div className={cn("flex min-w-0 flex-col gap-1 bg-background px-4 py-3", className)}>
			<dt className="text-[0.625rem]/4 font-medium tracking-wider text-muted-foreground uppercase">
				{label}
			</dt>
			<dd className="text-sm">{children}</dd>
		</div>
	)
}
