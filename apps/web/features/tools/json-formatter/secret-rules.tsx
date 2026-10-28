"use client"

import { Button } from "@workspace/ui/components/button"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { Switch } from "@workspace/ui/components/switch"
import { cn } from "@workspace/ui/lib/utils"
import { AlertTriangleIcon, RotateCcwIcon, SettingsIcon } from "lucide-react"
import { useState } from "react"
import { headerButton } from "../tool-chrome"
import { defaultEnabledRules, type Severity, secretRules } from "./secrets"

const STORAGE_KEY = "json-formatter:secret-rules"
const severities: { id: Severity; label: string; hint: string; dot: string }[] = [
	{
		id: "high",
		label: "High",
		hint: "Keys and tokens with a known format",
		dot: "bg-destructive",
	},
	{
		id: "medium",
		label: "Medium",
		hint: "Likely secrets, with some false alarms",
		dot: "bg-amber-500",
	},
	{
		id: "low",
		label: "Low",
		hint: "Personal data and random-looking strings",
		dot: "bg-muted-foreground/60",
	},
]

function loadRules() {
	try {
		const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null")
		if (Array.isArray(saved)) {
			const known = new Set(secretRules.map((rule) => rule.id))
			return saved.filter((id): id is string => typeof id === "string" && known.has(id))
		}
	} catch {}
	return defaultEnabledRules
}

/** Which secret rules run. Only rule ids are stored, never input. */
export function useSecretRules() {
	const [enabled, setEnabledState] = useState<string[]>(loadRules)
	const setEnabled = (next: string[]) => {
		setEnabledState(next)
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
		} catch {}
	}
	return [enabled, setEnabled] as const
}

export function SecretRulesButton({
	enabled,
	onChange,
}: {
	enabled: string[]
	onChange: (enabled: string[]) => void
}) {
	const on = new Set(enabled)
	const highOff = secretRules.some((rule) => rule.severity === "high" && !on.has(rule.id))
	const isDefault =
		enabled.length === defaultEnabledRules.length &&
		defaultEnabledRules.every((id) => on.has(id))
	const toggle = (ids: string[], value: boolean) => {
		const next = new Set(on)
		for (const id of ids) {
			if (value) next.add(id)
			else next.delete(id)
		}
		onChange(secretRules.map((rule) => rule.id).filter((id) => next.has(id)))
	}

	return (
		<Popover>
			<PopoverTrigger
				render={
					<Button
						size="sm"
						variant="outline"
						className={headerButton}
						aria-label="Secret rules"
					/>
				}
			>
				<SettingsIcon />
				<span className="max-sm:hidden">Secret rules</span>
			</PopoverTrigger>
			{/* Sized to the space the positioner reports, so only the rule list scrolls. */}
			<PopoverContent
				align="end"
				className="max-h-[min(34rem,var(--available-height))] w-[min(22rem,calc(100vw-2rem))] gap-0 overflow-hidden p-0"
			>
				<div className="flex shrink-0 flex-col gap-1 border-b border-line px-4 pt-4 pb-3">
					<p className="font-semibold">Secret rules</p>
					<p className="text-xs leading-relaxed text-muted-foreground">
						Choose what the scan flags. Your choice is saved in this browser.
					</p>
				</div>
				<div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
					{severities.map((severity) => {
						const rules = secretRules.filter((rule) => rule.severity === severity.id)
						const ids = rules.map((rule) => rule.id)
						const count = ids.filter((id) => on.has(id)).length
						return (
							<section key={severity.id} aria-label={`${severity.label} severity`}>
								<label className="sticky top-0 z-10 flex cursor-pointer items-center gap-3 border-b border-line bg-popover px-4 py-2.5">
									<span
										className={cn("size-2 shrink-0 rounded-full", severity.dot)}
									/>
									<span className="flex min-w-0 flex-1 flex-col">
										<span className="text-sm font-medium">
											{severity.label}
											<span className="ml-1.5 font-normal text-muted-foreground tabular-nums">
												{count}/{ids.length}
											</span>
										</span>
										<span className="text-xs text-muted-foreground">
											{severity.hint}
										</span>
									</span>
									<Switch
										checked={count === ids.length}
										onCheckedChange={(value) => toggle(ids, value)}
										aria-label={`All ${severity.label.toLowerCase()} rules`}
									/>
								</label>
								<ul className="py-1">
									{rules.map((rule) => (
										<li key={rule.id}>
											<label className="flex min-h-10 cursor-pointer items-center gap-3 px-4 py-2 transition-colors hover:bg-muted/60">
												<span className="min-w-0 flex-1 text-sm">
													{rule.name}
												</span>
												<Switch
													checked={on.has(rule.id)}
													onCheckedChange={(value) =>
														toggle([rule.id], value)
													}
												/>
											</label>
										</li>
									))}
								</ul>
							</section>
						)
					})}
				</div>
				{/* Below the list, so it appearing never pushes the rule being toggled out of place. */}
				{highOff && (
					<p
						role="status"
						className="flex shrink-0 gap-2 border-t border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs leading-relaxed text-amber-700 dark:text-amber-400"
					>
						<AlertTriangleIcon className="mt-0.5 size-3.5 shrink-0" />
						High-severity rules are off. Share links may contain secrets.
					</p>
				)}
				<div className="flex shrink-0 items-center justify-between gap-3 border-t border-line px-4 py-2.5">
					<span className="text-xs text-muted-foreground tabular-nums">
						{enabled.length} of {secretRules.length} rules on
					</span>
					<Button
						size="sm"
						variant="ghost"
						disabled={isDefault}
						onClick={() => onChange(defaultEnabledRules)}
					>
						<RotateCcwIcon />
						Reset to defaults
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	)
}
