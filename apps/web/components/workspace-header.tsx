"use client"

import { Button } from "@workspace/ui/components/button"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@workspace/ui/components/select"
import { ArrowLeftIcon } from "lucide-react"
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
			<Select
				items={tools.map((tool) => ({ value: tool.slug, label: tool.name }))}
				value={slug}
				onValueChange={(next) => {
					if (typeof next === "string") router.push(`/tools/${next}/workspace`)
				}}
			>
				<SelectTrigger aria-label="Switch tool" className="min-w-0 font-medium">
					<SelectValue />
				</SelectTrigger>
				<SelectContent align="start">
					{tools.map((tool) => (
						<SelectItem key={tool.slug} value={tool.slug}>
							{tool.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
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
