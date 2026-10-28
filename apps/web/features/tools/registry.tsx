import type { ComponentType } from "react"
import { DiffChecker } from "./diff-checker"
import { JsonFormatter } from "./json-formatter"
import { LlmTokenCost } from "./llm-token-cost"
import { MermaidPreviewer } from "./mermaid-previewer"
import { PromptPlayground } from "./prompt-playground"
import { ScreenshotMockup } from "./screenshot-mockup"
import { ToolSchemaConverter } from "./tool-schema-converter"

/** Tool UIs by slug. Each one loads lazily (see each tool's index.tsx). */
export const toolComponents: Record<string, ComponentType> = {
	"screenshot-mockup": ScreenshotMockup,
	"llm-token-cost": LlmTokenCost,
	"prompt-playground": PromptPlayground,
	"tool-schema-converter": ToolSchemaConverter,
	"diff-checker": DiffChecker,
	"mermaid-previewer": MermaidPreviewer,
	"json-formatter": JsonFormatter,
}
