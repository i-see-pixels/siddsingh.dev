import { describe, expect, it } from "vitest"
import { parseCron } from "@/features/tools/cron-expression/parse"

const ok = (input: string, platform: Parameters<typeof parseCron>[1]) => {
	const result = parseCron(input, platform)
	if (!result.ok) throw new Error(result.errors[0]?.message)
	return result.schedule
}
const error = (input: string, platform: Parameters<typeof parseCron>[1]) => {
	const result = parseCron(input, platform)
	if (result.ok) throw new Error(`expected ${input} to fail on ${platform}`)
	return result.errors[0]
}

describe("parseCron", () => {
	it("expands ranges, steps, lists and names", () => {
		const schedule = ok("*/15 9-17 1,15 JAN-MAR MON-FRI", "standard")
		expect(schedule.field.minute?.values).toEqual([0, 15, 30, 45])
		expect(schedule.field.hour?.values).toHaveLength(9)
		expect(schedule.field.dom?.values).toEqual([1, 15])
		expect(schedule.field.month?.values).toEqual([1, 2, 3])
		expect(schedule.field.dow?.values).toEqual([1, 2, 3, 4, 5])
		expect(schedule.field.dow?.usesNames).toBe(true)
	})

	it("reads each platform's field layout", () => {
		expect(
			ok("cron(0 9 ? * MON-FRI *)", "eventbridge").fields.map((field) => field.name),
		).toEqual(["minute", "hour", "dom", "month", "dow", "year"])
		expect(ok("0 0 9 ? * 2-6", "quartz").field.second?.values).toEqual([0])
		expect(ok("0 0 9 ? * 2-6 2027", "quartz").field.year?.values).toEqual([2027])
	})

	it("uses Sunday = 1 numbering on EventBridge and Quartz", () => {
		expect(ok("cron(0 9 ? * MON *)", "eventbridge").field.dow?.values).toEqual([2])
		expect(error("cron(0 9 ? * 0 *)", "eventbridge")?.message).toMatch(/1–7 from Sunday/)
	})

	it("names the field and position of an error", () => {
		const problem = error("0 25 * * *", "standard")
		expect(problem).toMatchObject({ field: "hour", from: 2, to: 4 })
		expect(problem?.message).toMatch(/outside the hour range 0–23/)
	})

	it("explains a wrong field count for the platform", () => {
		expect(error("0 9 * * 1", "eventbridge")?.message).toMatch(/appending \*/)
		expect(error("0 9 * * 1", "quartz")?.message).toMatch(/0 in front/)
		expect(error("0 0 9 * * 1", "standard")?.message).toMatch(/Expected 5 fields, found 6/)
	})

	it("expands shortcuts and reads a CRON_TZ prefix", () => {
		expect(ok("@daily", "standard").field.hour?.values).toEqual([0])
		const prefixed = ok("CRON_TZ=Europe/Berlin 0 9 * * *", "kubernetes")
		expect(prefixed.tzPrefix).toEqual({ name: "CRON_TZ", zone: "Europe/Berlin" })
		expect(prefixed.field.minute?.from).toBe(22)
	})

	it("accepts L, W, # and ?", () => {
		const schedule = ok("0 0 10 L * ?", "quartz")
		expect(schedule.field.dom?.usesSpecial).toBe(true)
		expect(schedule.field.dow?.question).toBe(true)
		expect(ok("cron(15 10 ? * 6L 2027)", "eventbridge").field.dow?.usesSpecial).toBe(true)
		expect(ok("cron(0 10 ? * 2#1 *)", "eventbridge").field.dow?.usesSpecial).toBe(true)
	})

	it("flags leading zeros and bare steps", () => {
		const schedule = ok("5/10 08 * * *", "github-actions")
		expect(schedule.field.minute?.bareStartStep).toBe(true)
		expect(schedule.field.hour?.leadingZero).toBe(true)
	})

	it("rejects backwards ranges and zero steps", () => {
		expect(error("0 9 * * 5-1", "standard")?.message).toMatch(/runs backwards/)
		expect(error("*/0 * * * *", "standard")?.message).toMatch(/step of 0/)
	})
})
