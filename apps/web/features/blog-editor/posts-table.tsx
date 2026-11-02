"use client"

import {
	flexRender,
	functionalUpdate,
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type PaginationState,
	type RowSelectionState,
	type SortingState,
	type Updater,
	useReactTable,
} from "@tanstack/react-table"
import { Button } from "@workspace/ui/components/button"
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@workspace/ui/components/dialog"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@workspace/ui/components/input-group"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@workspace/ui/components/select"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@workspace/ui/components/table"
import {
	ChevronLeftIcon,
	ChevronRightIcon,
	ChevronsLeftIcon,
	ChevronsRightIcon,
	SearchIcon,
	XIcon,
} from "lucide-react"
import Link from "next/link"
import { useMemo, useOptimistic, useState, useTransition } from "react"
import { type PublishManyResult, publishPostsAction, setPostsIndexedAction } from "./actions"
import { POST_COLUMNS } from "./post-columns"
import {
	DEFAULT_VIEW,
	filterPosts,
	type IndexedFilter,
	isFiltered,
	PAGE_SIZES,
	type PostRow,
	type PostView,
	tagsOf,
	viewToSearch,
} from "./post-filters"
import { TagFilter } from "./tag-filter"

type Option<T extends string> = { value: T; label: string }

const STATUSES = [
	{ value: "all", label: "All statuses" },
	{ value: "published", label: "Published" },
	{ value: "draft", label: "Draft" },
] satisfies Option<PostView["status"]>[]

const INDEXED = [
	{ value: "all", label: "Indexed or not" },
	{ value: "indexed", label: "Indexed" },
	{ value: "not-indexed", label: "Not indexed" },
] satisfies Option<IndexedFilter>[]

const SIZES = PAGE_SIZES.map((size) => ({ value: String(size), label: String(size) }))

function FilterSelect<T extends string>({
	label,
	value,
	options,
	onChange,
}: {
	label: string
	value: T
	options: Option<T>[]
	onChange: (value: T) => void
}) {
	return (
		<Select
			items={options}
			value={value}
			onValueChange={(next) => {
				if (next !== null) onChange(next)
			}}
		>
			<SelectTrigger aria-label={label}>
				<SelectValue />
			</SelectTrigger>
			<SelectContent alignItemWithTrigger={false} align="start">
				{options.map((option) => (
					<SelectItem key={option.value} value={option.value}>
						{option.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	)
}

/** Search, filters, sorting, paging and bulk actions over the posts list. */
export function PostsTable({ posts, initialView }: { posts: PostRow[]; initialView: PostView }) {
	const [view, setView] = useState(initialView)
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
	const [confirming, setConfirming] = useState(false)
	const [result, setResult] = useState<PublishManyResult | null>(null)
	const [pending, startTransition] = useTransition()
	// The switch has to answer the click; the server's refresh follows behind it.
	const [rows, markIndexed] = useOptimistic(
		posts,
		(current, { ids, indexed }: { ids: string[]; indexed: boolean }) =>
			current.map((row) => (ids.includes(row.id) ? { ...row, indexed } : row)),
	)

	const visible = useMemo(() => filterPosts(rows, view), [rows, view])
	// Rows hidden by a filter stay out of bulk actions, even if ticked earlier.
	const chosen = visible.filter((row) => rowSelection[row.id])
	const chosenIds = chosen.map((row) => row.id)
	const drafts = chosen.filter((row) => row.status === "draft")

	const pageCount = Math.max(Math.ceil(visible.length / view.pageSize), 1)
	// A filter or a URL can leave the page past the end of the list.
	const pageIndex = Math.min(view.page, pageCount) - 1
	const sorting: SortingState = [view.sort]
	const pagination: PaginationState = { pageIndex, pageSize: view.pageSize }

	function changeView(patch: Partial<PostView>) {
		const next = { ...view, ...patch }
		setView(next)
		// Survives a refresh or a trip into the editor and back.
		const search = viewToSearch(next)
		window.history.replaceState(null, "", search ? `?${search}` : location.pathname)
	}

	const filter = (patch: Partial<PostView>) => changeView({ ...patch, page: 1 })

	function setIndexed(ids: string[], indexed: boolean) {
		setResult(null)
		startTransition(async () => {
			markIndexed({ ids, indexed })
			await setPostsIndexedAction(ids, indexed)
		})
	}

	function publishChosen() {
		const ids = drafts.map((row) => row.id)
		setConfirming(false)
		setResult(null)
		startTransition(async () => {
			setResult(await publishPostsAction(ids))
			setRowSelection({})
		})
	}

	const table = useReactTable({
		data: visible,
		columns: POST_COLUMNS,
		getRowId: (row) => row.id,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		state: { sorting, pagination, rowSelection },
		enableSortingRemoval: false,
		enableMultiSort: false,
		autoResetPageIndex: false,
		onRowSelectionChange: setRowSelection,
		onSortingChange: (updater: Updater<SortingState>) => {
			const [sort] = functionalUpdate(updater, sorting)
			if (sort) changeView({ sort, page: 1 })
		},
		onPaginationChange: (updater: Updater<PaginationState>) => {
			const next = functionalUpdate(updater, pagination)
			changeView({ page: next.pageIndex + 1, pageSize: next.pageSize })
		},
		meta: { onIndexed: (row, indexed) => setIndexed([row.id], indexed) },
	})

	const firstShown = visible.length === 0 ? 0 : pageIndex * view.pageSize + 1
	const lastShown = Math.min((pageIndex + 1) * view.pageSize, visible.length)

	return (
		<>
			<div className="mt-8 flex flex-col gap-2">
				<InputGroup>
					<InputGroupAddon>
						<SearchIcon />
					</InputGroupAddon>
					<InputGroupInput
						type="search"
						placeholder="Search title, slug, summary or tags"
						aria-label="Search posts"
						value={view.query}
						onChange={(event) => filter({ query: event.target.value })}
					/>
				</InputGroup>
				<div className="flex flex-wrap items-center gap-2">
					<FilterSelect
						label="Filter by status"
						value={view.status}
						options={STATUSES}
						onChange={(status) => filter({ status })}
					/>
					<FilterSelect
						label="Filter by indexed"
						value={view.indexed}
						options={INDEXED}
						onChange={(indexed) => filter({ indexed })}
					/>
					<TagFilter
						tags={tagsOf(rows)}
						value={view.tags}
						onChange={(tags) => filter({ tags })}
					/>
					{isFiltered(view) && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() =>
								filter({
									query: DEFAULT_VIEW.query,
									status: DEFAULT_VIEW.status,
									indexed: DEFAULT_VIEW.indexed,
									tags: DEFAULT_VIEW.tags,
								})
							}
						>
							Clear
						</Button>
					)}
				</div>
			</div>

			{result && <PublishSummary result={result} />}

			<div className="mt-4 overflow-hidden rounded-xl border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((group) => (
							<TableRow key={group.id} className="hover:bg-transparent">
								{group.headers.map((header) => {
									const sorted = header.column.getIsSorted()
									return (
										<TableHead
											key={header.id}
											className="px-3"
											aria-sort={
												sorted === "asc"
													? "ascending"
													: sorted === "desc"
														? "descending"
														: undefined
											}
										>
											{flexRender(
												header.column.columnDef.header,
												header.getContext(),
											)}
										</TableHead>
									)
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows.map((row) => (
							<TableRow
								key={row.id}
								data-state={row.getIsSelected() ? "selected" : undefined}
							>
								{row.getVisibleCells().map((cell) => (
									<TableCell key={cell.id} className="px-3 py-2.5">
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
							</TableRow>
						))}
						{visible.length === 0 && (
							<TableRow>
								<TableCell
									colSpan={POST_COLUMNS.length}
									className="h-24 text-center text-muted-foreground"
								>
									No posts match these filters.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			<div className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-sm text-muted-foreground">
				<p role="status">
					{firstShown}–{lastShown} of {visible.length}
					{visible.length === rows.length ? " posts" : ` filtered from ${rows.length}`}
				</p>
				<div className="flex flex-wrap items-center gap-x-4 gap-y-2">
					<div className="flex items-center gap-2">
						<span>Rows per page</span>
						<FilterSelect
							label="Rows per page"
							value={String(view.pageSize)}
							options={SIZES}
							onChange={(size) => table.setPageSize(Number(size))}
						/>
					</div>
					<span>
						Page {pageIndex + 1} of {pageCount}
					</span>
					<div className="flex items-center gap-1">
						<Button
							variant="outline"
							size="icon-sm"
							aria-label="First page"
							disabled={!table.getCanPreviousPage()}
							onClick={() => table.setPageIndex(0)}
						>
							<ChevronsLeftIcon />
						</Button>
						<Button
							variant="outline"
							size="icon-sm"
							aria-label="Previous page"
							disabled={!table.getCanPreviousPage()}
							onClick={() => table.previousPage()}
						>
							<ChevronLeftIcon />
						</Button>
						<Button
							variant="outline"
							size="icon-sm"
							aria-label="Next page"
							disabled={!table.getCanNextPage()}
							onClick={() => table.nextPage()}
						>
							<ChevronRightIcon />
						</Button>
						<Button
							variant="outline"
							size="icon-sm"
							aria-label="Last page"
							disabled={!table.getCanNextPage()}
							onClick={() => table.setPageIndex(pageCount - 1)}
						>
							<ChevronsRightIcon />
						</Button>
					</div>
				</div>
			</div>

			{chosen.length > 0 && (
				<>
					{/* Room to scroll the pagination out from under the bar. */}
					<div aria-hidden className="h-20" />
					<div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
						<div
							role="toolbar"
							aria-label="Selected posts"
							className="pointer-events-auto flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border bg-popover py-2 pr-2 pl-4 text-popover-foreground shadow-lg transition-[translate,opacity] duration-200 ease-out motion-reduce:transition-none starting:translate-y-4 starting:opacity-0"
						>
							<span aria-live="polite" className="text-sm font-medium">
								{chosen.length} selected
							</span>
							<span aria-hidden className="h-5 w-px bg-line max-sm:hidden" />
							<div className="flex flex-wrap items-center gap-1">
								<Button
									variant="ghost"
									size="sm"
									disabled={pending}
									onClick={() => setIndexed(chosenIds, false)}
								>
									Mark not indexed
								</Button>
								<Button
									variant="outline"
									size="sm"
									disabled={pending}
									onClick={() => setIndexed(chosenIds, true)}
								>
									Mark indexed
								</Button>
								<Button
									size="sm"
									disabled={pending || drafts.length === 0}
									onClick={() => setConfirming(true)}
								>
									Publish{drafts.length > 0 && ` ${drafts.length}`}
								</Button>
								<Button
									variant="ghost"
									size="icon-sm"
									aria-label="Clear selection"
									onClick={() => setRowSelection({})}
								>
									<XIcon />
								</Button>
							</div>
						</div>
					</div>
				</>
			)}

			<Dialog open={confirming} onOpenChange={setConfirming}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							Publish {drafts.length} {drafts.length === 1 ? "post" : "posts"}?
						</DialogTitle>
						<DialogDescription>
							They go live on the blog straight away. Any draft that isn't ready is
							skipped, and you'll see why.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
						<Button onClick={publishChosen}>Publish</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}

function PublishSummary({ result: { published, failed } }: { result: PublishManyResult }) {
	return (
		<div className="mt-4 flex flex-col gap-2">
			{published > 0 && (
				<p role="status" className="rounded-lg bg-accent-muted px-3 py-2 text-sm">
					Published {published} {published === 1 ? "post" : "posts"}.
				</p>
			)}
			{failed.length > 0 && (
				<div
					role="alert"
					className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
				>
					<p>
						{failed.length} {failed.length === 1 ? "post wasn't" : "posts weren't"}{" "}
						published:
					</p>
					<ul className="mt-1 list-inside list-disc">
						{failed.map((failure) => (
							<li key={failure.id}>
								<Link
									href={`/admin/posts/${failure.id}`}
									className="underline underline-offset-2"
								>
									{failure.title}
								</Link>{" "}
								· {failure.reason}
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	)
}
