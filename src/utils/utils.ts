import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"

type Team = {
	name: string
	role: string
	avatar: string
	linkedIn: string
}

type Metadata = {
	title: string
	subtitle?: string
	publishedAt: string
	summary: string
	image?: string
	images: string[]
	tags?: string[]
	team: Team[]
	link?: string
}

import { notFound } from "next/navigation"

function getMDXFiles(dir: string) {
	if (!fs.existsSync(dir)) {
		notFound()
	}

	return fs.readdirSync(dir).filter((file) => path.extname(file) === ".mdx")
}

function readMDXFile(filePath: string) {
	if (!fs.existsSync(filePath)) {
		notFound()
	}

	const rawContent = fs.readFileSync(filePath, "utf-8")
	const { data, content } = matter(rawContent)

	const metadata: Metadata = {
		title: data.title || "",
		subtitle: data.subtitle || "",
		publishedAt: data.publishedAt,
		summary: data.summary || "",
		image: data.image || "",
		images: data.images || [],
		tags: data.tags || [],
		team: data.team || [],
		link: data.link || "",
	}

	return { metadata, content }
}

function getMDXData(dir: string) {
	const mdxFiles = getMDXFiles(dir)
	return mdxFiles.map((file) => {
		const { metadata, content } = readMDXFile(path.join(dir, file))
		const slug = path.basename(file, path.extname(file))

		return {
			metadata,
			slug,
			content,
		}
	})
}

function resolvePostsDir(customPath: string[]) {
	const baseDir = process.cwd()
	const directPath = path.join(baseDir, ...customPath)

	if (fs.existsSync(directPath)) {
		return directPath
	}

	const appIndex = customPath.indexOf("app")
	if (appIndex === -1) {
		notFound()
	}

	const nextSegment = customPath[appIndex + 1]
	if (nextSegment?.startsWith("(") && nextSegment.endsWith(")")) {
		notFound()
	}

	const appDir = path.join(baseDir, ...customPath.slice(0, appIndex + 1))
	if (!fs.existsSync(appDir)) {
		notFound()
	}

	const nestedPath = customPath.slice(appIndex + 1)
	const routeGroupMatch = fs.readdirSync(appDir, { withFileTypes: true }).find((entry) => {
		if (!entry.isDirectory() || !entry.name.startsWith("(") || !entry.name.endsWith(")")) {
			return false
		}

		return fs.existsSync(path.join(appDir, entry.name, ...nestedPath))
	})

	if (!routeGroupMatch) {
		notFound()
	}

	return path.join(appDir, routeGroupMatch.name, ...nestedPath)
}

export function getPosts(customPath = ["", "", "", ""]) {
	const postsDir = resolvePostsDir(customPath)
	return getMDXData(postsDir)
}
