import { describe, expect, it } from "vitest"
import { convert } from "@/features/tools/cron-expression/convert"
import { type PlatformId, parseCron } from "@/features/tools/cron-expression/parse"
import { compareRuns } from "@/features/tools/cron-expression/runs"

const schedule = (input: string, platform: PlatformId) => {
	const result = parseCron(input, platform)
	if (!result.ok) throw new Error(result.errors[0]?.message)
	return result.schedule
}
const from = new Date("2026-11-02T00:00:00Z")

describe("convert", () => {
	it("crontab weekdays to EventBridge, with the same runs", () => {
		const source = schedule("0 9 * * 1-5", "standard")
		const converted = convert(source, "eventbridge")
		expect(converted.expression).toBe("cron(0 9 ? * 2-6 *)")
		const target = schedule(converted.expression ?? "", "eventbridge")
		expect(compareRuns(source, target, "Etc/UTC", 50, from)).toMatchObject({ same: true })
	})

	it("EventBridge back to crontab and to Quartz", () => {
		const source = schedule("cron(0 9 ? * MON-FRI *)", "eventbridge")
		expect(convert(source, "standard").expression).toBe("0 9 * * 1-5")
		expect(convert(source, "quartz").expression).toBe("0 0 9 ? * 2-6")
	})

	it("renumbers nth and last weekdays", () => {
		expect(convert(schedule("cron(0 10 ? * 2#1 *)", "eventbridge"), "quartz").expression).toBe(
			"0 0 10 ? * 2#1",
		)
		expect(convert(schedule("0 0 10 ? * 6L", "quartz"), "eventbridge").expression).toBe(
			"cron(0 10 ? * 6L *)",
		)
	})

	it("splits a range that wraps past Sunday", () => {
		expect(convert(schedule("0 9 * * 5-7", "standard"), "github-actions").expression).toBe(
			"0 9 * * 5-6,0",
		)
	})

	it("can't put L into a five-field cron", () => {
		const result = convert(schedule("0 0 23 L * ?", "quartz"), "github-actions")
		expect(result.expression).toBeNull()
		expect(result.notes[0]).toMatch(/doesn't support L, W or #/)
	})

	it("drops seconds and years with a note", () => {
		const result = convert(schedule("30 0 9 ? * MON 2027", "quartz"), "standard")
		expect(result.expression).toBe("0 9 * * 1")
		expect(result.notes.join(" ")).toMatch(/second 0 instead of 30/)
		expect(result.notes.join(" ")).toMatch(/every year/)
	})

	it("won't put both day fields into EventBridge or Vercel", () => {
		const both = schedule("0 0 13 * 5", "standard")
		expect(convert(both, "eventbridge").expression).toBeNull()
		expect(convert(both, "vercel").expression).toBeNull()
	})

	it("expands a bare step for crontab", () => {
		expect(convert(schedule("0 5/10 * * * ?", "quartz"), "standard").expression).toBe(
			"5-59/10 * * * *",
		)
	})
})
