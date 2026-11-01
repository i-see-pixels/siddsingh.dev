"use client"

import { EditorView } from "@codemirror/view"
import { Button } from "@workspace/ui/components/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@workspace/ui/components/dialog"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@workspace/ui/components/select"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { cn } from "@workspace/ui/lib/utils"
import {
	CheckIcon,
	CopyIcon,
	DownloadIcon,
	EraserIcon,
	FileJsonIcon,
	Link2Icon,
	PlayIcon,
	ShieldAlertIcon,
	XIcon,
} from "lucide-react"
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react"
import { ResizableSplit } from "@/components/resizable-split"
import { downloadBlob } from "../download"
import { CodeEditor } from "../editor/code-editor"
import { json } from "../editor/languages/json"
import { yaml } from "../editor/languages/yaml"
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
import { type Analysis, type AnalyzeOptions, analyze } from "./analyze"
import {
	formatBytes,
	type Indent,
	type InputKind,
	minifyJson,
	type OutputMode,
	parseInput,
} from "./format"
import { formatPath, type PathFormat, pathAt } from "./path"
import { SecretRulesButton, useSecretRules } from "./secret-rules"
import { type Finding, type PathSegment, redact, scanSecrets, secretRules } from "./secrets"

// The sample carries AWS's documented example key and a database password, so the
// secret scan has something to show on first load.
const SAMPLE = JSON.stringify(
	{
		service: "billing-api",
		version: 3,
		aws_access_key_id: "AKIAIOSFODNN7EXAMPLE",
		database: { url: "postgres://billing:s3cr3t-Pa55word@db.internal:5432/billing", pool: 10 },
		owner: { name: "Jane Doe", email: "jane@acme.io" },
		items: [{ sku: "PEN-01", "unit-price": 3.5, tags: ["office", "blue"] }],
	},
	null,
	2,
)

/** Above this, work moves to a worker and stops re-running on every keystroke. */
const LARGE_INPUT = 1024 * 1024
const MAX_INPUT = 20 * 1024 * 1024
const MAX_LINK = 8000
const WORKSPACE = "/tools/json-formatter/workspace"

type OutAction = "copy" | "download" | "share"

const outputFiles: Record<OutputMode, string> = {
	formatted: "formatted.json",
	minified: "minified.json",
	yaml: "converted.yaml",
}
const indents = [
	{ value: "2", label: "2 spaces" },
	{ value: "4", label: "4 spaces" },
	{ value: "tab", label: "Tab" },
]
const pathFormats: { value: PathFormat; label: string }[] = [
	{ value: "jsonpath", label: "JSONPath" },
	{ value: "jq", label: "jq" },
	{ value: "javascript", label: "JavaScript" },
	{ value: "python", label: "Python" },
]
const severityLabel = { high: "high", medium: "medium", low: "low" }

/** Input from a share link (`#json=…&mode=yaml`), or the sample. */
function readInitial(): { text: string; mode: OutputMode } {
	const params = readFragment(window.location.hash)
	const shared = params.get("json")
	const text = shared ? fromBase64Url(shared) : null
	return { text: text ?? SAMPLE, mode: params.get("mode") === "yaml" ? "yaml" : "formatted" }
}

export function JsonFormatterTool() {
	const [initial] = useState(readInitial)
	const [text, setText] = useState(initial.text)
	const [mode, setMode] = useState<OutputMode>(initial.mode)
	const [indent, setIndent] = useState<Indent>("2")
	const [sortKeys, setSortKeys] = useState(false)
	const [enabledRules, setEnabledRules] = useSecretRules()
	const [ignored, setIgnored] = useState<ReadonlySet<string>>(() => new Set())
	const [reviewOpen, setReviewOpen] = useState(false)
	const [pathFormat, setPathFormat] = useState<PathFormat>("jsonpath")
	const [cursorPath, setCursorPath] = useState<PathSegment[] | null>(null)
	const [guard, setGuard] = useState<{
		action: OutAction
		analysis: Analysis
		findings: Finding[]
	} | null>(null)
	const [flash, setFlash] = useState<{ action: OutAction | "path"; label: string } | null>(null)
	const [busy, setBusy] = useState(false)

	const options = useMemo<AnalyzeOptions>(
		() => ({ mode, indent, sortKeys, enabledRules }),
		[mode, indent, sortKeys, enabledRules],
	)
	// Large input waits for the worker instead of blocking the first paint.
	const [analysis, setAnalysis] = useState<Analysis>(() =>
		initial.text.length > LARGE_INPUT ? analyze("", options) : analyze(initial.text, options),
	)

	const inputRef = useRef<EditorView | null>(null)
	const workerRef = useRef<Worker | null>(null)
	const requestRef = useRef(0)
	const textRef = useRef(text)
	textRef.current = text
	const flashTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

	const large = text.length > LARGE_INPUT
	const tooLarge = text.length > MAX_INPUT
	const stale = analysis.text !== text

	// Small input re-runs shortly after typing stops.
	useEffect(() => {
		if (large) return
		// Drop any large-input result still in flight, so it can't land over this one.
		requestRef.current++
		setBusy(false)
		const timer = setTimeout(() => setAnalysis(analyze(text, options)), 150)
		return () => clearTimeout(timer)
	}, [text, options, large])

	const runWorker = (source: string) => {
		if (source.length > MAX_INPUT) return
		workerRef.current ??= new Worker(new URL("./worker.ts", import.meta.url), {
			type: "module",
		})
		const id = ++requestRef.current
		workerRef.current.onmessage = (event: MessageEvent<{ id: number; analysis: Analysis }>) => {
			if (event.data.id !== requestRef.current) return
			setAnalysis(event.data.analysis)
			setBusy(false)
		}
		workerRef.current.onerror = () => setBusy(false)
		setBusy(true)
		workerRef.current.postMessage({ id, text: source, options })
	}

	// Large input runs once when it arrives and when an option changes, then on Format.
	useEffect(() => {
		if (large) runWorker(textRef.current)
	}, [large, options])

	useEffect(
		() => () => {
			workerRef.current?.terminate()
			workerRef.current = null
		},
		[],
	)
	useEffect(() => () => clearTimeout(flashTimer.current), [])

	const showFlash = (action: OutAction | "path", label: string) => {
		setFlash({ action, label })
		clearTimeout(flashTimer.current)
		flashTimer.current = setTimeout(() => setFlash(null), 1600)
	}

	const findings = useMemo(
		() => analysis.findings.filter((finding) => !ignored.has(finding.signature)),
		[analysis, ignored],
	)
	const counts = {
		high: findings.filter((finding) => finding.severity === "high").length,
		medium: findings.filter((finding) => finding.severity === "medium").length,
		low: findings.filter((finding) => finding.severity === "low").length,
	}

	/** Redact in the editor as one undoable edit, re-scanning first if the text moved on. */
	const redactInEditor = (list: Finding[]) => {
		const view = inputRef.current
		if (!view || list.length === 0) return
		const doc = view.state.doc.toString()
		let targets = list
		if (doc !== analysis.text) {
			const parsed = parseInput(doc)
			if (parsed.status !== "ok") return
			const wanted = new Set(list.map((finding) => finding.signature))
			targets = scanSecrets(doc, parsed.kind, new Set(enabledRules)).filter((finding) =>
				wanted.has(finding.signature),
			)
		}
		view.dispatch({
			changes: targets.map((finding) => ({
				from: finding.from,
				to: finding.to,
				insert: finding.replacement,
			})),
			userEvent: "input.redact",
		})
	}

	const marks = useMemo(
		() => ({
			doc: analysis.text,
			items: findings.map(
				(finding): InlineMark => ({
					from: finding.from,
					to: finding.to,
					className: `cm-mark-${finding.severity}`,
					tooltip: {
						title: finding.ruleName,
						detail: `${severityLabel[finding.severity]} · ${formatPath(finding.path, "jsonpath")}`,
						action: { label: "Redact", run: () => redactInEditor([finding]) },
					},
				}),
			),
		}),
		[analysis.text, findings],
	)

	// Cursor paths: the input only when it's JSON, the output only when it isn't YAML.
	const kindRef = useRef<InputKind | undefined>(analysis.kind)
	kindRef.current = analysis.kind
	const modeRef = useRef(mode)
	modeRef.current = mode
	const [inputListener] = useState(() =>
		EditorView.updateListener.of((update) => {
			if (!update.selectionSet && !update.focusChanged) return
			if (!update.view.hasFocus) return
			setCursorPath(
				kindRef.current === "json"
					? pathAt(update.state, update.state.selection.main.head)
					: null,
			)
		}),
	)
	const [outputListener] = useState(() =>
		EditorView.updateListener.of((update) => {
			if (!update.selectionSet && !update.focusChanged) return
			if (!update.view.hasFocus) return
			setCursorPath(
				modeRef.current === "yaml"
					? null
					: pathAt(update.state, update.state.selection.main.head),
			)
		}),
	)

	const finish = async (action: OutAction, result: Analysis) => {
		try {
			if (action === "share") {
				const payload = result.kind === "json" ? minifyJson(result.text) : result.text
				const link = fragmentLink(WORKSPACE, {
					json: toBase64Url(payload),
					...(mode === "yaml" ? { mode: "yaml" } : {}),
				})
				if (link.length > MAX_LINK) {
					showFlash("share", "Too long for a link")
					return
				}
				await navigator.clipboard.writeText(link)
				showFlash("share", "Link copied")
			} else if (action === "copy") {
				await navigator.clipboard.writeText(result.output)
				showFlash("copy", "Copied")
			} else {
				downloadBlob(
					new Blob([result.output], { type: "text/plain;charset=utf-8" }),
					outputFiles[mode],
				)
			}
		} catch {
			showFlash(action, "Clipboard blocked")
		}
	}

	const start = (action: OutAction) => {
		// Large input is only analysed on Format, so an edited one has nothing current to send.
		if (large && stale) return
		const current = stale ? analyze(text, options) : analysis
		if (current.status !== "ok") return
		// Share links never carry secrets, so ignored and low-severity findings are redacted too.
		const blocking = current.findings.filter(
			(finding) =>
				action === "share" ||
				(finding.severity !== "low" && !ignored.has(finding.signature)),
		)
		if (blocking.length > 0) setGuard({ action, analysis: current, findings: blocking })
		else void finish(action, current)
	}

	const redactAndFinish = () => {
		if (!guard) return
		const redacted = redact(guard.analysis.text, guard.findings)
		// Share leaves the editor alone; copy and download redact it too.
		if (guard.action !== "share") redactInEditor(guard.findings)
		void finish(guard.action, analyze(redacted, options))
		setGuard(null)
	}

	const focusFinding = (finding: Finding) => {
		const view = inputRef.current
		if (!view || analysis.text !== view.state.doc.toString()) return
		view.dispatch({
			selection: { anchor: finding.from, head: finding.to },
			scrollIntoView: true,
		})
		view.focus()
	}

	const kind = analysis.kind
	const ok = analysis.status === "ok"
	const lines = text ? text.split("\n").length : 0
	const detail = tooLarge
		? "Try: jq . file.json"
		: `${lines.toLocaleString()} lines · ${formatBytes(stale ? text.length : analysis.stats.bytes)}${
				ok ? ` · ${analysis.stats.depth} levels deep` : ""
			}`
	const status: { tone: "idle" | "ok" | "warn" | "error"; label: string } = tooLarge
		? { tone: "error", label: "Too large for the browser editor" }
		: busy
			? { tone: "idle", label: "Formatting…" }
			: large && stale
				? { tone: "warn", label: "Edited · press Format" }
				: analysis.status === "empty"
					? { tone: "idle", label: "Waiting for input" }
					: ok
						? { tone: "ok", label: kind === "yaml" ? "Valid YAML" : "Valid JSON" }
						: { tone: "error", label: "Invalid JSON" }
	const badge =
		analysis.status === "empty"
			? undefined
			: ok
				? kind === "yaml"
					? "Valid YAML"
					: "Valid JSON"
				: "Invalid JSON"
	const pathText = cursorPath ? formatPath(cursorPath, pathFormat) : null
	const guardNames = guard ? [...new Set(guard.findings.map((finding) => finding.ruleName))] : []

	const actionButton = (action: OutAction, icon: ReactNode, label: string) => (
		<Button
			size="sm"
			variant="outline"
			className={headerButton}
			disabled={!ok || busy || (large && stale)}
			onClick={() => start(action)}
		>
			{flash?.action === action ? <CheckIcon /> : icon}
			<span className={cn(action !== "copy" && "max-sm:hidden")}>
				{flash?.action === action ? flash.label : label}
			</span>
		</Button>
	)

	return (
		<>
			<ResizableSplit
				left={
					<section className="flex h-full min-h-0 flex-col bg-background">
						<PaneHeader>
							<FileTab
								name={kind === "yaml" ? "input.yaml" : "input.json"}
								badge={badge}
								badgeTone={ok ? "brand" : "destructive"}
							/>
							<div className="ml-auto flex items-center gap-1.5">
								{large && !tooLarge && (
									<Button
										size="sm"
										className="h-8 rounded-lg"
										disabled={busy}
										onClick={() => runWorker(text)}
									>
										<PlayIcon />
										Format
									</Button>
								)}
								<SecretRulesButton
									enabled={enabledRules}
									onChange={setEnabledRules}
								/>
								<Button
									size="sm"
									variant="outline"
									className={headerButton}
									onClick={() => setText(SAMPLE)}
								>
									<FileJsonIcon />
									<span className="max-sm:hidden">Sample</span>
								</Button>
								<Button
									size="sm"
									variant="outline"
									className={headerButton}
									disabled={!text}
									onClick={() => setText("")}
								>
									<EraserIcon />
									<span className="max-sm:hidden">Clear</span>
								</Button>
							</div>
						</PaneHeader>
						<CodeEditor
							label="JSON or YAML input"
							placeholder="Paste JSON or YAML"
							language={kind === "yaml" ? yaml : json}
							value={text}
							onChange={setText}
							errorLine={stale ? undefined : analysis.error?.line}
							invalid={analysis.status === "error"}
							marks={marks}
							editorRef={inputRef}
							extensions={inputListener}
						/>
						{analysis.status === "error" && analysis.error && !stale && (
							<ErrorCard
								title="Couldn't read this as JSON"
								message={
									analysis.error.line && !/line \d+/.test(analysis.error.message)
										? `${analysis.error.message} (line ${analysis.error.line}, column ${analysis.error.column})`
										: analysis.error.message
								}
							/>
						)}
						{reviewOpen && findings.length > 0 && (
							<ul
								aria-label="Secrets found"
								className="max-h-52 shrink-0 overflow-y-auto border-t border-line text-xs"
							>
								{findings.map((finding) => (
									<li
										key={`${finding.signature}:${finding.from}`}
										className="flex items-center gap-2 border-b border-line px-3 py-1.5 last:border-b-0"
									>
										<span
											className={cn(
												"size-1.5 shrink-0 rounded-full",
												finding.severity === "high"
													? "bg-destructive"
													: finding.severity === "medium"
														? "bg-amber-500"
														: "bg-muted-foreground/60",
											)}
										/>
										<button
											type="button"
											className="flex min-w-0 flex-1 flex-col text-left hover:text-foreground"
											onClick={() => focusFinding(finding)}
										>
											<span className="font-medium">{finding.ruleName}</span>
											<span className="truncate font-mono text-muted-foreground">
												{formatPath(finding.path, "jsonpath")} ·{" "}
												{finding.preview}
											</span>
										</button>
										<Button
											size="xs"
											variant="outline"
											onClick={() => redactInEditor([finding])}
										>
											Redact
										</Button>
										<Button
											size="xs"
											variant="ghost"
											onClick={() =>
												setIgnored((current) =>
													new Set(current).add(finding.signature),
												)
											}
										>
											Ignore
										</Button>
									</li>
								))}
							</ul>
						)}
						{findings.length > 0 && (
							<div
								role="status"
								className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1 border-t border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs"
							>
								<ShieldAlertIcon className="size-3.5 text-amber-600 dark:text-amber-400" />
								<span className="font-medium">
									{findings.length} {findings.length === 1 ? "secret" : "secrets"}{" "}
									found
								</span>
								<span className="text-muted-foreground">
									{(["high", "medium", "low"] as const)
										.filter((severity) => counts[severity] > 0)
										.map((severity) => `${counts[severity]} ${severity}`)
										.join(" · ")}
									{" · "}
									scanning with {enabledRules.length} of {secretRules.length}{" "}
									rules
								</span>
								<div className="ml-auto flex gap-1.5">
									<Button
										size="xs"
										variant="outline"
										className="bg-background"
										onClick={() => setReviewOpen((open) => !open)}
									>
										{reviewOpen ? <XIcon /> : null}
										{reviewOpen ? "Close" : "Review"}
									</Button>
									<Button size="xs" onClick={() => redactInEditor(findings)}>
										Redact all
									</Button>
								</div>
							</div>
						)}
						<StatusBar tone={status.tone} label={status.label} detail={detail} />
					</section>
				}
				right={
					<section className="flex h-full min-h-0 flex-col bg-background">
						<PaneHeader>
							<FileTab name={outputFiles[mode]} badge="Output" badgeTone="success" />
							<div className="ml-auto flex items-center gap-1.5">
								{actionButton("copy", <CopyIcon />, "Copy")}
								{actionButton("download", <DownloadIcon />, "Download")}
								{actionButton("share", <Link2Icon />, "Share")}
							</div>
						</PaneHeader>
						<SubBar>
							<Tabs
								value={mode}
								onValueChange={(next) => setMode(next as OutputMode)}
							>
								<TabsList className="rounded-lg">
									<TabsTrigger value="formatted" className="rounded-md px-2.5">
										Formatted
									</TabsTrigger>
									<TabsTrigger value="minified" className="rounded-md px-2.5">
										Minified
									</TabsTrigger>
									<TabsTrigger value="yaml" className="rounded-md px-2.5">
										YAML
									</TabsTrigger>
								</TabsList>
							</Tabs>
							<Select
								items={indents}
								value={indent}
								onValueChange={(next) => next && setIndent(next as Indent)}
							>
								<SelectTrigger
									aria-label="Indent"
									size="sm"
									className="h-7 bg-background"
									disabled={mode === "minified"}
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{indents.map((item) => (
										<SelectItem
											key={item.value}
											value={item.value}
											disabled={mode === "yaml" && item.value === "tab"}
										>
											{item.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<ToggleChip pressed={sortKeys} onPressedChange={setSortKeys}>
								Sort keys
							</ToggleChip>
							{analysis.stats.largeNumbers > 0 && (
								<Chip tone="warning">Large numbers may lose precision</Chip>
							)}
						</SubBar>
						<CodeEditor
							readOnly
							label="Output"
							placeholder={
								analysis.status === "error"
									? "Fix the input on the left to see the output."
									: "Formatted output appears here."
							}
							language={mode === "yaml" ? yaml : json}
							value={analysis.output}
							extensions={outputListener}
						/>
						{analysis.yamlComments && (
							<p className="shrink-0 border-t border-line px-3 py-1.5 text-xs text-muted-foreground">
								Comments in the YAML input aren't carried into the output.
							</p>
						)}
						<div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-line bg-muted/30 px-3 py-1.5 text-xs">
							<Tabs
								value={pathFormat}
								onValueChange={(next) => setPathFormat(next as PathFormat)}
							>
								<TabsList className="h-7 rounded-lg">
									{pathFormats.map((format) => (
										<TabsTrigger
											key={format.value}
											value={format.value}
											className="rounded-md px-2 text-xs"
										>
											{format.label}
										</TabsTrigger>
									))}
								</TabsList>
							</Tabs>
							<code
								aria-live="polite"
								className={cn(
									"min-w-0 flex-1 truncate font-mono",
									!pathText && "text-muted-foreground",
								)}
							>
								{pathText ?? "Click a key or value to see its path"}
							</code>
							<Button
								size="xs"
								variant="outline"
								className="bg-background"
								disabled={!pathText}
								onClick={async () => {
									if (!pathText) return
									try {
										await navigator.clipboard.writeText(pathText)
										showFlash("path", "Copied")
									} catch {}
								}}
							>
								{flash?.action === "path" ? <CheckIcon /> : <CopyIcon />}
								{flash?.action === "path" ? "Copied" : "Copy path"}
							</Button>
						</div>
					</section>
				}
			/>
			<Dialog open={guard !== null} onOpenChange={(open) => !open && setGuard(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{guard?.action === "share"
								? "Secrets will be removed from the link"
								: `This ${kind === "yaml" ? "YAML" : "JSON"} contains ${guard?.findings.length} ${
										guard?.findings.length === 1 ? "secret" : "secrets"
									}`}
						</DialogTitle>
						<DialogDescription>
							{guardNames.join(", ")}.{" "}
							{guard?.action === "share"
								? "Share links never carry secrets. Your editor isn't changed."
								: "Redact them before it leaves this page?"}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						{guard?.action === "share" ? (
							<Button variant="outline" onClick={() => setGuard(null)}>
								Cancel
							</Button>
						) : (
							<Button
								variant="outline"
								onClick={() => {
									if (guard) void finish(guard.action, guard.analysis)
									setGuard(null)
								}}
							>
								{guard?.action === "download" ? "Download anyway" : "Copy anyway"}
							</Button>
						)}
						<Button autoFocus onClick={redactAndFinish}>
							{guard?.action === "share"
								? "Copy redacted link"
								: guard?.action === "download"
									? "Redact and download"
									: "Redact and copy"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
