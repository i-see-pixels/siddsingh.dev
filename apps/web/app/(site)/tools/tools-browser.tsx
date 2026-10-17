"use client"

import { Button } from "@workspace/ui/components/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@workspace/ui/components/input-group"
import { SearchIcon, WrenchIcon } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { IconTile, Tag } from "@/components/badges"
import { tools } from "@/lib/content"

const categories = ["All", ...new Set(tools.map((tool) => tool.category))]

/** Search + category chips over the tool grid. */
export function ToolsBrowser() {
	const [query, setQuery] = useState("")
	const [category, setCategory] = useState("All")

	const needle = query.trim().toLowerCase()
	const visible = tools.filter(
		(tool) =>
			(category === "All" || tool.category === category) &&
			(!needle || `${tool.name} ${tool.description}`.toLowerCase().includes(needle)),
	)

	return (
		<>
			<div className="screen-line-bottom flex flex-col gap-3 p-4">
				<InputGroup>
					<InputGroupAddon>
						<SearchIcon />
					</InputGroupAddon>
					<InputGroupInput
						type="search"
						placeholder="Search tools"
						aria-label="Search tools"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
					/>
				</InputGroup>
				<fieldset className="flex min-w-0 flex-wrap gap-1.5">
					<legend className="sr-only">Category</legend>
					{categories.map((item) => (
						<Button
							key={item}
							size="sm"
							variant={item === category ? "secondary" : "ghost"}
							aria-pressed={item === category}
							onClick={() => setCategory(item)}
							className="font-mono text-xs"
						>
							{item}
						</Button>
					))}
				</fieldset>
			</div>
			<ul className="grid gap-px bg-line sm:grid-cols-2">
				{visible.map((tool) => (
					<li key={tool.slug} className="bg-background">
						<Link
							href={`/tools/${tool.slug}`}
							className="flex h-full flex-col gap-2 p-4 transition-[background-color] ease-out hover:bg-accent-muted"
						>
							<div className="flex items-center gap-3">
								<IconTile>
									<WrenchIcon />
								</IconTile>
								<h2 className="flex-1 text-lg/snug font-medium">{tool.name}</h2>
								<Tag>{tool.category}</Tag>
							</div>
							<p className="text-sm text-muted-foreground">{tool.description}</p>
						</Link>
					</li>
				))}
				{!needle && category === "All" && (
					<li className="flex flex-col justify-center gap-1 bg-background p-4 text-sm text-muted-foreground">
						<p className="font-mono text-xs uppercase">Next up</p>
						<p>
							More tools are on the way: JSON formatter, JWT decoder, colour
							converter.
						</p>
					</li>
				)}
			</ul>
			{visible.length === 0 && (
				<p className="screen-line-top p-4 text-sm text-muted-foreground" role="status">
					No tools match "{query}".
				</p>
			)}
		</>
	)
}
