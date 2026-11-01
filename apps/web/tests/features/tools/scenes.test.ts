import { describe, expect, it } from "vitest"
import { toolIcons } from "@/features/tools/icons"
import { toolScenes } from "@/features/tools/scenes"
import { tools } from "@/lib/content"

describe("tool scenes", () => {
	it("has a drawing for every tool", () => {
		const missing = tools.filter((tool) => !toolScenes[tool.slug]).map((tool) => tool.slug)
		expect(missing).toEqual([])
	})

	it("has its own icon for every tool", () => {
		const icons = tools.map((tool) => toolIcons[tool.slug])
		expect(icons).not.toContain(undefined)
		expect(new Set(icons).size).toBe(tools.length)
	})
})
