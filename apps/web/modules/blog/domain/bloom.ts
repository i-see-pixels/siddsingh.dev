// A Bloom filter over strings. It can say a string is definitely absent, or that
// it might be present; it never misses a string that was added. Pure, so the
// server builds a filter and the browser reads it with the same hashing.

/** Bits and hash count; `bits` is base64 so the filter can cross to the client. */
export type BloomFilter = { bits: string; size: number; hashes: number }

const FNV_PRIME = 0x01000193
const encoder = new TextEncoder()

/** FNV-1a over UTF-8 bytes, started from `seed`. */
function fnv1a(text: string, seed: number) {
	let hash = seed
	for (const byte of encoder.encode(text)) hash = Math.imul(hash ^ byte, FNV_PRIME)
	return hash >>> 0
}

/**
 * The k bit positions for `text`, by double hashing: h1 + i·h2. Two seeds stand
 * in for two independent hashes; h2 is kept odd so it never steps by zero.
 */
function positions(text: string, size: number, hashes: number) {
	const h1 = fnv1a(text, 0x811c9dc5)
	const h2 = fnv1a(text, 0x9747b28c) | 1
	// imul is signed; >>> 0 brings each sum back to an unsigned 32-bit position.
	return Array.from({ length: hashes }, (_, i) => ((h1 + Math.imul(i, h2)) >>> 0) % size)
}

/** Sized for `items` at the given false-positive rate. */
export function createBloomFilter(items: string[], falsePositiveRate = 0.01): BloomFilter {
	const count = Math.max(items.length, 1)
	const size = Math.max(Math.ceil((-count * Math.log(falsePositiveRate)) / Math.LN2 ** 2), 64)
	const hashes = Math.min(Math.max(Math.round((size / count) * Math.LN2), 1), 16)
	const bytes = new Uint8Array(Math.ceil(size / 8))
	for (const item of items)
		for (const bit of positions(item, size, hashes)) {
			const byte = bit >> 3
			bytes[byte] = (bytes[byte] ?? 0) | (1 << (bit & 7))
		}
	const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("")
	return { bits: btoa(binary), size, hashes }
}

/** Decodes once; the returned check runs on every keystroke. */
export function readBloomFilter({ bits, size, hashes }: BloomFilter) {
	const bytes = Uint8Array.from(atob(bits), (char) => char.charCodeAt(0))
	return (text: string) =>
		positions(text, size, hashes).every(
			(bit) => ((bytes[bit >> 3] ?? 0) & (1 << (bit & 7))) !== 0,
		)
}
