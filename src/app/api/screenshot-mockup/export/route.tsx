import * as cookie from "cookie"
import { ImageResponse } from "next/og"
import { type NextRequest, NextResponse } from "next/server"

import {
	type ScreenshotImageInput,
	type ServerExportFormat,
	createScreenshotMockupSvg,
	getScreenshotMockupExportSize,
	normalizeScreenshotMockupState,
} from "@/features/tools/screenshot-mockup/server-export"

export const runtime = "nodejs"

const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_OUTPUT_SIDE = 4096
const MAX_OUTPUT_PIXELS = 12_000_000

type ParsedImage = ScreenshotImageInput & {
	contentType: string
}

function isAuthorized(request: NextRequest) {
	const bearerToken = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]
	const configuredToken = process.env.SCREENSHOT_EXPORT_TOKEN || process.env.PAGE_ACCESS_PASSWORD

	if (configuredToken && bearerToken === configuredToken) {
		return true
	}

	const cookieHeader = request.headers.get("cookie") || ""
	const cookies = cookie.parse(cookieHeader)

	return cookies.authToken === "authenticated"
}

function jsonError(message: string, status: number) {
	return NextResponse.json({ error: message }, { status })
}

function unauthorizedResponse() {
	return new NextResponse(null, {
		status: 401,
		headers: {
			"Cache-Control": "no-store",
			"WWW-Authenticate": 'Bearer realm="screenshot-export"',
		},
	})
}

function sanitizeFilename(value: string) {
	const sanitized = value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")

	return sanitized || "screenshot-mockup"
}

function normalizeFormat(value: unknown): ServerExportFormat {
	if (value === "svg") {
		return "svg"
	}

	if (value === "jpg") {
		return "jpg"
	}

	return "png"
}

function normalizeScale(value: unknown) {
	const scale =
		typeof value === "number" ? value : typeof value === "string" ? Number.parseFloat(value) : 1

	if (!Number.isFinite(scale)) {
		return 1
	}

	return Math.min(4, Math.max(0.5, scale))
}

function bufferToDataUrl(buffer: Buffer, contentType: string) {
	return `data:${contentType};base64,${buffer.toString("base64")}`
}

function parseDataUrl(value: string) {
	const match = value.match(/^data:([^;,]+)(;base64)?,([\s\S]*)$/)

	if (!match) {
		return null
	}

	const contentType = match[1].toLowerCase()
	const buffer = match[2]
		? Buffer.from(match[3], "base64")
		: Buffer.from(decodeURIComponent(match[3]))

	return {
		buffer,
		contentType,
	}
}

function parseSvgDimensions(buffer: Buffer) {
	const text = buffer.toString("utf8", 0, Math.min(buffer.length, 4096))
	const svgTag = text.match(/<svg\b[^>]*>/i)?.[0]

	if (!svgTag) {
		return null
	}

	const width = svgTag.match(/\bwidth=["']?([\d.]+)/i)?.[1]
	const height = svgTag.match(/\bheight=["']?([\d.]+)/i)?.[1]

	if (width && height) {
		return {
			width: Math.round(Number(width)),
			height: Math.round(Number(height)),
		}
	}

	const viewBox = svgTag
		.match(/\bviewBox=["']?([\d.\s-]+)/i)?.[1]
		?.trim()
		.split(/\s+/)

	if (viewBox?.length === 4) {
		return {
			width: Math.round(Number(viewBox[2])),
			height: Math.round(Number(viewBox[3])),
		}
	}

	return null
}

function getImageDimensions(buffer: Buffer, contentType: string) {
	if (contentType.includes("png") && buffer.readUInt32BE(0) === 0x89504e47) {
		return {
			width: buffer.readUInt32BE(16),
			height: buffer.readUInt32BE(20),
		}
	}

	if (contentType.includes("gif")) {
		return {
			width: buffer.readUInt16LE(6),
			height: buffer.readUInt16LE(8),
		}
	}

	if (contentType.includes("svg")) {
		return parseSvgDimensions(buffer)
	}

	if (contentType.includes("webp") && buffer.toString("ascii", 0, 4) === "RIFF") {
		const format = buffer.toString("ascii", 12, 16)

		if (format === "VP8X") {
			return {
				width: 1 + buffer.readUIntLE(24, 3),
				height: 1 + buffer.readUIntLE(27, 3),
			}
		}

		if (format === "VP8 ") {
			return {
				width: buffer.readUInt16LE(26) & 0x3fff,
				height: buffer.readUInt16LE(28) & 0x3fff,
			}
		}

		if (format === "VP8L") {
			const bits = buffer.readUInt32LE(21)

			return {
				width: (bits & 0x3fff) + 1,
				height: ((bits >> 14) & 0x3fff) + 1,
			}
		}
	}

	if (contentType.includes("jpeg") || contentType.includes("jpg")) {
		let offset = 2

		while (offset < buffer.length) {
			if (buffer[offset] !== 0xff) {
				offset += 1
				continue
			}

			const marker = buffer[offset + 1]
			const length = buffer.readUInt16BE(offset + 2)
			const isStartOfFrame =
				(marker >= 0xc0 && marker <= 0xc3) ||
				(marker >= 0xc5 && marker <= 0xc7) ||
				(marker >= 0xc9 && marker <= 0xcb) ||
				(marker >= 0xcd && marker <= 0xcf)

			if (isStartOfFrame) {
				return {
					width: buffer.readUInt16BE(offset + 7),
					height: buffer.readUInt16BE(offset + 5),
				}
			}

			offset += 2 + length
		}
	}

	return null
}

async function readFileImage(file: File, fallbackName: string): Promise<ParsedImage> {
	if (!file.type.startsWith("image/")) {
		throw new Error(`${fallbackName} must be an image file.`)
	}

	if (file.size > MAX_IMAGE_BYTES) {
		throw new Error(`${fallbackName} must be 10MB or smaller.`)
	}

	const buffer = Buffer.from(await file.arrayBuffer())
	const dimensions = getImageDimensions(buffer, file.type)

	if (!dimensions) {
		throw new Error(`${fallbackName} dimensions could not be read.`)
	}

	return {
		src: bufferToDataUrl(buffer, file.type),
		contentType: file.type,
		width: dimensions.width,
		height: dimensions.height,
		name: file.name,
	}
}

async function readUrlImage(url: string, fallbackName: string): Promise<ParsedImage> {
	const parsedUrl = new URL(url)

	if (!["http:", "https:"].includes(parsedUrl.protocol)) {
		throw new Error(`${fallbackName} URL must use http or https.`)
	}

	const controller = new AbortController()
	const timeout = setTimeout(() => controller.abort(), 8000)

	try {
		const response = await fetch(parsedUrl, {
			signal: controller.signal,
			headers: {
				"User-Agent": "siddsingh.dev screenshot export",
			},
		})

		if (!response.ok) {
			throw new Error(`${fallbackName} could not be fetched.`)
		}

		const contentType = response.headers.get("content-type")?.split(";")[0] || "image/png"

		if (!contentType.startsWith("image/")) {
			throw new Error(`${fallbackName} URL did not return an image.`)
		}

		const contentLength = Number(response.headers.get("content-length") || 0)

		if (contentLength > MAX_IMAGE_BYTES) {
			throw new Error(`${fallbackName} must be 10MB or smaller.`)
		}

		const buffer = Buffer.from(await response.arrayBuffer())

		if (buffer.byteLength > MAX_IMAGE_BYTES) {
			throw new Error(`${fallbackName} must be 10MB or smaller.`)
		}

		const dimensions = getImageDimensions(buffer, contentType)

		if (!dimensions) {
			throw new Error(`${fallbackName} dimensions could not be read.`)
		}

		return {
			src: bufferToDataUrl(buffer, contentType),
			contentType,
			width: dimensions.width,
			height: dimensions.height,
			name: parsedUrl.pathname.split("/").pop() || fallbackName,
		}
	} finally {
		clearTimeout(timeout)
	}
}

async function readStringImage(value: string, fallbackName: string): Promise<ParsedImage> {
	if (value.startsWith("data:")) {
		const parsed = parseDataUrl(value)

		if (!parsed || !parsed.contentType.startsWith("image/")) {
			throw new Error(`${fallbackName} must be an image data URL.`)
		}

		if (parsed.buffer.byteLength > MAX_IMAGE_BYTES) {
			throw new Error(`${fallbackName} must be 10MB or smaller.`)
		}

		const dimensions = getImageDimensions(parsed.buffer, parsed.contentType)

		if (!dimensions) {
			throw new Error(`${fallbackName} dimensions could not be read.`)
		}

		return {
			src: value,
			contentType: parsed.contentType,
			width: dimensions.width,
			height: dimensions.height,
			name: fallbackName,
		}
	}

	return readUrlImage(value, fallbackName)
}

async function parseJsonPayload(request: NextRequest) {
	const body = await request.json()

	if (!body || typeof body !== "object" || Array.isArray(body)) {
		throw new Error("Request body must be a JSON object.")
	}

	const payload = body as Record<string, unknown>
	const imageValue = payload.image ?? payload.imageUrl ?? payload.imageSrc

	if (typeof imageValue !== "string") {
		throw new Error("Provide image as a data URL or image URL.")
	}

	const backgroundValue =
		payload.backgroundImage ?? payload.backgroundImageUrl ?? payload.backgroundImageSrc
	const image = await readStringImage(imageValue, "image")
	const backgroundImage =
		typeof backgroundValue === "string" && backgroundValue
			? await readStringImage(backgroundValue, "backgroundImage")
			: null

	return {
		image,
		backgroundImage,
		customization: payload.customization ?? payload.options ?? payload.state ?? {},
		format: normalizeFormat(payload.format),
		scale: normalizeScale(payload.scale),
	}
}

async function parseFormPayload(request: NextRequest) {
	const formData = await request.formData()
	const imageValue =
		formData.get("image") ?? formData.get("imageFile") ?? formData.get("imageUrl")

	if (!imageValue) {
		throw new Error("Provide an image file, image data URL, or image URL.")
	}

	const image =
		imageValue instanceof File
			? await readFileImage(imageValue, "image")
			: await readStringImage(String(imageValue), "image")
	const backgroundValue =
		formData.get("backgroundImage") ??
		formData.get("backgroundImageFile") ??
		formData.get("backgroundImageUrl")
	const backgroundImage =
		backgroundValue instanceof File
			? await readFileImage(backgroundValue, "backgroundImage")
			: typeof backgroundValue === "string" && backgroundValue
				? await readStringImage(backgroundValue, "backgroundImage")
				: null
	const optionsValue =
		formData.get("customization") ?? formData.get("options") ?? formData.get("state")
	let customization: unknown = {}

	if (typeof optionsValue === "string" && optionsValue.trim()) {
		customization = JSON.parse(optionsValue)
	}

	return {
		image,
		backgroundImage,
		customization,
		format: normalizeFormat(formData.get("format")),
		scale: normalizeScale(formData.get("scale")),
	}
}

function getSvgDataUrl(svg: string) {
	return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`
}

export async function POST(request: NextRequest) {
	if (!isAuthorized(request)) {
		return unauthorizedResponse()
	}

	try {
		const contentType = request.headers.get("content-type") || ""
		const payload = contentType.includes("multipart/form-data")
			? await parseFormPayload(request)
			: await parseJsonPayload(request)
		const state = normalizeScreenshotMockupState(
			payload.customization,
			payload.image,
			payload.backgroundImage,
		)
		const outputSize = getScreenshotMockupExportSize(state, payload.image, payload.scale)

		if (
			outputSize.width > MAX_OUTPUT_SIDE ||
			outputSize.height > MAX_OUTPUT_SIDE ||
			outputSize.width * outputSize.height > MAX_OUTPUT_PIXELS
		) {
			return jsonError("Requested export is too large. Reduce scale or padding.", 400)
		}

		const svg = createScreenshotMockupSvg({
			image: payload.image,
			backgroundImage: payload.backgroundImage,
			state,
		})
		const filename = `${sanitizeFilename(state.imageName)}-${payload.scale}x.${payload.format}`

		if (payload.format === "svg") {
			return new NextResponse(svg, {
				headers: {
					"Content-Type": "image/svg+xml; charset=utf-8",
					"Content-Disposition": `attachment; filename="${filename}"`,
				},
			})
		}

		if (payload.format === "jpg") {
			return jsonError(
				"JPG export is not available from the server API yet. Use png or svg.",
				400,
			)
		}

		const response = new ImageResponse(
			<img
				alt=""
				src={getSvgDataUrl(svg)}
				style={{
					display: "block",
					width: outputSize.width,
					height: outputSize.height,
				}}
			/>,
			{
				width: outputSize.width,
				height: outputSize.height,
			},
		)

		response.headers.set("Content-Disposition", `attachment; filename="${filename}"`)

		return response
	} catch (error) {
		console.error("Screenshot mockup export failed:", error)

		return jsonError(error instanceof Error ? error.message : "Export failed.", 400)
	}
}
