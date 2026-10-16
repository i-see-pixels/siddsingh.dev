import { Button } from "@workspace/ui/components/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip"
import { MailIcon } from "lucide-react"
import Link from "next/link"
import { AvailabilityPill, Joined } from "@/components/badges"
import { BlueprintFigure } from "@/components/home/blueprint-figure"
import { Panel } from "@/components/panel"
import { GitHubIcon, LinkedInIcon, XIcon } from "@/components/social-icons"
import { pitch } from "@/lib/placeholder-content"
import { siteConfig } from "@/lib/site-config"

export function Hero() {
	return (
		<>
			<Panel className="screen-line-bottom-none">
				<div className="relative px-4 pt-12 pb-8">
					<AvailabilityPill />
					<h1 className="mt-4 text-4xl font-medium tracking-tight text-balance sm:text-5xl">
						{pitch.headline}
					</h1>
					<p className="mt-3 max-w-xl text-base text-balance text-muted-foreground">
						{pitch.support}
					</p>
					<div className="mt-6 flex flex-wrap items-center gap-3">
						<Button
							size="lg"
							nativeButton={false}
							render={<Link href="/work#contact" />}
							className="bg-brand px-4 text-brand-foreground hover:bg-brand/90"
						>
							Hire me for a project
						</Button>
						<Button
							size="lg"
							variant="outline"
							nativeButton={false}
							render={<Link href="/about" />}
						>
							View resume
						</Button>
						<a
							href={siteConfig.callUrl}
							target="_blank"
							rel="noopener"
							className="text-sm text-muted-foreground link-underline"
						>
							or book a 15-min call
						</a>
					</div>
					<p
						aria-hidden
						className="absolute top-24 right-full mr-6 hidden w-24 -rotate-6 text-right font-handwritten text-base text-brand lg:block"
					>
						start here →
					</p>
				</div>
			</Panel>
			<ProfileRow />
		</>
	)
}

/** Avatar + name on the left, Fig. 1 on the right; stacks on phones. */
function ProfileRow() {
	return (
		<div className="screen-line-top screen-line-bottom screen-line-bottom-border grid grid-cols-[auto_minmax(0,1fr)]">
			<figure className="relative col-span-2 border-b border-line dot-grid p-3 sm:col-span-1 sm:col-start-2 sm:border-b-0 sm:p-4">
				<BlueprintFigure />
				<figcaption className="pointer-events-none absolute right-2 bottom-2 text-sm/none tracking-wide text-[color-mix(in_oklab,var(--muted-foreground)_60%,var(--background))] tabular-nums sm:right-4 sm:bottom-3">
					Fig. 1.
				</figcaption>
			</figure>
			<div className="flex sm:row-span-2 sm:row-start-1">
				<div className="mt-auto border-r border-line p-4">
					{/* PLACEHOLDER avatar: replace with the real photo (greyscale → colour on hover). */}
					<div className="flex size-28 items-center justify-center rounded-full border border-dashed border-muted-foreground/40 bg-muted font-mono text-xs text-muted-foreground sm:size-36 max-sm:size-24">
						photo
					</div>
				</div>
			</div>
			<div className="flex flex-col">
				<div className="mt-auto sm:border-t sm:border-line">
					<div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 pt-2">
						<p className="text-[2rem]/none font-medium tracking-tight">
							{siteConfig.name}
						</p>
						<SocialLinks />
					</div>
					<p className="mt-2 border-t border-line px-4 py-1.5 font-mono text-sm text-muted-foreground">
						<Joined text={pitch.flipSentence} />
					</p>
				</div>
			</div>
		</div>
	)
}

const socials = [
	{ label: "X", handle: "@creatorsidd", href: siteConfig.x, icon: <XIcon /> },
	{ label: "GitHub", handle: "i-see-pixels", href: siteConfig.github, icon: <GitHubIcon /> },
	{
		label: "LinkedIn",
		handle: "Siddhant Singh",
		href: siteConfig.linkedin,
		icon: <LinkedInIcon />,
	},
	{
		label: "Email",
		handle: siteConfig.email,
		href: `mailto:${siteConfig.email}`,
		icon: <MailIcon />,
	},
]

/** Icon buttons beside the name, with a handwritten nudge. */
function SocialLinks() {
	return (
		<div className="flex items-center gap-3">
			<ul className="flex gap-1.5">
				{socials.map((social) => (
					<li key={social.label}>
						<Tooltip>
							<TooltipTrigger
								render={
									<Button
										variant="outline"
										size="icon-sm"
										nativeButton={false}
										className="text-foreground/80 shadow-none [&_svg:not([class*=size-])]:size-4"
										render={
											<a href={social.href} target="_blank" rel="noopener" />
										}
									>
										{social.icon}
										<span className="sr-only">{social.label}</span>
									</Button>
								}
							/>
							<TooltipContent>
								{social.label} ({social.handle})
							</TooltipContent>
						</Tooltip>
					</li>
				))}
			</ul>
			<p
				aria-hidden
				className="-rotate-6 font-handwritten text-base whitespace-nowrap text-brand"
			>
				← follow me
			</p>
		</div>
	)
}
