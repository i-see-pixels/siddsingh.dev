import { existsSync } from "node:fs"
import { defineConfig } from "drizzle-kit"

// The web app's env file holds DATABASE_URL; share it rather than keeping a
// second copy. Same precedence as Next.js: .env.local before .env.
for (const envFile of ["../../apps/web/.env.local", "../../apps/web/.env"]) {
	if (!process.env.DATABASE_URL && existsSync(envFile)) process.loadEnvFile(envFile)
}

export default defineConfig({
	dialect: "postgresql",
	schema: "./src/schema.ts",
	out: "./migrations",
	casing: "snake_case",
	// Leave Neon Auth's `neon_auth` schema alone.
	schemaFilter: ["public"],
	dbCredentials: { url: process.env.DATABASE_URL ?? "" },
})
