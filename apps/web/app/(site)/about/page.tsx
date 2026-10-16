import {
	AwardIcon,
	BriefcaseBusinessIcon,
	FileTextIcon,
	GraduationCapIcon,
	SparklesIcon,
} from "lucide-react"
import { IconTile, PulseDot, Tag } from "@/components/badges"
import { Contact } from "@/components/home/sections"
import {
	PageHeading,
	Panel,
	PanelContent,
	PanelHeader,
	PanelTitle,
	Separator,
} from "@/components/panel"
import {
	achievements,
	certification,
	education,
	experience,
	publication,
	skills,
} from "@/lib/content"

export default function AboutPage() {
	return (
		<>
			<PageHeading
				tagline="About"
				title="Resume"
				description="Senior Software Engineer with 3+ years across full-stack development, cloud-native systems, AI agents and developer tooling."
			/>
			<Separator />
			<Panel id="experience">
				<PanelHeader>
					<PanelTitle sheet="01" count={experience.length} anchor="experience">
						Experience
					</PanelTitle>
				</PanelHeader>
				<ul>
					{experience.map((job) => (
						<li key={job.role} className="screen-line-bottom flex flex-col gap-3 p-4">
							<div className="flex items-start gap-3">
								<IconTile>
									<BriefcaseBusinessIcon />
								</IconTile>
								<div className="flex flex-1 flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
									<div>
										<h3 className="flex items-center gap-2 font-medium">
											{job.role}
											{job.current && <PulseDot />}
										</h3>
										<p className="text-sm text-muted-foreground">
											{job.company} · UnitedHealth Group
										</p>
									</div>
									<p className="font-mono text-sm text-muted-foreground tabular-nums">
										{job.period}
									</p>
								</div>
							</div>
							<ul className="space-y-1.5 pl-9 text-sm">
								{job.highlights.map((item) => (
									<li key={item} className="flex gap-2">
										<span className="text-brand" aria-hidden>
											+
										</span>
										{item}
									</li>
								))}
							</ul>
							<ul className="flex flex-wrap gap-1.5 pl-9">
								{job.skills.map((skill) => (
									<li key={skill}>
										<Tag>{skill}</Tag>
									</li>
								))}
							</ul>
						</li>
					))}
				</ul>
			</Panel>
			<Separator />
			<Panel id="education">
				<PanelHeader>
					<PanelTitle sheet="02" anchor="education">
						Education and credentials
					</PanelTitle>
				</PanelHeader>
				<ul>
					<CredentialRow
						icon={<GraduationCapIcon />}
						title={education.school}
						detail={`${education.degree} · ${education.detail}`}
						meta={education.period}
					/>
					<CredentialRow
						icon={<FileTextIcon />}
						title={publication.title}
						detail={`${publication.venue} · ${publication.detail}`}
						meta="Paper"
						href={publication.href}
					/>
					<CredentialRow
						icon={<AwardIcon />}
						title={certification.title}
						detail={certification.issuer}
						meta={certification.period}
						href={certification.href}
					/>
				</ul>
			</Panel>
			<Separator />
			<Panel id="skills">
				<PanelHeader>
					<PanelTitle sheet="03" anchor="skills">
						Skills
					</PanelTitle>
				</PanelHeader>
				<dl className="grid gap-px bg-line sm:grid-cols-2">
					{skills.map((group) => (
						<div key={group.group} className="flex flex-col gap-2 bg-background p-4">
							<dt className="font-mono text-[0.625rem]/4 font-medium tracking-wider text-muted-foreground uppercase">
								{group.group}
							</dt>
							<dd className="flex flex-wrap gap-1.5">
								{group.items.map((item) => (
									<Tag key={item}>{item}</Tag>
								))}
							</dd>
						</div>
					))}
				</dl>
				<PanelContent className="screen-line-top">
					<ul className="space-y-1.5 text-sm">
						{achievements.map((item) => (
							<li key={item} className="flex items-start gap-3">
								<IconTile>
									<SparklesIcon />
								</IconTile>
								<span className="pt-0.5">{item}</span>
							</li>
						))}
					</ul>
				</PanelContent>
			</Panel>
			<Separator />
			<Contact sheet="04" />
		</>
	)
}

function CredentialRow({
	icon,
	title,
	detail,
	meta,
	href,
}: {
	icon: React.ReactNode
	title: string
	detail: string
	meta: string
	href?: string
}) {
	return (
		<li className="screen-line-bottom flex items-start gap-3 p-4">
			<IconTile>{icon}</IconTile>
			<div className="flex flex-1 flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
				<div>
					<h3 className="font-medium">
						{href ? (
							<a className="link" href={href} target="_blank" rel="noopener">
								{title}
							</a>
						) : (
							title
						)}
					</h3>
					<p className="text-sm text-muted-foreground">{detail}</p>
				</div>
				<p className="font-mono text-sm text-muted-foreground tabular-nums">{meta}</p>
			</div>
		</li>
	)
}
