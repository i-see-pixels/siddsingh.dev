import type { MermaidConfig } from "mermaid"

const FONT = `Geist, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`

/**
 * Soft pastel fills with a stronger border of the same hue, thin rounded
 * shapes and a barely-there shadow. Light and dark are tuned separately so
 * text keeps its contrast on either canvas.
 */
const palettes = {
	light: {
		text: "#1e293b",
		line: "#64748b",
		blue: { fill: "#eff6ff", border: "#3b82f6" },
		green: { fill: "#f0fdf4", border: "#22c55e" },
		purple: { fill: "#faf5ff", border: "#a855f7" },
		amber: { fill: "#fffbeb", border: "#f59e0b" },
		surface: "#ffffff",
		cluster: "#f8fafc",
		clusterBorder: "#cbd5e1",
		muted: "#f1f5f9",
		shadow: "rgb(15 23 42 / 0.10)",
	},
	dark: {
		text: "#e2e8f0",
		line: "#94a3b8",
		blue: { fill: "#172a4d", border: "#60a5fa" },
		green: { fill: "#14301f", border: "#4ade80" },
		purple: { fill: "#2e1a47", border: "#c084fc" },
		amber: { fill: "#3b2d10", border: "#fbbf24" },
		surface: "#0f1623",
		cluster: "#111a2b",
		clusterBorder: "#334155",
		muted: "#1b2538",
		shadow: "rgb(0 0 0 / 0.35)",
	},
}

const pieColors = [
	"#3b82f6",
	"#22c55e",
	"#a855f7",
	"#f59e0b",
	"#ef4444",
	"#06b6d4",
	"#ec4899",
	"#84cc16",
	"#6366f1",
	"#14b8a6",
	"#f97316",
	"#64748b",
]

export function mermaidConfig(dark: boolean): MermaidConfig {
	const p = dark ? palettes.dark : palettes.light

	return {
		startOnLoad: false,
		securityLevel: "strict",
		theme: "base",
		fontFamily: FONT,
		// HTML labels use foreignObject, which taints the canvas used for PNG export.
		htmlLabels: false,
		flowchart: {
			htmlLabels: false,
			padding: 16,
			nodeSpacing: 44,
			rankSpacing: 56,
			curve: "basis",
		},
		sequence: { actorMargin: 56, messageMargin: 36, boxMargin: 8, noteMargin: 12 },
		themeVariables: {
			fontFamily: FONT,
			fontSize: "14px",
			background: p.surface,
			textColor: p.text,
			lineColor: p.line,
			primaryColor: p.blue.fill,
			primaryBorderColor: p.blue.border,
			primaryTextColor: p.text,
			secondaryColor: p.green.fill,
			secondaryBorderColor: p.green.border,
			secondaryTextColor: p.text,
			tertiaryColor: p.purple.fill,
			tertiaryBorderColor: p.purple.border,
			tertiaryTextColor: p.text,
			mainBkg: p.blue.fill,
			nodeBorder: p.blue.border,
			nodeTextColor: p.text,
			clusterBkg: p.cluster,
			clusterBorder: p.clusterBorder,
			edgeLabelBackground: p.surface,
			titleColor: p.text,
			noteBkgColor: p.amber.fill,
			noteBorderColor: p.amber.border,
			noteTextColor: p.text,
			actorBkg: p.blue.fill,
			actorBorder: p.blue.border,
			actorTextColor: p.text,
			actorLineColor: p.clusterBorder,
			signalColor: p.line,
			signalTextColor: p.text,
			labelBoxBkgColor: p.muted,
			labelBoxBorderColor: p.clusterBorder,
			labelTextColor: p.text,
			loopTextColor: p.text,
			activationBkgColor: p.blue.fill,
			activationBorderColor: p.blue.border,
			sequenceNumberColor: dark ? "#0f1623" : "#ffffff",
			attributeBackgroundColorOdd: p.surface,
			attributeBackgroundColorEven: p.cluster,
			transitionColor: p.line,
			stateBkg: p.blue.fill,
			stateLabelColor: p.text,
			compositeBackground: p.cluster,
			...Object.fromEntries(pieColors.map((color, index) => [`pie${index + 1}`, color])),
			pieTitleTextColor: p.text,
			pieSectionTextColor: "#ffffff",
			pieLegendTextColor: p.text,
			pieStrokeColor: p.surface,
			pieOuterStrokeColor: p.clusterBorder,
		},
		themeCSS: `
			.node rect, .node polygon, .node circle, .node ellipse, .node path { stroke-width: 1.5px; }
			.node rect, rect.actor, .cluster rect, rect.note, .labelBox { rx: 10px; ry: 10px; }
			.node rect, .node polygon, .node circle, .node ellipse, rect.actor {
				filter: drop-shadow(0 1px 2px ${p.shadow});
			}
			.cluster rect { stroke-dasharray: 5 4; rx: 14px; ry: 14px; }
			.edgeLabel rect, .labelBkg { rx: 6px; ry: 6px; opacity: 1; }
			.flowchart-link, .edgePath .path, .messageLine0, .messageLine1, .transition { stroke-width: 1.5px; }
			.nodeLabel, .label text, .messageText, .actor text { font-weight: 500; }
			.edgeLabel .label text { font-weight: 400; }
		`,
	}
}
