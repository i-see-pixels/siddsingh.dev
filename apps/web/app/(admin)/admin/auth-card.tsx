import Link from "next/link"
import { BrandMark } from "@/components/brand-mark"

/** Centred card shared by the login and setup pages. */
export function AuthCard({
	title,
	description,
	children,
}: {
	title: string
	description: string
	children: React.ReactNode
}) {
	return (
		<main className="dot-grid flex flex-1 items-center justify-center px-4 py-16">
			<div className="w-full max-w-sm rounded-xl border bg-background p-6 shadow-sm">
				<Link href="/" aria-label="siddsingh.dev home" className="text-2xl">
					<BrandMark />
				</Link>
				<h1 className="mt-6 text-xl font-medium tracking-tight">{title}</h1>
				<p className="mt-1 text-sm text-muted-foreground">{description}</p>
				<div className="mt-6">{children}</div>
			</div>
		</main>
	)
}
