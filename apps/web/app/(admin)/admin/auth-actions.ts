"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { type ActionState, toActionState } from "@/lib/action-state"
import { auth } from "@/lib/server/container"

const credentials = z.object({ email: z.string(), password: z.string() })

export async function signInAction(_: ActionState, formData: FormData): Promise<ActionState> {
	const { email, password } = credentials.parse(Object.fromEntries(formData))
	try {
		await auth().signIn.execute(email, password)
	} catch (error) {
		return toActionState(error)
	}
	redirect("/admin")
}

export async function signOutAction() {
	await auth().signOut.execute()
	redirect("/admin/login")
}

const setup = z.object({ name: z.string(), password: z.string(), confirm: z.string() })

export async function createAdminAction(_: ActionState, formData: FormData): Promise<ActionState> {
	const { name, password, confirm } = setup.parse(Object.fromEntries(formData))
	if (password !== confirm)
		return { ok: false, fieldErrors: { confirm: "The passwords don't match." } }
	try {
		const { createAdminAccount, signIn, policy } = auth()
		await createAdminAccount.execute({ name, password })
		await signIn.execute(policy.adminEmail, password)
	} catch (error) {
		return toActionState(error)
	}
	redirect("/admin")
}
