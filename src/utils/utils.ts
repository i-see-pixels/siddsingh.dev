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

const postsDirectories: Record<string, string> = {
	"src/app/blog/posts": path.join(process.cwd(), "src", "app", "(site)", "blog", "posts"),
	"src/app/work/projects": path.join(process.cwd(), "src", "app", "(site)", "work", "projects"),
}

function resolvePostsDir(customPath: string[]) {
	const postsDir = postsDirectories[customPath.join("/")]

	if (!postsDir) {
		notFound()
	}

	return postsDir
}

export function getPosts(customPath = ["", "", "", ""]) {
	const postsDir = resolvePostsDir(customPath)
	return getMDXData(postsDir)
}
