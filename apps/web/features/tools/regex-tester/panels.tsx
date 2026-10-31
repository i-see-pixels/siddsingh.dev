"use client"

import { cn } from "@workspace/ui/lib/utils"
import {
	CircleCheckIcon,
	CircleSlashIcon,
	type InfoIcon,
	TriangleAlertIcon,
	WrenchIcon,
} from "lucide-react"
import { Chip } from "../tool-chrome"
import { CopyButton } from "../tool-ui"
import type { CaptureGroup } from "./ast"
import type { ExplainRow } from "./explain"
import type { Issue, IssueLevel, Status } from "./portability"
import type { Match } from "./run"

const MAX_ROWS = 200

export function MatchesPanel({
	matches,
	groups,
	capped,
	onSelect,
}: {
	matches: Match[]
	groups: CaptureGroup[]
	capped: boolean
	onSelect: (match: Match) => void
}) {
	if (matches.length === 0) {
		return (
			<p className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
				No matches in this text.
			</p>
		)
	}
	const label = (index: number) =>
		groups.find((group) => group.index === index)?.name ?? `${index}`
	return (
		<div className="min-h-0 flex-1 overflow-auto">
			<table className="w-full text-xs">
				<thead className="sticky top-0 bg-background">
					<tr className="border-b border-line text-left font-mono text-muted-foreground uppercase">
						<th className="px-3 py-2 font-normal">#</th>
						<th className="px-3 py-2 font-normal">Range</th>
						<th className="px-3 py-2 font-normal">Match</th>
						{groups.map((group) => (
							<th key={group.index} className="px-3 py-2 font-normal normal-case">
								{group.name ?? `Group ${group.index}`}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{matches.slice(0, MAX_ROWS).map((match, index) => (
						<tr
							key={match.start}
							className="cursor-pointer border-b border-line align-top last:border-b-0 hover:bg-muted/50"
							onClick={() => onSelect(match)}
						>
							<td className="px-3 py-2 text-muted-foreground tabular-nums">
								{index + 1}
							</td>
							<td className="px-3 py-2 whitespace-nowrap text-muted-foreground tabular-nums">
								{match.start}–{match.end}
							</td>
							<td className="px-3 py-2 font-mono break-all">
								{match.text || (
									<span className="text-muted-foreground">(empty)</span>
								)}
							</td>
							{groups.map((group) => {
								const value = match.groups.find(
									(item) => item.index === group.index,
								)
								return (
									<td
										key={group.index}
										title={`Group ${label(group.index)}`}
										className="px-3 py-2 font-mono break-all"
									>
										{value ? (
											value.text
										) : (
											<span className="text-muted-foreground">–</span>
										)}
									</td>
								)
							})}
						</tr>
					))}
				</tbody>
			</table>
			{(capped || matches.length > MAX_ROWS) && (
				<p className="px-3 py-2 text-xs text-muted-foreground">
					Showing the first {Math.min(matches.length, MAX_ROWS).toLocaleString()} of{" "}
					{capped
						? `${matches.length.toLocaleString()}+`
						: matches.length.toLocaleString()}{" "}
					matches.
				</p>
			)}
		</div>
	)
}

export function ExplainPanel({
	rows,
	onHover,
}: {
	rows: ExplainRow[]
	onHover: (range: { from: number; to: number } | null) => void
}) {
	return (
		<ul className="min-h-0 flex-1 overflow-y-auto py-1" aria-label="Pattern explanation">
			{rows.map((row) => (
				<li
					key={`${row.from}-${row.to}-${row.depth}`}
					className="flex items-baseline gap-3 px-3 py-1 text-sm hover:bg-muted/50"
					style={{ paddingLeft: `${0.75 + row.depth * 1.25}rem` }}
					onMouseEnter={() => onHover(row)}
					onMouseLeave={() => onHover(null)}
				>
					<code className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
						{row.token}
					</code>
					<span className="min-w-0 text-muted-foreground">{row.text}</span>
				</li>
			))}
		</ul>
	)
}

const statusChip: Record<Status, { label: string; tone: "success" | "warning" | "destructive" }> = {
	works: { label: "Works", tone: "success" },
	changes: { label: "Works with changes", tone: "warning" },
	unsupported: { label: "Not supported", tone: "destructive" },
}

const issueIcon: Record<IssueLevel, { icon: typeof InfoIcon; className: string }> = {
	unsupported: { icon: CircleSlashIcon, className: "text-destructive" },
	rewrite: { icon: WrenchIcon, className: "text-amber-600 dark:text-amber-400" },
	behaviour: { icon: TriangleAlertIcon, className: "text-amber-600 dark:text-amber-400" },
}

export function LanguageRow({
	name,
	status,
	issues,
	code,
	ran,
}: {
	name: string
	status: Status
	issues: Issue[]
	code: string | null
	ran?: boolean
}) {
	const chip = statusChip[status]
	return (
		<section className="border-b border-line px-3 py-3 last:border-b-0">
			<div className="flex items-center gap-2">
				<h3 className="font-medium">{name}</h3>
				<Chip tone={chip.tone}>{chip.label}</Chip>
				{ran && (
					<span className="flex items-center gap-1 text-xs text-muted-foreground">
						<CircleCheckIcon className="size-3.5 text-success" />
						Run in your browser
					</span>
				)}
				{code && (
					<div className="ml-auto">
						<CopyButton value={code} />
					</div>
				)}
			</div>
			{issues.length > 0 && (
				<ul className="mt-2 flex flex-col gap-1.5 text-sm">
					{issues.map((issue) => {
						const { icon: Icon, className } = issueIcon[issue.level]
						return (
							<li key={`${issue.level}-${issue.message}`} className="flex gap-2">
								<Icon className={cn("mt-0.5 size-3.5 shrink-0", className)} />
								<span className="min-w-0">
									{issue.message}
									{issue.suggestion && (
										<span className="text-muted-foreground">
											{" "}
											{issue.suggestion}
										</span>
									)}
								</span>
							</li>
						)
					})}
				</ul>
			)}
			{code && (
				<pre className="mt-2 overflow-x-auto rounded-lg border border-line bg-muted/30 p-2.5 font-mono text-xs leading-5">
					{code}
				</pre>
			)}
		</section>
	)
}
