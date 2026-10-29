"use client"

import { Button } from "@workspace/ui/components/button"
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
	ComboboxTrigger,
} from "@workspace/ui/components/combobox"
import { Input } from "@workspace/ui/components/input"
import { InputGroupAddon } from "@workspace/ui/components/input-group"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@workspace/ui/components/select"
import { cn } from "@workspace/ui/lib/utils"
import {
	ArrowRightIcon,
	CircleCheckIcon,
	InfoIcon,
	SearchIcon,
	SparklesIcon,
	TriangleAlertIcon,
	XCircleIcon,
} from "lucide-react"
import { useEffect, useState } from "react"
import { CopyButton } from "../tool-ui"
import { type CronSpec, convert, PLATFORM_NAMES, render } from "./convert"
import { EXAMPLES, parseNatural } from "./natural"
import { type PlatformId, parseCron, type Schedule } from "./parse"
import { type Check, platformIds } from "./platforms"
import { compareRuns, type DstEvent, localDate } from "./runs"

/** The current time in milliseconds, refreshed every `interval` ms. */
export function useNow(interval: number) {
	const [now, setNow] = useState(() => Date.now())
	useEffect(() => {
		const timer = setInterval(() => setNow(Date.now()), interval)
		return () => clearInterval(timer)
	}, [interval])
	return now
}

export function formatIn(ms: number) {
	const seconds = Math.max(0, Math.round(ms / 1000))
	if (seconds < 60) return `${seconds}s`
	if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
	if (seconds < 86400) {
		const minutes = Math.floor((seconds % 3600) / 60)
		return `${Math.floor(seconds / 3600)}h${minutes ? ` ${minutes}m` : ""}`
	}
	const days = Math.floor(seconds / 86400)
	const hours = Math.floor((seconds % 86400) / 3600)
	return `${days}d${hours ? ` ${hours}h` : ""}`
}

/** "Next run in 3h 12m", ticking on its own so nothing else re-renders. */
export function NextRunCountdown({ runs }: { runs: Date[] }) {
	const now = useNow(1000)
	const next = runs.find((run) => run.getTime() > now)
	return <>{next ? `Next run in ${formatIn(next.getTime() - now)}` : "No upcoming runs"}</>
}

const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone

function formatIn24(date: Date, zone: string) {
	return new Intl.DateTimeFormat("en-GB", {
		timeZone: zone,
		weekday: "short",
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		second: undefined,
	}).format(date)
}

export function RunsTable({
	runs,
	timezone,
	dst,
	error,
}: {
	runs: Date[]
	timezone: string
	dst: DstEvent[]
	error?: string
}) {
	const now = useNow(30_000)
	if (error)
		return <p className="p-6 text-sm text-destructive">Couldn't compute run times: {error}</p>
	if (runs.length === 0) {
		return <p className="p-6 text-sm text-muted-foreground">This expression never runs.</p>
	}
	const showZone = timezone !== browserZone && timezone !== "Etc/UTC" && timezone !== "UTC"
	const byDate = new Map(dst.map((event) => [event.date, event]))
	return (
		<div className="min-h-0 flex-1 overflow-auto">
			<table className="w-full text-xs">
				<thead className="sticky top-0 bg-background">
					<tr className="border-b border-line text-left font-mono text-muted-foreground uppercase">
						<th className="px-3 py-2 font-normal">Your time ({browserZone})</th>
						<th className="px-3 py-2 font-normal max-sm:hidden">UTC</th>
						{showZone && <th className="px-3 py-2 font-normal">{timezone}</th>}
						<th className="px-3 py-2 text-right font-normal">In</th>
					</tr>
				</thead>
				<tbody>
					{runs.slice(0, 10).map((run) => {
						const event = byDate.get(localDate(run, timezone))
						return (
							<tr
								key={run.getTime()}
								className="border-b border-line align-top last:border-b-0"
							>
								<td className="px-3 py-2 font-mono">
									{formatIn24(run, browserZone)}
									{event && (
										<p className="mt-0.5 flex items-center gap-1 font-sans text-amber-600 dark:text-amber-400">
											<TriangleAlertIcon className="size-3" />
											{event.kind === "gap"
												? `${event.times.join(", ")} is skipped by daylight saving today`
												: `${event.times.join(", ")} happens twice today`}
										</p>
									)}
								</td>
								<td className="px-3 py-2 font-mono text-muted-foreground max-sm:hidden">
									{formatIn24(run, "Etc/UTC")}
								</td>
								{showZone && (
									<td className="px-3 py-2 font-mono">
										{formatIn24(run, timezone)}
									</td>
								)}
								<td className="px-3 py-2 text-right text-muted-foreground tabular-nums">
									{formatIn(run.getTime() - now)}
								</td>
							</tr>
						)
					})}
				</tbody>
			</table>
		</div>
	)
}

const checkIcon = {
	fail: { icon: XCircleIcon, className: "text-destructive", label: "Problem" },
	warn: {
		icon: TriangleAlertIcon,
		className: "text-amber-600 dark:text-amber-400",
		label: "Warning",
	},
	info: { icon: InfoIcon, className: "text-brand", label: "Note" },
}

export function ChecksList({ checks, platform }: { checks: Check[]; platform: PlatformId }) {
	const problems = checks.filter((check) => check.status !== "info").length
	return (
		<div className="min-h-0 flex-1 overflow-y-auto">
			<p
				role="status"
				className={cn(
					"flex items-center gap-2 border-b border-line px-3 py-3 font-medium",
					problems === 0 ? "bg-success/10" : "bg-destructive/5",
				)}
			>
				{problems === 0 ? (
					<CircleCheckIcon className="size-4 text-success" />
				) : (
					<TriangleAlertIcon className="size-4 text-destructive" />
				)}
				{problems === 0
					? `Looks good for ${PLATFORM_NAMES[platform]}`
					: `${problems} ${problems === 1 ? "issue" : "issues"} for ${PLATFORM_NAMES[platform]}`}
			</p>
			<ul aria-label="Platform checks">
				{checks.map((check) => {
					const { icon: Icon, className, label } = checkIcon[check.status]
					return (
						<li
							key={check.id}
							className="flex gap-3 border-b border-line px-3 py-2.5 last:border-b-0"
						>
							<Icon
								aria-label={label}
								className={cn("mt-0.5 size-4 shrink-0", className)}
							/>
							<div className="min-w-0 text-sm">
								<p className="font-medium">{check.title}</p>
								<p className="text-muted-foreground">{check.detail}</p>
								{check.fix && <p className="mt-0.5 text-xs">Fix: {check.fix}</p>}
							</div>
						</li>
					)
				})}
			</ul>
		</div>
	)
}

export function PlatformSelect({
	value,
	onChange,
	exclude,
	label,
}: {
	value: PlatformId
	onChange: (platform: PlatformId) => void
	exclude?: PlatformId
	label: string
}) {
	const items = platformIds
		.filter((id) => id !== exclude)
		.map((id) => ({ value: id, label: PLATFORM_NAMES[id] }))
	return (
		<Select
			items={items}
			value={value}
			onValueChange={(next) => next && onChange(next as PlatformId)}
		>
			<SelectTrigger aria-label={label} size="sm" className="h-8 bg-background">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{items.map((item) => (
					<SelectItem key={item.value} value={item.value}>
						{item.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	)
}

export function ConvertPanel({
	schedule,
	timezone,
	onOpen,
}: {
	schedule: Schedule
	timezone: string
	onOpen: (platform: PlatformId, expression: string) => void
}) {
	const [target, setTarget] = useState<PlatformId>(
		schedule.platform === "eventbridge" ? "standard" : "eventbridge",
	)
	const effectiveTarget =
		target === schedule.platform ? (platformIds.find((id) => id !== target) ?? target) : target
	const result = convert(schedule, effectiveTarget)
	const parsed = result.expression ? parseCron(result.expression, effectiveTarget) : null
	const comparison = parsed?.ok ? compareRuns(schedule, parsed.schedule, timezone) : null
	return (
		<div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
			<div className="flex flex-wrap items-center gap-2 text-sm">
				<span className="text-muted-foreground">Convert to</span>
				<PlatformSelect
					label="Target platform"
					value={effectiveTarget}
					exclude={schedule.platform}
					onChange={setTarget}
				/>
			</div>
			{result.expression ? (
				<div className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-muted/30 p-3">
					<code className="min-w-0 flex-1 font-mono text-sm break-all">
						{result.expression}
					</code>
					<CopyButton value={result.expression} />
					<Button
						size="sm"
						variant="outline"
						className="h-8 rounded-lg bg-background shadow-xs"
						onClick={() => onOpen(effectiveTarget, result.expression ?? "")}
					>
						Open
						<ArrowRightIcon />
					</Button>
				</div>
			) : (
				<p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
					Can't be written for {PLATFORM_NAMES[effectiveTarget]}.
				</p>
			)}
			{result.notes.length > 0 && (
				<ul className="flex flex-col gap-1 text-sm text-muted-foreground">
					{result.notes.map((note) => (
						<li key={note} className="flex gap-2">
							<InfoIcon className="mt-0.5 size-3.5 shrink-0" />
							{note}
						</li>
					))}
				</ul>
			)}
			{comparison && (
				<p
					className={cn(
						"flex items-center gap-2 text-sm",
						comparison.same ? "text-success" : "text-amber-600 dark:text-amber-400",
					)}
				>
					{comparison.same ? (
						<CircleCheckIcon className="size-4" />
					) : (
						<TriangleAlertIcon className="size-4" />
					)}
					{comparison.same
						? `Same schedule: the next ${comparison.count} runs match.`
						: `Differs from run ${comparison.index + 1}: ${comparison.a?.toISOString() ?? "none"} vs ${comparison.b?.toISOString() ?? "none"}.`}
				</p>
			)}
		</div>
	)
}

const zones = (() => {
	try {
		return Intl.supportedValuesOf("timeZone")
	} catch {
		return ["Etc/UTC"]
	}
})()
const zoneItems = ["Etc/UTC", ...zones.filter((zone) => zone !== "Etc/UTC" && zone !== "UTC")]

export function TimezonePicker({
	value,
	onChange,
	disabled,
}: {
	value: string
	onChange: (zone: string) => void
	disabled?: boolean
}) {
	return (
		<Combobox
			items={zoneItems}
			value={value}
			onValueChange={(next: string | null) => next && onChange(next)}
			disabled={disabled}
			autoHighlight
		>
			<ComboboxTrigger
				aria-label="Time zone"
				disabled={disabled}
				className="flex h-8 min-w-0 items-center justify-between gap-1.5 rounded-lg border border-input bg-background px-2.5 font-mono text-xs whitespace-nowrap outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
			>
				<span className="truncate">{value}</span>
			</ComboboxTrigger>
			<ComboboxContent className="w-72">
				<ComboboxInput
					showTrigger={false}
					placeholder="Search time zones"
					aria-label="Search time zones"
				>
					<InputGroupAddon>
						<SearchIcon />
					</InputGroupAddon>
				</ComboboxInput>
				<ComboboxEmpty>No time zone matches.</ComboboxEmpty>
				<ComboboxList>
					{(zone: string) => (
						<ComboboxItem key={zone} value={zone} className="font-mono text-xs">
							{zone}
						</ComboboxItem>
					)}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	)
}

type Preset = "minutes" | "hourly" | "daily" | "weekly" | "monthly"
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

/** Build an expression from a sentence or from presets, written in `platform`'s dialect. */
export function Builder({
	platform,
	onBuild,
}: {
	platform: PlatformId
	onBuild: (expression: string) => void
}) {
	const [mode, setMode] = useState<"sentence" | "pick">("sentence")
	const [sentence, setSentence] = useState("")
	const [message, setMessage] = useState<string | null>(null)
	const [preset, setPreset] = useState<Preset>("daily")
	const [every, setEvery] = useState("15")
	const [time, setTime] = useState("09:00")
	const [weekday, setWeekday] = useState("1")
	const [monthDay, setMonthDay] = useState("1")

	const apply = (spec: CronSpec) => {
		const result = render(spec, platform)
		if (result.expression) {
			onBuild(result.expression)
			setMessage(result.notes.length > 0 ? result.notes.join(" ") : null)
		} else setMessage(result.notes.join(" "))
	}

	const fromSentence = (text: string) => {
		const result = parseNatural(text)
		if (result.ok) apply(result.spec)
		else setMessage(result.message)
	}

	const fromPreset = () => {
		const [hour = "0", minute = "0"] = time.split(":").map((part) => String(Number(part)))
		const base: CronSpec = {
			second: "0",
			minute,
			hour,
			dom: "*",
			month: "*",
			dow: "*",
			year: "*",
		}
		const n = Math.min(59, Math.max(1, Number(every) || 1))
		const spec: Record<Preset, CronSpec> = {
			minutes: { ...base, minute: n === 1 ? "*" : `*/${n}`, hour: "*" },
			hourly: { ...base, minute: String(Math.min(59, Number(every) || 0)), hour: "*" },
			daily: base,
			weekly: { ...base, dow: weekday },
			monthly: { ...base, dom: String(Math.min(31, Math.max(1, Number(monthDay) || 1))) },
		}
		apply(spec[preset])
	}

	const presetItems: { value: Preset; label: string }[] = [
		{ value: "minutes", label: "Every N minutes" },
		{ value: "hourly", label: "Hourly at minute" },
		{ value: "daily", label: "Daily at" },
		{ value: "weekly", label: "Weekly on" },
		{ value: "monthly", label: "Monthly on day" },
	]

	return (
		<div className="flex flex-col gap-2 px-3 py-3">
			<div className="flex items-center gap-1 text-xs">
				<SparklesIcon className="size-3.5 text-brand" />
				<span className="mr-auto font-medium">Build an expression</span>
				{(["sentence", "pick"] as const).map((value) => (
					<button
						key={value}
						type="button"
						aria-pressed={mode === value}
						onClick={() => setMode(value)}
						className={cn(
							"rounded-md px-2 py-1",
							mode === value
								? "bg-muted font-medium"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						{value === "sentence" ? "From a sentence" : "Pick"}
					</button>
				))}
			</div>
			{mode === "sentence" ? (
				<>
					<form
						className="flex gap-2"
						onSubmit={(event) => {
							event.preventDefault()
							fromSentence(sentence)
						}}
					>
						<Input
							aria-label="Describe the schedule"
							placeholder="every weekday at 9:30"
							value={sentence}
							onChange={(event) => setSentence(event.target.value)}
							className="h-8"
						/>
						<Button type="submit" size="sm" className="h-8 rounded-lg">
							Build
						</Button>
					</form>
					<div className="flex flex-wrap gap-1">
						{EXAMPLES.map((example) => (
							<button
								key={example}
								type="button"
								className="rounded-full border border-line px-2 py-0.5 text-xs text-muted-foreground hover:border-brand/40 hover:text-foreground"
								onClick={() => {
									setSentence(example)
									fromSentence(example)
								}}
							>
								{example}
							</button>
						))}
					</div>
				</>
			) : (
				<div className="flex flex-wrap items-center gap-2 text-sm">
					<Select
						items={presetItems}
						value={preset}
						onValueChange={(next) => next && setPreset(next as Preset)}
					>
						<SelectTrigger aria-label="Preset" size="sm" className="h-8 bg-background">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{presetItems.map((item) => (
								<SelectItem key={item.value} value={item.value}>
									{item.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{(preset === "minutes" || preset === "hourly") && (
						<Input
							aria-label={
								preset === "minutes"
									? "Minutes between runs"
									: "Minute past the hour"
							}
							type="number"
							min={preset === "minutes" ? 1 : 0}
							max={59}
							value={every}
							onChange={(event) => setEvery(event.target.value)}
							className="h-8 w-20"
						/>
					)}
					{preset === "weekly" && (
						<select
							aria-label="Day of the week"
							value={weekday}
							onChange={(event) => setWeekday(event.target.value)}
							className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
						>
							{WEEKDAYS.map((day, index) => (
								<option key={day} value={String(index)}>
									{day}
								</option>
							))}
						</select>
					)}
					{preset === "monthly" && (
						<Input
							aria-label="Day of the month"
							type="number"
							min={1}
							max={31}
							value={monthDay}
							onChange={(event) => setMonthDay(event.target.value)}
							className="h-8 w-20"
						/>
					)}
					{preset !== "minutes" && preset !== "hourly" && (
						<Input
							aria-label="Time"
							type="time"
							value={time}
							onChange={(event) => setTime(event.target.value)}
							className="h-8 w-28"
						/>
					)}
					<Button size="sm" className="h-8 rounded-lg" onClick={fromPreset}>
						Use
					</Button>
				</div>
			)}
			{message && <p className="text-xs text-muted-foreground">{message}</p>}
		</div>
	)
}
