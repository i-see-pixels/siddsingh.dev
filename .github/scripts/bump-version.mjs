// Bumps the version in the root and web package.json files and prints the new
// version. Used by .github/workflows/release.yml when a pull request is merged.
//
// The bump comes from the PR, in this order:
//   1. a label: release:major, release:minor or release:patch
//   2. the PR title, written as a Conventional Commit:
//      "feat!: …" or "fix(api)!: …"  → major
//      "feat: …" or "feat(blog): …"   → minor
//      anything else                  → patch
//
// Try it locally:
//   PR_TITLE="feat: add tags page" PR_LABELS='[]' node .github/scripts/bump-version.mjs --dry-run

// biome-ignore-all lint/suspicious/noUndeclaredEnvVars: run by GitHub Actions, not a Turborepo task.

import { readFileSync, writeFileSync } from "node:fs"

const FILES = ["package.json", "apps/web/package.json"]

export function pickBump(title, labels) {
	for (const bump of ["major", "minor", "patch"])
		if (labels.includes(`release:${bump}`)) return bump
	if (/^\w+(\([^)]*\))?!:/.test(title)) return "major"
	if (/^feat(\([^)]*\))?:/.test(title)) return "minor"
	return "patch"
}

export function nextVersion(version, bump) {
	const [major, minor, patch] = version.split(".").map(Number)
	if ([major, minor, patch].some(Number.isNaN)) throw new Error(`Not a version: ${version}`)
	if (bump === "major") return `${major + 1}.0.0`
	if (bump === "minor") return `${major}.${minor + 1}.0`
	return `${major}.${minor}.${patch + 1}`
}

const title = process.env.PR_TITLE ?? ""
const labels = JSON.parse(process.env.PR_LABELS || "[]")
const dryRun = process.argv.includes("--dry-run")

const root = JSON.parse(readFileSync(FILES[0], "utf8"))
const bump = pickBump(title, labels)
const version = nextVersion(root.version, bump)

if (!dryRun) {
	for (const file of FILES) {
		const json = JSON.parse(readFileSync(file, "utf8"))
		json.version = version
		// Tabs and a final newline, as Biome formats them.
		writeFileSync(file, `${JSON.stringify(json, null, "\t")}\n`)
	}
}

console.error(`${root.version} → ${version} (${bump})`)
console.log(version)
