"use client"

import { EditorView } from "@codemirror/view"
import { Button } from "@workspace/ui/components/button"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { cn } from "@workspace/ui/lib/utils"
import { CheckIcon, Link2Icon } from "lucide-react"
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react"
import { ResizableSplit } from "@/components/resizable-split"
import { CodeEditor } from "../editor/code-editor"
import { cron } from "../editor/languages/cron"
import { json } from "../editor/languages/json"
import { plainText } from "../editor/languages/text"
import { yaml } from "../editor/languages/yaml"
import type { InlineMark } from "../editor/marks"
import { fragmentLink, readFragment } from "../share"
import {
	Chip,
	ErrorCard,
	FileTab,
	headerButton,
	PaneHeader,
	StatusBar,
	SubBar,
} from "../tool-chrome"
import { CopyButton } from "../tool-ui"
import { convert, PLATFORM_NAMES } from "./convert"
import {
	Builder,
	ChecksList,
	ConvertPanel,
	NextRunCountdown,
	PlatformSelect,
	RunsTable,
	TimezonePicker,
} from "./panels"
import { fieldLabel, type PlatformId, parseCron } from "./parse"
import { describe, lint, platformIds, platforms, snippet } from "./platforms"
import { dstEvents, nextRuns, shortestGap } from "./runs"

const WORKSPACE = "/tools/cron-expression/workspace"
type Tab = "runs" | "checks" | "snippet" | "convert"

const EXAMPLES: Record<PlatformId, string> = {
	standard: "30 9 * * 1-5",
	"github-actions": "17 9 * * 1-5",
	kubernetes: "0 9 * * 1-5",
	eventbridge: "cron(0 9 ? * MON-FRI *)",
	vercel: "0 9 * * 1",
	quartz: "0 0 9 ? * MON-FRI",
}

const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone

function defaultZone(platform: PlatformId) {
	const { timezone } = platforms[platform]
	return timezone.fixed ?? (timezone.default === "UTC" ? "Etc/UTC" : browserZone)
}

function validZone(zone: string) {
	try {
		new Intl.DateTimeFormat("en-US", { timeZone: zone })
		return true
	} catch {
		return false
	}
}

function readInitial() {
	const params = readFragment(window.location.hash)
	const requested = params.get("platform")
	const platform = platformIds.includes(requested as PlatformId)
		? (requested as PlatformId)
		: "standard"
	const zone = params.get("tz")
	return {
		platform,
		text: params.get("cron") ?? EXAMPLES[platform],
		timezone:
			platforms[platform].timezone.fixed ??
			(zone && validZone(zone) ? zone : defaultZone(platform)),
	}
}

// One-line editor: no gutters, and a tint for the field under the ruler's pointer.
const singleLine = EditorView.theme({
	".cm-gutters": { display: "none" },
	".cm-content": { padding: "10px 0" },
	".cm-field-hover": { backgroundColor: "var(--brand-muted)", borderRadius: "3px" },
})

export function CronExpressionTool() {
	const [initial] = useState(readInitial)
	const [platform, setPlatform] = useState<PlatformId>(initial.platform)
	const [text, setText] = useState(initial.text)
	const [timezone, setTimezone] = useState(initial.timezone)
	const [tab, setTab] = useState<Tab>("runs")
	const [hovered, setHovered] = useState<string | null>(null)
	const [flash, setFlash] = useState<string | null>(null)
	const flashTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
	useEffect(() => () => clearTimeout(flashTimer.current), [])

	const deferredText = useDeferredValue(text)
	const parsed = useMemo(() => parseCron(deferredText, platform), [deferredText, platform])
	const schedule = parsed.ok ? parsed.schedule : null
	// A CRON_TZ= prefix in a crontab line sets the zone the run times use.
	const prefixZone =
		platform === "standard" && schedule?.tzPrefix && validZone(schedule.tzPrefix.zone)
			? schedule.tzPrefix.zone
			: null
	const zone = prefixZone ?? timezone

	const analysis = useMemo(() => {
		if (!schedule) return null
		const { runs, error } = nextRuns(schedule, zone, 50)
		const dst = dstEvents(schedule, zone)
		return {
			runs,
			error,
			dst,
			checks: lint(schedule, {
				timezone: zone,
				shortestGap: shortestGap(runs),
				neverRuns: !error && runs.length === 0,
				dst,
			}),
			description: describe(schedule),
			snippet: snippet(schedule, zone),
		}
	}, [schedule, zone])

	const switchPlatform = (next: PlatformId) => {
		// Carry the schedule over when it can be written in the new dialect.
		const converted = schedule ? convert(schedule, next).expression : null
		setPlatform(next)
		setText(converted ?? EXAMPLES[next])
		setTimezone(defaultZone(next))
	}

	const marks = useMemo(() => {
		if (!parsed.ok) {
			return {
				doc: deferredText,
				items: parsed.errors.map(
					(error): InlineMark => ({
						from: error.from,
						to: Math.max(error.to, error.from + 1),
						className: "cm-mark-high",
						tooltip: { title: error.message },
					}),
				),
			}
		}
		const field = parsed.schedule.fields.find((item) => item.name === hovered)
		return field && !parsed.schedule.macro
			? {
					doc: deferredText,
					items: [{ from: field.from, to: field.to, className: "cm-field-hover" }],
				}
			: undefined
	}, [parsed, deferredText, hovered])

	const share = async () => {
		const link = fragmentLink(WORKSPACE, { cron: text, platform, tz: zone })
		try {
			await navigator.clipboard.writeText(link)
			setFlash("Link copied")
		} catch {
			setFlash("Clipboard blocked")
		}
		clearTimeout(flashTimer.current)
		flashTimer.current = setTimeout(() => setFlash(null), 1600)
	}

	const problems = analysis?.checks.filter((check) => check.status !== "info").length ?? 0
	const fails = analysis?.checks.some((check) => check.status === "fail") ?? false
	const name = PLATFORM_NAMES[platform]
	const fixedZone = platforms[platform].timezone.fixed

	return (
		<ResizableSplit
			left={
				<section className="flex h-full min-h-0 flex-col overflow-y-auto bg-background">
					<PaneHeader>
						<FileTab
							name="schedule"
							badge={
								!parsed.ok
									? "Invalid"
									: fails
										? `Problems for ${name}`
										: `Valid for ${name}`
							}
							badgeTone={!parsed.ok || fails ? "destructive" : "brand"}
						/>
						<div className="ml-auto flex items-center gap-1.5">
							<PlatformSelect
								label="Platform"
								value={platform}
								onChange={switchPlatform}
							/>
							<Button
								size="sm"
								variant="outline"
								className={headerButton}
								onClick={share}
							>
								{flash ? <CheckIcon /> : <Link2Icon />}
								<span className="max-sm:hidden">{flash ?? "Share"}</span>
							</Button>
						</div>
					</PaneHeader>
					<CodeEditor
						label={`Cron expression for ${name}`}
						placeholder={EXAMPLES[platform]}
						language={cron}
						value={text}
						onChange={setText}
						invalid={!parsed.ok}
						marks={marks}
						extensions={singleLine}
						className="flex-none text-base"
					/>
					{schedule && !schedule.macro && (
						<div className="grid shrink-0 auto-cols-fr grid-flow-col border-y border-line text-center">
							{schedule.fields.map((field) => (
								// biome-ignore lint/a11y/noStaticElementInteractions: hover only highlights the field in the editor
								<div
									key={field.name}
									className={cn(
										"min-w-0 border-r border-line px-1 py-1.5 last:border-r-0",
										hovered === field.name && "bg-brand-muted",
									)}
									onMouseEnter={() => setHovered(field.name)}
									onMouseLeave={() => setHovered(null)}
								>
									<p className="truncate font-mono text-sm">{field.text}</p>
									<p className="truncate text-[0.65rem] text-muted-foreground uppercase">
										{fieldLabel(field.name)}
									</p>
								</div>
							))}
						</div>
					)}
					{parsed.ok ? (
						<p
							className="shrink-0 px-3 py-3 text-lg font-medium text-balance"
							aria-live="polite"
						>
							{analysis?.description ?? "Can't describe this expression."}
						</p>
					) : (
						<div className="pt-3">
							<ErrorCard
								title="Couldn't read this expression"
								message={parsed.errors.map((error) => error.message).join("\n")}
							/>
						</div>
					)}
					<div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-line px-3 py-2 text-xs">
						<span className="text-muted-foreground">Time zone</span>
						<TimezonePicker
							value={zone}
							onChange={setTimezone}
							disabled={Boolean(fixedZone || prefixZone)}
						/>
						<span className="min-w-0 flex-1 text-muted-foreground">
							{prefixZone
								? "Set by CRON_TZ= in the expression."
								: platforms[platform].timezone.note}
						</span>
					</div>
					<div className="shrink-0 border-t border-line">
						<Builder platform={platform} onBuild={setText} />
					</div>
					<div className="mt-auto">
						<StatusBar
							tone={!parsed.ok ? "error" : fails ? "warn" : "ok"}
							label={!parsed.ok ? "Invalid expression" : `${name} · ${zone}`}
							detail={
								analysis ? <NextRunCountdown runs={analysis.runs} /> : undefined
							}
						/>
					</div>
				</section>
			}
			right={
				<section className="flex h-full min-h-0 flex-col bg-background">
					<SubBar className="min-h-12">
						<Tabs value={tab} onValueChange={(next) => setTab(next as Tab)}>
							<TabsList className="rounded-lg">
								<TabsTrigger value="runs" className="rounded-md px-2.5">
									Next runs
								</TabsTrigger>
								<TabsTrigger value="checks" className="gap-1.5 rounded-md px-2.5">
									Checks
									{problems > 0 && (
										<Chip
											tone={fails ? "destructive" : "warning"}
											className="px-1.5 py-0"
										>
											{problems}
										</Chip>
									)}
								</TabsTrigger>
								<TabsTrigger value="snippet" className="rounded-md px-2.5">
									Snippet
								</TabsTrigger>
								<TabsTrigger value="convert" className="rounded-md px-2.5">
									Convert
								</TabsTrigger>
							</TabsList>
						</Tabs>
						{tab === "snippet" && analysis && (
							<div className="ml-auto">
								<CopyButton value={analysis.snippet.text} />
							</div>
						)}
					</SubBar>
					{!schedule || !analysis ? (
						<p className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
							Fix the expression on the left to see when it runs.
						</p>
					) : tab === "runs" ? (
						<RunsTable
							runs={analysis.runs}
							timezone={zone}
							dst={analysis.dst}
							error={analysis.error}
						/>
					) : tab === "checks" ? (
						<ChecksList checks={analysis.checks} platform={platform} />
					) : tab === "snippet" ? (
						<CodeEditor
							readOnly
							label={`${name} config`}
							language={
								analysis.snippet.language === "yaml"
									? yaml
									: analysis.snippet.language === "json"
										? json
										: plainText
							}
							value={analysis.snippet.text}
						/>
					) : (
						<ConvertPanel
							key={platform}
							schedule={schedule}
							timezone={zone}
							onOpen={(next, expression) => {
								setPlatform(next)
								setText(expression)
								setTimezone(platforms[next].timezone.fixed ?? zone)
								setTab("checks")
							}}
						/>
					)}
				</section>
			}
		/>
	)
}
