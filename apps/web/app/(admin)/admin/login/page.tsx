import { redirect } from "next/navigation"
import { getCurrentAdmin } from "@/lib/auth/session"
import { AuthCard } from "../auth-card"
import { LoginForm } from "./login-form"

export default async function LoginPage() {
	if (await getCurrentAdmin()) redirect("/admin")
	return (
		<AuthCard title="Sign in" description="Admin access for siddsingh.dev.">
			<LoginForm />
		</AuthCard>
	)
}
