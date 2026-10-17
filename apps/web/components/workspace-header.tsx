"use client"

import { Button } from "@workspace/ui/components/button"
import { ArrowLeftIcon, ChevronDownIcon } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { BrandMark } from "@/components/brand-mark"
import { ThemeToggle } from "@/components/theme-toggle"
import { tools } from "@/lib/content"

export function WorkspaceHeader() {
	const router = useRouter()
	const { slug } = useParams<{ slug: string }>()

	return (
		<header className="screen-line-bottom sticky top-0 z-50 flex h-14 shrink-0 items-center gap-2 bg-background px-3">
			<Link href="/" aria-label="siddsingh.dev home" className="mr-1 text-xl">
				<BrandMark />
			</Link>
			<span aria-hidden className="h-5 w-px bg-line" />
			<div className="relative min-w-0">
				<select
					aria-label="Switch tool"
					value={slug}
					onChange={(event) => router.push(`/tools/${event.target.value}/workspace`)}
					className="h-8 max-w-full min-w-0 appearance-none truncate rounded-lg border border-input bg-background py-1 pr-8 pl-2.5 text-sm font-medium outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
				>
					{tools.map((tool) => (
						<option key={tool.slug} value={tool.slug}>
							{tool.name}
						</option>
					))}
				</select>
				<ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-muted-foreground" />
			</div>
			<div className="ml-auto flex items-center gap-1">
				<Button
					variant="ghost"
					size="sm"
					nativeButton={false}
					render={<Link href={`/tools/${slug}`} />}
				>
					<ArrowLeftIcon data-icon="inline-start" />
					<span className="hidden sm:inline">About this tool</span>
					<span className="sm:hidden">Back</span>
				</Button>
				<ThemeToggle />
			</div>
		</header>
	)
}
