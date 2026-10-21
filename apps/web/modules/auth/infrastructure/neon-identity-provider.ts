import type { NeonAuth } from "@neondatabase/auth/next/server"
import type { IdentityProvider } from "../application/auth-use-cases"
import { AuthUnavailableError, type Identity, SignUpRejectedError } from "../domain/admin"

type NeonUser = { id: string; email: string; name: string; emailVerified: boolean }

function toIdentity(user: NeonUser): Identity {
	return {
		id: user.id,
		email: user.email,
		name: user.name,
		emailVerified: user.emailVerified,
	}
}

/** Network failures are outages, not bad passwords; the SDK marks them with a code. */
function isOutage(error: { code?: string } | null | undefined) {
	return Boolean(error?.code?.startsWith("NETWORK_"))
}

export class NeonIdentityProvider implements IdentityProvider {
	constructor(private readonly auth: NeonAuth) {}

	async currentIdentity() {
		const { data } = await this.auth.getSession()
		return data?.user ? toIdentity(data.user) : null
	}

	async signIn(email: string, password: string) {
		const { data, error } = await this.auth.signIn.email({ email, password })
		if (isOutage(error)) throw new AuthUnavailableError()
		return data?.user ? toIdentity(data.user) : null
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
