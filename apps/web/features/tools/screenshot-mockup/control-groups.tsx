"use client"

import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
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
		<Tabs
			value={activeGroup}
			onValueChange={(value) => onGroupChangeAction(value as ControlGroupId)}
			className="overflow-x-auto p-2"
		>
			<TabsList variant="line" aria-label="Screenshot mockup control groups">
				{controlGroups.map((group) => {
					const GroupIcon = group.icon

					return (
						<TabsTrigger
							key={group.value}
							value={group.value}
							className="shrink-0 flex-none px-2.5"
						>
							<GroupIcon />
							{group.label}
						</TabsTrigger>
					)
				})}
			</TabsList>
		</Tabs>
	)
}
