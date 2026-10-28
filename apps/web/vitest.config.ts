import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

// Tests live in tests/, mirroring the source tree, and import code through the same
// `@/` alias the app uses.
export default defineConfig({
	resolve: {
		alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
	},
	test: {
		include: ["tests/**/*.test.ts"],
	},
})
