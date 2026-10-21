import { cn } from "@workspace/ui/lib/utils"
import {
	CheckIcon,
	ExternalLinkIcon,
	InfoIcon,
	LightbulbIcon,
	LinkIcon,
	MessageSquareWarningIcon,
	OctagonAlertIcon,
	TriangleAlertIcon,
} from "lucide-react"
import type { ReactNode } from "react"
import ReactMarkdown, { type Components, type ExtraProps } from "react-markdown"
import rehypeHighlight from "rehype-highlight"
import remarkGfm from "remark-gfm"
import { CodeBlock } from "@/components/code-block"
import { EmbedFrame } from "@/components/embed-frame"
import { MermaidDiagram } from "@/components/mermaid-diagram"
import { resolveEmbed } from "@/modules/blog/domain/embeds"
import { slugify } from "@/modules/blog/domain/slug"

// Renders a post's Markdown with the site's prose styles. Raw HTML in the source
// is not rendered, so a post cannot inject markup or script. Works on the server
// (public pages) and the client (the editor's live preview).

/**
 * A paragraph holding nothing but a bare link (a URL on its own line) becomes an
 * embed when the URL is from a supported provider. A link with its own text,
 * like [watch this](https://youtu.be/…), stays a link.
 */
function embedFromParagraph(node: ExtraProps["node"]) {
	const children = node?.children.filter(
		(child) => !(child.type === "text" && !child.value.trim()),
	)
	const link = children?.length === 1 ? children[0] : undefined
	if (link?.type !== "element" || link.tagName !== "a") return null
	const href = link.properties.href
	const text = link.children.map((child) => (child.type === "text" ? child.value : "")).join("")
	return typeof href === "string" && text === href ? resolveEmbed(href) : null
}

type HastNode = NonNullable<ExtraProps["node"]>["children"][number]

function textOf(node: HastNode | NonNullable<ExtraProps["node"]>): string {
	if (node.type === "text") return node.value
	return "children" in node ? node.children.map(textOf).join("") : ""
}

type HastParent = { children: HastNode[] }

/**
 * Gives each heading an id from its text, "Why SQLite?" → "why-sqlite", so
 * search and answer engines can link to a section. A repeated heading gets a
 * suffix ("example", "example-1"), as on GitHub, so every id stays unique.
 * Headings that already have one (the footnotes label) keep it.
 */
function rehypeHeadingIds() {
	return (tree: HastParent) => {
		const used = new Set<string>()
		const visit = (node: HastNode) => {
			if (node.type !== "element") return
			if (/^h[1-6]$/.test(node.tagName)) {
				const existing = node.properties.id
				if (typeof existing === "string") used.add(existing)
				else {
					const base = slugify(textOf(node))
					let id = base
					for (let n = 1; used.has(id); n++) id = `${base}-${n}`
					if (id) {
						used.add(id)
						node.properties.id = id
					}
				}
			}
			node.children.forEach(visit)
		}
		tree.children.forEach(visit)
	}
}

const headingId = (node: ExtraProps["node"]) => {
	const id = node?.properties.id
	return typeof id === "string" ? id : undefined
}

const CALLOUTS = {
	note: { label: "Note", Icon: InfoIcon, tone: "border-brand/30 bg-brand-muted" },
	tip: { label: "Tip", Icon: LightbulbIcon, tone: "border-success/30 bg-success/10" },
	important: {
		label: "Important",
		Icon: MessageSquareWarningIcon,
		tone: "border-purple-500/30 bg-purple-500/10",
	},
	warning: {
		label: "Warning",
		Icon: TriangleAlertIcon,
		tone: "border-amber-500/30 bg-amber-500/10",
	},
	caution: {
		label: "Caution",
		Icon: OctagonAlertIcon,
		tone: "border-destructive/30 bg-destructive/10",
	},
} as const

const CALLOUT_ICON_TONE: Record<keyof typeof CALLOUTS, string> = {
	note: "text-brand",
	tip: "text-success",
	important: "text-purple-600 dark:text-purple-400",
	warning: "text-amber-600 dark:text-amber-400",
	caution: "text-destructive",
}

type CalloutKind = keyof typeof CALLOUTS

type MdastNode = {
	type: string
	value?: string
	children?: MdastNode[]
	data?: { hProperties?: Record<string, string> }
}

/** Turns "> [!NOTE]" blockquotes into callouts, marking them for the blockquote component. */
function remarkCallouts() {
	return (tree: MdastNode) => {
		const visit = (node: MdastNode) => {
			if (node.type === "blockquote") {
				const text = node.children?.[0]?.children?.[0]
				const match =
					text?.type === "text" ? text.value?.match(/^\[!(\w+)\][ \t]*\n?/) : null
				const kind = match?.[1]?.toLowerCase()
				if (text && match && kind && kind in CALLOUTS) {
					text.value = text.value?.slice(match[0].length)
					node.data = { hProperties: { "data-callout": kind } }
				}
			}
			node.children?.forEach(visit)
		}
		visit(tree)
	}
}

function Heading({
	as: Tag,
	node,
	className,
	children,
}: {
	as: "h2" | "h3" | "h4"
	node: ExtraProps["node"]
	className: string
	children?: ReactNode
}) {
	const id = headingId(node)
	return (
		<Tag
			id={id}
			className={cn("group/heading font-medium tracking-tight text-balance", className)}
		>
			{children}
			{id && (
				<a
					href={`#${id}`}
					aria-label="Link to this section"
					className="ml-2 inline-flex align-middle text-muted-foreground opacity-0 transition-opacity group-hover/heading:opacity-100 focus-visible:opacity-100"
				>
					<LinkIcon className="size-4" />
				</a>
			)}
		</Tag>
	)
}

// The page's title is the only h1, so a "# Heading" in a post renders as an h2.
const components: Components = {
	h1: ({ node, children }) => (
		<Heading as="h2" node={node} className="mt-12 text-2xl first:mt-0">
			{children}
		</Heading>
	),
	h2: ({ node, children }) => (
		<Heading as="h2" node={node} className="mt-12 text-2xl first:mt-0">
			{children}
		</Heading>
	),
	h3: ({ node, children }) => (
		<Heading as="h3" node={node} className="mt-8 text-xl/snug">
			{children}
		</Heading>
	),
	h4: ({ node, children }) => (
		<Heading as="h4" node={node} className="mt-6 text-base/snug">
			{children}
		</Heading>
	),
	p: ({ node, ...props }) => {
		const embed = embedFromParagraph(node)
		return embed ? (
			<EmbedFrame embed={embed} />
		) : (
			<p className="mt-4 leading-7 first:mt-0" {...props} />
		)
	},
	a: ({ node: _, href, children, ...props }) => {
		const external = typeof href === "string" && /^https?:\/\//.test(href)
		const isFootnote = Object.keys(props).some((name) => name.startsWith("data-footnote"))
		const Icon = external ? ExternalLinkIcon : LinkIcon
		return (
			<a
				href={href}
				className="text-brand underline decoration-brand/40 underline-offset-4 transition-[text-decoration-color] ease-out hover:decoration-brand"
				{...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
				{...props}
			>
				{children}
				{!isFootnote && (
					<Icon
						aria-hidden
						className="ml-1 inline size-3.5 align-[-0.125em] no-underline"
					/>
				)}
			</a>
		)
	},
	strong: ({ node: _, ...props }) => (
		<strong className="font-medium text-foreground" {...props} />
	),
	ul: ({ node: _, className, ...props }) => (
		<ul
			className={cn(
				"mt-4 space-y-2 leading-7",
				className?.includes("contains-task-list")
					? "list-none pl-0"
					: "list-disc pl-6 marker:text-muted-foreground",
			)}
			{...props}
		/>
	),
	ol: ({ node: _, ...props }) => (
		<ol
			className="mt-4 list-decimal space-y-2 pl-6 leading-7 marker:text-muted-foreground"
			{...props}
		/>
	),
	li: ({ node: _, className, ...props }) => (
		<li
			className={cn(
				"[&>ol]:mt-2 [&>ul]:mt-2",
				className?.includes("task-list-item") && "flex items-start gap-2.5",
			)}
			{...props}
		/>
	),
	input: ({ node: _, type, checked }) =>
		type === "checkbox" ? (
			<span
				role="img"
				aria-label={checked ? "Done" : "Not done"}
				className={cn(
					"mt-1.5 inline-flex size-4 shrink-0 items-center justify-center rounded border",
					checked
						? "border-brand/50 bg-brand-muted text-brand"
						: "border-muted-foreground/50",
				)}
			>
				{checked && <CheckIcon className="size-3" strokeWidth={3} />}
			</span>
		) : null,
	blockquote: ({ node: _, children, ...props }) => {
		const kind = (props as { "data-callout"?: string })["data-callout"]
		if (kind && kind in CALLOUTS) {
			const { label, Icon, tone } = CALLOUTS[kind as CalloutKind]
			return (
				<aside className={cn("mt-4 rounded-xl border p-4", tone)}>
					<p
						className={cn(
							"flex items-center gap-2 font-mono text-[0.625rem]/4 font-medium tracking-wider uppercase",
							CALLOUT_ICON_TONE[kind as CalloutKind],
						)}
					>
						<Icon className="size-3.5" />
						{label}
					</p>
					<div className="mt-2 [&>p]:mt-2 [&>p:first-child]:mt-0">{children}</div>
				</aside>
			)
		}
		return (
			<blockquote
				className="mt-4 border-l-2 border-brand pl-4 text-muted-foreground [&>p]:mt-3 [&>p:first-child]:mt-0"
				{...props}
			>
				{children}
			</blockquote>
		)
	},
	hr: () => <hr className="my-10 border-line" />,
	code: ({ node: _, className, ...props }) => (
		<code
			className={cn(
				className,
				"font-mono text-[0.875em] [:not(pre)>&]:rounded-md [:not(pre)>&]:border [:not(pre)>&]:bg-muted [:not(pre)>&]:px-1.5 [:not(pre)>&]:py-0.5",
			)}
			{...props}
		/>
	),
	pre: ({ node, children }) => {
		const code = node?.children[0]
		if (code?.type !== "element" || code.tagName !== "code") return <pre>{children}</pre>
		const classes = code.properties.className
		const language = Array.isArray(classes)
			? classes
					.map(String)
					.find((name) => name.startsWith("language-"))
					?.slice("language-".length)
			: undefined
		const text = textOf(code).replace(/\n$/, "")
		if (language === "mermaid") return <MermaidDiagram code={text} />
		return (
			<CodeBlock language={language} text={text}>
				{children}
			</CodeBlock>
		)
	},
	table: ({ node: _, ...props }) => (
		<div className="mt-4 overflow-x-auto rounded-xl border bg-card">
			<table className="w-full border-collapse text-sm" {...props} />
		</div>
	),
	thead: ({ node: _, ...props }) => <thead className="bg-muted/40" {...props} />,
	tr: ({ node: _, ...props }) => (
		<tr className="border-b border-line last:border-b-0" {...props} />
	),
	th: ({ node: _, ...props }) => (
		<th
			className="px-4 py-2.5 text-left font-mono text-[0.625rem]/4 font-medium tracking-wider whitespace-nowrap text-muted-foreground uppercase"
			{...props}
		/>
	),
	td: ({ node: _, ...props }) => <td className="px-4 py-2.5 align-top" {...props} />,
	img: ({ node: _, alt, ...props }) => (
		// biome-ignore lint/performance/noImgElement: Markdown images have no known size.
		<img alt={alt} loading="lazy" className="mt-4 w-full rounded-xl border" {...props} />
	),
	sup: ({ node: _, ...props }) => <sup className="text-[0.7em] [&>a]:no-underline" {...props} />,
	section: ({ node: _, className, ...props }) =>
		className?.includes("footnotes") ? (
			<section
				className="mt-12 border-t border-line pt-4 font-mono text-xs text-muted-foreground [&_h2]:sr-only [&_li]:mt-1 [&_ol]:mt-0 [&_p]:mt-0"
				{...props}
			/>
		) : (
			<section {...props} />
		),
}

export function Markdown({ children }: { children: string }) {
	return (
		<ReactMarkdown
			remarkPlugins={[remarkGfm, remarkCallouts]}
			rehypePlugins={[
				rehypeHeadingIds,
				[rehypeHighlight, { detect: false, ignoreMissing: true }],
			]}
			components={components}
		>
			{children}
		</ReactMarkdown>
	)
}
