"use client"

import { cn } from "@workspace/ui/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { navItems } from "@/lib/site-config"

export function NavLinks({ className }: { className?: string }) {
	const pathname = usePathname()

	return (
		<nav className={cn("flex items-center gap-4", className)}>
			{navItems.map((item) => {
				const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
				return (
					<Link
						key={item.href}
						href={item.href}
						aria-current={active ? "page" : undefined}
						className="text-sm font-medium tracking-wide text-muted-foreground transition-[color] hover:text-foreground aria-[current=page]:text-foreground"
					>
						{item.title}
					</Link>
				)
			})}
		</nav>
	)
}
