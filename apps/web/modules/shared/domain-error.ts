/** Base class for rule violations the presentation layer can show to the user as-is. */
export abstract class DomainError extends Error {
	constructor(message: string) {
		super(message)
		this.name = new.target.name
	}
}

/** Field-level problems with user input, keyed by field name. */
export class ValidationError<Field extends string = string> extends DomainError {
	constructor(readonly issues: Partial<Record<Field, string>>) {
		super(Object.values<string | undefined>(issues).filter(Boolean).join(" "))
	}
}

export class NotFoundError extends DomainError {}
