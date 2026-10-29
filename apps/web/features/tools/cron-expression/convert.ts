// Converts schedules between dialects through one neutral form. Pure and DOM-free.

import { dowBase, type FieldName, type PlatformId, type Schedule } from "./parse"

/**
 * A schedule in neutral form: every field present, crontab day numbering
 * (0 = Sunday, 7 also Sunday), numbers instead of names, `*` instead of `?`.
 */
export type CronSpec = Record<FieldName, string>

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
const MAX: Partial<Record<FieldName, number>> = {
	second: 59,
	minute: 59,
	hour: 23,
	dom: 31,
	month: 12,
}

/** Rewrites each value in a list/range/step field with `map`, leaving steps and `#n` alone. */
function mapItems(text: string, map: (value: string) => string) {
	return text
		.split(",")
		.map((item) => {
			const match = /^([^/#]*?)(L?)((?:#\d)?)((?:\/\d+)?)$/i.exec(item)
			if (!match) return item
			const [, range = "", last = "", nth = "", step = ""] = match
			if (range === "*" || range === "" || range.toUpperCase() === "L") return item
			const mapped = range
				.split("-")
				.map((value) => map(value))
				.join("-")
			return `${mapped}${last}${nth}${step}`
		})
		.join(",")
}

/** `5/10` → `5-59/10`, the form every cron accepts. */
function expandBareStep(text: string, name: FieldName) {
	const max = name === "dow" ? 6 : MAX[name]
	if (max === undefined) return text
	return text
		.split(",")
		.map((item) => (/^\d+\/\d+$/.test(item) ? item.replace("/", `-${max}/`) : item))
		.join(",")
}

export function toSpec(schedule: Schedule): CronSpec {
	const base = dowBase(schedule.platform)
	const text = (name: FieldName, fallback: string) => {
		const field = schedule.field[name]
		if (!field || field.question) return fallback
		return field.text
	}
	const month = mapItems(text("month", "*"), (value) => {
		const index = MONTHS.indexOf(value.toUpperCase())
		return index === -1 ? value : String(index + 1)
	})
	const dow = mapItems(text("dow", "*"), (value) => {
		const named = DAYS.indexOf(value.toUpperCase())
		if (named !== -1) return String(named)
		return /^\d+$/.test(value) ? String(Number(value) - base) : value
	})
	return {
		second: expandBareStep(text("second", "0"), "second"),
		minute: expandBareStep(text("minute", "*"), "minute"),
		hour: expandBareStep(text("hour", "*"), "hour"),
		dom: expandBareStep(text("dom", "*").toUpperCase(), "dom"),
		month: expandBareStep(month, "month"),
		dow: expandBareStep(dow.toUpperCase(), "dow"),
		year: text("year", "*"),
	}
}

const restricted = (text: string) => text !== "*"
const special = (text: string) => /[LW#]/i.test(text)

/** Day-of-week text in neutral numbering → the target's numbering, splitting ranges that wrap. */
function renderDow(text: string, base: 0 | 1, allowSeven: boolean) {
	if (text === "*") return text
	const max = base === 1 ? 7 : 6
	const mapOne = (value: number) => {
		const sunday0 = value % 7
		return base === 1 ? sunday0 + 1 : sunday0 === 0 && value === 7 && allowSeven ? 7 : sunday0
	}
	return text
		.split(",")
		.flatMap((item) => {
			const match = /^(\d+)(?:-(\d+))?(L?)((?:#\d)?)((?:\/\d+)?)$/.exec(item)
			if (!match) return [item]
			const [, startText = "", endText, last = "", nth = "", step = ""] = match
			const start = mapOne(Number(startText))
			if (endText === undefined) return [`${start}${last}${nth}${step}`]
			const end = mapOne(Number(endText))
			if (start <= end) return [`${start}-${end}${step}`]
			// The range wrapped past Sunday: split it so it reads forwards.
			const piece = (from: number, to: number) =>
				from === to ? `${from}` : `${from}-${to}${step}`
			return [piece(start, max), piece(base, end)]
		})
		.join(",")
}

export type Rendered = {
	/** The expression in the target dialect, or null when it can't be expressed there. */
	expression: string | null
	/** What changed or was dropped on the way. */
	notes: string[]
}

const FIVE_FIELD: PlatformId[] = ["standard", "github-actions", "kubernetes", "vercel"]

export function render(spec: CronSpec, target: PlatformId): Rendered {
	const notes: string[] = []
	const blockers: string[] = []
	const fiveField = FIVE_FIELD.includes(target)
	const name = PLATFORM_NAMES[target]

	if (spec.second !== "0" && target !== "quartz") {
		notes.push(
			`${name} has no seconds field, so it runs at second 0 instead of ${spec.second}.`,
		)
	}
	if (restricted(spec.year) && fiveField) {
		notes.push(`${name} has no year field, so it runs every year, not only ${spec.year}.`)
	}
	if (fiveField && (special(spec.dom) || special(spec.dow))) {
		blockers.push(`${name} doesn't support L, W or # (last day, nearest weekday, nth weekday).`)
	}

	const base = (target === "eventbridge" || target === "quartz" ? 1 : 0) as 0 | 1
	const dow = renderDow(spec.dow, base, target === "standard")
	let dom = spec.dom
	let dowOut = dow
	if (target === "eventbridge" || target === "quartz") {
		if (restricted(spec.dom) && restricted(spec.dow)) {
			blockers.push(
				`${name} can't run "on these dates or on these weekdays": one of the two day fields must be ?.`,
			)
		} else if (restricted(spec.dow)) dom = "?"
		else dowOut = "?"
	}
	if (target === "vercel" && restricted(spec.dom) && restricted(spec.dow)) {
		blockers.push("Vercel doesn't allow day of month and day of week together; one must be *.")
	}
	if (blockers.length > 0) return { expression: null, notes: [...blockers, ...notes] }

	const core = `${spec.minute} ${spec.hour} ${dom} ${spec.month} ${dowOut}`
	if (target === "eventbridge") return { expression: `cron(${core} ${spec.year})`, notes }
	if (target === "quartz") {
		return {
			expression: `${spec.second} ${core}${restricted(spec.year) ? ` ${spec.year}` : ""}`,
			notes,
		}
	}
	return { expression: core, notes }
}

export const PLATFORM_NAMES: Record<PlatformId, string> = {
	standard: "Standard crontab",
	"github-actions": "GitHub Actions",
	kubernetes: "Kubernetes",
	eventbridge: "AWS EventBridge",
	vercel: "Vercel",
	quartz: "Quartz",
}

/** Convert a parsed schedule into `target`'s dialect. */
export function convert(schedule: Schedule, target: PlatformId): Rendered {
	return render(toSpec(schedule), target)
}
