// Parses a cron expression in one platform's dialect. Pure and DOM-free.
// Platform rules were checked against official docs on 2026-10-30; see platforms.ts.

export type PlatformId =
	| "standard"
	| "github-actions"
	| "kubernetes"
	| "eventbridge"
	| "vercel"
	| "quartz"

export type FieldName = "second" | "minute" | "hour" | "dom" | "month" | "dow" | "year"

export type ParsedField = {
	name: FieldName
	text: string
	/** Position of the field in the input. */
	from: number
	to: number
	/** Every value the field allows, after expanding ranges, steps and names. */
	values: number[]
	/** `*`, or a `*` step that covers the whole range. */
	any: boolean
	/** `?` (EventBridge and Quartz day fields). */
	question: boolean
	usesNames: boolean
	/** `L`, `W` or `#` appear in the field. */
	usesSpecial: boolean
	/** `5/10` style steps without a range, which standard crons reject. */
	bareStartStep: boolean
	/** Numbers written with a leading zero, like `08`. */
	leadingZero: boolean
}

export type Schedule = {
	platform: PlatformId
	/** The expression as given, without `cron(…)` or a `CRON_TZ=` prefix. */
	expression: string
	fields: ParsedField[]
	field: Partial<Record<FieldName, ParsedField>>
	/** `@daily` and friends, when used. */
	macro?: string
	/** A `CRON_TZ=` or `TZ=` prefix, when used. */
	tzPrefix?: { name: string; zone: string }
	/** The input was wrapped in `cron(…)` (EventBridge). */
	wrapped: boolean
}

export type ParseError = { message: string; field?: FieldName; from: number; to: number }
export type ParseResult = { ok: true; schedule: Schedule } | { ok: false; errors: ParseError[] }

const FIVE: FieldName[] = ["minute", "hour", "dom", "month", "dow"]

export function fieldLayout(platform: PlatformId, count?: number): FieldName[] {
	if (platform === "eventbridge") return [...FIVE, "year"]
	if (platform === "quartz") {
		return count === 7 ? ["second", ...FIVE, "year"] : ["second", ...FIVE]
	}
	return FIVE
}

/** Day-of-week numbering: crontab counts from 0 = Sunday, EventBridge and Quartz from 1 = Sunday. */
export function dowBase(platform: PlatformId) {
	return platform === "eventbridge" || platform === "quartz" ? 1 : 0
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

function bounds(name: FieldName, platform: PlatformId): [number, number] {
	switch (name) {
		case "second":
		case "minute":
			return [0, 59]
		case "hour":
			return [0, 23]
		case "dom":
			return [1, 31]
		case "month":
			return [1, 12]
		case "dow":
			// Standard crontab also accepts 7 for Sunday.
			return dowBase(platform) === 1 ? [1, 7] : [0, platform === "standard" ? 7 : 6]
		case "year":
			return platform === "eventbridge" ? [1970, 2199] : [1970, 2099]
	}
}

export const MACROS: Record<string, string> = {
	"@yearly": "0 0 1 1 *",
	"@annually": "0 0 1 1 *",
	"@monthly": "0 0 1 * *",
	"@weekly": "0 0 * * 0",
	"@daily": "0 0 * * *",
	"@midnight": "0 0 * * *",
	"@hourly": "0 * * * *",
}

const FIELD_LABEL: Record<FieldName, string> = {
	second: "second",
	minute: "minute",
	hour: "hour",
	dom: "day of month",
	month: "month",
	dow: "day of week",
	year: "year",
}

export function fieldLabel(name: FieldName) {
	return FIELD_LABEL[name]
}

/** A value in `name`'s field: a number or, for month and day of week, a name. */
function readValue(
	token: string,
	name: FieldName,
	platform: PlatformId,
): { value: number; name: boolean } | null {
	const upper = token.toUpperCase()
	if (name === "month" && MONTHS.includes(upper))
		return { value: MONTHS.indexOf(upper) + 1, name: true }
	if (name === "dow" && DAYS.includes(upper)) {
		return { value: DAYS.indexOf(upper) + dowBase(platform), name: true }
	}
	if (!/^\d+$/.test(token)) return null
	return { value: Number(token), name: false }
}

function parseField(
	text: string,
	from: number,
	name: FieldName,
	platform: PlatformId,
): { field: ParsedField } | { error: ParseError } {
	const [min, max] = bounds(name, platform)
	const label = FIELD_LABEL[name]
	const fail = (message: string): { error: ParseError } => ({
		error: { message, field: name, from, to: from + text.length },
	})
	const field: ParsedField = {
		name,
		text,
		from,
		to: from + text.length,
		values: [],
		any: false,
		question: false,
		usesNames: false,
		usesSpecial: false,
		bareStartStep: false,
		leadingZero: /(^|[^\d])0\d/.test(text),
	}
	if (text === "?") {
		if (name !== "dom" && name !== "dow")
			return fail(`? is only allowed in the day fields, not ${label}.`)
		field.question = true
		field.any = true
		return { field }
	}
	const values = new Set<number>()
	for (const part of text.split(",")) {
		if (part === "") return fail(`The ${label} field has an empty item in its list.`)
		const upper = part.toUpperCase()
		// Day-of-month specials: L, L-3, LW, 15W.
		if (name === "dom" && /^(L(-\d+)?|LW|\d+W)$/.test(upper)) {
			field.usesSpecial = true
			const day = /^(\d+)W$/.exec(upper)?.[1]
			if (day && (Number(day) < 1 || Number(day) > 31))
				return fail(`${day}W is outside 1–31.`)
			continue
		}
		// Day-of-week specials: 5L (last Friday in crontab numbering), 2#1 (first Monday).
		if (name === "dow" && /^([A-Z]{3}|\d)(L|#[1-5])$/.test(upper)) {
			const day = readValue(/^([A-Z]{3}|\d)/.exec(upper)?.[1] ?? "", name, platform)
			if (!day || day.value < min || day.value > max)
				return fail(`${part} names a day outside ${min}–${max}.`)
			field.usesSpecial = true
			field.usesNames ||= day.name
			continue
		}
		if (name === "dow" && upper === "L") {
			field.usesSpecial = true
			continue
		}
		const stepMatch = /^(.*)\/(\d+)$/.exec(part)
		const rangeText = stepMatch ? (stepMatch[1] ?? "") : part
		const step = stepMatch ? Number(stepMatch[2]) : 1
		if (stepMatch && step === 0)
			return fail(`A step of 0 in the ${label} field never advances.`)
		let start: number
		let end: number
		if (rangeText === "*") {
			start = min
			end = max
		} else {
			const range = rangeText.split("-")
			if (range.length > 2) return fail(`"${part}" isn't a valid ${label} range.`)
			const first = readValue(range[0] ?? "", name, platform)
			const last = range.length === 2 ? readValue(range[1] ?? "", name, platform) : null
			if (!first || (range.length === 2 && !last)) {
				return fail(
					`"${part}" isn't a valid ${label}. Allowed: ${min}–${max}${name === "month" ? " or JAN–DEC" : name === "dow" ? " or SUN–SAT" : ""}.`,
				)
			}
			field.usesNames ||= first.name || Boolean(last?.name)
			start = first.value
			end = last ? last.value : stepMatch ? max : first.value
			if (stepMatch && range.length === 1) field.bareStartStep = true
		}
		for (const value of [start, end]) {
			if (value < min || value > max) {
				const hint =
					name === "dow" && dowBase(platform) === 1 && value === 0
						? " This platform counts days 1–7 from Sunday."
						: ""
				return fail(`${value} is outside the ${label} range ${min}–${max}.${hint}`)
			}
		}
		if (start > end) {
			// Wrapping ranges like FRI-MON are allowed in some crons but not others; reject them plainly.
			return fail(
				`The ${label} range ${part} runs backwards. Write it as two ranges, like ${start}-${max},${min}-${end}.`,
			)
		}
		for (let value = start; value <= end; value += step) values.add(value)
	}
	field.values = [...values].sort((a, b) => a - b)
	field.any = text === "*" || text === "*/1"
	return { field }
}

/** Parse `input` in `platform`'s dialect. */
export function parseCron(input: string, platform: PlatformId): ParseResult {
	let text = input
	let offset = 0
	const leading = text.length - text.trimStart().length
	text = text.trim()
	offset = leading
	if (!text)
		return { ok: false, errors: [{ message: "Type a cron expression.", from: 0, to: 0 }] }

	let tzPrefix: Schedule["tzPrefix"]
	const prefix = /^(CRON_TZ|TZ)=(\S+)\s+/.exec(text)
	if (prefix) {
		tzPrefix = { name: prefix[1] ?? "", zone: prefix[2] ?? "" }
		offset += prefix[0].length
		text = text.slice(prefix[0].length)
	}

	let wrapped = false
	const cronCall = /^cron\((.*)\)$/i.exec(text)
	if (cronCall) {
		wrapped = true
		offset += 5
		text = cronCall[1] ?? ""
		const inner = text.length - text.trimStart().length
		offset += inner
		text = text.trim()
	}

	let macro: string | undefined
	let expression = text
	if (text.startsWith("@")) {
		const lower = text.toLowerCase()
		if (lower === "@reboot") {
			return {
				ok: false,
				errors: [
					{
						message:
							"@reboot runs at startup, not on a schedule, so there's nothing to show.",
						from: offset,
						to: offset + text.length,
					},
				],
			}
		}
		const expanded = MACROS[lower]
		if (!expanded) {
			return {
				ok: false,
				errors: [
					{
						message: `${text} isn't a known shortcut. Known: ${Object.keys(MACROS).join(", ")}.`,
						from: offset,
						to: offset + text.length,
					},
				],
			}
		}
		macro = lower
		expression = expanded
	}

	// Split into fields, keeping each one's position in the input.
	const parts: { text: string; from: number }[] = []
	if (macro) {
		for (const part of expression.split(" ")) parts.push({ text: part, from: offset })
	} else {
		for (const match of text.matchAll(/\S+/g))
			parts.push({ text: match[0], from: offset + (match.index ?? 0) })
	}

	const layout = fieldLayout(platform, parts.length)
	if (macro && (platform === "eventbridge" || platform === "quartz")) {
		return {
			ok: false,
			errors: [
				{
					message: `${platform === "eventbridge" ? "EventBridge" : "Quartz"} doesn't support shortcuts like ${macro}.`,
					from: offset,
					to: offset + text.length,
				},
			],
		}
	}
	if (parts.length !== layout.length) {
		const hint =
			platform === "eventbridge" && parts.length === 5
				? " EventBridge adds a year at the end: try appending *."
				: platform === "quartz" && parts.length === 5
					? " Quartz starts with seconds: try 0 in front."
					: platform !== "eventbridge" && platform !== "quartz" && parts.length > 5
						? " This platform has no seconds or year field."
						: ""
		return {
			ok: false,
			errors: [
				{
					message: `Expected ${platform === "quartz" ? "6 or 7" : layout.length} fields, found ${parts.length}.${hint}`,
					from: offset,
					to: offset + text.length,
				},
			],
		}
	}

	const fields: ParsedField[] = []
	const errors: ParseError[] = []
	layout.forEach((name, index) => {
		const part = parts[index]
		if (!part) return
		const result = parseField(part.text, part.from, name, platform)
		if ("error" in result) {
			if (macro) result.error.to = offset + text.length
			errors.push(result.error)
		} else fields.push(result.field)
	})
	if (errors.length > 0) return { ok: false, errors }

	return {
		ok: true,
		schedule: {
			platform,
			expression: macro ? text : expression,
			fields,
			field: Object.fromEntries(fields.map((field) => [field.name, field])),
			macro,
			tzPrefix,
			wrapped,
		},
	}
}
