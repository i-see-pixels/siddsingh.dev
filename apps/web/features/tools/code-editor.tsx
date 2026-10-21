"use client"

import { Textarea } from "@workspace/ui/components/textarea"
import { cn } from "@workspace/ui/lib/utils"
import { Fragment, type ReactNode, useRef } from "react"

const GUTTER =
	"w-11 shrink-0 overflow-hidden border-r border-line bg-muted/30 py-3 text-right text-muted-foreground/70 select-none"

function Gutter({
	ref,
	lines,
	errorLine,
}: {
	ref?: React.Ref<HTMLDivElement>
	lines: number
	errorLine?: number
}) {
	return (
		<div ref={ref} aria-hidden className={GUTTER}>
			{Array.from({ length: lines }, (_, index) => (
				<div
					// biome-ignore lint/suspicious/noArrayIndexKey: line numbers are positional
					key={index}
					className={cn(
						"pr-2.5",
						errorLine === index + 1 && "bg-destructive/10 text-destructive",
					)}
				>
					{index + 1}
				</div>
			))}
		</div>
	)
}

/** A plain textarea with a line-number gutter that scrolls in step with it. */
export function CodeEditor({
	value,
	onChange,
	label,
	placeholder,
	errorLine,
	invalid,
}: {
	value: string
	onChange: (value: string) => void
	label: string
	placeholder?: string
	errorLine?: number
	invalid?: boolean
}) {
	const gutterRef = useRef<HTMLDivElement>(null)

	return (
		<div className="flex min-h-0 flex-1 overflow-hidden font-mono text-[13px] leading-6">
			<Gutter ref={gutterRef} lines={value.split("\n").length} errorLine={errorLine} />
			<Textarea
				aria-label={label}
				aria-invalid={invalid}
				wrap="off"
				spellCheck={false}
				value={value}
				placeholder={placeholder}
				onChange={(event) => onChange(event.target.value)}
				onScroll={(event) => {
					if (gutterRef.current)
						gutterRef.current.scrollTop = event.currentTarget.scrollTop
				}}
				className="h-full min-h-0 flex-1 resize-none overflow-auto rounded-none border-0 bg-transparent px-3 py-3 font-mono text-[13px] leading-6 whitespace-pre [field-sizing:fixed] focus-visible:ring-0 dark:bg-transparent"
			/>
		</div>
	)
}

const JSON_TOKEN =
	/("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g

/** Colour JSON keys, strings and literals. Anything else is left as plain text. */
function highlightJson(text: string): ReactNode[] {
	const nodes: ReactNode[] = []
	let last = 0
	for (const match of text.matchAll(JSON_TOKEN)) {
		const start = match.index ?? 0
		if (start > last) nodes.push(text.slice(last, start))
		const [token, string, colon, literal] = match
		let className = "text-amber-600 dark:text-amber-400"
		if (string) className = colon ? "text-brand" : "text-emerald-600 dark:text-emerald-400"
		else if (literal) className = "text-violet-600 dark:text-violet-400"
		nodes.push(
			<span key={start} className={className}>
				{string && colon ? string : token}
			</span>,
		)
		if (string && colon) nodes.push(<Fragment key={`${start}:`}>{colon}</Fragment>)
		last = start + token.length
	}
	if (last < text.length) nodes.push(text.slice(last))
	return nodes
}

/** A read-only, line-numbered, syntax-coloured view of JSON text. */
export function CodeView({ value, label }: { value: string; label: string }) {
	const gutterRef = useRef<HTMLDivElement>(null)

	return (
		<div className="flex min-h-0 flex-1 overflow-hidden font-mono text-[13px] leading-6">
			<Gutter ref={gutterRef} lines={value.split("\n").length} />
			<section
				aria-label={label}
				// biome-ignore lint/a11y/noNoninteractiveTabindex: keyboard users need to focus a scrollable region
				tabIndex={0}
				onScroll={(event) => {
					if (gutterRef.current)
						gutterRef.current.scrollTop = event.currentTarget.scrollTop
				}}
				className="min-w-0 flex-1 overflow-auto outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset"
			>
				<pre className="px-3 py-3">{highlightJson(value)}</pre>
			</section>
		</div>
	)
}
