import { Contact, SelectedWork, Services } from "@/components/home/sections"
import { PageHeading, Separator } from "@/components/panel"

export default function WorkPage() {
	return (
		<>
			<PageHeading
				tagline="Work"
				title="Freelance work"
				description="Services, selected client projects and how to hire me."
			/>
			<Separator />
			<Services sheet="01" />
			<Separator />
			<SelectedWork sheet="02" />
			<Separator />
			<Contact sheet="03" />
		</>
	)
}
