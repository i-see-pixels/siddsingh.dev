import type { NeonAuth } from "@neondatabase/auth/next/server"
import type { IdentityProvider } from "../application/auth-use-cases"
import {
	AuthUnavailableError,
	EmailNotVerifiedError,
	type Identity,
	SignUpRejectedError,
} from "../domain/admin"

type NeonUser = { id: string; email: string; name: string; emailVerified: boolean }

function toIdentity(user: NeonUser): Identity {
	return {
		id: user.id,
		email: user.email,
		name: user.name,
		emailVerified: user.emailVerified,
	}
}

type NeonError = { code?: string; message?: string } | null | undefined

/** Network failures are outages, not bad passwords; the SDK marks them with a code. */
function isOutage(error: NeonError) {
	return Boolean(error?.code?.startsWith("NETWORK_"))
}

/** The only replies that mean the credentials themselves were wrong. */
const WRONG_CREDENTIALS = new Set(["INVALID_EMAIL_OR_PASSWORD", "USER_NOT_FOUND"])

export class NeonIdentityProvider implements IdentityProvider {
	constructor(private readonly auth: NeonAuth) {}

	async currentIdentity() {
		const { data } = await this.auth.getSession()
		return data?.user ? toIdentity(data.user) : null
	}

	async signIn(email: string, password: string) {
		const { data, error } = await this.auth.signIn.email({ email, password })
		if (data?.user) return toIdentity(data.user)
		if (!error || WRONG_CREDENTIALS.has(error.code ?? "")) return null
		// Neon Auth checks the password before verification, so only the owner sees this.
		if (error.code === "EMAIL_NOT_VERIFIED") throw new EmailNotVerifiedError()
		// Anything else is a fault, not a wrong password: an outage, or a setting
		// such as the site's domain missing from Neon Auth's trusted domains
		// (INVALID_ORIGIN). Log the code so it shows up in the server logs.
		if (!isOutage(error))
			console.error(
				`Neon Auth refused sign-in: ${error.code ?? "unknown"} ${error.message ?? ""}`,
			)
		throw new AuthUnavailableError()
	}

	async signUp(account: { email: string; password: string; name: string }) {
		const { data, error } = await this.auth.signUp.email(account)
		if (isOutage(error)) throw new AuthUnavailableError()
		if (!data?.user)
			throw new SignUpRejectedError(error?.message || "Could not create the account.")
		return toIdentity(data.user)
	}

	async signOut() {
		await this.auth.signOut()
	}
}
