"use client"

import { cn } from "@workspace/ui/lib/utils"
import {
	CircleCheckIcon,
	CircleDashedIcon,
	CircleMinusIcon,
	InfoIcon,
	LoaderCircleIcon,
	ShieldAlertIcon,
	ShieldCheckIcon,
	TriangleAlertIcon,
	XCircleIcon,
} from "lucide-react"
import { useEffect, useState } from "react"
import { type AuditCheck, type AuditInput, audit, type CheckStatus, verdict } from "./audit"
import { explainClaim, formatTimestamp, relativeTime, TIME_CLAIMS } from "./claims"
import type { JsonObject } from "./decode"

/** The current time in seconds, refreshed every `interval` ms. Each user holds its own clock. */
export function useNow(interval: number) {
	const [now, setNow] = useState(() => Date.now() / 1000)
	useEffect(() => {
		const timer = setInterval(() => setNow(Date.now() / 1000), interval)
		return () => clearInterval(timer)
	}, [interval])
	return now
}

/** "Expires in 2h 14m", ticking every second without re-rendering anything else. */
export function ExpiryCountdown({ exp }: { exp: unknown }) {
	const now = useNow(1000)
	if (typeof exp !== "number") return <>No expiry</>
	return (
		<>
			{exp >= now ? `Expires ${relativeTime(exp, now)}` : `Expired ${relativeTime(exp, now)}`}
		</>
	)
}

const statusIcon: Record<CheckStatus, { icon: typeof InfoIcon; className: string; label: string }> =
	{
		fail: { icon: XCircleIcon, className: "text-destructive", label: "Problem" },
		warn: {
			icon: TriangleAlertIcon,
			className: "text-amber-600 dark:text-amber-400",
			label: "Warning",
		},
		info: { icon: InfoIcon, className: "text-brand", label: "Note" },
		pass: { icon: CircleCheckIcon, className: "text-success", label: "Pass" },
		pending: {
			icon: LoaderCircleIcon,
			className: "animate-spin text-muted-foreground",
			label: "Checking",
		},
		skip: { icon: CircleMinusIcon, className: "text-muted-foreground/60", label: "Skipped" },
	}

function CheckRow({ check }: { check: AuditCheck }) {
	const { icon: Icon, className, label } = statusIcon[check.status]
	return (
		<li className="flex gap-3 border-b border-line px-3 py-2.5 last:border-b-0">
			<Icon aria-label={label} className={cn("mt-0.5 size-4 shrink-0", className)} />
			<div className="min-w-0 text-sm">
				<p
					className={cn(
						"font-medium",
						check.status === "skip" && "text-muted-foreground",
					)}
				>
					<span className="mr-1.5 font-mono text-xs text-muted-foreground tabular-nums">
						{String(check.id).padStart(2, "0")}
					</span>
					{check.title}
				</p>
				<p className="text-muted-foreground">{check.detail}</p>
				{check.fix && <p className="mt-0.5 text-xs">Fix: {check.fix}</p>}
			</div>
		</li>
	)
}

/** Verdict and checks. Holds its own clock so expiry checks stay current. */
export function AuditPanel(props: Omit<AuditInput, "now">) {
	const now = useNow(30_000)
	const checks = audit({ ...props, now })
	const summary = verdict(checks)
	const clean = summary === "No problems found"
	return (
		<div className="min-h-0 flex-1 overflow-y-auto">
			<div
				className={cn(
					"flex items-center gap-2 border-b border-line px-3 py-3",
					clean ? "bg-success/10" : "bg-destructive/5",
				)}
			>
				{clean ? (
					<ShieldCheckIcon className="size-5 text-success" />
				) : (
					<ShieldAlertIcon className="size-5 text-destructive" />
				)}
				<p className="font-medium" role="status">
					{summary}
				</p>
				<span className="ml-auto text-xs text-muted-foreground">
					{checks.filter((check) => check.status !== "skip").length} of {checks.length}{" "}
					checks ran
				</span>
			</div>
			<ul aria-label="Security checks">
				{checks.map((check) => (
					<CheckRow key={check.id} check={check} />
				))}
			</ul>
		</div>
	)
}

function ClaimValue({ name, value, now }: { name: string; value: unknown; now: number }) {
	if (TIME_CLAIMS.has(name) && typeof value === "number") {
		const { local, utc } = formatTimestamp(value)
		return (
			<div className="flex flex-col">
				<span className="font-mono">{value}</span>
				<span>
					{local} · {relativeTime(value, now)}
				</span>
				<span className="text-muted-foreground">{utc}</span>
			</div>
		)
	}
	return (
		<span className="font-mono break-all">
			{typeof value === "string" ? value : JSON.stringify(value)}
		</span>
	)
}

/** Every claim with its value and meaning. */
export function ClaimsPanel({ payload }: { payload?: JsonObject }) {
	const now = useNow(30_000)
	if (!payload) {
		return (
			<p className="flex flex-1 items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
				<CircleDashedIcon className="size-4" />
				This token is encrypted. Its payload can only be read with the private key.
			</p>
		)
	}
	const entries = Object.entries(payload)
	return (
		<div className="min-h-0 flex-1 overflow-auto">
			<table className="w-full text-xs">
				<thead className="sticky top-0 bg-background">
					<tr className="border-b border-line text-left font-mono text-muted-foreground uppercase">
						<th className="px-3 py-2 font-normal">Claim</th>
						<th className="px-3 py-2 font-normal">Value</th>
						<th className="px-3 py-2 font-normal max-sm:hidden">Meaning</th>
					</tr>
				</thead>
				<tbody>
					{entries.map(([name, value]) => (
						<tr key={name} className="border-b border-line align-top last:border-b-0">
							<td className="px-3 py-2 font-mono font-medium">{name}</td>
							<td className="px-3 py-2">
								<ClaimValue name={name} value={value} now={now} />
								<p className="mt-1 text-muted-foreground sm:hidden">
									{explainClaim(name)}
								</p>
							</td>
							<td className="px-3 py-2 text-muted-foreground max-sm:hidden">
								{explainClaim(name)}
							</td>
						</tr>
					))}
				</tbody>
			</table>
			{entries.length === 0 && (
				<p className="p-6 text-sm text-muted-foreground">The payload is empty.</p>
			)}
		</div>
	)
}
