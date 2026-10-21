"use client"

import { CheckIcon, CopyIcon } from "lucide-react"
import { type ReactNode, useEffect, useState } from "react"

/** A fenced code block: a mono label strip with the language and a copy button. */
export function CodeBlock({
	language,
	text,
	children,
}: {
	language?: string
	/** The plain text to copy. */
	text: string
	children: ReactNode
}) {
	const [copied, setCopied] = useState(false)

	useEffect(() => {
		if (!copied) return
		const timer = setTimeout(() => setCopied(false), 1500)
		return () => clearTimeout(timer)
	}, [copied])

	return (
		<figure className="mt-4 overflow-hidden rounded-xl border bg-card">
			<figcaption className="flex h-9 items-center justify-between border-b border-line bg-muted/40 pr-1.5 pl-4">
				<span className="font-mono text-[0.625rem]/4 font-medium tracking-wider text-muted-foreground uppercase">
					{language ?? "text"}
				</span>
				<button
					type="button"
					onClick={() => {
						navigator.clipboard
							.writeText(text)
							.then(() => setCopied(true))
							.catch(() => {})
					}}
					className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 font-mono text-xs text-muted-foreground transition-colors ease-out hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
				>
					{copied ? (
						<CheckIcon className="size-3.5" />
					) : (
						<CopyIcon className="size-3.5" />
					)}
					{copied ? "Copied" : "Copy"}
				</button>
			</figcaption>
			<pre className="overflow-x-auto p-4 font-mono text-sm leading-6">{children}</pre>
		</figure>
	)
}
