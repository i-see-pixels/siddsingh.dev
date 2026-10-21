"use client"

import { Input } from "@workspace/ui/components/input"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { AlertTriangleIcon, CheckCircle2Icon } from "lucide-react"
import { useMemo, useState } from "react"
import { CodeEditor, CodeView } from "../code-editor"
import { ResizableSplit } from "../resizable-split"
import { ErrorCard, FileTab, PaneHeader, StatusBar, SubBar, ToggleChip } from "../tool-chrome"
import { CopyButton } from "../tool-ui"
import {
	buildDefinition,
	formatLabels,
	makeStrict,
	parseDefinition,
	type SchemaFormat,
	type ToolDefinition,
	tabLabels,
	validate,
} from "./convert"

const SAMPLE = JSON.stringify(
	{
		name: "get_weather",
		description: "Get the current weather for a city.",
		input_schema: {
			type: "object",
			properties: {
				city: { type: "string", description: "City name, e.g. Berlin" },
				unit: { type: "string", enum: ["celsius", "fahrenheit"] },
			},
			required: ["city"],
		},
	},
	null,
	2,
)

const targets = Object.keys(formatLabels) as SchemaFormat[]

const outputFiles: Record<SchemaFormat, string> = {
	"json-schema": "schema.json",
	anthropic: "tool.anthropic.json",
	"openai-chat": "tool.openai-chat.json",
	"openai-responses": "tool.openai-responses.json",
}

export function ToolSchemaConverterTool() {
	const [input, setInput] = useState(SAMPLE)
	const [target, setTarget] = useState<SchemaFormat>("openai-chat")
	const [name, setName] = useState("")
	const [description, setDescription] = useState("")
	const [strict, setStrict] = useState(false)

	const parsed = useMemo(() => parseDefinition(input), [input])
	const isOpenAi = target === "openai-chat" || target === "openai-responses"

	const result = useMemo(() => {
		if (!parsed.ok) return null
		const tool: ToolDefinition = {
			name: name || parsed.tool.name,
			description: description || parsed.tool.description,
			schema: (strict && isOpenAi
				? makeStrict(parsed.tool.schema)
				: parsed.tool.schema) as Record<string, unknown>,
		}
		return {
			output: JSON.stringify(
				buildDefinition(target, tool, { strict: strict && isOpenAi }),
				null,
				2,
			),
			issues: validate(target, tool, strict && isOpenAi),
		}
	}, [parsed, target, name, description, strict, isOpenAi])

	return (
		<ResizableSplit
			left={
				<section className="flex h-full min-h-0 flex-col bg-background">
					<PaneHeader>
						<FileTab
							name="input.json"
							badge={
								parsed.ok
									? `Detected: ${formatLabels[parsed.format]}`
									: "Invalid JSON"
							}
							badgeTone={parsed.ok ? "brand" : "destructive"}
						/>
					</PaneHeader>
					<CodeEditor
						label="Schema or tool definition"
						placeholder="Paste a JSON Schema, an Anthropic tool or an OpenAI function"
						value={input}
						invalid={!parsed.ok}
						onChange={setInput}
					/>
					{!parsed.ok && (
						<ErrorCard title="Couldn't read this JSON" message={parsed.error} />
					)}
					<div className="grid shrink-0 gap-3 border-t border-line bg-muted/20 p-3 sm:grid-cols-2">
						<label className="flex flex-col gap-1 text-xs text-muted-foreground">
							Tool name
							<Input
								value={name}
								onChange={(event) => setName(event.target.value)}
								placeholder={
									parsed.ok ? parsed.tool.name || "get_weather" : "get_weather"
								}
								className="bg-background"
							/>
						</label>
						<label className="flex flex-col gap-1 text-xs text-muted-foreground">
							Description
							<Input
								value={description}
								onChange={(event) => setDescription(event.target.value)}
								placeholder={
									parsed.ok ? parsed.tool.description || "What the tool does" : ""
								}
								className="bg-background"
							/>
						</label>
					</div>
					<StatusBar
						tone={parsed.ok ? "ok" : "error"}
						label={parsed.ok ? "Valid JSON" : "Invalid JSON"}
						detail={`${input.split("\n").length} lines`}
					/>
				</section>
			}
			right={
				<section className="flex h-full min-h-0 flex-col bg-background">
					<PaneHeader>
						<FileTab name={outputFiles[target]} badge="Output" badgeTone="success" />
						<div className="ml-auto">
							<CopyButton value={result?.output ?? ""} />
						</div>
					</PaneHeader>
					<SubBar>
						<Tabs
							value={target}
							onValueChange={(next) => setTarget(next as SchemaFormat)}
						>
							<TabsList className="rounded-lg">
								{targets.map((item) => (
									<TabsTrigger
										key={item}
										value={item}
										className="rounded-md px-2.5"
									>
										{tabLabels[item]}
									</TabsTrigger>
								))}
							</TabsList>
						</Tabs>
						{isOpenAi && (
							<ToggleChip pressed={strict} onPressedChange={setStrict}>
								Strict mode
							</ToggleChip>
						)}
					</SubBar>
					<CodeView
						label="Converted definition"
						value={result?.output ?? "Fix the JSON on the left to see the result."}
					/>
					{result && (
						<ul
							className="flex max-h-32 shrink-0 flex-col gap-1.5 overflow-auto border-t border-line bg-muted/30 px-3 py-2.5 text-xs"
							aria-label="Checks"
						>
							{result.issues.length === 0 ? (
								<li className="flex items-center gap-2 text-muted-foreground">
									<CheckCircle2Icon className="size-3.5 text-success" />
									No problems found. Ready to paste into your API call.
								</li>
							) : (
								result.issues.map((issue) => (
									<li key={issue} className="flex items-start gap-2">
										<AlertTriangleIcon className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
										{issue}
									</li>
								))
							)}
						</ul>
					)}
				</section>
			}
		/>
	)
}
