import type { MetadataRoute } from "next"
import { siteConfig } from "@/lib/site-config"

// Every crawler is welcome, AI and answer-engine bots included, except in the
// admin area and the API.
export default function robots(): MetadataRoute.Robots {
	return {
		rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
		sitemap: new URL("/sitemap.xml", siteConfig.url).href,
		host: siteConfig.url,
	}
}
