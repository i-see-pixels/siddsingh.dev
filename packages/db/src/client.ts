import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema"

/** Neon over HTTP: one round trip per query, no pool to manage in serverless functions. */
export function createDb(databaseUrl: string) {
	return drizzle({ client: neon(databaseUrl), schema, casing: "snake_case" })
}

export type Database = ReturnType<typeof createDb>
