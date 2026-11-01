import type { Metadata } from "next"
import { Hero } from "@/components/home/hero"
import {
	Contact,
	Experience,
	Overview,
	Products,
	ProofStrip,
	SelectedWork,
	Services,
	Tools,
} from "@/components/home/sections"
import { JsonLd } from "@/components/json-ld"
import { Separator } from "@/components/panel"
import { pageMetadata } from "@/lib/seo"
import { personJsonLd, websiteJsonLd } from "@/lib/structured-data"

// Section order: docs/design.md §7 (page templates).
export const metadata: Metadata = pageMetadata({
	title: "Siddhant Singh: Senior Software Engineer & AI Builder",
	description:
		"Senior software engineer in Gurugram building AI agents, web apps and browser extensions. Portfolio, blog and free developer tools.",
	path: "/",
})

export default function HomePage() {
	return (
		<>
			<JsonLd data={websiteJsonLd()} />
			<JsonLd data={personJsonLd()} />
			<Hero />
			<ProofStrip />
			<Overview />
			<Separator />
			<SelectedWork />
			<Separator />
			<Services />
			<Separator />
			<Products />
			<Separator />
			<Experience />
			<Separator />
			<Tools />
			<Separator />
			<Contact />
		</>
	)
}
