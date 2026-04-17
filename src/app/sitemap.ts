import { baseURL, routes as routesConfig } from "@/resources"
import { getLiveToolEntries } from "@/features/tools/registry"
import { getPosts } from "@/utils/utils"

export default async function sitemap() {
	const blogs = routesConfig["/blog"]
		? getPosts(["src", "app", "blog", "posts"]).map((post) => ({
				url: `${baseURL}/blog/${post.slug}`,
				lastModified: post.metadata.publishedAt,
			}))
		: []

	const works = routesConfig["/work"]
		? getPosts(["src", "app", "work", "projects"]).map((post) => ({
				url: `${baseURL}/work/${post.slug}`,
				lastModified: post.metadata.publishedAt,
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
