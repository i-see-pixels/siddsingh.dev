import fs from "node:fs"
import path from "node:path"
import { getLiveToolEntries } from "@/features/tools/registry"
import { baseURL, routes as routesConfig } from "@/resources"
import matter from "gray-matter"

function getStaticMdxEntries(postsDir: string) {
	if (!fs.existsSync(postsDir)) {
		return []
	}

	return fs
		.readdirSync(postsDir)
		.filter((file) => path.extname(file) === ".mdx")
		.map((file) => {
			const rawContent = fs.readFileSync(path.join(postsDir, file), "utf-8")
			const { data } = matter(rawContent)

			return {
				slug: path.basename(file, path.extname(file)),
				publishedAt: data.publishedAt,
			}
		})
}

const blogPostsDir = path.join(process.cwd(), "src", "app", "(site)", "blog", "posts")
const workProjectsDir = path.join(process.cwd(), "src", "app", "(site)", "work", "projects")

export default async function sitemap() {
	const blogs = routesConfig["/blog"]
		? getStaticMdxEntries(blogPostsDir).map((post) => ({
				url: `${baseURL}/blog/${post.slug}`,
				lastModified: post.publishedAt,
			}))
		: []

	const works = routesConfig["/work"]
		? getStaticMdxEntries(workProjectsDir).map((post) => ({
				url: `${baseURL}/work/${post.slug}`,
				lastModified: post.publishedAt,
			}))
		: []

	const tools = routesConfig["/tools"]
		? getLiveToolEntries().map((tool) => ({
				url: `${baseURL}${tool.path}`,
				lastModified: new Date().toISOString().split("T")[0],
			}))
		: []

	const activeRoutes = Object.keys(routesConfig).filter(
		(route) => routesConfig[route as keyof typeof routesConfig],
	)

	const routes = activeRoutes.map((route) => ({
		url: `${baseURL}${route !== "/" ? route : ""}`,
		lastModified: new Date().toISOString().split("T")[0],
	}))

	return [...routes, ...blogs, ...works, ...tools]
}
