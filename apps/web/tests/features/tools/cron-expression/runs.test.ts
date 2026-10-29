import { describe, expect, it } from "vitest"
import { type PlatformId, parseCron } from "@/features/tools/cron-expression/parse"
import {
	dstEvents,
	nextRuns,
	offsetChanges,
	shortestGap,
} from "@/features/tools/cron-expression/runs"

const schedule = (input: string, platform: PlatformId) => {
	const result = parseCron(input, platform)
	if (!result.ok) throw new Error(result.errors[0]?.message)
	return result.schedule
}
const from = new Date("2026-11-02T00:00:00Z")
const iso = (dates: Date[]) => dates.map((date) => date.toISOString())

describe("nextRuns", () => {
	it("runs weekday mornings in the given zone", () => {
		const { runs } = nextRuns(schedule("0 9 * * 1-5", "standard"), "Europe/Berlin", 3, from)
		expect(iso(runs)).toEqual([
			"2026-11-02T08:00:00.000Z",
			"2026-11-03T08:00:00.000Z",
			"2026-11-04T08:00:00.000Z",
		])
	})

	it("runs when either day field matches in crontab", () => {
		const { runs } = nextRuns(schedule("0 0 13 * 5", "standard"), "Etc/UTC", 4, from)
		expect(iso(runs)).toEqual([
			"2026-11-06T00:00:00.000Z",
			"2026-11-13T00:00:00.000Z",
			"2026-11-20T00:00:00.000Z",
			"2026-11-27T00:00:00.000Z",
		])
	})

	it("reads EventBridge numbering and ?", () => {
		const { runs } = nextRuns(schedule("cron(0 9 ? * 2 *)", "eventbridge"), "Etc/UTC", 2, from)
		expect(iso(runs)).toEqual(["2026-11-02T09:00:00.000Z", "2026-11-09T09:00:00.000Z"])
	})

	it("finds the last day of the month and the first Monday", () => {
		expect(iso(nextRuns(schedule("0 0 23 L * ?", "quartz"), "Etc/UTC", 1, from).runs)).toEqual([
			"2026-11-30T23:00:00.000Z",
		])
		expect(
			iso(nextRuns(schedule("cron(0 10 ? * 2#1 *)", "eventbridge"), "Etc/UTC", 1, from).runs),
		).toEqual(["2026-11-02T10:00:00.000Z"])
	})

	it("returns no runs for an impossible date", () => {
		expect(nextRuns(schedule("0 0 30 2 *", "standard"), "Etc/UTC", 1, from).runs).toEqual([])
	})

	it("measures the shortest gap", () => {
		expect(
			shortestGap(nextRuns(schedule("*/2 * * * *", "standard"), "Etc/UTC", 10, from).runs),
		).toBe(120)
	})
})

describe("daylight saving", () => {
	it("finds Berlin's clock changes", () => {
		const changes = offsetChanges("Europe/Berlin", from)
		expect(changes.map((change) => change.at.toISOString())).toEqual([
			"2027-03-28T01:00:00.000Z",
			"2027-10-31T01:00:00.000Z",
		])
	})

	it("marks 02:30 as skipped in March and repeated in October", () => {
		const events = dstEvents(schedule("30 2 * * *", "standard"), "Europe/Berlin", from)
		expect(events.map(({ kind, date, times }) => ({ kind, date, times }))).toEqual([
			{ kind: "gap", date: "2027-03-28", times: ["02:30"] },
			{ kind: "overlap", date: "2027-10-31", times: ["02:30"] },
		])
	})

	it("works from a start time that isn't on a whole minute", () => {
		const unaligned = new Date("2026-11-02T13:47:18.435Z")
		expect(offsetChanges("Europe/Berlin", unaligned)[0]?.at.toISOString()).toBe(
			"2027-03-28T01:00:00.000Z",
		)
		const events = dstEvents(schedule("30 2 * * *", "standard"), "Europe/Berlin", unaligned)
		expect(events[0]).toMatchObject({ kind: "gap", date: "2027-03-28", times: ["02:30"] })
	})

	it("finds nothing for UTC or a safe time", () => {
		expect(dstEvents(schedule("30 2 * * *", "standard"), "Etc/UTC", from)).toEqual([])
		expect(dstEvents(schedule("0 9 * * *", "standard"), "Europe/Berlin", from)).toEqual([])
	})
})
