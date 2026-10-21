import { DomainError, ValidationError } from "@/modules/shared/domain-error"

/** What a server action reports back to its form. */
export type ActionState<Field extends string = string> = {
	ok: boolean
	message?: string
	fieldErrors?: Partial<Record<Field, string>>
} | null

/** Turns a domain error into form feedback. Anything else is a bug and is rethrown. */
export function toActionState(error: unknown): NonNullable<ActionState> {
	if (error instanceof ValidationError)
		return { ok: false, message: error.message, fieldErrors: error.issues }
	if (error instanceof DomainError) return { ok: false, message: error.message }
	throw error
}
