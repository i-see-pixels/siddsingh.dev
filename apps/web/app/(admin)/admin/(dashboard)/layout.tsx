import { Button } from "@workspace/ui/components/button"
import { ExternalLinkIcon, LogOutIcon } from "lucide-react"
import Link from "next/link"
import { BrandMark } from "@/components/brand-mark"
import { ThemeToggle } from "@/components/theme-toggle"
import { requireAdmin } from "@/lib/auth/session"
import { signOutAction } from "../auth-actions"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
	const admin = await requireAdmin()

	return (
		<>
			<header className="screen-line-bottom sticky top-0 z-50 flex h-14 shrink-0 items-center gap-2 bg-background px-2 sm:px-3">
				<Link href="/" aria-label="siddsingh.dev home" className="text-xl sm:mr-1">
					<BrandMark />
				</Link>
				<span aria-hidden className="h-5 w-px bg-line" />
				<Link href="/admin" className="px-1 text-sm font-medium">
					Posts
				</Link>
				<div className="ml-auto flex items-center gap-1">
					<span className="mr-2 text-sm text-muted-foreground max-md:hidden">
						{admin.email}
					</span>
					<Button
						variant="ghost"
						size="sm"
						nativeButton={false}
						render={<Link href="/blog" target="_blank" />}
					>
						<ExternalLinkIcon data-icon="inline-start" />
						<span className="max-sm:sr-only">View blog</span>
					</Button>
					<ThemeToggle />
					<form action={signOutAction}>
						<Button type="submit" variant="ghost" size="sm">
							<LogOutIcon data-icon="inline-start" />
							<span className="max-sm:sr-only">Sign out</span>
						</Button>
					</form>
				</div>
			</header>
			<main className="flex flex-1 flex-col">{children}</main>
		</>
	)
}
