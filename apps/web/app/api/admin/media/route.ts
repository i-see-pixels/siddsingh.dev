import { getCurrentAdmin } from "@/lib/auth/session"
import { media } from "@/lib/server/container"
import { MediaValidationError } from "@/modules/media/domain/media"

/** Uploads an image from the editor. A route handler, not a server action: actions cap bodies at 1 MB. */
export async function POST(request: Request) {
	if (!(await getCurrentAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 })

	const form = await request.formData()
	const file = form.get("file")
	if (!(file instanceof File)) return Response.json({ error: "Attach a file." }, { status: 400 })

	try {
		const uploaded = await media().uploadMedia.execute({
			data: file,
			contentType: file.type,
			size: file.size,
			alt: String(form.get("alt") ?? ""),
		})
		return Response.json({ url: uploaded.url, alt: uploaded.alt }, { status: 201 })
	} catch (error) {
		if (error instanceof MediaValidationError)
			return Response.json({ error: error.message }, { status: 400 })
		throw error
	}
}
