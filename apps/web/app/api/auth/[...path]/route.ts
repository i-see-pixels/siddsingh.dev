import { neonAuth } from "@/lib/auth/neon-auth"

// Proxies the browser's auth requests to Neon Auth. Sign-up is refused here:
// the admin account is created once through /admin/setup, which calls Neon Auth
// from the server, so this public endpoint never needs to create accounts.

type Context = { params: Promise<{ path: string[] }> }

const forward =
	(method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH") =>
	async (request: Request, context: Context) => {
		const { path } = await context.params
		if (path[0] === "sign-up") return Response.json({ error: "Not found" }, { status: 404 })
		return neonAuth().handler()[method](request, context)
	}

export const GET = forward("GET")
export const POST = forward("POST")
export const PUT = forward("PUT")
export const DELETE = forward("DELETE")
export const PATCH = forward("PATCH")
