import { put } from "@vercel/blob"
import type { Database } from "@workspace/db/client"
import { media } from "@workspace/db/schema"
import type { MediaRepository, MediaStorage } from "../application/upload-media"
import type { Media } from "../domain/media"

export class VercelBlobStorage implements MediaStorage {
	/** `prefix` keeps blog uploads beside the site's other files in the shared store. */
	constructor(
		private readonly token: string | undefined,
		private readonly prefix: string,
	) {}

	async put(pathname: string, data: Blob, contentType: string) {
		if (!this.token) throw new Error("BLOB_READ_WRITE_TOKEN is not set, so uploads are off.")
		const blob = await put(`${this.prefix}/${pathname}`, data, {
			access: "public",
			contentType,
			token: this.token,
			addRandomSuffix: false,
		})
		return { url: blob.url, pathname: blob.pathname }
	}
}

export class DrizzleMediaRepository implements MediaRepository {
	constructor(private readonly db: Database) {}

	async create(values: Omit<Media, "id" | "createdAt">): Promise<Media> {
		const [row] = await this.db.insert(media).values(values).returning()
		if (!row) throw new Error("Insert returned no row.")
		return row
	}
}
