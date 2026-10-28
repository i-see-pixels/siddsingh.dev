"use client"

import { Button } from "@workspace/ui/components/button"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { Switch } from "@workspace/ui/components/switch"
import { cn } from "@workspace/ui/lib/utils"
import { AlertTriangleIcon, SettingsIcon } from "lucide-react"
import { useState } from "react"
import { headerButton } from "../tool-chrome"
import { defaultEnabledRules, type Severity, secretRules } from "./secrets"

const STORAGE_KEY = "json-formatter:secret-rules"
const severities: { id: Severity; label: string; dot: string }[] = [
	{ id: "high", label: "High", dot: "bg-destructive" },
	{ id: "medium", label: "Medium", dot: "bg-amber-500" },
	{ id: "low", label: "Low", dot: "bg-muted-foreground/60" },
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
			<PopoverContent align="end" className="w-80 gap-3 p-3">
				<div>
					<p className="font-medium">Secret rules</p>
					<p className="text-xs text-muted-foreground">
						{enabled.length} of {secretRules.length} rules on. Your choice is saved in
						this browser.
					</p>
				</div>
				{highOff && (
					<p className="flex gap-2 rounded-md bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-400">
						<AlertTriangleIcon className="mt-0.5 size-3.5 shrink-0" />
						High-severity rules are off. Share links may contain secrets.
					</p>
				)}
				<div className="flex max-h-80 flex-col gap-3 overflow-y-auto">
					{severities.map((severity) => {
						const rules = secretRules.filter((rule) => rule.severity === severity.id)
						const ids = rules.map((rule) => rule.id)
						const allOn = ids.every((id) => on.has(id))
						return (
							<section key={severity.id} className="flex flex-col gap-1.5">
								<div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase">
									<span className={cn("size-1.5 rounded-full", severity.dot)} />
									{severity.label}
									<span className="ml-auto flex items-center gap-1.5 font-normal normal-case">
										All
										<Switch
											size="sm"
											checked={allOn}
											onCheckedChange={(value) => toggle(ids, value)}
											aria-label={`All ${severity.label.toLowerCase()} rules`}
										/>
									</span>
								</div>
								{rules.map((rule) => (
									<div
										key={rule.id}
										className="flex items-center justify-between gap-3 rounded-md px-1 py-0.5 hover:bg-muted/60"
									>
										<span>{rule.name}</span>
										<Switch
											size="sm"
											checked={on.has(rule.id)}
											onCheckedChange={(value) => toggle([rule.id], value)}
											aria-label={rule.name}
										/>
									</div>
								))}
							</section>
						)
					})}
				</div>
				<Button
					size="sm"
					variant="ghost"
					className="self-start"
					onClick={() => onChange(defaultEnabledRules)}
				>
					Reset to defaults
				</Button>
			</PopoverContent>
		</Popover>
	)
}
