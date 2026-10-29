import { describe, expect, it } from "vitest"
import { render } from "@/features/tools/cron-expression/convert"
import { parseNatural } from "@/features/tools/cron-expression/natural"
import type { PlatformId } from "@/features/tools/cron-expression/parse"

const to = (sentence: string, platform: PlatformId = "standard") => {
	const result = parseNatural(sentence)
	if (!result.ok) throw new Error(result.message)
	return render(result.spec, platform)
}

describe("parseNatural", () => {
	const cases: [string, string][] = [
		["every 15 minutes", "*/15 * * * *"],
		["every hour at :17", "17 * * * *"],
		["every day at 9am", "0 9 * * *"],
		["every weekday at 9:30", "30 9 * * 1-5"],
		["every Monday and Thursday at 18:00", "0 18 * * 1,4"],
		["on the 1st of every month at midnight", "0 0 1 * *"],
		["every 6 hours", "0 */6 * * *"],
		["every other hour", "0 */2 * * *"],
		["every minute", "* * * * *"],
		["daily at 6 pm", "0 18 * * *"],
		["every weekend at noon", "0 12 * * 0,6"],
	]
	for (const [sentence, expected] of cases) {
		it(sentence, () => expect(to(sentence).expression).toBe(expected))
	}

	it("first Monday of the month, where # exists", () => {
		expect(to("first Monday of the month at 10am", "eventbridge").expression).toBe(
			"cron(0 10 ? * 2#1 *)",
		)
		expect(to("first Monday of the month at 10am", "quartz").expression).toBe("0 0 10 ? * 2#1")
		expect(to("first Monday of the month at 10am", "github-actions").expression).toBeNull()
	})

	it("last day of the month, where L exists", () => {
		expect(to("last day of the month at 23:00", "eventbridge").expression).toBe(
			"cron(0 23 L * ? *)",
		)
		expect(to("last day of the month at 23:00", "quartz").expression).toBe("0 0 23 L * ?")
		expect(to("last day of the month at 23:00", "standard").notes[0]).toMatch(
			/doesn't support L/,
		)
	})

	it("names the word it didn't understand", () => {
		expect(parseNatural("every day at 9am except bank holidays")).toMatchObject({
			ok: false,
			message: `I didn't understand "except".`,
		})
	})

	it("rejects impossible times", () => {
		expect(parseNatural("every day at 25:00")).toMatchObject({ ok: false })
	})
})
