"use client"

import { Button } from "@workspace/ui/components/button"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { cn } from "@workspace/ui/lib/utils"
import { type Change, createTwoFilesPatch, diffChars, diffLines, diffWordsWithSpace } from "diff"
import { ArrowLeftRightIcon } from "lucide-react"
import { useDeferredValue, useMemo, useState } from "react"
import { CodeEditor } from "../editor/code-editor"
import {
	Chip,
	FileTab,
	headerButton,
	PaneHeader,
	StatusBar,
	SubBar,
	ToggleChip,
} from "../tool-chrome"
import { CopyButton } from "../tool-ui"

type Granularity = "lines" | "words" | "chars"
type View = "split" | "unified"

const LEFT_SAMPLE = `function total(items) {
  let sum = 0
  for (const item of items) {
    sum += item.price
  }
  return sum
}`

const RIGHT_SAMPLE = `function total(items, taxRate = 0) {
  let sum = 0
  for (const item of items) {
    sum += item.price * item.quantity
  }
  return sum * (1 + taxRate)
}`

type Row = { kind: "same" | "add" | "del"; left?: number; right?: number; text: string }

function splitLines(value: string) {
	const lines = value.split("\n")
	if (lines.at(-1) === "") lines.pop()
	return lines
}

function toRows(changes: Change[]): Row[] {
	const rows: Row[] = []
	let left = 1
	let right = 1
	for (const change of changes) {
		for (const text of splitLines(change.value)) {
			if (change.added) rows.push({ kind: "add", right: right++, text })
			else if (change.removed) rows.push({ kind: "del", left: left++, text })
			else rows.push({ kind: "same", left: left++, right: right++, text })
		}
	}
	return rows
}

/** Line up each run of deletions beside the additions that follow it. */
function toSplitRows(rows: Row[]) {
	const out: { left?: Row; right?: Row }[] = []
	let index = 0
	while (index < rows.length) {
		const row = rows[index] as Row
		if (row.kind === "same") {
			out.push({ left: row, right: row })
			index++
			continue
		}
		const removed: Row[] = []
		const added: Row[] = []
		while (rows[index]?.kind === "del") removed.push(rows[index++] as Row)
		while (rows[index]?.kind === "add") added.push(rows[index++] as Row)
		for (let i = 0; i < Math.max(removed.length, added.length); i++) {
			out.push({ left: removed[i], right: added[i] })
		}
	}
	return out
}

const lineStyle: Record<Row["kind"], string> = {
	same: "",
	add: "bg-success/10",
	del: "bg-destructive/10",
}

const numberStyle: Record<Row["kind"], string> = {
	same: "bg-muted/30",
	add: "bg-success/20 text-success",
	del: "bg-destructive/20 text-destructive",
}

const size = (change: Change, granularity: Granularity) =>
	granularity === "lines" ? splitLines(change.value).length : change.value.length

export function DiffCheckerTool() {
	const [left, setLeft] = useState(LEFT_SAMPLE)
	const [right, setRight] = useState(RIGHT_SAMPLE)
	const [granularity, setGranularity] = useState<Granularity>("lines")
	const [view, setView] = useState<View>("split")
	const [ignoreWhitespace, setIgnoreWhitespace] = useState(false)
	const [ignoreCase, setIgnoreCase] = useState(false)

	const deferredLeft = useDeferredValue(left)
	const deferredRight = useDeferredValue(right)

	const changes = useMemo(() => {
		const options = { ignoreCase }
		if (granularity === "words") return diffWordsWithSpace(deferredLeft, deferredRight, options)
		if (granularity === "chars") return diffChars(deferredLeft, deferredRight, options)
		return diffLines(deferredLeft, deferredRight, { ...options, ignoreWhitespace })
	}, [deferredLeft, deferredRight, granularity, ignoreWhitespace, ignoreCase])

	const rows = useMemo(
		() => (granularity === "lines" ? toRows(changes) : []),
		[changes, granularity],
	)
	const splitRows = useMemo(() => toSplitRows(rows), [rows])

	const added = changes
		.filter((change) => change.added)
		.reduce((sum, change) => sum + size(change, granularity), 0)
	const removed = changes
		.filter((change) => change.removed)
		.reduce((sum, change) => sum + size(change, granularity), 0)

	const patch = useMemo(
		() => createTwoFilesPatch("original", "modified", deferredLeft, deferredRight),
		[deferredLeft, deferredRight],
	)
	const identical = deferredLeft === deferredRight

	return (
		<div className="flex flex-col bg-background lg:h-[calc(100svh-3.5rem)]">
			<div className="grid shrink-0 border-b border-line lg:h-[36%] lg:grid-cols-2">
				<EditorPane
					name="original.txt"
					label="Original text"
					value={left}
					onChange={setLeft}
					className="border-b border-line lg:border-r lg:border-b-0"
				/>
				<EditorPane
					name="modified.txt"
					label="Modified text"
					value={right}
					onChange={setRight}
				/>
			</div>
			<SubBar className="border-b-0 border-b-line">
				<Tabs
					value={granularity}
					onValueChange={(next) => setGranularity(next as Granularity)}
				>
					<TabsList className="rounded-lg">
						<TabsTrigger value="lines" className="rounded-md px-2.5">
							Lines
						</TabsTrigger>
						<TabsTrigger value="words" className="rounded-md px-2.5">
							Words
						</TabsTrigger>
						<TabsTrigger value="chars" className="rounded-md px-2.5">
							Characters
						</TabsTrigger>
					</TabsList>
				</Tabs>
				{granularity === "lines" && (
					<Tabs value={view} onValueChange={(next) => setView(next as View)}>
						<TabsList className="rounded-lg">
							<TabsTrigger value="split" className="rounded-md px-2.5">
								Split
							</TabsTrigger>
							<TabsTrigger value="unified" className="rounded-md px-2.5">
								Unified
							</TabsTrigger>
						</TabsList>
					</Tabs>
				)}
				<ToggleChip pressed={ignoreCase} onPressedChange={setIgnoreCase}>
					Ignore case
				</ToggleChip>
				{granularity === "lines" && (
					<ToggleChip pressed={ignoreWhitespace} onPressedChange={setIgnoreWhitespace}>
						Ignore whitespace
					</ToggleChip>
				)}
				<div className="ml-auto flex items-center gap-2">
					<Chip tone="success">+{added}</Chip>
					<Chip tone="destructive">−{removed}</Chip>
					<Button
						size="sm"
						variant="outline"
						className={headerButton}
						onClick={() => {
							setLeft(right)
							setRight(left)
						}}
					>
						<ArrowLeftRightIcon />
						Swap
					</Button>
					<CopyButton value={patch} label="Copy patch" />
				</div>
			</SubBar>
			<div className="min-h-64 flex-1 overflow-auto border-t border-line font-mono text-[13px] leading-6 lg:min-h-0">
				{identical ? (
					<p className="p-4 font-sans text-sm text-muted-foreground">
						The two texts are identical.
					</p>
				) : granularity !== "lines" ? (
					<p className="p-3 break-words whitespace-pre-wrap">
						{changes.map((change, index) => (
							<span
								// biome-ignore lint/suspicious/noArrayIndexKey: the diff is positional and never reordered
								key={index}
								className={cn(
									"rounded-sm",
									change.added && "bg-success/25",
									change.removed &&
										"bg-destructive/25 line-through decoration-destructive/60",
								)}
							>
								{change.value}
							</span>
						))}
					</p>
				) : view === "unified" ? (
					<table className="w-full border-collapse">
						<tbody>
							{rows.map((row, index) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: rows are positional
								<tr key={index} className={lineStyle[row.kind]}>
									<LineNumber value={row.left} kind={row.kind} />
									<LineNumber value={row.right} kind={row.kind} />
									<td className="w-5 text-center text-muted-foreground select-none">
										{row.kind === "add" ? "+" : row.kind === "del" ? "−" : ""}
									</td>
									<td className="pr-3 break-all whitespace-pre-wrap">
										{row.text}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				) : (
					<table className="w-full table-fixed border-collapse">
						<tbody>
							{splitRows.map((pair, index) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: rows are positional
								<tr key={index}>
									<SplitCell row={pair.left} side="left" />
									<SplitCell row={pair.right} side="right" />
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
			<StatusBar
				tone={identical ? "ok" : "warn"}
				label={identical ? "No differences" : "Differences found"}
				detail={`${added + removed} changed ${granularity === "lines" ? "lines" : granularity}`}
			/>
		</div>
	)
}

function EditorPane({
	name,
	label,
	value,
	onChange,
	className,
}: {
	name: string
	label: string
	value: string
	onChange: (value: string) => void
	className?: string
}) {
	const lines = value ? value.split("\n").length : 0
	return (
		<section className={cn("flex h-56 min-h-0 min-w-0 flex-col lg:h-auto", className)}>
			<PaneHeader>
				<FileTab
					name={name}
					badge={`${lines} ${lines === 1 ? "line" : "lines"}`}
					badgeTone="neutral"
				/>
			</PaneHeader>
			<CodeEditor label={label} value={value} onChange={onChange} />
		</section>
	)
}

function LineNumber({ value, kind }: { value?: number; kind: Row["kind"] }) {
	return (
		<td
			className={cn(
				"w-10 px-2 text-right text-xs text-muted-foreground tabular-nums select-none",
				numberStyle[kind],
			)}
		>
			{value}
		</td>
	)
}

function SplitCell({ row, side }: { row?: Row; side: "left" | "right" }) {
	const kind = row?.kind
	const visible = row && (kind === "same" || (side === "left" ? kind === "del" : kind === "add"))
	return (
		<>
			<td
				className={cn(
					"w-10 px-2 text-right align-top text-xs text-muted-foreground tabular-nums select-none",
					side === "right" && "border-l border-line",
					visible && row ? numberStyle[row.kind] : "bg-muted/40",
				)}
			>
				{visible ? (side === "left" ? row.left : row.right) : ""}
			</td>
			<td
				className={cn(
					"px-2 align-top break-all whitespace-pre-wrap",
					visible && row ? lineStyle[row.kind] : "bg-muted/40",
				)}
			>
				{visible ? row.text : ""}
			</td>
		</>
	)
}
