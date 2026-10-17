import type { ComponentType } from "react"
import { ScreenshotMockup } from "./screenshot-mockup"

/** Tool UIs by slug. Each one loads lazily (see each tool's index.tsx). */
export const toolComponents: Record<string, ComponentType> = {
	"screenshot-mockup": ScreenshotMockup,
}
