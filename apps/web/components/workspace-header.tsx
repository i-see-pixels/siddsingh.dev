"use client"

import { Button } from "@workspace/ui/components/button"
import {
	Combobox,
	ComboboxCollection,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxGroup,
	ComboboxInput,
	ComboboxItem,
	ComboboxLabel,
	ComboboxList,
	ComboboxTrigger,
} from "@workspace/ui/components/combobox"
import { InputGroupAddon } from "@workspace/ui/components/input-group"
import { ArrowLeftIcon, SearchIcon } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { BrandMark } from "@/components/brand-mark"
import { ThemeToggle } from "@/components/theme-toggle"
import { tools } from "@/lib/content"

type Tool = (typeof tools)[number]

const toolGroups = [...new Set(tools.map((tool) => tool.category))].map((category) => ({
	value: category,
	items: tools.filter((tool) => tool.category === category),
}))

/** Match the query against a tool's name, category and description. */
function matchesTool(tool: Tool, query: string) {
	const needle = query.trim().toLowerCase()
	return [tool.name, tool.category, tool.description].some((text) =>
		text.toLowerCase().includes(needle),
	)
}

export function WorkspaceHeader() {
	const router = useRouter()
	const { slug } = useParams<{ slug: string }>()
	const current = tools.find((tool) => tool.slug === slug) ?? null

	return (
		<header className="screen-line-bottom sticky top-0 z-50 flex h-14 shrink-0 items-center gap-2 bg-background px-2 sm:px-3">
			<Link href="/" aria-label="siddsingh.dev home" className="text-xl sm:mr-1">
				<BrandMark />
			</Link>
			<span aria-hidden className="h-5 w-px bg-line max-sm:hidden" />
			<Combobox
				items={toolGroups}
				value={current}
				itemToStringLabel={(tool: Tool) => tool.name}
				filter={matchesTool}
				autoHighlight
				onValueChange={(next: Tool | null) => {
					if (next && next.slug !== slug) router.push(`/tools/${next.slug}/workspace`)
				}}
			>
				<ComboboxTrigger
					aria-label="Switch tool"
					className="flex h-8 min-w-0 flex-1 items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:w-60 sm:flex-none dark:bg-input/30 dark:hover:bg-input/50"
				>
					<span className="truncate">{current?.name ?? "Choose a tool"}</span>
				</ComboboxTrigger>
				<ComboboxContent className="w-80">
					<ComboboxInput
						showTrigger={false}
						placeholder="Search tools"
						aria-label="Search tools"
					>
						<InputGroupAddon>
							<SearchIcon />
						</InputGroupAddon>
					</ComboboxInput>
					<ComboboxEmpty>No tools match.</ComboboxEmpty>
					<ComboboxList>
						{(group: (typeof toolGroups)[number]) => (
							<ComboboxGroup key={group.value} items={group.items}>
								<ComboboxLabel>{group.value}</ComboboxLabel>
								<ComboboxCollection>
									{(tool: Tool) => (
										<ComboboxItem key={tool.slug} value={tool}>
											<div className="flex min-w-0 flex-col">
												<span className="truncate">{tool.name}</span>
												<span className="truncate text-xs text-muted-foreground">
													{tool.description}
												</span>
											</div>
										</ComboboxItem>
									)}
								</ComboboxCollection>
							</ComboboxGroup>
						)}
					</ComboboxList>
				</ComboboxContent>
			</Combobox>
			<div className="ml-auto flex items-center gap-1">
				<Button
					variant="ghost"
					size="sm"
					nativeButton={false}
					render={<Link href={`/tools/${slug}`} />}
				>
					<ArrowLeftIcon data-icon="inline-start" />
					<span className="hidden sm:inline">About this tool</span>
					<span className="sr-only sm:hidden">Back to tool page</span>
				</Button>
				<ThemeToggle />
			</div>
		</header>
	)
}
