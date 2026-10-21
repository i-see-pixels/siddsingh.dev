"use client"

import { cn } from "@workspace/ui/lib/utils"
import { Maximize2Icon } from "lucide-react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { useEffect, useId, useRef, useState } from "react"
import { mermaidWorkspaceHref } from "@/features/tools/mermaid-previewer/share"
import { mermaidConfig } from "@/features/tools/mermaid-previewer/theme"

type State = { status: "loading" } | { status: "ready"; svg: string } | { status: "error" }

/**
 * A ```mermaid block drawn as a diagram, with a button that opens the same code
 * in the Mermaid previewer. Mermaid is loaded on demand, so posts without a
 * diagram never download it.
 */
export function MermaidDiagram({ code }: { code: string }) {
	const [state, setState] = useState<State>({ status: "loading" })
	const { resolvedTheme } = useTheme()
	const baseId = useId().replace(/:/g, "")
	const counter = useRef(0)

	useEffect(() => {
		let cancelled = false
		;(async () => {
			try {
				const { default: mermaid } = await import("mermaid")
				mermaid.initialize(mermaidConfig(resolvedTheme === "dark"))
				const { svg } = await mermaid.render(`${baseId}-${counter.current++}`, code)
				if (!cancelled) setState({ status: "ready", svg })
			} catch {
				if (!cancelled) setState({ status: "error" })
			}
		})()
		return () => {
			cancelled = true
		}
	}, [code, resolvedTheme, baseId])

	return (
		<figure className="dot-grid relative mt-4 overflow-hidden rounded-xl border bg-card">
			<Link
				href={mermaidWorkspaceHref(code)}
				target="_blank"
				aria-label="Open this diagram in the Mermaid previewer"
				title="Open in Mermaid previewer"
				className="absolute top-2 right-2 z-10 inline-flex size-8 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors ease-out hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
			>
				<Maximize2Icon className="size-4" />
			</Link>
			{state.status === "ready" ? (
				<div
					role="img"
					aria-label="Diagram"
					className="flex justify-center overflow-x-auto p-6 [&>svg]:h-auto [&>svg]:max-w-full"
					// Mermaid runs with securityLevel "strict", which sanitises the SVG it returns.
					// biome-ignore lint/security/noDangerouslySetInnerHtml: sanitised Mermaid output.
					dangerouslySetInnerHTML={{ __html: state.svg }}
				/>
			) : (
				<pre
					className={cn(
						"overflow-x-auto p-4 font-mono text-sm leading-6",
						state.status === "loading" && "animate-pulse text-muted-foreground",
					)}
				>
					{code}
				</pre>
			)}
		</figure>
	)
}
