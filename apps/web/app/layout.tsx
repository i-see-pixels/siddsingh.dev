import { TooltipProvider } from "@workspace/ui/components/tooltip"
import type { Metadata } from "next"
import { Architects_Daughter, Geist, Geist_Mono } from "next/font/google"

import "@workspace/ui/globals.css"
import { cn } from "@workspace/ui/lib/utils"
import { Analytics } from "@/components/analytics"
import { ThemeProvider } from "@/components/theme-provider"
import { siteConfig } from "@/lib/site-config"

export const metadata: Metadata = {
	// Resolves relative canonical and Open Graph URLs below this layout.
	metadataBase: new URL(siteConfig.url),
	title: { default: siteConfig.name, template: `%s · ${siteConfig.name}` },
	description: siteConfig.description,
	authors: [{ name: siteConfig.name, url: siteConfig.url }],
	creator: siteConfig.name,
	openGraph: { type: "website", siteName: siteConfig.name, locale: "en_GB" },
	twitter: { card: "summary_large_image", creator: "@creatorsidd" },
	alternates: {
		types: { "application/rss+xml": [{ url: "/blog/rss.xml", title: "Blog" }] },
	},
}

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
	subsets: ["latin"],
	variable: "--font-mono",
})

const fontHandwritten = Architects_Daughter({
	subsets: ["latin"],
	weight: "400",
	variable: "--font-handwritten",
})

const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html
			lang="en"
			suppressHydrationWarning
			className={cn(
				"antialiased",
				fontMono.variable,
				"font-sans",
				geist.variable,
				fontHandwritten.variable,
			)}
		>
			<body>
				<ThemeProvider defaultTheme="light">
					<TooltipProvider>{children}</TooltipProvider>
				</ThemeProvider>
			</body>
			{/* Unset locally, so dev traffic stays out of the reports. */}
			{gaId && <Analytics gaId={gaId} />}
		</html>
	)
}
