import { readFileSync } from "node:fs"
import path from "node:path"

// Installed versions for the footer's Stack field, read at build time.
// Paths are read directly (not imported) because package `exports` maps
// don't expose package.json, and some of these are dependencies of packages/ui.
const packages = [
	{ name: "next", dir: "node_modules/next" },
	{ name: "react", dir: "node_modules/react" },
	{ name: "@base-ui/react", dir: "../../packages/ui/node_modules/@base-ui/react" },
	{ name: "shadcn", dir: "../../packages/ui/node_modules/shadcn" },
	{ name: "tailwindcss", dir: "../../packages/ui/node_modules/tailwindcss" },
]

export function getStack() {
	return packages.flatMap(({ name, dir }) => {
		try {
			const file = path.join(process.cwd(), dir, "package.json")
			const { version } = JSON.parse(readFileSync(file, "utf8")) as { version: string }
			return [`${name}@${version}`]
		} catch {
			return []
		}
	})
}
