"use client"

import { Button } from "@workspace/ui/components/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip"
import {
	BoldIcon,
	ClapperboardIcon,
	CodeIcon,
	Heading2Icon,
	Heading3Icon,
	ImageIcon,
	ItalicIcon,
	LinkIcon,
	ListIcon,
	ListOrderedIcon,
	type LucideIcon,
	SquareCodeIcon,
	TextQuoteIcon,
} from "lucide-react"
import { useRef } from "react"
import { EMBED_PROVIDERS } from "@/modules/blog/domain/embeds"
import { MEDIA_ACCEPT } from "@/modules/media/domain/media"
import type { CommandName } from "./markdown-commands"

const groups: { command: CommandName; label: string; shortcut?: string; icon: LucideIcon }[][] = [
	[
		{ command: "heading2", label: "Heading", icon: Heading2Icon },
		{ command: "heading3", label: "Subheading", icon: Heading3Icon },
	],
	[
		{ command: "bold", label: "Bold", shortcut: "Ctrl B", icon: BoldIcon },
		{ command: "italic", label: "Italic", shortcut: "Ctrl I", icon: ItalicIcon },
		{ command: "link", label: "Link", shortcut: "Ctrl K", icon: LinkIcon },
		{ command: "code", label: "Inline code", icon: CodeIcon },
	],
	[
		{ command: "bulletList", label: "Bulleted list", icon: ListIcon },
		{ command: "orderedList", label: "Numbered list", icon: ListOrderedIcon },
		{ command: "quote", label: "Quote", icon: TextQuoteIcon },
		{ command: "codeBlock", label: "Code block", icon: SquareCodeIcon },
		{
			command: "embed",
			label: "Embed",
			shortcut: EMBED_PROVIDERS.join(", "),
			icon: ClapperboardIcon,
		},
	],
]

function ToolbarButton({
	label,
	shortcut,
	onClick,
	disabled,
	children,
}: {
	label: string
	shortcut?: string
	onClick: () => void
	disabled?: boolean
	children: React.ReactNode
}) {
	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						aria-label={label}
						disabled={disabled}
						// Keep focus (and the selection) in the textarea.
						onMouseDown={(event) => event.preventDefault()}
						onClick={onClick}
					/>
				}
			>
				{children}
			</TooltipTrigger>
			<TooltipContent>
				{label}
				{shortcut && <span className="ml-2 text-muted-foreground">{shortcut}</span>}
			</TooltipContent>
		</Tooltip>
	)
}

export function MarkdownToolbar({
	onCommand,
	onImage,
	uploading,
}: {
	onCommand: (command: CommandName) => void
	onImage: (file: File) => void
	uploading: boolean
}) {
	const fileInput = useRef<HTMLInputElement>(null)

	return (
		<div
			role="toolbar"
			aria-label="Formatting"
			className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-y border-line bg-background px-2 py-1"
		>
			{groups.map((group, index) => (
				<div key={group[0]?.command} className="flex items-center gap-0.5">
					{index > 0 && <span aria-hidden className="mx-1 h-4 w-px bg-line" />}
					{group.map(({ command, label, shortcut, icon: Icon }) => (
						<ToolbarButton
							key={command}
							label={label}
							shortcut={shortcut}
							onClick={() => onCommand(command)}
						>
							<Icon />
						</ToolbarButton>
					))}
				</div>
			))}
			<span aria-hidden className="mx-1 h-4 w-px bg-line" />
			<ToolbarButton
				label={uploading ? "Uploading…" : "Insert image"}
				disabled={uploading}
				onClick={() => fileInput.current?.click()}
			>
				<ImageIcon />
			</ToolbarButton>
			<input
				ref={fileInput}
				type="file"
				accept={MEDIA_ACCEPT}
				className="hidden"
				onChange={(event) => {
					const file = event.target.files?.[0]
					if (file) onImage(file)
					event.target.value = ""
				}}
			/>
		</div>
	)
}
