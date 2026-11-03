"use client"

import type { Column, ColumnDef, RowData } from "@tanstack/react-table"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Switch } from "@workspace/ui/components/switch"
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from "lucide-react"
import Link from "next/link"
import type { PostRow } from "./post-filters"
import { PostThumbnail } from "./post-thumbnail"

declare module "@tanstack/react-table" {
	interface TableMeta<TData extends RowData> {
		onIndexed: (row: TData, indexed: boolean) => void
	}
}

/** Fixed to UTC so the server's render and the browser's agree. */
const date = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" })

const MAX_TAGS_SHOWN = 2

function SortHeader({ column, title }: { column: Column<PostRow>; title: string }) {
	const sorted = column.getIsSorted()
	const Icon =
		sorted === "asc" ? ArrowUpIcon : sorted === "desc" ? ArrowDownIcon : ChevronsUpDownIcon
	return (
		<Button
			variant="ghost"
			size="sm"
			className="-ml-2.5"
			onClick={column.getToggleSortingHandler()}
		>
			{title}
			<Icon data-icon="inline-end" className={sorted ? undefined : "text-muted-foreground"} />
		</Button>
	)
}

/** Defined once, outside the component: a new cell function would remount every cell. */
export const POST_COLUMNS: ColumnDef<PostRow>[] = [
	{
		id: "select",
		enableSorting: false,
		header: ({ table }) => (
			<Checkbox
				aria-label="Select all posts on this page"
				checked={table.getIsAllPageRowsSelected()}
				indeterminate={table.getIsSomePageRowsSelected()}
				onCheckedChange={(on) => table.toggleAllPageRowsSelected(on)}
			/>
		),
		cell: ({ row }) => (
			<Checkbox
				aria-label={`Select ${row.original.title}`}
				checked={row.getIsSelected()}
				onCheckedChange={(on) => row.toggleSelected(on)}
			/>
		),
	},
	{
		id: "cover",
		enableSorting: false,
		header: () => <span className="sr-only">Cover</span>,
		cell: ({ row }) => <PostThumbnail url={row.original.coverImageUrl} />,
	},
	{
		id: "title",
		accessorKey: "title",
		sortingFn: "text",
		sortDescFirst: false,
		header: ({ column }) => <SortHeader column={column} title="Title" />,
		cell: ({ row }) => (
			<Link
				href={`/admin/posts/${row.original.id}`}
				className="flex w-52 flex-col gap-0.5 hover:text-brand xl:w-72"
			>
				<span className="truncate font-medium">{row.original.title}</span>
				<span className="truncate font-mono text-xs text-muted-foreground">
					/blog/{row.original.slug}
				</span>
			</Link>
		),
	},
	{
		id: "status",
		accessorKey: "status",
		sortDescFirst: false,
		header: ({ column }) => <SortHeader column={column} title="Status" />,
		cell: ({ row }) => (
			<Badge variant={row.original.status === "published" ? "default" : "outline"}>
				{row.original.status === "published" ? "Published" : "Draft"}
			</Badge>
		),
	},
	{
		id: "tags",
		enableSorting: false,
		header: "Tags",
		cell: ({ row }) => {
			const { tags } = row.original
			if (tags.length === 0) return <span className="text-muted-foreground">—</span>
			return (
				<div className="flex items-center gap-1" title={tags.join(", ")}>
					{tags.slice(0, MAX_TAGS_SHOWN).map((tag) => (
						<Badge key={tag} variant="secondary" className="max-w-20">
							{/* Text in a flex box won't ellipsise; a block inside it will. */}
							<span className="truncate">{tag}</span>
						</Badge>
					))}
					{tags.length > MAX_TAGS_SHOWN && (
						<span className="text-xs text-muted-foreground">
							+{tags.length - MAX_TAGS_SHOWN}
						</span>
					)}
				</div>
			)
		},
	},
	{
		id: "indexed",
		accessorKey: "indexed",
		sortingFn: "basic",
		header: ({ column }) => <SortHeader column={column} title="Indexed" />,
		cell: ({ row, table }) => (
			<Switch
				size="sm"
				aria-label={`${row.original.title} is indexed`}
				checked={row.original.indexed}
				onCheckedChange={(indexed) => table.options.meta?.onIndexed(row.original, indexed)}
			/>
		),
	},
	{
		id: "published",
		accessorFn: (row) => row.publishedAt?.getTime(),
		sortingFn: "basic",
		// Drafts have no date, whichever way the column is sorted.
		sortUndefined: "last",
		header: ({ column }) => <SortHeader column={column} title="Published" />,
		cell: ({ row }) =>
			row.original.publishedAt ? (
				date.format(row.original.publishedAt)
			) : (
				<span className="text-muted-foreground">—</span>
			),
	},
	{
		id: "edited",
		accessorFn: (row) => row.updatedAt.getTime(),
		sortingFn: "basic",
		header: ({ column }) => <SortHeader column={column} title="Edited" />,
		cell: ({ row }) => date.format(row.original.updatedAt),
	},
]
