"use client"

import { Input } from "@workspace/ui/components/input"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { Textarea } from "@workspace/ui/components/textarea"
import { useMemo, useState } from "react"
import { CopyButton, monoTextarea, Pane, SplitLayout } from "../tool-ui"

type OutputFormat = "text" | "anthropic" | "openai"

const SYSTEM_SAMPLE =
	"You are a senior {{role}}. Answer in {{language}} and keep it under {{max_words}} words."
const TEMPLATE_SAMPLE = `Review this pull request description and list the three biggest risks.

{{pr_description}}`

const VARIABLE = /\{\{\s*([a-zA-Z_][\w.-]*)\s*\}\}/g

function findVariables(...templates: string[]) {
	const found = new Set<string>()
	for (const template of templates) {
		for (const match of template.matchAll(VARIABLE)) found.add(match[1] as string)
	}
	return [...found]
}

function fill(template: string, values: Record<string, string>) {
	return template.replace(VARIABLE, (whole, name: string) => {
		const value = values[name]
		return value ? value : whole
	})
}

function format(kind: OutputFormat, system: string, user: string) {
	if (kind === "text") {
		return system ? `${system}\n\n---\n\n${user}` : user
	}
	if (kind === "anthropic") {
		const body: Record<string, unknown> = {
			model: "YOUR_MODEL",
			max_tokens: 1024,
			...(system ? { system } : {}),
			messages: [{ role: "user", content: user }],
		}
		return JSON.stringify(body, null, 2)
	}
	const messages = [
		...(system ? [{ role: "system", content: system }] : []),
		{ role: "user", content: user },
	]
	return JSON.stringify({ model: "YOUR_MODEL", messages }, null, 2)
}

export function PromptPlaygroundTool() {
	const [system, setSystem] = useState(SYSTEM_SAMPLE)
	const [template, setTemplate] = useState(TEMPLATE_SAMPLE)
	const [values, setValues] = useState<Record<string, string>>({})
	const [kind, setKind] = useState<OutputFormat>("text")

	const variables = useMemo(() => findVariables(system, template), [system, template])
	const missing = variables.filter((name) => !values[name])
	const output = format(kind, fill(system, values), fill(template, values))

	return (
		<SplitLayout>
			<Pane title="Template">
				<label className="flex flex-col">
					<span className="screen-line-bottom px-3 py-1.5 text-xs text-muted-foreground">
						System prompt (optional)
					</span>
					<Textarea
						aria-label="System prompt"
						className={`${monoTextarea} min-h-24 flex-none`}
						value={system}
						onChange={(event) => setSystem(event.target.value)}
						spellCheck={false}
					/>
				</label>
				<label className="flex min-h-0 flex-1 flex-col">
					<span className="screen-line-top screen-line-bottom px-3 py-1.5 text-xs text-muted-foreground">
						User prompt. Write variables as {"{{name}}"}
					</span>
					<Textarea
						aria-label="User prompt template"
						className={monoTextarea}
						value={template}
						onChange={(event) => setTemplate(event.target.value)}
						spellCheck={false}
					/>
				</label>
				<div className="screen-line-top flex flex-col gap-2 p-3">
					<p className="font-mono text-xs text-muted-foreground uppercase">
						Variables ({variables.length})
					</p>
					{variables.length === 0 && (
						<p className="text-sm text-muted-foreground">
							No variables yet. Add {"{{name}}"} to the prompt to create one.
						</p>
					)}
					<div className="grid gap-2 sm:grid-cols-2">
						{variables.map((name) => (
							<label
								key={name}
								className="flex flex-col gap-1 text-xs text-muted-foreground"
							>
								<code>{name}</code>
								<Input
									value={values[name] ?? ""}
									onChange={(event) =>
										setValues((current) => ({
											...current,
											[name]: event.target.value,
										}))
									}
									placeholder={`Value for ${name}`}
								/>
							</label>
						))}
					</div>
				</div>
			</Pane>
			<Pane
				title="Result"
				actions={
					<>
						<Tabs value={kind} onValueChange={(next) => setKind(next as OutputFormat)}>
							<TabsList>
								<TabsTrigger value="text">Text</TabsTrigger>
								<TabsTrigger value="anthropic">Anthropic</TabsTrigger>
								<TabsTrigger value="openai">OpenAI</TabsTrigger>
							</TabsList>
						</Tabs>
						<CopyButton value={output} />
					</>
				}
			>
				{missing.length > 0 && (
					<p
						className="screen-line-bottom px-3 py-2 text-xs text-muted-foreground"
						role="status"
					>
						Not filled in yet: {missing.join(", ")}. They stay as {"{{placeholders}}"}{" "}
						below.
					</p>
				)}
				<pre className="min-h-0 flex-1 overflow-auto p-3 font-mono text-sm leading-relaxed whitespace-pre-wrap">
					{output}
				</pre>
			</Pane>
		</SplitLayout>
	)
}
