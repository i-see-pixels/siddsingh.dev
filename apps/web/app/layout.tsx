import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { Architects_Daughter, Geist, Geist_Mono } from "next/font/google"

import "@workspace/ui/globals.css"
import { cn } from "@workspace/ui/lib/utils"
import { ThemeProvider } from "@/components/theme-provider"

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
		</html>
	)
}
