// Next run times and daylight-saving trouble spots, using croner. Pure and DOM-free.

import { Cron, type CronOptions } from "croner"
import type { Schedule } from "./parse"

/** The schedule as a croner pattern and options. */
export function cronerConfig(schedule: Schedule): { pattern: string; options: CronOptions } {
	// croner treats `?` as "the current time", not "any", so it becomes `*` here.
	const texts = schedule.fields.map((field) => (field.question ? "*" : field.text))
	if (schedule.platform === "eventbridge") {
		return {
			pattern: `0 ${texts.join(" ")}`,
			options: { mode: "7-part", alternativeWeekdays: true, domAndDow: false },
		}
	}
	if (schedule.platform === "quartz") {
		return {
			pattern: texts.join(" "),
			options: { mode: "6-or-7-parts", alternativeWeekdays: true, domAndDow: false },
		}
	}
	// Five-field crons run when either day field matches, if both are restricted.
	return { pattern: texts.join(" "), options: { mode: "5-part", domAndDow: false } }
}

export function makeCron(schedule: Schedule, timezone: string) {
	const { pattern, options } = cronerConfig(schedule)
	return new Cron(pattern, { ...options, timezone, paused: true })
}

/** The next `count` runs after `from`, or an error when croner can't evaluate the pattern. */
export function nextRuns(schedule: Schedule, timezone: string, count: number, from = new Date()) {
	try {
		const cron = makeCron(schedule, timezone)
		const runs = cron.nextRuns(count, from)
		cron.stop()
		return { runs }
	} catch (error) {
		return { runs: [] as Date[], error: error instanceof Error ? error.message : String(error) }
	}
}

/** Shortest gap between consecutive runs, in seconds, over the next `count` runs. */
export function shortestGap(runs: Date[]) {
	let gap: number | null = null
	for (let index = 1; index < runs.length; index++) {
		const current = runs[index]
		const previous = runs[index - 1]
		if (!current || !previous) continue
		const seconds = (current.getTime() - previous.getTime()) / 1000
		if (gap === null || seconds < gap) gap = seconds
	}
	return gap
}

// The DST scan asks for offsets about 1,500 times per expression, so formatters are reused.
const offsetFormats = new Map<string, Intl.DateTimeFormat>()

/** UTC offset of `zone` at `instant`, in minutes (Berlin in summer: 120). */
export function offsetMinutes(zone: string, instant: Date) {
	let format = offsetFormats.get(zone)
	if (!format) {
		format = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "longOffset" })
		offsetFormats.set(zone, format)
	}
	const name = format.formatToParts(instant).find((part) => part.type === "timeZoneName")?.value
	const match = /GMT([+-])(\d{2}):?(\d{2})?/.exec(name ?? "")
	if (!match) return 0
	const minutes = Number(match[2]) * 60 + Number(match[3] ?? 0)
	return match[1] === "-" ? -minutes : minutes
}

export type DstEvent = {
	kind: "gap" | "overlap"
	/** Local date of the change, YYYY-MM-DD. */
	date: string
	/** Local times the schedule hits that are skipped or happen twice, HH:MM. */
	times: string[]
	/** The instant the clocks change. */
	at: Date
}

const pad = (value: number) => String(value).padStart(2, "0")

/** Instants within the next `days` where `zone` changes its UTC offset. */
export function offsetChanges(zone: string, from: Date, days = 400) {
	const changes: { at: Date; before: number; after: number }[] = []
	const step = 6 * 3600_000
	let previousTime = from.getTime()
	let previousOffset = offsetMinutes(zone, from)
	for (let time = previousTime + step; time <= from.getTime() + days * 86400_000; time += step) {
		const offset = offsetMinutes(zone, new Date(time))
		if (offset !== previousOffset) {
			// Narrow the change down to the minute.
			let low = previousTime
			let high = time
			while (high - low > 60_000) {
				const middle = low + Math.floor((high - low) / 120_000) * 60_000
				if (offsetMinutes(zone, new Date(middle)) === previousOffset) low = middle
				else high = middle
			}
			// Clocks change on a whole minute, and the search leaves it in (low, high], a window
			// of at most a minute that usually isn't aligned, because `from` usually isn't.
			const at = Math.floor(high / 60_000) * 60_000
			changes.push({ at: new Date(at), before: previousOffset, after: offset })
		}
		previousTime = time
		previousOffset = offset
	}
	return changes
}

/**
 * Daylight-saving changes in `zone` where the schedule hits a local time that is skipped
 * (spring forward) or happens twice (fall back).
 */
export function dstEvents(
	schedule: Schedule,
	zone: string,
	from = new Date(),
	days = 400,
): DstEvent[] {
	let wallClock: Cron
	try {
		// Match wall-clock times in UTC, where every local time exists exactly once.
		const { pattern, options } = cronerConfig(schedule)
		wallClock = new Cron(pattern, { ...options, timezone: "Etc/UTC", paused: true })
	} catch {
		return []
	}
	const events: DstEvent[] = []
	for (const change of offsetChanges(zone, from, days)) {
		const difference = change.after - change.before
		// Local wall time just before the change, expressed as a UTC timestamp.
		const wallStart =
			difference > 0
				? change.at.getTime() + change.before * 60_000
				: change.at.getTime() + change.after * 60_000
		const times: string[] = []
		for (let minute = 0; minute < Math.abs(difference); minute++) {
			const wall = new Date(wallStart + minute * 60_000)
			if (wallClock.match(wall))
				times.push(`${pad(wall.getUTCHours())}:${pad(wall.getUTCMinutes())}`)
		}
		if (times.length > 0) {
			const day = new Date(wallStart)
			events.push({
				kind: difference > 0 ? "gap" : "overlap",
				date: `${day.getUTCFullYear()}-${pad(day.getUTCMonth() + 1)}-${pad(day.getUTCDate())}`,
				times,
				at: change.at,
			})
		}
	}
	wallClock.stop()
	return events
}

/** A date's local calendar day in `zone`, YYYY-MM-DD. */
export function localDate(instant: Date, zone: string) {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: zone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(instant)
}

/** Whether two schedules produce the same next `count` runs. */
export function compareRuns(a: Schedule, b: Schedule, zone: string, count = 50, from = new Date()) {
	const first = nextRuns(a, zone, count, from).runs
	const second = nextRuns(b, zone, count, from).runs
	for (let index = 0; index < Math.max(first.length, second.length); index++) {
		if (first[index]?.getTime() !== second[index]?.getTime()) {
			return {
				same: false as const,
				index,
				a: first[index] ?? null,
				b: second[index] ?? null,
			}
		}
	}
	return { same: true as const, count: first.length }
}
