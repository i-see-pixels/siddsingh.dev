import { describe, expect, it } from "vitest"
import { type PlatformId, parseCron } from "@/features/tools/cron-expression/parse"
import {
	describe as explain,
	type LintContext,
	lint,
	snippet,
} from "@/features/tools/cron-expression/platforms"
import { dstEvents, nextRuns, shortestGap } from "@/features/tools/cron-expression/runs"

const from = new Date("2026-11-02T00:00:00Z")
const schedule = (input: string, platform: PlatformId) => {
	const result = parseCron(input, platform)
	if (!result.ok) throw new Error(result.errors[0]?.message)
	return result.schedule
}
const checks = (input: string, platform: PlatformId, timezone = "Etc/UTC") => {
	const parsed = schedule(input, platform)
	const runs = nextRuns(parsed, timezone, 50, from).runs
	const context: LintContext = {
		timezone,
		shortestGap: shortestGap(runs),
		neverRuns: runs.length === 0,
		dst: dstEvents(parsed, timezone, from),
	}
	return lint(parsed, context).map((check) => `${check.status}:${check.id}`)
}

describe("lint", () => {
	const cases: [string, PlatformId, string, string?][] = [
		["0 0 30 2 *", "standard", "fail:never-runs"],
		["*/2 * * * *", "github-actions", "fail:too-often"],
		["0 9 * * MON", "vercel", "fail:unsupported"],
		["@daily", "github-actions", "fail:unsupported"],
		["0 9 L * *", "standard", "fail:unsupported"],
		["0 9 ? * 1", "standard", "fail:unsupported"],
		["5/10 * * * *", "standard", "warn:bare-step"],
		["0 9 1 * 1", "vercel", "fail:vercel-both-days"],
		["0 0 13 * 5", "standard", "warn:either-day"],
		["cron(0 9 * * MON *)", "eventbridge", "fail:needs-question"],
		["cron(0 9 ? * ? *)", "eventbridge", "fail:both-question"],
		["cron(0 9 ? * 1-5 *)", "eventbridge", "warn:dow-numbering"],
		["cron(0 9 ? * 2-6 *)", "eventbridge", "info:dow-numbering"],
		["CRON_TZ=Europe/Berlin 0 9 * * *", "kubernetes", "fail:k8s-tz-prefix"],
		["CRON_TZ=Europe/Berlin 0 9 * * *", "standard", "warn:cron-tz-line"],
		["CRON_TZ=Europe/Berlin 0 9 * * *", "github-actions", "fail:tz-prefix"],
		["0 08 * * *", "github-actions", "warn:leading-zero"],
		["0 9 * * *", "github-actions", "info:top-of-hour"],
		["17 9 * * *", "github-actions", "info:gh-utc"],
		["17 9 * * *", "github-actions", "info:gh-timezone", "Europe/Berlin"],
		["17 9 * * *", "github-actions", "info:default-branch"],
		["17 9 * * *", "github-actions", "info:inactive-repo"],
		["0 * * * *", "vercel", "warn:vercel-hobby"],
		["0 9 * * *", "vercel", "info:vercel-precision"],
		["0 9 * * *", "kubernetes", "info:k8s-policies"],
		["cron(0 9 * * ? *)", "eventbridge", "info:eventbridge-timezone", "Europe/Berlin"],
		["30 2 * * *", "standard", "warn:dst-2027-03-28", "Europe/Berlin"],
	]
	for (const [input, platform, expected, timezone] of cases) {
		it(`${platform}: ${input} → ${expected}`, () => {
			expect(checks(input, platform, timezone)).toContain(expected)
		})
	}

	it("keeps a clean schedule clean", () => {
		expect(
			checks("17 9 * * 1-5", "standard").filter((check) => !check.startsWith("info")),
		).toEqual([])
		expect(
			checks("cron(17 9 ? * MON-FRI *)", "eventbridge").filter(
				(check) => !check.startsWith("info"),
			),
		).toEqual([])
	})
})

describe("describe", () => {
	it("reads weekday mornings the same in crontab and EventBridge", () => {
		expect(explain(schedule("0 9 * * 1-5", "standard"))).toBe("At 09:00, Monday through Friday")
		expect(explain(schedule("cron(0 9 ? * 2-6 *)", "eventbridge"))).toBe(
			"At 09:00, Monday through Friday",
		)
	})
})

describe("snippet", () => {
	it("adds timezone to GitHub Actions only when it isn't UTC", () => {
		expect(snippet(schedule("17 9 * * 1-5", "github-actions"), "Etc/UTC").text).not.toMatch(
			/timezone/,
		)
		expect(snippet(schedule("17 9 * * 1-5", "github-actions"), "Europe/Berlin").text).toMatch(
			/timezone: "Europe\/Berlin"/,
		)
	})

	it("switches EventBridge to Scheduler for a time zone", () => {
		expect(snippet(schedule("cron(0 9 ? * MON *)", "eventbridge"), "Etc/UTC").text).toMatch(
			/AWS::Events::Rule/,
		)
		expect(
			snippet(schedule("cron(0 9 ? * MON *)", "eventbridge"), "Europe/Berlin").text,
		).toMatch(/ScheduleExpressionTimezone/)
	})

	it("writes valid vercel.json", () => {
		const { text } = snippet(schedule("0 9 * * 1", "vercel"), "Etc/UTC")
		expect(JSON.parse(text)).toEqual({ crons: [{ path: "/api/cron", schedule: "0 9 * * 1" }] })
	})
})
