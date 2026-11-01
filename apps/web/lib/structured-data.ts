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

/** The site itself, for the home page. */
export function websiteJsonLd() {
	return {
		"@context": "https://schema.org",
		"@type": "WebSite",
		"@id": `${absolute("/")}#website`,
		url: absolute("/"),
		name: siteConfig.name,
		description: siteConfig.description,
		inLanguage: "en",
		publisher: author,
	}
}

/** The person behind the site, for the home and about pages. */
export function personJsonLd() {
	return {
		"@context": "https://schema.org",
		...author,
		"@id": `${absolute("/")}#person`,
		jobTitle: "Senior Software Engineer",
		email: `mailto:${siteConfig.email}`,
		address: { "@type": "PostalAddress", addressLocality: "Gurugram", addressCountry: "IN" },
	}
}

/** A free browser tool, for its page under /tools. */
export function webApplicationJsonLd(tool: {
	slug: string
	name: string
	description: string
	category: string
}) {
	return {
		"@context": "https://schema.org",
		"@type": "WebApplication",
		"@id": `${absolute(`/tools/${tool.slug}`)}#app`,
		name: tool.name,
		description: tool.description,
		url: absolute(`/tools/${tool.slug}`),
		applicationCategory:
			tool.category === "Images" ? "DesignApplication" : "DeveloperApplication",
		operatingSystem: "Any (runs in the browser)",
		isAccessibleForFree: true,
		offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
		author,
	}
}

export type Faq = { question: string; answer: string }

export function faqPageJsonLd(faq: readonly Faq[]) {
	return {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		mainEntity: faq.map((item) => ({
			"@type": "Question",
			name: item.question,
			acceptedAnswer: { "@type": "Answer", text: item.answer },
		})),
	}
}

/** Markdown down to plain text: links keep their words, emphasis and code marks go. */
function plainText(markdown: string) {
	return markdown
		.replace(/!\[[^\]]*\]\([^)]*\)/g, "")
		.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
		.replace(/[*_`]+/g, "")
		.replace(/\s+/g, " ")
		.trim()
}

/**
 * The questions under a post's "## FAQ" heading: each "### " heading is a
 * question and the text up to the next heading is its answer.
 */
export function faqFromMarkdown(markdown: string): Faq[] {
	const section = markdown.match(
		/^## (?:FAQ|Frequently asked questions)\s*$([\s\S]*?)(?=^## |(?![\s\S]))/im,
	)
	if (!section?.[1]) return []
	const faq: Faq[] = []
	for (const block of section[1].split(/^### /m).slice(1)) {
		const [heading = "", ...rest] = block.split("\n")
		const answer = plainText(rest.join("\n"))
		if (heading.trim() && answer) faq.push({ question: plainText(heading), answer })
	}
	return faq
}
