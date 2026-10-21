import type { Clock, IdGenerator } from "./ports"

export const systemClock: Clock = { now: () => new Date() }

export const cryptoIds: IdGenerator = { uuid: () => crypto.randomUUID() }
