import {
	assertPasswordPolicy,
	EmailNotVerifiedError,
	hasAdminEmail,
	type Identity,
	InvalidCredentialsError,
	isAdmin,
	normalizeEmail,
	SetupClosedError,
} from "../domain/admin"

/** The account system that owns users and sessions (Neon Auth in production). */
export interface IdentityProvider {
	/** The signed-in identity for the current request, if any. */
	currentIdentity(): Promise<Identity | null>
	/** Starts a session. Returns null when the credentials are wrong. */
	signIn(email: string, password: string): Promise<Identity | null>
	signUp(account: { email: string; password: string; name: string }): Promise<Identity>
	signOut(): Promise<void>
}

export type AdminPolicy = {
	adminEmail: string
	/** Allows creating the admin account once; switch off after setup. */
	setupEnabled: boolean
}

export class GetCurrentAdmin {
	constructor(
		private readonly identities: IdentityProvider,
		private readonly policy: AdminPolicy,
	) {}

	async execute(): Promise<Identity | null> {
		const identity = await this.identities.currentIdentity()
		return identity && isAdmin(identity, this.policy.adminEmail) ? identity : null
	}
}

export class SignIn {
	constructor(
		private readonly identities: IdentityProvider,
		private readonly policy: AdminPolicy,
	) {}

	/**
	 * Every address goes to the provider, and any other account gets the same
	 * error as a wrong password, so neither the reply nor its timing shows which
	 * email is the admin's.
	 */
	async execute(email: string, password: string): Promise<Identity> {
		const identity = await this.identities.signIn(normalizeEmail(email), password)
		if (identity && isAdmin(identity, this.policy.adminEmail)) return identity
		if (identity) await this.identities.signOut()
		// Only someone holding the admin password gets this hint.
		if (identity && hasAdminEmail(identity, this.policy.adminEmail))
			throw new EmailNotVerifiedError()
		throw new InvalidCredentialsError()
	}
}

export class SignOut {
	constructor(private readonly identities: IdentityProvider) {}

	execute(): Promise<void> {
		return this.identities.signOut()
	}
}

/** Creates the one admin account, for the configured email only. */
export class CreateAdminAccount {
	constructor(
		private readonly identities: IdentityProvider,
		private readonly policy: AdminPolicy,
	) {}

	async execute(account: { name: string; password: string }): Promise<Identity> {
		if (!this.policy.setupEnabled) throw new SetupClosedError()
		assertPasswordPolicy(account.password)
		return this.identities.signUp({
			email: normalizeEmail(this.policy.adminEmail),
			password: account.password,
			name: account.name.trim() || "Admin",
		})
	}
}
