import "server-only"
import { redirect } from "next/navigation"
import { cache } from "react"
import { auth } from "@/lib/server/container"

// The proxy only checks that a session cookie exists. These run the real check
// (a live session for ADMIN_EMAIL) and must guard every admin page, action and
// route handler.

export const getCurrentAdmin = cache(() => auth().getCurrentAdmin.execute())

export async function requireAdmin() {
	const admin = await getCurrentAdmin()
	if (!admin) redirect("/admin/login")
	return admin
}
