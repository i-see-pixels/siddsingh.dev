import { ThemeProvider } from "@/components/theme-provider"
import { fonts } from "@/resources"
import "@/app/globals.css"
import { TooltipProvider } from "@/components/ui/tooltip"
import classNames from "classnames"

export default function ToolsLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html
			suppressHydrationWarning
			lang="en"
			data-scroll-behavior="smooth"
			className={classNames(fonts.sans.variable, fonts.mono.variable)}
		>
			<body className="min-h-screen bg-background text-foreground">
				<ThemeProvider>
					<TooltipProvider>{children}</TooltipProvider>
				</ThemeProvider>
			</body>
		</html>
	)
}
