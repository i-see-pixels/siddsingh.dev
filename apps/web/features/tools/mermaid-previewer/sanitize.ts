import DOMPurify from "dompurify"

/**
 * Mermaid's securityLevel "strict" already sanitises its output, but the code
 * can come from a shared link, so the SVG is cleaned again before it reaches
 * the page. Both configs set htmlLabels: false, so the output is plain SVG.
 */
export function sanitizeSvg(svg: string) {
	return DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } })
}
