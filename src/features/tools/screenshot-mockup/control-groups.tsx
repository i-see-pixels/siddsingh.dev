"use client"

import { Button } from "@/components/ui/button"
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
			className="flex flex-col items-center gap-2"
		>
			{controlGroups.map((group) => {
				const GroupIcon = group.icon
				const isActive = activeGroup === group.value

				return (
					<Button
						key={group.value}
						type="button"
						variant={isActive ? "secondary" : "ghost"}
						size="icon-sm"
						aria-label={group.label}
						title={group.label}
						aria-pressed={isActive}
						onClick={() => onGroupChangeAction(group.value)}
						className="w-full h-full p-3"
					>
						<GroupIcon className="size-6" />
					</Button>
				)
			})}
		</nav>
	)
}
