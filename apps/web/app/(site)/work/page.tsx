import { cn } from "@workspace/ui/lib/utils"
import { ArrowUpRightIcon, MapPinIcon } from "lucide-react"
import { AvailabilityPill, Joined, StatusTag } from "@/components/badges"
import { Contact, Services } from "@/components/home/sections"
import {
	PageHeading,
	Panel,
	PanelDescription,
	PanelHeader,
	PanelTitle,
	Separator,
} from "@/components/panel"
import { type CaseStudy, caseStudies } from "@/lib/content"
import { siteConfig } from "@/lib/site-config"
import { ProjectCover } from "./project-cover"

export default function WorkPage() {
	return (
		<>
			<PageHeading
				tagline="Work"
				title="Freelance work"
				description="I take on a few client projects at a time: web apps, AI features, browser extensions and sites built to rank."
			/>
			<Panel marks={false} className="screen-line-top-none">
				<div className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
					<AvailabilityPill />
					<p className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
						<MapPinIcon className="size-3.5" />
						<Joined text={`${siteConfig.location} · ${siteConfig.timeZoneLabel}`} />
					</p>
				</div>
			</Panel>
			<Separator />
			<ProjectIndex />
			<Separator />
			<Services sheet="02" />
			<Separator />
			<Process />
			<Separator />
			<Contact sheet="04" />
		</>
	)
}

const columns = "grid gap-x-4 sm:grid-cols-[2rem_minmax(0,1fr)_8rem_4.5rem_1rem]"

/** Every project as one index table: project / type / year. */
function ProjectIndex() {
	return (
		<Panel id="projects">
			<PanelHeader>
				<PanelTitle sheet="01" count={caseStudies.length} anchor="projects">
					Project index
				</PanelTitle>
			</PanelHeader>
			<div
				aria-hidden
				className={cn(
					columns,
					"screen-line-bottom px-4 py-2 font-mono text-[0.625rem]/4 font-medium tracking-wider text-muted-foreground uppercase max-sm:hidden",
				)}
			>
				<span>No.</span>
				<span>Project</span>
				<span>Type</span>
				<span>Year</span>
			</div>
			<ol>
				{caseStudies.map((study, index) => (
					<li key={study.slug} className="screen-line-bottom">
						<ProjectRow study={study} number={index + 1} />
					</li>
				))}
			</ol>
		</Panel>
	)
}

function ProjectRow({ study, number }: { study: CaseStudy; number: number }) {
	const content = (
		<>
			<span className="font-mono text-sm text-muted-foreground tabular-nums max-sm:hidden">
				{String(number).padStart(2, "0")}
			</span>
			<div className="flex flex-col gap-4 sm:flex-row">
				<ProjectCover src={study.image} name={study.name} />
				<div className="flex flex-col gap-1">
					<h3 className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xl/snug font-medium tracking-tight">
						{study.name}
						{study.client !== study.name && (
							<span className="font-mono text-xs font-normal tracking-normal text-muted-foreground">
								{study.client}
							</span>
						)}
						{study.status && <StatusTag status={study.status} />}
					</h3>
					<p className="text-sm text-balance text-muted-foreground">{study.title}</p>
					<p className="font-mono text-xs text-muted-foreground">
						<Joined text={study.stack.join(" · ")} />
					</p>
					{study.outcome && (
						<p className="mt-1 font-mono text-sm font-medium text-brand tabular-nums">
							{study.outcome}
						</p>
					)}
				</div>
			</div>
			<p className="font-mono text-sm text-muted-foreground max-sm:mt-2 max-sm:inline-block">
				{study.type}
			</p>
			<p className="font-mono text-sm text-muted-foreground tabular-nums max-sm:inline">
				<span className="sm:hidden"> · </span>
				{study.year}
			</p>
			{study.href && (
				<ArrowUpRightIcon className="size-4 text-muted-foreground transition-[translate,color] ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand max-sm:hidden" />
			)}
		</>
	)

	const rowClass = cn(columns, "items-start p-4 max-sm:block")
	if (!study.href) return <div className={rowClass}>{content}</div>
	return (
		<a
			href={study.href}
			target="_blank"
			rel="noopener"
			className={cn(
				rowClass,
				"group transition-[background-color] ease-out hover:bg-accent-muted",
			)}
		>
			{content}
		</a>
	)
}

function Process() {
	return (
		<Panel id="process">
			<PanelHeader>
				<PanelTitle sheet="03" anchor="process">
					Process
				</PanelTitle>
			</PanelHeader>
			<PanelDescription>
				How a project runs, from the first call to after launch.
			</PanelDescription>
			<figure className="dot-grid flex justify-center px-4 py-8">
				<figcaption className="sr-only">
					Flowchart: an intro call, then a written scope. If we are not a good fit, I
					point you to someone who is. If we are, I build in small pieces and you review a
					live preview every week until it is right, then we launch and I support it after
					go-live.
				</figcaption>
				<div
					aria-hidden
					className="flex flex-col [--main:12.5rem] [--side:7.5rem] sm:[--main:18rem] sm:[--side:13rem]"
				>
					<FlowRow>
						<FlowNode step="01" title="Intro call">
							15 minutes on what you're building and who it's for.
						</FlowNode>
					</FlowRow>
					<FlowArrow />
					<FlowRow>
						<FlowNode step="02" title="Scope">
							A written plan: milestones, stack, timeline and cost.
						</FlowNode>
					</FlowRow>
					<FlowArrow />
					<FlowRow
						side={
							<div className="relative ml-4 rounded-lg border border-dashed border-muted-foreground/40 bg-background p-2.5 text-xs text-muted-foreground sm:ml-8 sm:text-sm">
								Not a fit? I'll point you to someone who is.
							</div>
						}
					>
						<div className="relative flex w-full justify-center py-3">
							<div className="flex size-16 rotate-45 items-center justify-center border border-brand bg-brand-muted backdrop-blur-xs">
								<span className="-rotate-45 font-mono text-xs font-medium text-brand">
									Fit?
								</span>
							</div>
							{/* "no" branch: from the diamond's right corner to the side note. */}
							<div className="absolute top-1/2 -right-4 left-[calc(50%+2.9rem)] h-px bg-muted-foreground/50 sm:-right-8">
								<Arrowhead className="absolute -top-[3.5px] -right-1 -rotate-90" />
								<span className="absolute -top-5 left-1 font-mono text-[0.625rem] text-muted-foreground uppercase">
									no
								</span>
							</div>
						</div>
					</FlowRow>
					<FlowArrow label="yes" />
					{/* Build and review repeat; the bracket on the right draws the loop back. */}
					<div className="relative">
						<FlowRow>
							<FlowNode step="03" title="Build">
								Small, shippable pieces on a live preview link.
							</FlowNode>
						</FlowRow>
						<FlowArrow />
						<FlowRow>
							<FlowNode step="04" title="Review">
								You click through the preview and send feedback.
							</FlowNode>
						</FlowRow>
						<div className="absolute inset-y-7 left-(--main) w-5 rounded-r-lg border-y border-r border-dashed border-brand sm:w-8">
							<Arrowhead className="absolute -top-[3.5px] -left-1 rotate-90 text-brand" />
							<span className="absolute top-1/2 left-full ml-2 -translate-y-1/2 font-mono text-[0.625rem]/4 whitespace-nowrap text-brand uppercase">
								Weekly,
								<br />
								until it's right
							</span>
						</div>
					</div>
					<FlowArrow label="approved" />
					<FlowRow>
						<FlowNode step="05" title="Launch">
							Deploy to your domain and hand over the code and docs.
						</FlowNode>
					</FlowRow>
					<FlowArrow />
					<FlowRow>
						<FlowNode step="06" title="Support">
							Fixes and small changes after go-live.
						</FlowNode>
					</FlowRow>
				</div>
			</figure>
		</Panel>
	)
}

/** One flowchart row: the main column, plus an optional note to its right. */
function FlowRow({ side, children }: { side?: React.ReactNode; children: React.ReactNode }) {
	return (
		<div className="flex items-center">
			<div className="flex w-(--main) shrink-0">{children}</div>
			<div className="w-(--side) shrink-0">{side}</div>
		</div>
	)
}

function FlowNode({
	step,
	title,
	children,
}: {
	step: string
	title: string
	children: React.ReactNode
}) {
	return (
		<div className="w-full rounded-lg border bg-background p-3 shadow-xs">
			<p className="flex items-baseline gap-2">
				<span className="font-mono text-xs text-brand tabular-nums">{step}</span>
				<span className="font-medium">{title}</span>
			</p>
			<p className="mt-1 text-sm text-muted-foreground">{children}</p>
		</div>
	)
}

/** Downward connector between rows, centred on the main column. */
function FlowArrow({ label }: { label?: string }) {
	return (
		<div className="relative flex h-8 w-(--main) flex-col items-center">
			<div className="w-px flex-1 bg-muted-foreground/50" />
			<Arrowhead />
			{label && (
				<span className="absolute top-1/2 left-1/2 ml-2 -translate-y-1/2 font-mono text-[0.625rem] text-muted-foreground uppercase">
					{label}
				</span>
			)}
		</div>
	)
}

function Arrowhead({ className }: { className?: string }) {
	return (
		<svg
			aria-hidden="true"
			viewBox="0 0 8 6"
			className={cn("h-1.5 w-2 shrink-0 fill-current text-muted-foreground", className)}
		>
			<path d="M0 0h8L4 6z" />
		</svg>
	)
}
