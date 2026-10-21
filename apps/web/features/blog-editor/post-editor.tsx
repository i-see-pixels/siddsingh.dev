"use client"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import { cn } from "@workspace/ui/lib/utils"
import { ArrowLeftIcon, ExternalLinkIcon, Trash2Icon } from "lucide-react"
import Link from "next/link"
import { useDeferredValue, useEffect, useRef, useState, useTransition } from "react"
import { Markdown } from "@/components/markdown"
import { ResizableSplit } from "@/components/resizable-split"
import type { PostField, PostFields } from "@/modules/blog/domain/post"
import { slugify } from "@/modules/blog/domain/slug"
import { deletePostAction, type SavedPost, savePostAction } from "./actions"
import { CoverImageField } from "./cover-image-field"
import { type CommandName, commands, insertImage, type TextEdit } from "./markdown-commands"
import { MarkdownToolbar } from "./markdown-toolbar"
import { SeoFields } from "./seo-fields"
import { useImageUpload } from "./upload-image"

type Fields = PostFields

const SHORTCUTS: Record<string, CommandName> = { b: "bold", i: "italic", k: "link" }

const time = new Intl.DateTimeFormat("en-GB", { timeStyle: "short" })

const parseTags = (text: string) =>
	text
		.split(",")
		.map((tag) => tag.trim())
		.filter(Boolean)

/** Equal apart from tags, which the editor keeps as text in their own state. */
const sameText = (a: Fields, b: Fields) =>
	JSON.stringify({ ...a, tags: [] }) === JSON.stringify({ ...b, tags: [] })

/**
 * Applies an edit through the browser's own text insertion, so Ctrl+Z still
 * works and React sees an ordinary input event.
 */
function applyEdit(textarea: HTMLTextAreaElement, edit: TextEdit) {
	textarea.focus()
	textarea.setSelectionRange(edit.from, edit.to)
	// execCommand is deprecated but is still the only way to keep native undo.
	if (!document.execCommand("insertText", false, edit.insert)) {
		textarea.setRangeText(edit.insert, edit.from, edit.to)
		textarea.dispatchEvent(new Event("input", { bubbles: true }))
	}
	textarea.setSelectionRange(edit.select.start, edit.select.end)
}

export function PostEditor({
	id,
	initial,
	saved: initialSaved,
}: {
	id: string
	initial: Fields
	saved: SavedPost
}) {
	const [fields, setFields] = useState(initial)
	const [tagsText, setTagsText] = useState(initial.tags.join(", "))
	const [baseline, setBaseline] = useState(initial)
	const [saved, setSaved] = useState(initialSaved)
	const [errors, setErrors] = useState<Partial<Record<PostField, string>>>({})
	const [message, setMessage] = useState<string | null>(null)
	const { uploading, upload } = useImageUpload(setMessage)
	const [pending, startTransition] = useTransition()
	// A draft's slug follows its title until the slug is edited by hand.
	const [slugFollowsTitle, setSlugFollowsTitle] = useState(
		initialSaved.status === "draft" &&
			(initial.slug.startsWith("untitled-") || initial.slug === slugify(initial.title)),
	)
	const textarea = useRef<HTMLTextAreaElement>(null)
	const preview = useDeferredValue(fields)

	const current: Fields = { ...fields, tags: parseTags(tagsText) }
	const dirty = JSON.stringify(current) !== JSON.stringify(baseline)
	const published = saved.status === "published"

	useEffect(() => {
		if (!dirty) return
		const warn = (event: BeforeUnloadEvent) => event.preventDefault()
		window.addEventListener("beforeunload", warn)
		return () => window.removeEventListener("beforeunload", warn)
	}, [dirty])

	const update = (patch: Partial<Fields>) => setFields((previous) => ({ ...previous, ...patch }))

	const set = (field: "slug" | "summary" | "content") => (value: string) =>
		update({ [field]: value })

	function setTitle(title: string) {
		setFields((previous) => ({
			...previous,
			title,
			slug: slugFollowsTitle ? slugify(title) || previous.slug : previous.slug,
		}))
	}

	function save(intent: "save" | "publish" | "unpublish") {
		const submitted = current
		const submittedTags = tagsText
		startTransition(async () => {
			const result = await savePostAction(id, submitted, intent)
			if (result?.ok && result.post && result.fields) {
				const stored = result.fields
				setSaved(result.post)
				// Show what was stored (trimmed, lowercased, de-duplicated), unless the
				// writer kept typing while the save ran.
				setFields((previous) =>
					sameText(previous, submitted) ? { ...previous, ...stored } : previous,
				)
				setTagsText((previous) =>
					previous === submittedTags ? stored.tags.join(", ") : previous,
				)
				setBaseline(stored)
				setErrors({})
				setMessage(null)
				if (result.post.status === "published") setSlugFollowsTitle(false)
			} else {
				setErrors(result?.fieldErrors ?? {})
				setMessage(result?.message ?? "Could not save.")
			}
		})
	}

	function runCommand(name: CommandName) {
		const element = textarea.current
		if (!element) return
		const selection = { start: element.selectionStart, end: element.selectionEnd }
		applyEdit(element, commands[name](element.value, selection))
	}

	async function addImage(file: File) {
		const element = textarea.current
		if (!element) return
		// Remember the cursor; the writer may keep typing while the upload runs.
		const selection = { start: element.selectionStart, end: element.selectionEnd }
		setMessage(null)
		const image = await upload(file)
		if (image) applyEdit(element, insertImage(element.value, selection, image.url, image.alt))
	}

	function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
		if (!(event.ctrlKey || event.metaKey) || event.altKey) return
		const command = SHORTCUTS[event.key.toLowerCase()]
		if (!command) return
		event.preventDefault()
		runCommand(command)
	}

	// Ctrl+S saves from anywhere on the page.
	useEffect(() => {
		const onSave = (event: KeyboardEvent) => {
			if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
				event.preventDefault()
				document.getElementById("save-post")?.click()
			}
		}
		window.addEventListener("keydown", onSave)
		return () => window.removeEventListener("keydown", onSave)
	}, [])

	const status = uploading
		? "Uploading image…"
		: pending
			? "Saving…"
			: dirty
				? "Unsaved changes"
				: `Saved ${time.format(new Date(saved.updatedAt))}`

	const editor = (
		<div className="flex h-full flex-col">
			<div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label="All posts"
					nativeButton={false}
					render={<Link href="/admin" />}
				>
					<ArrowLeftIcon />
				</Button>
				<Badge variant={published ? "default" : "outline"}>
					{published ? "Published" : "Draft"}
				</Badge>
				<span aria-live="polite" className="text-xs text-muted-foreground">
					{status}
				</span>
				<div className="ml-auto flex items-center gap-1">
					{published && (
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label="View post"
							nativeButton={false}
							render={<Link href={`/blog/${saved.slug}`} target="_blank" />}
						>
							<ExternalLinkIcon />
						</Button>
					)}
					<DeleteButton id={id} disabled={pending} />
					{published ? (
						<>
							<Button
								variant="outline"
								size="sm"
								disabled={pending}
								onClick={() => save("unpublish")}
							>
								Unpublish
							</Button>
							<Button
								id="save-post"
								size="sm"
								disabled={pending || !dirty}
								onClick={() => save("save")}
							>
								Update
							</Button>
						</>
					) : (
						<>
							<Button
								id="save-post"
								variant="outline"
								size="sm"
								disabled={pending || !dirty}
								onClick={() => save("save")}
							>
								Save draft
							</Button>
							<Button size="sm" disabled={pending} onClick={() => save("publish")}>
								Publish
							</Button>
						</>
					)}
				</div>
			</div>

			{/* `relative` so absolutely positioned content scrolls with the pane (see ResizableSplit). */}
			<div className="relative min-h-0 flex-1 overflow-y-auto">
				<div className="flex flex-col gap-4 p-4">
					{message && (
						<p
							role="alert"
							className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
						>
							{message}
						</p>
					)}
					<Field data-invalid={Boolean(errors.title) || undefined}>
						<input
							aria-label="Title"
							value={fields.title}
							onChange={(event) => setTitle(event.target.value)}
							placeholder="Post title"
							className="w-full bg-transparent text-2xl font-medium tracking-tight outline-none placeholder:text-muted-foreground"
						/>
						<FieldError>{errors.title}</FieldError>
					</Field>
					<div className="grid gap-4 sm:grid-cols-2">
						<Field data-invalid={Boolean(errors.slug) || undefined}>
							<FieldLabel htmlFor="slug">Slug</FieldLabel>
							<Input
								id="slug"
								value={fields.slug}
								onChange={(event) => {
									setSlugFollowsTitle(false)
									set("slug")(event.target.value)
								}}
								className="font-mono"
								aria-invalid={Boolean(errors.slug) || undefined}
							/>
							<FieldError>{errors.slug}</FieldError>
						</Field>
						<Field data-invalid={Boolean(errors.tags) || undefined}>
							<FieldLabel htmlFor="tags">Tags</FieldLabel>
							<Input
								id="tags"
								value={tagsText}
								onChange={(event) => setTagsText(event.target.value)}
								placeholder="ai, nextjs"
								aria-invalid={Boolean(errors.tags) || undefined}
							/>
							<FieldError>{errors.tags}</FieldError>
						</Field>
					</div>
					<Field data-invalid={Boolean(errors.summary) || undefined}>
						<FieldLabel htmlFor="summary">Summary</FieldLabel>
						<Textarea
							id="summary"
							rows={2}
							value={fields.summary}
							onChange={(event) => set("summary")(event.target.value)}
							placeholder="One paragraph, shown under the title, on /blog and in search results."
							aria-invalid={Boolean(errors.summary) || undefined}
						/>
						<FieldError>{errors.summary}</FieldError>
					</Field>
					<CoverImageField
						value={{ url: fields.coverImageUrl, alt: fields.coverImageAlt }}
						onChange={({ url, alt }) =>
							update({ coverImageUrl: url, coverImageAlt: alt })
						}
						onError={setMessage}
						errors={{ url: errors.coverImageUrl, alt: errors.coverImageAlt }}
					/>
					<SeoFields
						title={fields.title}
						summary={fields.summary}
						slug={fields.slug}
						seoTitle={fields.seoTitle}
						seoDescription={fields.seoDescription}
						onChange={update}
						errors={{
							seoTitle: errors.seoTitle,
							seoDescription: errors.seoDescription,
						}}
					/>
				</div>
				<MarkdownToolbar onCommand={runCommand} onImage={addImage} uploading={uploading} />
				{errors.content && (
					<p role="alert" className="px-4 pt-3 text-sm text-destructive">
						{errors.content}
					</p>
				)}
				<textarea
					ref={textarea}
					aria-label="Post content in Markdown"
					value={fields.content}
					onChange={(event) => set("content")(event.target.value)}
					onKeyDown={onKeyDown}
					onPaste={(event) => {
						const file = event.clipboardData.files[0]
						if (file?.type.startsWith("image/")) {
							event.preventDefault()
							addImage(file)
						}
					}}
					onDrop={(event) => {
						const file = event.dataTransfer.files[0]
						if (file?.type.startsWith("image/")) {
							event.preventDefault()
							addImage(file)
						}
					}}
					placeholder="Write in Markdown. Paste a YouTube or Vimeo link on its own line to embed it; paste or drop an image to upload it."
					spellCheck
					className={cn(
						"block min-h-[60svh] w-full resize-none bg-transparent p-4 font-mono text-sm leading-6 outline-none [field-sizing:content]",
						"placeholder:text-muted-foreground",
					)}
				/>
			</div>
		</div>
	)

	const previewPane = (
		// `relative` keeps the footnotes' sr-only heading inside the scroll area (see ResizableSplit).
		<div className="relative h-full overflow-y-auto">
			<p className="border-b border-line px-4 py-2 font-mono text-xs text-muted-foreground">
				Preview · /blog/{preview.slug}
			</p>
			<div className="mx-auto max-w-3xl px-4 py-8">
				<h1 className="text-4xl font-medium tracking-tight text-balance">
					{preview.title || "Untitled"}
				</h1>
				{preview.summary && (
					<p className="mt-4 text-base text-balance text-muted-foreground">
						{preview.summary}
					</p>
				)}
				{preview.coverImageUrl && (
					// biome-ignore lint/performance/noImgElement: an editor preview of any uploaded size.
					<img
						src={preview.coverImageUrl}
						alt={preview.coverImageAlt}
						className="mt-8 aspect-[1200/630] w-full rounded-xl border object-cover"
					/>
				)}
				<article className="mt-8">
					{preview.content.trim() ? (
						<Markdown>{preview.content}</Markdown>
					) : (
						<p className="text-sm text-muted-foreground">Nothing written yet.</p>
					)}
				</article>
			</div>
		</div>
	)

	return <ResizableSplit left={editor} right={previewPane} />
}

function DeleteButton({ id, disabled }: { id: string; disabled: boolean }) {
	const [deleting, startDelete] = useTransition()

	return (
		<Dialog>
			<DialogTrigger
				render={
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Delete post"
						disabled={disabled}
					/>
				}
			>
				<Trash2Icon />
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Delete this post?</DialogTitle>
					<DialogDescription>
						It is removed from the blog straight away. This can't be undone.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
					<Button
						variant="destructive"
						disabled={deleting}
						onClick={() => startDelete(() => deletePostAction(id))}
					>
						{deleting ? "Deleting…" : "Delete"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
