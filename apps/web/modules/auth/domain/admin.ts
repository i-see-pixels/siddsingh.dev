import { DomainError, ValidationError } from "@/modules/shared/domain-error"

/** A signed-in account, as reported by the identity provider. */
export type Identity = {
	id: string
	email: string
	name: string
	/** Whether the provider has confirmed the owner controls `email`. */
	emailVerified: boolean
}

/** Whether the identity claims the configured admin address, verified or not. */
export function hasAdminEmail(identity: Pick<Identity, "email">, adminEmail: string) {
	return normalizeEmail(identity.email) === normalizeEmail(adminEmail)
}

/**
 * The identity provider will sign anyone up under any address, so only the
 * configured address, once verified, is the admin. Without the check an account
 * registered straight with the provider could claim the admin email.
 */
export function isAdmin(identity: Pick<Identity, "email" | "emailVerified">, adminEmail: string) {
	return identity.emailVerified && hasAdminEmail(identity, adminEmail)
}

export function normalizeEmail(email: string) {
	return email.trim().toLowerCase()
}

export const MIN_PASSWORD_LENGTH = 12

export class InvalidCredentialsError extends DomainError {
	constructor() {
		super("That email and password don't match.")
	}
}

export class EmailNotVerifiedError extends DomainError {
	constructor() {
		super("Verify this email address first, with the code or link Neon Auth sent to it.")
	}
}

export class SetupClosedError extends DomainError {
	constructor() {
		super("Admin setup is closed.")
	}
}

export class AuthUnavailableError extends DomainError {
	constructor() {
		super("Sign-in is unavailable right now. Try again shortly.")
	}
}

/** The provider refused to create the account, e.g. because it already exists. */
export class SignUpRejectedError extends DomainError {}

export class PasswordPolicyError extends ValidationError<"password"> {}

export function assertPasswordPolicy(password: string) {
	if (password.length < MIN_PASSWORD_LENGTH)
		throw new PasswordPolicyError({
			password: `Use at least ${MIN_PASSWORD_LENGTH} characters.`,
		})
}
