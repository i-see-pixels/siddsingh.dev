import type { NextRequest } from "next/server"
import { neonAuth } from "@/lib/auth/neon-auth"

// Bounces signed-out visitors to the login page and refreshes the session.
// It is a first line only; lib/auth/session.ts makes the authorisation call.
export default function proxy(request: NextRequest) {
	return neonAuth().middleware({ loginUrl: "/admin/login" })(request)
}

export const config = {
	// /admin and everything below it, except the login and one-time setup pages.
	matcher: ["/admin", "/admin/((?!login|setup).*)"],
}
