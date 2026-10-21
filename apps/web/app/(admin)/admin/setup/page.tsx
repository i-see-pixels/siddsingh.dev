import { notFound } from "next/navigation"
import { auth } from "@/lib/server/container"
import { AuthCard } from "../auth-card"
import { SetupForm } from "./setup-form"

/** One-time admin account creation, open only while ADMIN_SETUP_ENABLED=true. */
export default function SetupPage() {
	const { policy } = auth()
	if (!policy.setupEnabled) notFound()
	return (
		<AuthCard
			title="Create the admin account"
			description="Turn on email verification in Neon Auth first; the account can sign in once its address is verified. Set ADMIN_SETUP_ENABLED back to false afterwards."
		>
			<SetupForm email={policy.adminEmail} />
		</AuthCard>
	)
}
