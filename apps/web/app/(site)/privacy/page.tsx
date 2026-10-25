import type { Metadata } from "next"
import { ConsentSettings } from "@/components/consent-settings"
import {
	PageHeading,
	Panel,
	PanelContent,
	PanelHeader,
	PanelTitle,
	Separator,
} from "@/components/panel"
import { siteConfig } from "@/lib/site-config"

export const metadata: Metadata = {
	title: "Privacy",
	description:
		"What siddsingh.dev collects, which cookies it sets, and how to change your choice.",
	alternates: { canonical: "/privacy" },
}

const cookies = [
	{
		name: "_ga",
		purpose: "Tells one visitor's page views apart from another's.",
		expires: "2 years",
	},
	{ name: "_ga_<id>", purpose: "Keeps the state of the current visit.", expires: "2 years" },
]

export default function PrivacyPage() {
	return (
		<>
			<PageHeading
				tagline="Privacy"
				title="The short version"
				description="I use Google Analytics to see which pages people read. It only sets cookies if you accept. There are no ads, and nothing is sold or shared for marketing."
			/>
			<Separator />
			<Panel id="analytics">
				<PanelHeader>
					<PanelTitle sheet="01" anchor="analytics">
						Analytics
					</PanelTitle>
				</PanelHeader>
				<PanelContent className="space-y-3 text-sm text-pretty">
					<p>
						With your consent, Google Analytics records the pages you view, where you
						came from, and your rough location, device and browser. Google processes
						this on my behalf; see{" "}
						<a
							className="link-underline"
							href="https://business.safety.google/privacy/"
							target="_blank"
							rel="noopener"
						>
							Google&apos;s privacy policy
						</a>
						.
					</p>
					<p>
						Until you accept, the site runs Google&apos;s Consent Mode with analytics
						storage denied: no cookies are set, and Google receives only anonymous pings
						with no identifier, which it uses to estimate visit counts. Ad features are
						always off.
					</p>
				</PanelContent>
			</Panel>
			<Separator />
			<Panel id="cookies">
				<PanelHeader>
					<PanelTitle sheet="02" count={cookies.length} anchor="cookies">
						Cookies
					</PanelTitle>
				</PanelHeader>
				<dl className="grid gap-px bg-line sm:grid-cols-2">
					{cookies.map((cookie) => (
						<div key={cookie.name} className="flex flex-col gap-1 bg-background p-4">
							<dt className="font-mono text-sm font-medium">{cookie.name}</dt>
							<dd className="text-sm text-muted-foreground">
								{cookie.purpose} Expires after {cookie.expires}.
							</dd>
						</div>
					))}
				</dl>
				<PanelContent className="screen-line-top text-sm text-pretty text-muted-foreground">
					Both are set only after you accept. Your browser also keeps your theme and this
					choice in local storage; those never leave your device.
				</PanelContent>
			</Panel>
			<Separator />
			<Panel id="choice">
				<PanelHeader>
					<PanelTitle sheet="03" anchor="choice">
						Your choice
					</PanelTitle>
				</PanelHeader>
				<PanelContent className="space-y-3 text-sm">
					<p className="text-pretty">
						Change your mind whenever you like. Declining stops new analytics data; to
						remove cookies already set, clear this site&apos;s cookies in your browser.
					</p>
					<ConsentSettings />
				</PanelContent>
			</Panel>
			<Separator />
			<Panel id="contact">
				<PanelHeader>
					<PanelTitle sheet="04" anchor="contact">
						Questions
					</PanelTitle>
				</PanelHeader>
				<PanelContent className="text-sm text-pretty">
					Want your data deleted, or to ask anything else? Email{" "}
					<a className="link-underline" href={`mailto:${siteConfig.email}`}>
						{siteConfig.email}
					</a>
					.
				</PanelContent>
			</Panel>
		</>
	)
}
