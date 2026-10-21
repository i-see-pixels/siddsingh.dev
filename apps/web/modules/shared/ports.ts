export interface Clock {
	now(): Date
}

export interface IdGenerator {
	/** A random UUID. */
	uuid(): string
}
