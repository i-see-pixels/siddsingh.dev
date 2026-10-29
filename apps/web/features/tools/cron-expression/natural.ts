// Turns a plain-English schedule into a cron spec. Local and rule-based: no AI, no network.

import type { CronSpec } from "./convert"

export type NaturalResult = { ok: true; spec: CronSpec } | { ok: false; message: string }

export const EXAMPLES = [
	"every 15 minutes",
	"every hour at :17",
	"every day at 9am",
	"every weekday at 9:30",
	"every Monday and Thursday at 18:00",
	"on the 1st of every month at midnight",
	"first Monday of the month at 10am",
	"every 6 hours",
	"last day of the month at 23:00",
]

const DAYS: Record<string, number> = {
	sunday: 0,
	sun: 0,
	monday: 1,
	mon: 1,
	tuesday: 2,
	tue: 2,
	tues: 2,
	wednesday: 3,
	wed: 3,
	thursday: 4,
	thu: 4,
	thur: 4,
	thurs: 4,
	friday: 5,
	fri: 5,
	saturday: 6,
	sat: 6,
}

const ORDINALS: Record<string, number> = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5 }

const NUMBER_WORDS: Record<string, number> = {
	one: 1,
	two: 2,
	three: 3,
	four: 4,
	five: 5,
	six: 6,
	ten: 10,
	twelve: 12,
	fifteen: 15,
	twenty: 20,
	thirty: 30,
}

/** Words the parser understands; anything else is reported back to the user. */
const KNOWN = new Set([
	"every",
	"each",
	"at",
	"on",
	"the",
	"of",
	"and",
	"in",
	"a",
	"an",
	"other",
	"minute",
	"minutes",
	"min",
	"mins",
	"hour",
	"hours",
	"day",
	"days",
	"daily",
	"hourly",
	"weekly",
	"monthly",
	"weekday",
	"weekdays",
	"weekend",
	"weekends",
	"month",
	"past",
	"am",
	"pm",
	"midnight",
	"noon",
	"midday",
	"last",
	...Object.keys(DAYS),
	...Object.keys(DAYS).map((day) => `${day}s`),
	...Object.keys(ORDINALS),
	...Object.keys(NUMBER_WORDS),
])

const EMPTY: CronSpec = {
	second: "0",
	minute: "0",
	hour: "0",
	dom: "*",
	month: "*",
	dow: "*",
	year: "*",
}

/** The time of day in `text`, if any, and the text without it. */
function takeTime(
	text: string,
): { time?: { hour: number; minute: number }; rest: string } | { error: string } {
	if (/\bmidnight\b/.test(text))
		return { time: { hour: 0, minute: 0 }, rest: text.replace(/\b(at\s+)?midnight\b/, " ") }
	if (/\b(noon|midday)\b/.test(text))
		return {
			time: { hour: 12, minute: 0 },
			rest: text.replace(/\b(at\s+)?(noon|midday)\b/, " "),
		}
	const match = /\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/.exec(text)
	if (!match || (!match[2] && !match[3] && !/\bat\s+\d/.test(match[0]))) return { rest: text }
	let hour = Number(match[1])
	const minute = Number(match[2] ?? 0)
	const meridiem = match[3]
	if (meridiem) {
		if (hour < 1 || hour > 12) return { error: `${match[0].trim()} isn't a valid time.` }
		hour = (hour % 12) + (meridiem === "pm" ? 12 : 0)
	}
	if (hour > 23 || minute > 59) return { error: `${match[0].trim()} isn't a valid time.` }
	return { time: { hour, minute }, rest: text.replace(match[0], " ") }
}

function readNumber(word: string | undefined) {
	if (!word) return undefined
	if (/^\d+$/.test(word)) return Number(word)
	return NUMBER_WORDS[word]
}

/** Parse a sentence like "every weekday at 9:30" into a cron spec. */
export function parseNatural(sentence: string): NaturalResult {
	const text = ` ${sentence.toLowerCase().replace(/[,.!]/g, " ").replace(/\s+/g, " ").trim()} `
	if (!text.trim())
		return { ok: false, message: "Describe a schedule, like one of the examples." }

	// "every hour at :17" / "17 minutes past every hour"
	const pastHour = /\bat :(\d{1,2})\b|\b(\d{1,2}) minutes? past\b/.exec(text)
	if (pastHour) {
		const minute = Number(pastHour[1] ?? pastHour[2])
		if (minute > 59) return { ok: false, message: `:${minute} isn't a valid minute.` }
		return { ok: true, spec: { ...EMPTY, minute: String(minute), hour: "*" } }
	}

	// "every 15 minutes", "every minute", "every 6 hours", "every hour", "hourly"
	const interval = /\bevery (other )?(\w+ )?(minute|minutes|min|mins|hour|hours)\b/.exec(text)
	if (interval || /\bhourly\b/.test(text)) {
		const unit = interval?.[3] ?? "hour"
		const count = interval?.[1] ? 2 : interval?.[2] ? readNumber(interval[2].trim()) : 1
		if (count === undefined)
			return { ok: false, message: `"${interval?.[2]?.trim()}" isn't a number I can read.` }
		const minutes = unit.startsWith("min")
		if (minutes) {
			if (count < 1 || count > 59)
				return { ok: false, message: "Use an interval between 1 and 59 minutes." }
			return {
				ok: true,
				spec: { ...EMPTY, minute: count === 1 ? "*" : `*/${count}`, hour: "*" },
			}
		}
		if (count < 1 || count > 23)
			return { ok: false, message: "Use an interval between 1 and 23 hours." }
		return { ok: true, spec: { ...EMPTY, hour: count === 1 ? "*" : `*/${count}` } }
	}

	const timed = takeTime(text)
	if ("error" in timed) return { ok: false, message: timed.error }
	const time = timed.time ?? { hour: 0, minute: 0 }
	const base = { ...EMPTY, minute: String(time.minute), hour: String(time.hour) }
	const rest = timed.rest

	// "last day of the month"
	if (/\blast day of (the|every|each) month\b/.test(rest))
		return { ok: true, spec: { ...base, dom: "L" } }

	// "first Monday of the month", "last Friday of the month"
	const nthDay =
		/\b(first|second|third|fourth|fifth|last|1st|2nd|3rd|4th|5th) (\w+?)s? of (the|every|each) month\b/.exec(
			rest,
		)
	if (nthDay) {
		const day = DAYS[nthDay[2] ?? ""]
		if (day === undefined)
			return { ok: false, message: `"${nthDay[2]}" isn't a day of the week.` }
		if (nthDay[1] === "last") return { ok: true, spec: { ...base, dow: `${day}L` } }
		const n = ORDINALS[nthDay[1] ?? ""] ?? Number.parseInt(nthDay[1] ?? "", 10)
		return { ok: true, spec: { ...base, dow: `${day}#${n}` } }
	}

	// "on the 1st of every month", "monthly on the 15th", "every month on the 3rd"
	const dayOfMonth = /\b(\d{1,2})(st|nd|rd|th)\b/.exec(rest)
	if (dayOfMonth && /\b(month|monthly)\b/.test(rest)) {
		const day = Number(dayOfMonth[1])
		if (day < 1 || day > 31)
			return { ok: false, message: `The ${dayOfMonth[0]} isn't a day of the month.` }
		return { ok: true, spec: { ...base, dom: String(day) } }
	}

	// Weekdays, weekends and named days.
	if (/\bweekdays?\b/.test(rest)) return { ok: true, spec: { ...base, dow: "1-5" } }
	if (/\bweekends?\b/.test(rest)) return { ok: true, spec: { ...base, dow: "0,6" } }
	const named = [...rest.matchAll(/\b([a-z]+?)s?\b/g)]
		.map((match) => DAYS[match[1] ?? ""])
		.filter((day): day is number => day !== undefined)
	if (named.length > 0) {
		const days = [...new Set(named)].sort((a, b) => a - b)
		return { ok: true, spec: { ...base, dow: days.join(",") } }
	}

	// "every day", "daily", "weekly", "monthly", or just a time.
	if (/\b(every day|each day|daily)\b/.test(rest) || timed.time) {
		const unknown = rest.split(" ").find((word) => word && !KNOWN.has(word))
		if (unknown) return { ok: false, message: `I didn't understand "${unknown}".` }
		return { ok: true, spec: base }
	}
	if (/\bweekly\b/.test(rest)) return { ok: true, spec: { ...base, dow: "0" } }
	if (/\bmonthly\b/.test(rest)) return { ok: true, spec: { ...base, dom: "1" } }

	const unknown = rest.split(" ").find((word) => word && !KNOWN.has(word))
	return {
		ok: false,
		message: unknown
			? `I didn't understand "${unknown}".`
			: "I couldn't tell how often this should run.",
	}
}
