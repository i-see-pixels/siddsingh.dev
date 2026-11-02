import { describe, expect, it } from "vitest"
import { createBloomFilter, readBloomFilter } from "@/modules/blog/domain/bloom"

const slugs = (prefix: string, count: number) =>
	Array.from({ length: count }, (_, i) => `${prefix}-${i}`)

describe("Bloom filter", () => {
	it("never misses a slug it was built from", () => {
		const added = slugs("post", 1000)
		const has = readBloomFilter(createBloomFilter(added))
		expect(added.every(has)).toBe(true)
	})

	it("keeps false positives near the target rate", () => {
		const has = readBloomFilter(createBloomFilter(slugs("post", 1000), 0.01))
		const falsePositives = slugs("other", 10_000).filter(has).length
		expect(falsePositives / 10_000).toBeLessThan(0.02)
	})

	it("contains nothing when built from nothing", () => {
		const has = readBloomFilter(createBloomFilter([]))
		expect(slugs("post", 100).some(has)).toBe(false)
	})

	it("builds the same bits for the same slugs", () => {
		expect(createBloomFilter(["a", "b-c"])).toEqual(createBloomFilter(["a", "b-c"]))
	})
})
