import type { PostWithContent } from "@/lib/blog"
import { siteConfig } from "@/lib/site-config"

// schema.org data for search and answer engines. Rendered with <JsonLd>.

const absolute = (path: string) => new URL(path, siteConfig.url).href

export const author = {
	"@type": "Person",
	name: siteConfig.name,
	url: siteConfig.url,
	sameAs: [siteConfig.github, siteConfig.x, siteConfig.linkedin],
}

/** The card shown when a post is shared: its cover, or one generated from its title. */
export function socialImage(post: Pick<PostWithContent, "slug" | "cover">) {
	return post.cover?.url ?? absolute(`/og/blog/${post.slug}`)
}

export function blogPostingJsonLd(post: PostWithContent) {
	const url = absolute(`/blog/${post.slug}`)
	return {
		"@context": "https://schema.org",
		"@type": "BlogPosting",
		"@id": `${url}#article`,
		mainEntityOfPage: url,
		url,
		headline: post.seoTitle,
		description: post.seoDescription,
		image: socialImage(post),
		datePublished: post.publishedAt,
		dateModified: post.modifiedAt,
		author,
		publisher: author,
		keywords: post.tags.join(", "),
		wordCount: post.wordCount,
		timeRequired: `PT${post.readingMinutes}M`,
		inLanguage: "en",
		isPartOf: { "@type": "Blog", "@id": `${absolute("/blog")}#blog`, name: "Blog" },
	}
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: items.map((item, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: item.name,
			item: absolute(item.path),
		})),
	}
}
