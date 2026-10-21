import { z } from "zod"

// Variables are read per concern and on first use, so a page that only reads
// posts does not fail when, say, the auth variables are missing.

function reader<Schema extends z.ZodType>(schema: Schema) {
	let value: z.output<Schema> | undefined
	return (): z.output<Schema> => {
		if (value) return value
		const result = schema.safeParse(process.env)
		if (!result.success)
			throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`)
		value = result.data
		return result.data
	}
}

export const databaseEnv = reader(z.object({ DATABASE_URL: z.url() }))

export const authEnv = reader(
	z.object({
		/** Settings → Auth in the Neon Console. */
		NEON_AUTH_BASE_URL: z.url(),
		NEON_AUTH_COOKIE_SECRET: z.string().min(32),
		/** The only account allowed into /admin. */
		ADMIN_EMAIL: z.email(),
		/** "true" opens /admin/setup to create that account; turn it off afterwards. */
		ADMIN_SETUP_ENABLED: z
			.enum(["true", "false"])
			.default("false")
			.transform((value) => value === "true"),
	}),
)

export const blobEnv = reader(z.object({ BLOB_READ_WRITE_TOKEN: z.string().optional() }))
