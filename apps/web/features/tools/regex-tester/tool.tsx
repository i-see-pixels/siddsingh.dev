"use client"

import { Prec } from "@codemirror/state"
import { EditorView, keymap } from "@codemirror/view"
import { Button } from "@workspace/ui/components/button"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { cn } from "@workspace/ui/lib/utils"
import { CheckIcon, Link2Icon, ShieldAlertIcon } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { ResizableSplit } from "@/components/resizable-split"
import { CodeEditor } from "../editor/code-editor"
import { regex } from "../editor/languages/regex"
import { plainText } from "../editor/languages/text"
import type { InlineMark } from "../editor/marks"
import { fragmentLink, fromBase64Url, readFragment, toBase64Url } from "../share"
import {
	Chip,
	ErrorCard,
	FileTab,
	headerButton,
	PaneHeader,
	StatusBar,
	SubBar,
	ToggleChip,
} from "../tool-chrome"
import { parsePattern } from "./ast"
import { javascriptCode, targetCode } from "./codegen"
import { explain } from "./explain"
import { ExplainPanel, LanguageRow, MatchesPanel } from "./panels"
import { checkTarget, TARGET_NAMES, TARGETS } from "./portability"
import { findRedos } from "./redos"
import type { Match, RunResult } from "./run"
import type { WorkerReply, WorkerRequest } from "./worker"

const WORKSPACE = "/tools/regex-tester/workspace"
const BUDGET_MS = 1000
const DEBOUNCE_MS = 120
const MAX_SHARED_TEXT = 4000
const MAX_MARKS = 2000
const GROUP_COLOURS = 6

type Tab = "matches" | "explain" | "languages" | "result"

const SAMPLE_PATTERN = "(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})"
const SAMPLE_TEXT = `Released 2026-10-31, patched 2026-11-02.
Older builds: 1999-01-02 and 2024-02-29.
Not a date: 2026/10/31`

const FLAGS = [
	{ flag: "g", title: "Global: find every match" },
	{ flag: "i", title: "Ignore case" },
	{ flag: "m", title: "Multiline: ^ and $ match at each line" },
	{ flag: "s", title: "Dot matches newlines" },
	{ flag: "u", title: "Unicode" },
	{ flag: "v", title: "Unicode sets" },
	{ flag: "y", title: "Sticky: match only at the current position" },
]

function readInitial() {
	const state = readFragment(window.location.hash).get("state")
	try {
		const parsed = state ? JSON.parse(fromBase64Url(state) ?? "null") : null
		if (parsed && typeof parsed.p === "string") {
			return {
				pattern: parsed.p as string,
				flags: (typeof parsed.f === "string" ? parsed.f : "g") as string,
				text: (typeof parsed.t === "string" ? parsed.t : "") as string,
				replacement: typeof parsed.r === "string" ? (parsed.r as string) : undefined,
			}
		}
	} catch {}
	return { pattern: SAMPLE_PATTERN, flags: "g", text: SAMPLE_TEXT, replacement: undefined }
}

// The pattern is one line: no gutters, and Enter does nothing.
const patternEditor = [
	EditorView.theme({
		".cm-gutters": { display: "none" },
		".cm-content": { padding: "8px 0" },
		".cm-line": { padding: "0 2px" },
		".cm-token-hover": { backgroundColor: "var(--brand-muted)", borderRadius: "3px" },
		".cm-redos": { textDecoration: "underline wavy #f59e0b", textUnderlineOffset: "3px" },
	}),
	Prec.highest(keymap.of([{ key: "Enter", run: () => true }])),
]

const tint = (colour: string, percent: number) => ({
	backgroundColor: `color-mix(in oklab, ${colour} ${percent}%, transparent)`,
	borderRadius: "2px",
})

const textEditor = EditorView.theme({
	".cm-regex-match": tint("var(--brand)", 16),
	".cm-regex-group-1": tint("#10b981", 30),
	".cm-regex-group-2": tint("#f59e0b", 30),
	".cm-regex-group-3": tint("#ec4899", 28),
	".cm-regex-group-4": tint("#8b5cf6", 30),
	".cm-regex-group-5": tint("#0ea5e9", 30),
	".cm-regex-group-6": tint("#84cc16", 30),
	".cm-regex-replaced": tint("#10b981", 24),
})

type Run =
	| { status: "idle" }
	| { status: "running"; last?: Finished }
	| { status: "timeout"; last?: Finished }
	| { status: "error"; message: string }
	| ({ status: "done" } & Finished)
type Finished = { result: RunResult; text: string; replacement?: string; key: string }

/** Runs the pattern in a worker, and kills the worker if it overruns the budget. */
function useRegexRun(
	pattern: string,
	flags: string,
	text: string,
	replacement: string | undefined,
	valid: boolean,
) {
	const [run, setRun] = useState<Run>({ status: "idle" })
	const workerRef = useRef<Worker | null>(null)
	const requestRef = useRef(0)
	const busyRef = useRef(false)
	const pendingRef = useRef<Omit<Finished, "result">>({ text: "", key: "" })
	const budgetRef = useRef<ReturnType<typeof setTimeout>>(undefined)

	useEffect(
		() => () => {
			clearTimeout(budgetRef.current)
			workerRef.current?.terminate()
			workerRef.current = null
		},
		[],
	)

	useEffect(() => {
		if (!valid || !pattern) {
			clearTimeout(budgetRef.current)
			setRun({ status: "idle" })
			return
		}
		const timer = setTimeout(() => {
			// A run still going may be stuck, and a worker can't be interrupted, only replaced.
			if (busyRef.current) {
				workerRef.current?.terminate()
				workerRef.current = null
			}
			clearTimeout(budgetRef.current)
			const last = (current: Run) =>
				current.status === "done"
					? {
							result: current.result,
							text: current.text,
							replacement: current.replacement,
							key: current.key,
						}
					: current.status === "running" || current.status === "timeout"
						? current.last
						: undefined
			setRun((current) => ({ status: "running", last: last(current) }))
			if (!workerRef.current) {
				workerRef.current = new Worker(new URL("./worker.ts", import.meta.url), {
					type: "module",
				})
				workerRef.current.onmessage = (event: MessageEvent<WorkerReply>) => {
					const reply = event.data
					if (reply.id !== requestRef.current) return
					if (reply.type === "started") {
						budgetRef.current = setTimeout(() => {
							workerRef.current?.terminate()
							workerRef.current = null
							busyRef.current = false
							setRun((current) => ({ status: "timeout", last: last(current) }))
						}, BUDGET_MS)
						return
					}
					clearTimeout(budgetRef.current)
					busyRef.current = false
					setRun(
						reply.type === "done"
							? { status: "done", ...pendingRef.current, result: reply.result }
							: { status: "error", message: reply.message },
					)
				}
			}
			const id = ++requestRef.current
			busyRef.current = true
			pendingRef.current = { text, replacement, key: `${pattern}/${flags}` }
			workerRef.current.postMessage({
				id,
				pattern,
				flags,
				text,
				replacement,
			} satisfies WorkerRequest)
		}, DEBOUNCE_MS)
		return () => clearTimeout(timer)
	}, [pattern, flags, text, replacement, valid])

	return run
}

export function RegexTesterTool() {
	const [initial] = useState(readInitial)
	const [pattern, setPattern] = useState(initial.pattern)
	const [flags, setFlags] = useState(initial.flags)
	const [text, setText] = useState(initial.text)
	const [replacing, setReplacing] = useState(initial.replacement !== undefined)
	const [replacement, setReplacement] = useState(initial.replacement ?? "")
	const [tab, setTab] = useState<Tab>("matches")
	const [hover, setHover] = useState<{ from: number; to: number } | null>(null)
	const [flash, setFlash] = useState<string | null>(null)
	const flashTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
	const textRef = useRef<EditorView | null>(null)
	useEffect(() => () => clearTimeout(flashTimer.current), [])

	const engineError = useMemo(() => {
		try {
			new RegExp(pattern, flags)
			return null
		} catch (error) {
			return error instanceof Error ? error.message : String(error)
		}
	}, [pattern, flags])

	const parsed = useMemo(() => parsePattern(pattern, flags), [pattern, flags])
	const activeReplacement = replacing ? replacement : undefined
	const run = useRegexRun(pattern, flags, text, activeReplacement, !engineError)

	const finished =
		run.status === "done"
			? run
			: run.status === "running" || run.status === "timeout"
				? run.last
				: undefined
	const current = finished && finished.text === text ? finished : undefined
	const matches = current?.result.matches ?? []
	const groups = parsed.ok ? parsed.groups : []

	const analysis = useMemo(() => {
		if (!parsed.ok || !pattern) return null
		const languages = TARGETS.map((target) => {
			const result = checkTarget(parsed, pattern, flags, target)
			return {
				...result,
				name: TARGET_NAMES[target],
				code:
					result.pattern === null
						? null
						: targetCode(result, {
								flags,
								groups: parsed.groups,
								replacement: activeReplacement,
							}),
			}
		})
		return {
			languages,
			rows: explain(parsed.root),
			redos: findRedos(parsed.root, flags),
			javascript: javascriptCode({
				pattern,
				flags,
				groups: parsed.groups,
				replacement: activeReplacement,
			}),
		}
	}, [parsed, pattern, flags, activeReplacement])

	const redos = analysis?.redos ?? []
	const patternMarks = useMemo(() => {
		const items: InlineMark[] = []
		if (engineError && !parsed.ok && parsed.position !== undefined) {
			const from = Math.min(parsed.position, Math.max(pattern.length - 1, 0))
			items.push({
				from,
				to: from + 1,
				className: "cm-mark-high",
				tooltip: { title: engineError },
			})
		}
		for (const finding of redos) {
			items.push({
				from: finding.from,
				to: finding.to,
				className: "cm-redos",
				tooltip: { title: "Can hang on some inputs", detail: finding.message },
			})
		}
		if (hover) items.push({ from: hover.from, to: hover.to, className: "cm-token-hover" })
		return { doc: pattern, items }
	}, [engineError, parsed, pattern, redos, hover])

	const textMarks = useMemo(() => {
		if (!current) return undefined
		const items: InlineMark[] = []
		current.result.matches.slice(0, MAX_MARKS).forEach((match, index) => {
			items.push({
				from: match.start,
				to: match.end,
				className: "cm-regex-match",
				tooltip: {
					title: `Match ${index + 1}: ${match.start}–${match.end}`,
					detail: match.groups
						.map(
							(group) =>
								`${groups.find((item) => item.index === group.index)?.name ?? group.index}: ${group.text}`,
						)
						.join(" · "),
				},
			})
			for (const group of match.groups) {
				items.push({
					from: group.start,
					to: group.end,
					className: `cm-regex-group-${((group.index - 1) % GROUP_COLOURS) + 1}`,
				})
			}
		})
		return { doc: text, items }
	}, [current, groups, text])

	const replaced = current?.result.replaced
	const resultMarks = useMemo(
		() =>
			replaced
				? {
						doc: replaced.text,
						items: replaced.spans.slice(0, MAX_MARKS).map((span) => ({
							from: span.start,
							to: span.end,
							className: "cm-regex-replaced",
						})),
					}
				: undefined,
		[replaced],
	)

	const toggleFlag = (flag: string, on: boolean) => {
		setFlags((value) => {
			// u and v can't be set together.
			const other = flag === "u" ? "v" : flag === "v" ? "u" : ""
			const rest = value.replace(flag, "").replace(other || flag, "")
			const next = on ? rest + flag : rest
			return FLAGS.map((item) => item.flag)
				.filter((item) => next.includes(item))
				.join("")
		})
	}

	const selectMatch = (match: Match) => {
		const view = textRef.current
		if (!view) return
		view.dispatch({ selection: { anchor: match.start, head: match.end }, scrollIntoView: true })
		view.focus()
	}

	const showFlash = (label: string) => {
		setFlash(label)
		clearTimeout(flashTimer.current)
		flashTimer.current = setTimeout(() => setFlash(null), 1800)
	}

	const share = async () => {
		const tooLong = text.length > MAX_SHARED_TEXT
		const state = {
			p: pattern,
			f: flags,
			...(tooLong ? {} : { t: text }),
			...(replacing ? { r: replacement } : {}),
		}
		try {
			await navigator.clipboard.writeText(
				fragmentLink(WORKSPACE, { state: toBase64Url(JSON.stringify(state)) }),
			)
			showFlash(tooLong ? "Copied, without the long text" : "Link copied")
		} catch {
			showFlash("Clipboard blocked")
		}
	}

	const count = matches.length
	const badge = engineError
		? "Error"
		: run.status === "timeout"
			? "Stopped"
			: !current
				? undefined
				: count === 0
					? "No match"
					: `${current.result.capped ? `${count.toLocaleString()}+` : count.toLocaleString()} ${count === 1 ? "match" : "matches"}`
	const status: { tone: "idle" | "ok" | "warn" | "error"; label: string } = engineError
		? { tone: "error", label: "Invalid pattern" }
		: run.status === "timeout"
			? {
					tone: "error",
					label: `Stopped after ${BUDGET_MS / 1000} s: catastrophic backtracking`,
				}
			: run.status === "error"
				? { tone: "error", label: run.message }
				: !pattern
					? { tone: "idle", label: "Write a pattern" }
					: !current
						? { tone: "idle", label: "Running…" }
						: {
								tone: count > 0 ? "ok" : "warn",
								label: `Ran in ${current.result.ms.toFixed(1)} ms · ${count.toLocaleString()} ${count === 1 ? "match" : "matches"} · ${current.result.groupCount} ${current.result.groupCount === 1 ? "group" : "groups"}`,
							}
	const needsWork =
		analysis?.languages.filter((language) => language.status !== "works").length ?? 0
	const activeTab = tab === "result" && !replacing ? "matches" : tab

	return (
		<div className="flex flex-1 flex-col lg:h-[calc(100svh-3.5rem)] lg:flex-none">
			<div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-line px-3 py-2">
				<div className="flex min-w-60 flex-1 items-center rounded-lg border border-input bg-background px-2 font-mono text-sm focus-within:border-ring">
					<span aria-hidden className="text-muted-foreground">
						/
					</span>
					<CodeEditor
						label="Regular expression"
						placeholder="Write a pattern"
						language={regex}
						value={pattern}
						onChange={(value) => setPattern(value.replace(/\r?\n/g, ""))}
						invalid={Boolean(engineError)}
						marks={patternMarks}
						extensions={patternEditor}
						className="min-w-0 flex-1 text-sm"
					/>
					<span aria-hidden className="text-muted-foreground">
						/{flags}
					</span>
				</div>
				<fieldset className="flex flex-wrap items-center gap-1" aria-label="Flags">
					{FLAGS.map(({ flag, title }) => (
						<ToggleChip
							key={flag}
							title={title}
							aria-label={title}
							pressed={flags.includes(flag)}
							onPressedChange={(on) => toggleFlag(flag, on)}
							className="font-mono [&_svg]:hidden"
						>
							{flag}
						</ToggleChip>
					))}
				</fieldset>
				<Button size="sm" variant="outline" className={headerButton} onClick={share}>
					{flash ? <CheckIcon /> : <Link2Icon />}
					{flash ?? "Share"}
				</Button>
			</div>
			{engineError && (
				<div className="shrink-0 pt-3">
					<ErrorCard title="This pattern doesn't compile" message={engineError} />
				</div>
			)}
			{(redos.length > 0 || run.status === "timeout") && (
				<div
					role="status"
					className="flex shrink-0 flex-wrap items-start gap-2 border-b border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs"
				>
					<ShieldAlertIcon className="mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
					<div className="min-w-0 flex-1">
						{run.status === "timeout" && (
							<p className="font-medium">
								This pattern took over a second on this text, so the run was
								stopped.
							</p>
						)}
						{redos.map((finding) => (
							<p key={`${finding.kind}-${finding.from}`}>
								<span className="font-medium">
									{finding.severity === "exponential"
										? "Can hang on some inputs: "
										: "Can slow down on long inputs: "}
								</span>
								{finding.message}{" "}
								<span className="text-muted-foreground">{finding.fix}</span>
							</p>
						))}
						<p className="text-muted-foreground">
							Go and Rust are immune: their engines run in linear time.
						</p>
					</div>
					{redos[0] && (
						<Button
							size="xs"
							variant="outline"
							className="bg-background"
							onClick={() => setText(redos[0]?.probe ?? "")}
						>
							Generate a test string
						</Button>
					)}
				</div>
			)}
			<ResizableSplit
				className="lg:h-auto lg:min-h-0 lg:flex-1"
				left={
					<section className="flex h-full min-h-0 flex-col bg-background">
						<PaneHeader>
							<FileTab
								name="test.txt"
								badge={badge}
								badgeTone={
									badge === "Error" || badge === "Stopped"
										? "destructive"
										: count > 0
											? "brand"
											: "neutral"
								}
							/>
							<div className="ml-auto">
								<ToggleChip pressed={replacing} onPressedChange={setReplacing}>
									Replace
								</ToggleChip>
							</div>
						</PaneHeader>
						{replacing && (
							<div className="flex shrink-0 items-center gap-2 border-b border-line px-3 py-1.5">
								<label
									htmlFor="regex-replacement"
									className="text-xs text-muted-foreground"
								>
									Replace with
								</label>
								<input
									id="regex-replacement"
									value={replacement}
									spellCheck={false}
									autoComplete="off"
									placeholder="$<year>/$<month>"
									onChange={(event) => setReplacement(event.target.value)}
									className="h-7 min-w-0 flex-1 rounded-md border border-input bg-transparent px-2 font-mono text-xs outline-none focus-visible:border-ring"
								/>
							</div>
						)}
						<CodeEditor
							label="Test text"
							placeholder="Paste text to test against"
							language={plainText}
							value={text}
							onChange={setText}
							marks={textMarks}
							editorRef={textRef}
							extensions={textEditor}
						/>
						<StatusBar tone={status.tone} label={status.label} />
					</section>
				}
				right={
					<section className="flex h-full min-h-0 flex-col bg-background">
						<SubBar className="min-h-12">
							<Tabs value={activeTab} onValueChange={(next) => setTab(next as Tab)}>
								<TabsList className="rounded-lg">
									<TabsTrigger value="matches" className="rounded-md px-2.5">
										Matches
									</TabsTrigger>
									<TabsTrigger value="explain" className="rounded-md px-2.5">
										Explain
									</TabsTrigger>
									<TabsTrigger
										value="languages"
										className="gap-1.5 rounded-md px-2.5"
									>
										Languages
										{needsWork > 0 && (
											<Chip tone="warning" className="px-1.5 py-0">
												{needsWork}
											</Chip>
										)}
									</TabsTrigger>
									{replacing && (
										<TabsTrigger value="result" className="rounded-md px-2.5">
											Result
										</TabsTrigger>
									)}
								</TabsList>
							</Tabs>
						</SubBar>
						{activeTab === "matches" ? (
							run.status === "timeout" && !current ? (
								<p className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
									Stopped before it finished, so there are no results for this
									pattern.
								</p>
							) : (
								<div
									className={cn(
										"flex min-h-0 flex-1 flex-col",
										run.status === "timeout" && "opacity-60",
									)}
								>
									<MatchesPanel
										matches={matches}
										groups={groups}
										capped={current?.result.capped ?? false}
										onSelect={selectMatch}
									/>
								</div>
							)
						) : activeTab === "explain" ? (
							analysis ? (
								<ExplainPanel rows={analysis.rows} onHover={setHover} />
							) : (
								<p className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
									Write a valid pattern to see it explained.
								</p>
							)
						) : activeTab === "languages" ? (
							analysis ? (
								<div className="min-h-0 flex-1 overflow-y-auto">
									<p className="border-b border-line px-3 py-2 text-xs text-muted-foreground">
										JavaScript is run in your browser. Other languages are
										checked against known differences, not run.
									</p>
									<LanguageRow
										name="JavaScript"
										status="works"
										issues={[]}
										code={analysis.javascript}
										ran
									/>
									{analysis.languages.map((language) => (
										<LanguageRow
											key={language.target}
											name={language.name}
											status={language.status}
											issues={language.issues}
											code={language.code}
										/>
									))}
								</div>
							) : (
								<p className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
									Write a valid pattern to compare languages.
								</p>
							)
						) : (
							<CodeEditor
								readOnly
								label="Text after replacing"
								language={plainText}
								value={replaced?.text ?? ""}
								marks={resultMarks}
								extensions={textEditor}
							/>
						)}
					</section>
				}
			/>
		</div>
	)
}
