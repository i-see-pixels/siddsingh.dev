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
import { Separator } from "@/components/panel"

// Section order: docs/design.md §7 (page templates).
export default function HomePage() {
	return (
		<>
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
