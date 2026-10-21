import type { Clock, IdGenerator } from "@/modules/shared/ports"
import { assertUploadable, type Media, type MediaUpload, mediaPathname } from "../domain/media"

export interface MediaStorage {
	/** Stores the file publicly and returns where it is served from. */
	put(
		pathname: string,
		data: Blob,
		contentType: string,
	): Promise<{ url: string; pathname: string }>
}

export interface MediaRepository {
	create(media: Omit<Media, "id" | "createdAt">): Promise<Media>
}

export class UploadMedia {
	constructor(
		private readonly storage: MediaStorage,
		private readonly media: MediaRepository,
		private readonly ids: IdGenerator,
		private readonly clock: Clock,
	) {}

	async execute(upload: MediaUpload): Promise<Media> {
		assertUploadable(upload)
		const pathname = mediaPathname(this.ids.uuid(), upload.contentType, this.clock.now())
		const stored = await this.storage.put(pathname, upload.data, upload.contentType)
		return this.media.create({
			url: stored.url,
			pathname: stored.pathname,
			contentType: upload.contentType,
			size: upload.size,
			alt: upload.alt.trim(),
		})
	}
}
