import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import {
	ArrowRightIcon,
	ArrowUpRightIcon,
	BoxIcon,
	BriefcaseBusinessIcon,
	CalendarIcon,
	ClockIcon,
	CodeIcon,
	MailIcon,
	MapPinIcon,
	PenToolIcon,
	WrenchIcon,
} from "lucide-react"
import Link from "next/link"
import { AvailabilityPill, IconTile, Joined, PulseDot, StatusTag, Tag } from "@/components/badges"
import { LocalTime } from "@/components/home/local-time"
import {
	Panel,
	PanelContent,
	PanelDescription,
	PanelFooter,
	PanelHeader,
	PanelTitle,
} from "@/components/panel"
import { caseStudies, experience, posts, products, proof, services, tools } from "@/lib/content"
import { availability, siteConfig } from "@/lib/site-config"

export function ProofStrip() {
	return (
		<Panel marks={false} className="screen-line-top-none">
			<h2 className="sr-only">At a glance</h2>
			<dl className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
				{proof.map((item) => (
					<div key={item.label} className="flex flex-col gap-1 bg-background px-4 py-4">
						<dd className="font-mono text-3xl font-medium tracking-tight tabular-nums">
							{item.value}
						</dd>
						<dt className="order-first font-mono text-[0.625rem]/4 font-medium tracking-wider text-muted-foreground uppercase">
							{item.label}
						</dt>
					</div>
				))}
			</dl>
		</Panel>
	)
}

export function Overview() {
	const current = experience.find((job) => job.current)
	const rows = [
		{
			id: "role",
			icon: <CodeIcon />,
			content: current ? `${current.role} @ ${current.company}` : "Independent",
		},
		{ id: "location", icon: <MapPinIcon />, content: siteConfig.location },
		{
			id: "time",
			icon: <ClockIcon />,
			content: <LocalTime timeZone={siteConfig.timeZone} label={siteConfig.timeZoneLabel} />,
		},
		{
			id: "email",
			icon: <MailIcon />,
			content: (
				<a className="link" href={`mailto:${siteConfig.email}`}>
					{siteConfig.email}
				</a>
			),
		},
	]

	return (
		<Panel marks={false} className="screen-line-top-none">
			<h2 className="sr-only">Overview</h2>
			<PanelContent className="grid gap-x-4 gap-y-2.5 sm:grid-cols-2">
				{rows.map((row) => (
					<div key={row.id} className="flex items-center gap-4 font-mono text-sm">
						<IconTile>{row.icon}</IconTile>
						<p className="text-balance">{row.content}</p>
					</div>
				))}
			</PanelContent>
			<div className="pointer-events-none absolute inset-y-0 left-1/2 -z-1 w-px -translate-x-2.25 border-r border-dashed border-line max-sm:hidden" />
		</Panel>
	)
}

/** Two-column grid whose 1px gaps draw the cell borders. */
function CardGrid({ className, ...props }: React.ComponentProps<"ul">) {
	return (
		<ul
			className={cn(
				"grid gap-px bg-line sm:grid-cols-2 sm:[&>li:last-child:nth-child(odd)]:col-span-2",
				className,
			)}
			{...props}
		/>
	)
}

function CardCell({ href, children }: { href: string; children: React.ReactNode }) {
	return (
		<li className="bg-background">
			<Link
				href={href}
				className="flex h-full flex-col gap-2 p-4 transition-[background-color] ease-out hover:bg-accent-muted"
			>
				{children}
			</Link>
		</li>
	)
}

function ViewAll({ href, children }: { href: string; children: React.ReactNode }) {
	return (
		<PanelFooter>
			<Button
				variant="secondary"
				size="sm"
				nativeButton={false}
				render={<Link href={href} />}
				className="gap-2 pr-2.5 pl-3 shadow-[inset_0_0_1px] shadow-foreground/20"
			>
				{children}
				<ArrowRightIcon />
			</Button>
		</PanelFooter>
	)
}

const workRowClass = "grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-end"

/** A case-study row; links out to the live project when there is one. */
function WorkRow({ href, children }: { href?: string; children: React.ReactNode }) {
	if (!href) return <div className={workRowClass}>{children}</div>
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener"
			className={cn(
				workRowClass,
				"transition-[background-color] ease-out hover:bg-accent-muted",
			)}
		>
			{children}
		</a>
	)
}

export function SelectedWork({ sheet = "01" }: { sheet?: string }) {
	return (
		<Panel id="work">
			<PanelHeader>
				<PanelTitle sheet={sheet} count={caseStudies.length} anchor="work">
					Selected work
				</PanelTitle>
			</PanelHeader>
			<ul>
				{caseStudies.map((study) => (
					<li key={study.slug} className="screen-line-bottom">
						<WorkRow href={study.href}>
							<div className="flex flex-col gap-1">
								<p className="font-mono text-xs text-muted-foreground">
									<Joined
										text={`${study.client} · ${study.type} · ${study.year}`}
									/>
								</p>
								<h3 className="text-lg/snug font-medium text-balance">
									{study.title}
								</h3>
								<ul className="mt-1 flex flex-wrap gap-1.5">
									{study.stack.map((item) => (
										<li key={item}>
											<Tag>{item}</Tag>
										</li>
									))}
								</ul>
							</div>
							{study.outcome && (
								<p className="font-mono text-2xl font-medium tracking-tight text-brand tabular-nums">
									{study.outcome}
								</p>
							)}
						</WorkRow>
					</li>
				))}
			</ul>
			<ViewAll href="/work">All work</ViewAll>
		</Panel>
	)
}

export function Services({ sheet = "02" }: { sheet?: string }) {
	return (
		<Panel id="services">
			<PanelHeader>
				<PanelTitle sheet={sheet} anchor="services">
					Services
				</PanelTitle>
			</PanelHeader>
			<PanelDescription>
				Freelance work for teams and founders, from a single landing page to a full product.
			</PanelDescription>
			<ul className="grid gap-px bg-line sm:grid-cols-2">
				{services.map((service) => (
					<li key={service.name} className="flex flex-col gap-3 bg-background p-4">
						<div className="flex items-center gap-3">
							<IconTile>
								<PenToolIcon />
							</IconTile>
							<h3 className="text-lg/snug font-medium">{service.name}</h3>
						</div>
						<p className="text-sm text-muted-foreground">{service.description}</p>
						<ul className="space-y-1 text-sm">
							{service.includes.map((item) => (
								<li key={item} className="flex gap-2">
									<span className="text-brand" aria-hidden>
										+
									</span>
									{item}
								</li>
							))}
						</ul>
					</li>
				))}
			</ul>
			<PanelFooter>
				<Button
					nativeButton={false}
					render={<Link href="#contact" />}
					className="bg-brand text-brand-foreground hover:bg-brand/90"
				>
					Start a project
				</Button>
			</PanelFooter>
		</Panel>
	)
}

export function Products() {
	return (
		<Panel id="products">
			<PanelHeader>
				<PanelTitle sheet="03" count={products.length} anchor="products">
					Products
				</PanelTitle>
			</PanelHeader>
			<CardGrid>
				{products.map((product) => (
					<CardCell key={product.name} href={product.href}>
						<div className="flex items-center gap-3">
							<IconTile>
								<BoxIcon />
							</IconTile>
							<h3 className="flex-1 font-medium">{product.name}</h3>
							<StatusTag status={product.status} />
						</div>
						<p className="text-sm text-muted-foreground">{product.pitch}</p>
					</CardCell>
				))}
			</CardGrid>
			<ViewAll href="/products">All products</ViewAll>
		</Panel>
	)
}

export function Experience() {
	return (
		<Panel id="experience">
			<PanelHeader>
				<PanelTitle sheet="04" anchor="experience">
					Experience
				</PanelTitle>
			</PanelHeader>
			<ul>
				{experience.slice(0, 2).map((job) => (
					<li key={job.role} className="screen-line-bottom flex items-center gap-3 p-4">
						<IconTile>
							<BriefcaseBusinessIcon />
						</IconTile>
						<div className="flex-1">
							<h3 className="flex items-center gap-2 font-medium">
								{job.company}
								{job.current && <PulseDot />}
							</h3>
							<p className="text-sm text-muted-foreground">{job.role}</p>
						</div>
						<p className="font-mono text-sm text-muted-foreground tabular-nums">
							{job.period}
						</p>
					</li>
				))}
			</ul>
			<ViewAll href="/about">Full resume</ViewAll>
		</Panel>
	)
}

export function Writing() {
	return (
		<Panel id="writing">
			<PanelHeader>
				<PanelTitle sheet="05" count={posts.length} anchor="writing">
					Writing
				</PanelTitle>
			</PanelHeader>
			<CardGrid>
				{posts.slice(0, 4).map((post) => (
					<CardCell key={post.slug} href={`/blog/${post.slug}`}>
						<h3 className="text-lg/snug font-medium text-balance">{post.title}</h3>
						<p className="text-sm text-muted-foreground">{post.date}</p>
					</CardCell>
				))}
			</CardGrid>
			<ViewAll href="/blog">All posts</ViewAll>
		</Panel>
	)
}

export function Tools() {
	return (
		<Panel id="tools">
			<PanelHeader>
				<PanelTitle sheet="06" count={tools.length} anchor="tools">
					Free tools
				</PanelTitle>
			</PanelHeader>
			<CardGrid>
				{tools.map((tool) => (
					<CardCell key={tool.slug} href={`/tools/${tool.slug}`}>
						<div className="flex items-center gap-3">
							<IconTile>
								<WrenchIcon />
							</IconTile>
							<h3 className="flex-1 font-medium">{tool.name}</h3>
							<Tag>{tool.category}</Tag>
						</div>
						<p className="text-sm text-muted-foreground">{tool.description}</p>
					</CardCell>
				))}
			</CardGrid>
			<ViewAll href="/tools">All tools</ViewAll>
		</Panel>
	)
}

export function Contact({ sheet = "07" }: { sheet?: string }) {
	return (
		<Panel id="contact">
			<PanelHeader>
				<PanelTitle sheet={sheet} anchor="contact">
					Let's build something
				</PanelTitle>
			</PanelHeader>
			<PanelContent className="flex flex-col gap-4">
				<AvailabilityPill className="self-start" />
				<p className="text-muted-foreground">
					Tell me what you're building, or grab a 15-minute call.
				</p>
				<div className="flex flex-wrap gap-3">
					<Button
						nativeButton={false}
						render={<a href={`mailto:${siteConfig.email}`} />}
						className="gap-2 bg-brand text-brand-foreground hover:bg-brand/90"
					>
						<MailIcon />
						Email me
					</Button>
					<Button
						variant="outline"
						nativeButton={false}
						render={<a href={siteConfig.callUrl} target="_blank" rel="noopener" />}
						className="gap-2"
					>
						<CalendarIcon />
						Book a call
					</Button>
					<Button
						variant="ghost"
						nativeButton={false}
						render={<a href={siteConfig.linkedin} />}
						className="gap-1"
					>
						LinkedIn
						<ArrowUpRightIcon />
					</Button>
				</div>
				{!availability.open && (
					<p className="text-sm text-muted-foreground">
						Currently booked — join the waitlist.
					</p>
				)}
			</PanelContent>
		</Panel>
	)
}
