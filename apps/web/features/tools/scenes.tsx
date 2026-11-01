import { cn } from "@workspace/ui/lib/utils"
import {
	BracesIcon,
	CoinsIcon,
	HashIcon,
	ImageIcon,
	KeyRoundIcon,
	type LucideIcon,
	ShieldCheckIcon,
	WrenchIcon,
} from "lucide-react"
import type { ComponentType, ReactNode } from "react"

/**
 * Drawings for the tool landing pages. Every scene shares one 760x240 canvas and is cropped
 * from the sides on narrow screens, so x 180 to 580 has to read on its own. Anything outside
 * that band is decoration.
 */

const CHAR_WIDTH = 0.6

const tones = {
	text: "fill-foreground",
	muted: "fill-muted-foreground",
	brand: "fill-brand",
	success: "fill-success",
	destructive: "fill-destructive",
	amber: "fill-amber-600 dark:fill-amber-400",
}

type Tone = keyof typeof tones

/** Monospace text with its width pinned, so highlights line up whatever font loads. */
function Code({
	x,
	y,
	size = 12,
	tone = "text",
	anchor = "start",
	children,
}: {
	x: number
	y: number
	size?: number
	tone?: Tone
	anchor?: "start" | "middle" | "end"
	children: string
}) {
	return (
		<text
			x={x}
			y={y}
			fontSize={size}
			textAnchor={anchor}
			textLength={children.length * size * CHAR_WIDTH}
			lengthAdjust="spacingAndGlyphs"
			xmlSpace="preserve"
			className={cn("font-mono", tones[tone])}
		>
			{children}
		</text>
	)
}

/** A line of differently coloured code, laid out left to right from `x`. */
function CodeRun({
	x,
	y,
	size = 12,
	parts,
}: {
	x: number
	y: number
	size?: number
	parts: [text: string, tone?: Tone][]
}) {
	let cursor = x
	return parts.map(([text, tone]) => {
		const start = cursor
		cursor += text.length * size * CHAR_WIDTH
		return (
			<Code key={start} x={start} y={y} size={size} tone={tone}>
				{text}
			</Code>
		)
	})
}

/** Oversized, barely visible character in the side margins. */
function Glyph({ x, children }: { x: number; children: string }) {
	return (
		<text
			x={x}
			y={168}
			fontSize={132}
			textAnchor="middle"
			className="fill-foreground/5 font-mono"
		>
			{children}
		</text>
	)
}

/** Thin-stroked icon in the side margins. */
function SideIcon({ icon: Icon, x }: { icon: LucideIcon; x: number }) {
	return (
		<Icon
			x={x - 48}
			y={72}
			width={96}
			height={96}
			strokeWidth={0.75}
			className="text-muted-foreground/30"
		/>
	)
}

function Card({
	x,
	y,
	width,
	height,
	className,
}: {
	x: number
	y: number
	width: number
	height: number
	className?: string
}) {
	return (
		<rect
			x={x}
			y={y}
			width={width}
			height={height}
			rx={8}
			className={cn("fill-background stroke-border", className)}
		/>
	)
}

/** Arrow head marker. Each scene that uses it renders one with its own id. */
function ArrowMarker({ id }: { id: string }) {
	return (
		<defs>
			<marker
				id={id}
				viewBox="0 0 8 8"
				refX={7}
				refY={4}
				markerWidth={8}
				markerHeight={8}
				orient="auto"
			>
				<path d="M1 1.5 7 4 1 6.5" className="fill-none stroke-muted-foreground" />
			</marker>
		</defs>
	)
}

function RegexScene() {
	const languages = ["JS", "PY", "GO", "JAVA", "RUST", "PHP"]
	return (
		<>
			<Glyph x={82}>^</Glyph>
			<Glyph x={678}>$</Glyph>
			<Card x={244} y={22} width={272} height={44} />
			<CodeRun
				x={271}
				y={49}
				size={14}
				parts={[
					["/", "muted"],
					["(\\d{4})", "brand"],
					["-", "muted"],
					["(\\d{2})", "success"],
					["-", "muted"],
					["(\\d{2})", "amber"],
					["/g", "muted"],
				]}
			/>
			<g fill="none" strokeDasharray="3 3">
				<path d="M309 66C309 100 294 96 294 126" className="stroke-brand" />
				<path d="M376 66C376 100 332 96 332 126" className="stroke-success" />
				<path d="M443 66C443 100 361 96 361 126" className="stroke-amber-500" />
			</g>
			<rect x={272} y={128} width={101} height={28} rx={5} className="fill-brand/10" />
			<rect x={464} y={128} width={101} height={28} rx={5} className="fill-brand/10" />
			<CodeRun
				x={197.6}
				y={148}
				size={16}
				parts={[
					["release ", "muted"],
					["2026", "brand"],
					["-", "muted"],
					["10", "success"],
					["-", "muted"],
					["31", "amber"],
					[" · hotfix ", "muted"],
					["2026-11-07", "brand"],
				]}
			/>
			{languages.map((language, index) => {
				const x = 200 + index * 61
				return (
					<g key={language}>
						<rect
							x={x}
							y={184}
							width={53}
							height={26}
							rx={13}
							className="fill-background stroke-border"
						/>
						<Code x={x + 26.5} y={201} size={11} tone="muted" anchor="middle">
							{language}
						</Code>
					</g>
				)
			})}
		</>
	)
}

function CronScene() {
	const fields = [
		["0", "minute"],
		["9", "hour"],
		["*", "day"],
		["*", "month"],
		["1-5", "weekday"],
	]
	const week = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
	const minutes = Array.from({ length: 60 }, (_, minute) => minute)
	const monthDays = Array.from({ length: 35 }, (_, day) => day)
	return (
		<>
			<g transform="translate(92 120)">
				<circle r={68} className="fill-none stroke-border" />
				{minutes.map((minute) => (
					<line
						key={minute}
						y1={-68}
						y2={minute % 5 === 0 ? -60 : -64}
						transform={`rotate(${minute * 6})`}
						className="stroke-muted-foreground/30"
					/>
				))}
				<line y2={-50} className="stroke-muted-foreground/50" strokeWidth={1.5} />
				<line x2={-36} className="stroke-brand/60" strokeWidth={2} />
			</g>
			{monthDays.map((day) => (
				<rect
					key={day}
					x={610 + (day % 7) * 18}
					y={72 + Math.floor(day / 7) * 18}
					width={12}
					height={12}
					rx={3}
					className={day % 7 < 5 ? "fill-brand/20" : "fill-muted-foreground/10"}
				/>
			))}
			{fields.map(([value = "", label = ""], index) => {
				const x = 200 + index * 74
				return (
					<g key={label}>
						<Card x={x} y={26} width={64} height={56} />
						<Code x={x + 32} y={62} size={20} tone="brand" anchor="middle">
							{value}
						</Code>
						<Code x={x + 32} y={102} size={11} tone="muted" anchor="middle">
							{label}
						</Code>
					</g>
				)
			})}
			<line x1={200} y1={168} x2={560} y2={168} className="stroke-border" />
			{week.map((day, index) => {
				const x = 216 + index * 54.6
				const runs = index < 5
				return (
					<g key={day}>
						<circle
							cx={x}
							cy={168}
							r={runs ? 6 : 4}
							className={runs ? "fill-brand" : "fill-background stroke-border"}
						/>
						<Code x={x} y={196} size={11} tone="muted" anchor="middle">
							{day}
						</Code>
						{runs && (
							<Code x={x} y={150} size={10} tone="brand" anchor="middle">
								09:00
							</Code>
						)}
					</g>
				)
			})}
		</>
	)
}

function JsonScene() {
	return (
		<>
			<Glyph x={82}>{"{"}</Glyph>
			<Glyph x={678}>{"}"}</Glyph>
			<Card x={204} y={18} width={352} height={204} />
			<line x1={240} y1={18} x2={240} y2={222} className="stroke-border" />
			{[1, 2, 3, 4, 5, 6, 7].map((line) => (
				<Code key={line} x={222} y={21 + line * 26} tone="muted" anchor="middle">
					{String(line)}
				</Code>
			))}
			<rect x={243} y={107} width={310} height={24} className="fill-destructive/10" />
			<CodeRun x={252} y={47} parts={[["{", "muted"]]} />
			<CodeRun
				x={252}
				y={73}
				parts={[
					['  "name"', "brand"],
					[": ", "muted"],
					['"sidd"', "success"],
					[",", "muted"],
				]}
			/>
			<CodeRun
				x={252}
				y={99}
				parts={[
					['  "role"', "brand"],
					[": ", "muted"],
					['"engineer"', "success"],
					[",", "muted"],
				]}
			/>
			<CodeRun
				x={252}
				y={125}
				parts={[
					['  "token"', "brand"],
					[": ", "muted"],
					['"[REDACTED]"', "destructive"],
					[",", "muted"],
				]}
			/>
			<CodeRun
				x={252}
				y={151}
				parts={[
					['  "active"', "brand"],
					[": ", "muted"],
					["true", "amber"],
					[",", "muted"],
				]}
			/>
			<CodeRun
				x={252}
				y={177}
				parts={[
					['  "tags"', "brand"],
					[": [", "muted"],
					['"tools"', "success"],
					[", ", "muted"],
					['"ai"', "success"],
					["]", "muted"],
				]}
			/>
			<CodeRun x={252} y={203} parts={[["}", "muted"]]} />
		</>
	)
}

function JwtScene() {
	const parts = [
		{ label: "HEADER", tone: "destructive", lines: ["alg: HS256", "typ: JWT"] },
		{ label: "PAYLOAD", tone: "brand", lines: ["sub: 1042", "exp: in 1h"] },
		{ label: "SIGNATURE", tone: "success", lines: ["key matches", "not forged"] },
	] as const
	return (
		<>
			<SideIcon icon={ShieldCheckIcon} x={92} />
			<SideIcon icon={KeyRoundIcon} x={668} />
			<CodeRun
				x={224.8}
				y={50}
				size={16}
				parts={[
					["eyJhbGci", "destructive"],
					[".", "muted"],
					["eyJzdWIi", "brand"],
					[".", "muted"],
					["SflKxwRJ", "success"],
				]}
			/>
			<g fill="none" strokeDasharray="3 3">
				<path d="M263 60C263 84 256 76 256 100" className="stroke-destructive" />
				<path d="M380 60V100" className="stroke-brand" />
				<path d="M497 60C497 84 504 76 504 100" className="stroke-success" />
			</g>
			{parts.map(({ label, tone, lines }, index) => {
				const x = 200 + index * 124
				return (
					<g key={label}>
						<Card x={x} y={100} width={112} height={104} />
						<Code x={x + 12} y={124} size={10} tone={tone}>
							{label}
						</Code>
						{lines.map((line, row) => (
							<Code key={line} x={x + 12} y={150 + row * 22} size={11} tone="muted">
								{line}
							</Code>
						))}
					</g>
				)
			})}
		</>
	)
}

function DiffScene() {
	const before: [string, Tone?][] = [
		["function serve() {"],
		["  const port = 3000", "destructive"],
		["  listen(port)"],
		['  log("up")', "destructive"],
		["}"],
	]
	const after: [string, Tone?][] = [
		["function serve() {"],
		["  const port = 8080", "success"],
		["  listen(port)"],
		['  log("ready", port)', "success"],
		["}"],
	]
	const pane = (x: number, lines: [string, Tone?][], tint: string) => (
		<g>
			<Card x={x} y={38} width={192} height={164} />
			{lines.map(([line, tone], row) => (
				<g key={line}>
					{tone && (
						<rect
							x={x + 1}
							y={54 + row * 26}
							width={190}
							height={24}
							className={tint}
						/>
					)}
					<Code x={x + 12} y={70 + row * 26} size={11.5} tone={tone ?? "muted"}>
						{line}
					</Code>
				</g>
			))}
		</g>
	)
	return (
		<>
			<Glyph x={82}>−</Glyph>
			<Glyph x={678}>+</Glyph>
			{pane(180, before, "fill-destructive/10")}
			{pane(388, after, "fill-success/15")}
		</>
	)
}

function MermaidScene() {
	const node = (x: number, y: number, label: string, emphasis = false) => (
		<g key={label}>
			<rect
				x={x}
				y={y}
				width={110}
				height={40}
				rx={8}
				className={
					emphasis ? "fill-brand/10 stroke-brand" : "fill-background stroke-border"
				}
			/>
			<Code
				x={x + 55}
				y={y + 24}
				size={12}
				tone={emphasis ? "brand" : "muted"}
				anchor="middle"
			>
				{label}
			</Code>
		</g>
	)
	return (
		<g transform="translate(0 20)">
			<ArrowMarker id="mermaid-arrow" />
			<g fill="none" className="stroke-muted-foreground" markerEnd="url(#mermaid-arrow)">
				<path d="M136 100H184" />
				<path d="M294 100H336" />
				<path d="M424 88C444 88 436 64 462 64" />
				<path d="M424 112C444 112 436 136 462 136" />
				<path d="M572 64H620" />
				<path d="M462 156H239V120" strokeDasharray="3 3" />
			</g>
			{node(26, 80, "Write code")}
			{node(184, 80, "Parse")}
			<path d="M380 66 424 100 380 134 336 100Z" className="fill-background stroke-border" />
			<Code x={380} y={104} size={12} tone="muted" anchor="middle">
				Valid?
			</Code>
			{node(462, 44, "Preview", true)}
			{node(462, 116, "Fix syntax")}
			{node(622, 44, "Export SVG")}
			<Code x={436} y={58} size={10} tone="muted" anchor="middle">
				yes
			</Code>
			<Code x={436} y={150} size={10} tone="muted" anchor="middle">
				no
			</Code>
		</g>
	)
}

function TokenScene() {
	const tokens = ["Summ", "arize", " this", " support", " ticket", " in", " two", " lines"]
	const models = [
		{ name: "Claude", width: 214, tint: "fill-brand" },
		{ name: "GPT", width: 262, tint: "fill-brand/60" },
		{ name: "Gemini", width: 156, tint: "fill-brand/30" },
	]
	let cursor = 192
	return (
		<>
			<SideIcon icon={HashIcon} x={92} />
			<SideIcon icon={CoinsIcon} x={668} />
			{tokens.map((token, index) => {
				const width = token.length * 7.2 + 8
				const x = cursor
				cursor += width + 3
				return (
					<g key={token}>
						<rect
							x={x}
							y={32}
							width={width}
							height={26}
							rx={4}
							className={index % 2 === 0 ? "fill-brand/15" : "fill-success/15"}
						/>
						<Code x={x + 4} y={49}>
							{token}
						</Code>
					</g>
				)
			})}
			<Code x={192} y={84} size={11} tone="muted">
				9 tokens
			</Code>
			{models.map(({ name, width, tint }, index) => {
				const y = 110 + index * 36
				return (
					<g key={name}>
						<Code x={192} y={y + 15} size={12} tone="muted">
							{name}
						</Code>
						<rect x={256} y={y} width={312} height={22} rx={4} className="fill-muted" />
						<rect x={256} y={y} width={width} height={22} rx={4} className={tint} />
					</g>
				)
			})}
		</>
	)
}

function PromptScene() {
	const fields = [
		{ name: "topic", value: "cron jobs", x: 196, tone: "brand" },
		{ name: "audience", value: "new hires", x: 388, tone: "success" },
	] as const
	return (
		<>
			<Glyph x={82}>{"{{"}</Glyph>
			<Glyph x={678}>{"}}"}</Glyph>
			<Card x={196} y={32} width={368} height={56} />
			<rect x={294} y={47} width={78} height={26} rx={4} className="fill-brand/10" />
			<rect x={403} y={47} width={102} height={26} rx={4} className="fill-success/10" />
			<CodeRun
				x={220}
				y={65}
				size={13}
				parts={[
					["Summarize ", "muted"],
					["{{topic}}", "brand"],
					[" for ", "muted"],
					["{{audience}}", "success"],
				]}
			/>
			<g fill="none" strokeDasharray="3 3">
				<path d="M333 73C333 110 284 100 284 138" className="stroke-brand" />
				<path d="M454 73C454 110 476 100 476 138" className="stroke-success" />
			</g>
			{fields.map(({ name, value, x, tone }) => (
				<g key={name}>
					<Card x={x} y={138} width={176} height={68} />
					<Code x={x + 14} y={162} size={11} tone={tone}>
						{name}
					</Code>
					<Code x={x + 14} y={188} size={13}>
						{value}
					</Code>
				</g>
			))}
		</>
	)
}

function SchemaScene() {
	const card = (x: number, title: string, tone: Tone, key: string) => (
		<g>
			<Card x={x} y={40} width={176} height={160} />
			<Code x={x + 14} y={64} size={11} tone={tone}>
				{title}
			</Code>
			<line x1={x} y1={76} x2={x + 176} y2={76} className="stroke-border" />
			<Code x={x + 14} y={100} size={11.5} tone="muted">
				{'"name": "search",'}
			</Code>
			<Code x={x + 14} y={124} size={11.5} tone={tone}>
				{`"${key}": {`}
			</Code>
			<Code x={x + 14} y={148} size={11.5} tone="muted">
				{'  "type": "object"'}
			</Code>
			<Code x={x + 14} y={172} size={11.5} tone="muted">
				{"}"}
			</Code>
		</g>
	)
	return (
		<>
			<SideIcon icon={WrenchIcon} x={92} />
			<SideIcon icon={BracesIcon} x={668} />
			<ArrowMarker id="schema-arrow" />
			{card(180, "ANTHROPIC", "brand", "input_schema")}
			{card(404, "OPENAI", "success", "parameters")}
			<g fill="none" className="stroke-muted-foreground" markerEnd="url(#schema-arrow)">
				<path d="M361 108H400" />
				<path d="M399 132H360" />
			</g>
		</>
	)
}

function ScreenshotScene() {
	return (
		<>
			<defs>
				<linearGradient id="screenshot-backdrop" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0" stopColor="var(--brand)" stopOpacity={0.35} />
					<stop offset="1" stopColor="var(--success)" stopOpacity={0.3} />
				</linearGradient>
			</defs>
			<SideIcon icon={ImageIcon} x={92} />
			<g>
				<rect
					x={600}
					y={84}
					width={136}
					height={32}
					rx={8}
					className="fill-background stroke-border"
				/>
				<Code x={668} y={104} size={12} tone="muted" anchor="middle">
					shot.png
				</Code>
				<rect
					x={600}
					y={124}
					width={136}
					height={32}
					rx={8}
					className="fill-background stroke-border"
				/>
				<Code x={668} y={144} size={12} tone="muted" anchor="middle">
					shot.jpg
				</Code>
			</g>
			<rect
				x={184}
				y={16}
				width={392}
				height={208}
				rx={14}
				fill="url(#screenshot-backdrop)"
			/>
			<Card x={224} y={40} width={312} height={168} className="stroke-foreground/10" />
			<line x1={224} y1={66} x2={536} y2={66} className="stroke-border" />
			{[238, 252, 266].map((cx, index) => (
				<circle
					key={cx}
					cx={cx}
					cy={53}
					r={4}
					className={
						["fill-destructive/70", "fill-amber-500/70", "fill-success/70"][index]
					}
				/>
			))}
			<rect x={288} y={47} width={184} height={12} rx={6} className="fill-muted" />
			<rect x={244} y={84} width={124} height={12} rx={3} className="fill-foreground/70" />
			<rect
				x={244}
				y={104}
				width={96}
				height={8}
				rx={3}
				className="fill-muted-foreground/30"
			/>
			<rect
				x={244}
				y={118}
				width={108}
				height={8}
				rx={3}
				className="fill-muted-foreground/30"
			/>
			<rect x={244} y={140} width={56} height={18} rx={5} className="fill-brand" />
			<path
				d="M392 188V150L420 164 448 126 476 140 516 92V188Z"
				className="fill-brand/15 stroke-brand"
			/>
		</>
	)
}

export const toolScenes: Record<string, ComponentType> = {
	"cron-expression": CronScene,
	"diff-checker": DiffScene,
	"json-formatter": JsonScene,
	"jwt-decoder": JwtScene,
	"llm-token-cost": TokenScene,
	"mermaid-previewer": MermaidScene,
	"prompt-playground": PromptScene,
	"regex-tester": RegexScene,
	"screenshot-mockup": ScreenshotScene,
	"tool-schema-converter": SchemaScene,
}

/** The drawing for a tool. Decorative: the page text says the same thing. */
export function ToolScene({ slug, className }: { slug: string; className?: string }): ReactNode {
	const Scene = toolScenes[slug]
	if (!Scene) return null
	return (
		<svg
			viewBox="0 0 760 240"
			preserveAspectRatio="xMidYMid slice"
			aria-hidden="true"
			focusable="false"
			className={className}
		>
			<Scene />
		</svg>
	)
}
