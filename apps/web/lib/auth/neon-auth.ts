import { createNeonAuth, type NeonAuth } from "@neondatabase/auth/next/server"
import { authEnv } from "@/lib/env"

let instance: NeonAuth | undefined

/** Neon Auth (managed Better Auth), created on first use so builds don't need its variables. */
export function neonAuth() {
	if (!instance) {
		const env = authEnv()
		instance = createNeonAuth({
			baseUrl: env.NEON_AUTH_BASE_URL,
			cookies: { secret: env.NEON_AUTH_COOKIE_SECRET },
		})
	}
	return instance
}
