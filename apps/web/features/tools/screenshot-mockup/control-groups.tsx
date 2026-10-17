"use client"

import { cn } from "@workspace/ui/lib/utils"
import {
	DownloadIcon,
	FrameIcon,
	ImagePlusIcon,
	type LucideIcon,
	PaletteIcon,
	SlidersHorizontalIcon,
	SparklesIcon,
	SquareIcon,
} from "lucide-react"

export type ControlGroupId =
	| "image"
	| "background"
	| "styling"
	| "shadow"
	| "border"
	| "window"
	| "export"

type ControlGroup = {
	value: ControlGroupId
	label: string
	icon: LucideIcon
}

export const controlGroups: ControlGroup[] = [
	{ value: "image", label: "Image", icon: ImagePlusIcon },
	{ value: "background", label: "Background", icon: PaletteIcon },
	{ value: "styling", label: "Styling", icon: SlidersHorizontalIcon },
	{ value: "shadow", label: "Shadow", icon: SparklesIcon },
	{ value: "border", label: "Border", icon: SquareIcon },
	{ value: "window", label: "Window", icon: FrameIcon },
	{ value: "export", label: "Export", icon: DownloadIcon },
]

type ControlGroupRailProps = {
	activeGroup: ControlGroupId
	onGroupChangeAction: (group: ControlGroupId) => void
}

export function ControlGroupRail({ activeGroup, onGroupChangeAction }: ControlGroupRailProps) {
	return (
		<nav
			aria-label="Screenshot mockup control groups"
			className="flex gap-1 overflow-x-auto p-2"
		>
			{controlGroups.map((group) => {
				const GroupIcon = group.icon
				const isActive = activeGroup === group.value

				return (
					<button
						key={group.value}
						type="button"
						aria-pressed={isActive}
						onClick={() => onGroupChangeAction(group.value)}
						className={cn(
							"flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
							isActive
								? "border-brand bg-brand-muted text-foreground"
								: "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
						)}
					>
						<GroupIcon className="size-4" />
						{group.label}
					</button>
				)
			})}
		</nav>
	)
}
