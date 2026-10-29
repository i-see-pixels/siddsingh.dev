// What each platform accepts, the traps worth warning about, and copy-ready config.
// Checked against the official docs on 2026-10-30:
// - GitHub Actions: https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions
//   (UTC by default, IANA `timezone` field since March 2026, 5-minute minimum, no @ shortcuts)
// - Kubernetes: https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/
//   (`spec.timeZone`; CRON_TZ/TZ in the schedule rejected since 1.29)
// - EventBridge: https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-scheduled-rule-pattern.html
//   (6 fields, 1–7 = SUN–SAT, one day field must be ?, rules in UTC; Scheduler takes a timezone)
// - Vercel: https://vercel.com/docs/cron-jobs and /docs/cron-jobs/usage-and-pricing
//   (UTC, no names, day of month and day of week not together, Hobby: once a day, ±59 min)

import cronstrue from "cronstrue"
import { PLATFORM_NAMES } from "./convert"
import { dowBase, MACROS, type PlatformId, type Schedule } from "./parse"
import type { DstEvent } from "./runs"

export type Platform = {
	id: PlatformId
	name: string
	/** Where the schedule's time zone comes from. */
	timezone: { fixed?: string; default: "UTC" | "local"; note: string }
	/** Shortest interval allowed, in seconds. */
	minInterval: number
	supports: { names: boolean; macros: boolean; special: boolean; question: boolean }
	docs: string
}

export const platforms: Record<PlatformId, Platform> = {
	standard: {
		id: "standard",
		name: PLATFORM_NAMES.standard,
		timezone: {
			default: "local",
			note: "Runs in the server's time zone. cronie also reads a CRON_TZ= line.",
		},
		minInterval: 60,
		supports: { names: true, macros: true, special: false, question: false },
		docs: "https://man7.org/linux/man-pages/man5/crontab.5.html",
	},
	"github-actions": {
		id: "github-actions",
		name: PLATFORM_NAMES["github-actions"],
		timezone: {
			default: "UTC",
			note: "UTC unless the schedule sets timezone: (an IANA name, supported since March 2026).",
		},
		minInterval: 300,
		supports: { names: true, macros: false, special: false, question: false },
		docs: "https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions#onschedule",
	},
	kubernetes: {
		id: "kubernetes",
		name: PLATFORM_NAMES.kubernetes,
		timezone: {
			default: "UTC",
			note: "Set by spec.timeZone. Without it, the controller manager's own zone is used.",
		},
		minInterval: 60,
		supports: { names: true, macros: true, special: false, question: false },
		docs: "https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/",
	},
	eventbridge: {
		id: "eventbridge",
		name: PLATFORM_NAMES.eventbridge,
		timezone: {
			default: "UTC",
			note: "Rules run in UTC. EventBridge Scheduler accepts a time zone.",
		},
		minInterval: 60,
		supports: { names: true, macros: false, special: true, question: true },
		docs: "https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-scheduled-rule-pattern.html",
	},
	vercel: {
		id: "vercel",
		name: PLATFORM_NAMES.vercel,
		timezone: { fixed: "Etc/UTC", default: "UTC", note: "Always UTC." },
		minInterval: 60,
		supports: { names: false, macros: false, special: false, question: false },
		docs: "https://vercel.com/docs/cron-jobs",
	},
	quartz: {
		id: "quartz",
		name: PLATFORM_NAMES.quartz,
		timezone: {
			default: "local",
			note: "Runs in the scheduler's zone, or the one set with inTimeZone.",
		},
		minInterval: 1,
		supports: { names: true, macros: false, special: true, question: true },
		docs: "https://www.quartz-scheduler.org/documentation/quartz-2.3.0/tutorials/crontrigger.html",
	},
}

export const platformIds = Object.keys(platforms) as PlatformId[]

export type Check = {
	id: string
	status: "fail" | "warn" | "info"
	title: string
	detail: string
	fix?: string
}

export type LintContext = {
	timezone: string
	/** Shortest gap between the next runs, in seconds; null when there are fewer than two. */
	shortestGap: number | null
	neverRuns: boolean
	dst: DstEvent[]
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

function duration(seconds: number) {
	if (seconds < 60) return `${seconds} seconds`
	if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`
	if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`
	return `${Math.round(seconds / 86400)} days`
}

export function lint(schedule: Schedule, context: LintContext): Check[] {
	const platform = platforms[schedule.platform]
	const checks: Check[] = []
	const { dom, dow, minute } = schedule.field
	const fiveField = schedule.platform !== "eventbridge" && schedule.platform !== "quartz"
	const domSet = Boolean(dom && !dom.any)
	const dowSet = Boolean(dow && !dow.any)

	if (context.neverRuns) {
		checks.push({
			id: "never-runs",
			status: "fail",
			title: "Never runs",
			detail: "No date matches this expression, for example the 30th of February.",
		})
	}
	if (context.shortestGap !== null && context.shortestGap < platform.minInterval) {
		checks.push({
			id: "too-often",
			status: "fail",
			title: "Runs too often",
			detail: `It runs every ${duration(context.shortestGap)} at times, but ${platform.name} allows at most one run every ${duration(platform.minInterval)}.`,
		})
	}
	const unsupported: string[] = []
	if (!platform.supports.names && schedule.fields.some((field) => field.usesNames)) {
		unsupported.push("day or month names (use numbers)")
	}
	if (!platform.supports.macros && schedule.macro) {
		unsupported.push(`shortcuts like ${schedule.macro} (use ${MACROS[schedule.macro]})`)
	}
	if (!platform.supports.special && schedule.fields.some((field) => field.usesSpecial)) {
		unsupported.push("L, W or # (last day, nearest weekday, nth weekday)")
	}
	if (!platform.supports.question && schedule.fields.some((field) => field.question)) {
		unsupported.push("? (use *)")
	}
	if (unsupported.length > 0) {
		checks.push({
			id: "unsupported",
			status: "fail",
			title: "Not supported here",
			detail: `${platform.name} doesn't accept ${unsupported.join("; ")}.`,
		})
	}
	if (fiveField && schedule.fields.some((field) => field.bareStartStep)) {
		const field = schedule.fields.find((item) => item.bareStartStep)
		checks.push({
			id: "bare-step",
			status: "warn",
			title: "Step without a range",
			detail: `${field?.text} is Quartz syntax; many crons reject it.`,
			fix: field
				? `Write ${field.text.replace("/", `-${field.name === "hour" ? 23 : 59}/`)}.`
				: undefined,
		})
	}

	// Day-field rules.
	if (fiveField && domSet && dowSet) {
		if (schedule.platform === "vercel") {
			checks.push({
				id: "vercel-both-days",
				status: "fail",
				title: "Both day fields set",
				detail: "Vercel doesn't allow day of month and day of week together.",
				fix: "Set one of them to *.",
			})
		} else {
			checks.push({
				id: "either-day",
				status: "warn",
				title: "Runs on either day",
				detail: `With both day fields set, cron runs when either matches: every ${dom?.text} of the month and also every matching weekday, not only when both match.`,
				fix: "Usually you want one of them set to *.",
			})
		}
	}
	if (!fiveField && dom && dow) {
		if (!dom.question && !dow.question) {
			checks.push({
				id: "needs-question",
				status: "fail",
				title: "One day field must be ?",
				detail: `${platform.name} needs ? in either day of month or day of week.`,
				fix: dow.any
					? `Use ${dom.text} ? for the day fields.`
					: `Use ? ${dow.text} for the day fields.`,
			})
		} else if (dom.question && dow.question) {
			checks.push({
				id: "both-question",
				status: "fail",
				title: "Both day fields are ?",
				detail: "Only one of the day fields can be ?. Use * in the other.",
			})
		}
	}
	if (!fiveField && dow && !dow.question && !dow.any && !dow.usesNames && /\d/.test(dow.text)) {
		const names = dow.values
			.map((value) => DAY_NAMES[(value - dowBase(schedule.platform)) % 7])
			.filter(Boolean)
		// Sunday (1) without Saturday (7), as in 1-5, is the usual sign of crontab numbering.
		const looksLikeCrontab = dow.values.includes(1) && !dow.values.includes(7)
		checks.push({
			id: "dow-numbering",
			status: looksLikeCrontab ? "warn" : "info",
			title: "Day numbers start at Sunday = 1",
			detail: `In ${platform.name}, ${dow.text} means ${names.join(", ")}. Crontab numbering is one lower.`,
			fix: "Use names like MON-FRI to avoid the mix-up.",
		})
	}

	// Time zone prefixes.
	if (schedule.tzPrefix) {
		if (schedule.platform === "kubernetes") {
			checks.push({
				id: "k8s-tz-prefix",
				status: "fail",
				title: `${schedule.tzPrefix.name}= isn't allowed`,
				detail: "Kubernetes rejects a time zone inside the schedule (since 1.29).",
				fix: `Set spec.timeZone: "${schedule.tzPrefix.zone}" instead.`,
			})
		} else if (schedule.platform === "standard") {
			checks.push({
				id: "cron-tz-line",
				status: "warn",
				title: `${schedule.tzPrefix.name}= goes on its own line`,
				detail: "In a crontab, CRON_TZ= is a separate line above the job, and only cronie reads it. The zone is used for the run times here.",
			})
		} else {
			checks.push({
				id: "tz-prefix",
				status: "fail",
				title: `${schedule.tzPrefix.name}= isn't supported`,
				detail: `${platform.name} doesn't read a time zone from the expression.`,
			})
		}
	}

	// Platform notes.
	if (schedule.platform === "github-actions") {
		if (schedule.fields.some((field) => field.leadingZero)) {
			checks.push({
				id: "leading-zero",
				status: "warn",
				title: "Leading zero",
				detail: "GitHub has rejected values like 08 in schedules.",
				fix: "Write 8 instead of 08.",
			})
		}
		if (minute?.values.includes(0)) {
			checks.push({
				id: "top-of-hour",
				status: "info",
				title: "Top of the hour is busy",
				detail: "GitHub delays scheduled runs under load, and minute 0 is the busiest.",
				fix: "Pick a minute like 17 if exact timing doesn't matter.",
			})
		}
		checks.push(
			context.timezone === "Etc/UTC" || context.timezone === "UTC"
				? {
						id: "gh-utc",
						status: "info",
						title: "Runs in UTC",
						detail: "Add timezone: with an IANA name to run in local time; the snippet includes it when you pick a zone.",
					}
				: {
						id: "gh-timezone",
						status: "info",
						title: `Runs in ${context.timezone}`,
						detail: "Uses the timezone: field. A run in a skipped daylight-saving hour moves to the next valid time.",
					},
			{
				id: "default-branch",
				status: "info",
				title: "Default branch only",
				detail: "Scheduled workflows run from the default branch, so the workflow must be there.",
			},
			{
				id: "inactive-repo",
				status: "info",
				title: "Paused in inactive repos",
				detail: "In public repositories, schedules are disabled after 60 days without repository activity.",
			},
		)
	}
	if (schedule.platform === "vercel") {
		if (context.shortestGap !== null && context.shortestGap < 86400) {
			checks.push({
				id: "vercel-hobby",
				status: "warn",
				title: "Fails on the Hobby plan",
				detail: "Hobby projects can run a cron at most once a day; deploys with more frequent schedules fail.",
			})
		}
		checks.push({
			id: "vercel-precision",
			status: "info",
			title: "Hobby timing is loose",
			detail: "On Hobby, a run can start any time within the scheduled hour. Paid plans run within the minute.",
		})
	}
	if (schedule.platform === "kubernetes") {
		checks.push({
			id: "k8s-policies",
			status: "info",
			title: "Missed and overlapping runs",
			detail: "Set startingDeadlineSeconds for runs missed while the controller was down, and concurrencyPolicy for runs that overlap.",
		})
	}
	if (
		schedule.platform === "eventbridge" &&
		context.timezone !== "Etc/UTC" &&
		context.timezone !== "UTC"
	) {
		checks.push({
			id: "eventbridge-timezone",
			status: "info",
			title: "Needs EventBridge Scheduler",
			detail: `Rules always run in UTC. To run in ${context.timezone}, use EventBridge Scheduler; the snippet does.`,
		})
	}

	for (const event of context.dst) {
		checks.push({
			id: `dst-${event.date}`,
			status: "warn",
			title:
				event.kind === "gap" ? "Skipped by daylight saving" : "Repeated by daylight saving",
			detail:
				event.kind === "gap"
					? `${event.times.join(", ")} doesn't exist on ${event.date} in ${context.timezone}. ${schedule.platform === "github-actions" ? "GitHub runs it at the next valid time." : "Depending on the cron, the run is skipped or happens late."}`
					: `${event.times.join(", ")} happens twice on ${event.date} in ${context.timezone}. Most crons run once; some run twice.`,
			fix: "Schedule outside 01:00–03:00 local time, or use UTC.",
		})
	}

	const order = { fail: 0, warn: 1, info: 2 }
	return checks.sort((a, b) => order[a.status] - order[b.status])
}

/** The plain-English meaning, or null when cronstrue can't read it. */
export function describe(schedule: Schedule) {
	const texts = schedule.fields.map((field) => field.text)
	// cronstrue reads 6 fields as seconds-first, so EventBridge gets a seconds field.
	const expression =
		schedule.platform === "eventbridge" ? `0 ${texts.join(" ")}` : texts.join(" ")
	try {
		return cronstrue.toString(expression, {
			use24HourTimeFormat: true,
			dayOfWeekStartIndexZero: dowBase(schedule.platform) === 0,
			verbose: false,
		})
	} catch {
		return null
	}
}

/** The expression as each platform's config writes it. */
function bareExpression(schedule: Schedule) {
	const texts = schedule.macro ?? schedule.fields.map((field) => field.text).join(" ")
	return schedule.platform === "eventbridge" ? `cron(${texts})` : texts
}

export function snippet(
	schedule: Schedule,
	timezone: string,
): { language: "yaml" | "json" | "text"; text: string } {
	const expression = bareExpression(schedule)
	const utc = timezone === "Etc/UTC" || timezone === "UTC"
	switch (schedule.platform) {
		case "github-actions":
			return {
				language: "yaml",
				text: [
					"on:",
					"  schedule:",
					`    - cron: "${expression}"`,
					...(utc ? [] : [`      timezone: "${timezone}"`]),
				].join("\n"),
			}
		case "kubernetes":
			return {
				language: "yaml",
				text: [
					"apiVersion: batch/v1",
					"kind: CronJob",
					"metadata:",
					"  name: my-job",
					"spec:",
					`  schedule: "${expression}"`,
					`  timeZone: "${timezone}"`,
					"  concurrencyPolicy: Forbid",
					"  jobTemplate:",
					"    spec:",
					"      template:",
					"        spec:",
					"          containers:",
					"            - name: my-job",
					"              image: busybox:1.36",
					'              command: ["sh", "-c", "date; echo hello"]',
					"          restartPolicy: OnFailure",
				].join("\n"),
			}
		case "eventbridge":
			return utc
				? {
						language: "yaml",
						text: [
							"# CloudFormation: an EventBridge rule (UTC)",
							"ScheduledRule:",
							"  Type: AWS::Events::Rule",
							"  Properties:",
							`    ScheduleExpression: "${expression}"`,
							"    State: ENABLED",
							"",
							"# AWS CLI",
							`# aws events put-rule --name my-schedule --schedule-expression "${expression}"`,
						].join("\n"),
					}
				: {
						language: "yaml",
						text: [
							`# CloudFormation: EventBridge Scheduler, which runs in ${timezone}`,
							"Schedule:",
							"  Type: AWS::Scheduler::Schedule",
							"  Properties:",
							`    ScheduleExpression: "${expression}"`,
							`    ScheduleExpressionTimezone: "${timezone}"`,
							"    FlexibleTimeWindow:",
							'      Mode: "OFF"',
							"    Target:",
							"      Arn: <target ARN>",
							"      RoleArn: <role ARN>",
						].join("\n"),
					}
		case "vercel":
			return {
				language: "json",
				text: JSON.stringify(
					{ crons: [{ path: "/api/cron", schedule: expression }] },
					null,
					2,
				),
			}
		case "quartz":
			return {
				language: "text",
				text: [
					"Trigger trigger = TriggerBuilder.newTrigger()",
					'    .withIdentity("my-trigger")',
					`    .withSchedule(CronScheduleBuilder.cronSchedule("${expression}")`,
					`        .inTimeZone(TimeZone.getTimeZone("${timezone}")))`,
					"    .build();",
				].join("\n"),
			}
		default:
			return {
				language: "text",
				text: [
					"# crontab -e  (CRON_TZ works in cronie; Vixie cron uses the server's zone)",
					`CRON_TZ=${timezone}`,
					`${expression} /path/to/command`,
				].join("\n"),
			}
	}
}
