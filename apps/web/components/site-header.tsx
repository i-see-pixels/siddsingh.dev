import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import Link from "next/link"
import { PulseDot } from "@/components/badges"
import { BrandMark } from "@/components/brand-mark"
import { CommandMenu } from "@/components/command-menu"
import { NavLinks } from "@/components/nav-links"
import { ThemeToggle } from "@/components/theme-toggle"
import { availability, siteConfig } from "@/lib/site-config"

export function SiteHeader() {
	return (
		<header className="sticky top-0 z-50 max-w-screen overflow-x-clip bg-background px-2">
			<div className="screen-line-top screen-line-bottom mx-auto flex h-(--header-height) items-center gap-2 border-x border-line pr-2 pl-4 sm:gap-4 md:max-w-3xl">
				<Link href="/" aria-label={`${siteConfig.name}, home`}>
					<BrandMark className="text-xl" />
				</Link>
				<div className="flex-1" />
				<NavLinks className="max-md:hidden" />
				<div className="flex items-center">
					<Separator
						orientation="vertical"
						className="mr-2 max-md:hidden data-vertical:h-5 data-vertical:self-center bg-line"
					/>
					<CommandMenu hotkey className="max-md:hidden" />
					<Separator
						orientation="vertical"
						className="mx-2 max-md:hidden data-vertical:h-5 data-vertical:self-center bg-line"
					/>
					<ThemeToggle />
					<Button
						size="sm"
						nativeButton={false}
						render={<Link href="/work#contact" />}
						className="ml-2 gap-2 bg-brand text-brand-foreground hover:bg-brand/90"
					>
						{availability.open && <PulseDot className="[&>span]:bg-brand-foreground" />}
						Hire me
					</Button>
				</div>
			</div>
		</header>
	)
}
