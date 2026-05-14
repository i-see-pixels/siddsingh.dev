"use client"

import type { CSSProperties, ReactNode } from "react"
import { useState } from "react"

import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarInset,
	SidebarProvider,
	SidebarRail,
	SidebarSeparator,
	SidebarTrigger,
} from "@/components/ui/sidebar"
import type { LiveToolEntry } from "@/features/tools/types"
import { cn } from "@/lib/utils"
import {
	ArrowLeftIcon,
	ChevronDownIcon,
	ImageIcon,
	LayoutDashboardIcon,
	type LucideIcon,
	SparklesIcon,
	WandSparklesIcon,
} from "lucide-react"

const SIDEBAR_WIDTH_PRESETS = [
	{ label: "S", width: 288 },
	{ label: "M", width: 336 },
	{ label: "L", width: 384 },
] as const

type ToolWorkspaceShellProps = {
	tool: LiveToolEntry
	toolbar?: ReactNode
	sidebarNavigation?: ReactNode
	sidebarContent: ReactNode
	sidebarFooter?: ReactNode
	children: ReactNode
}

type ToolWorkspaceSectionProps = {
	title: string
	description?: string
	defaultOpen?: boolean
	children: ReactNode
}

function getToolIcon(category: LiveToolEntry["category"]): LucideIcon {
	switch (category) {
		case "image":
			return ImageIcon
		case "content":
			return LayoutDashboardIcon
		case "marketing":
			return WandSparklesIcon
		default:
			return SparklesIcon
	}
}

export function ToolWorkspaceSection({
	title,
	description,
	defaultOpen = true,
	children,
}: ToolWorkspaceSectionProps) {
	const [open, setOpen] = useState(defaultOpen)

	return (
		<Collapsible
			open={open}
			onOpenChange={setOpen}
			className="rounded-xl border border-border bg-card"
		>
			<CollapsibleTrigger className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left">
				<div className="flex min-w-0 flex-col gap-1">
					<p className="text-sm font-medium text-card-foreground">{title}</p>
					{description ? (
						<p className="text-xs leading-relaxed text-muted-foreground">
							{description}
						</p>
					) : null}
				</div>
				<ChevronDownIcon
					className={cn(
						"mt-0.5 shrink-0 text-muted-foreground transition-transform",
						open ? "rotate-180" : "rotate-0",
					)}
				/>
			</CollapsibleTrigger>
			<CollapsibleContent className="px-4 pb-4">{children}</CollapsibleContent>
		</Collapsible>
	)
}

export function ToolWorkspaceShell({
	tool,
	toolbar,
	sidebarNavigation,
	sidebarContent,
	sidebarFooter,
	children,
}: ToolWorkspaceShellProps) {
	const ToolIcon = getToolIcon(tool.category)
	const hasSidebarNavigation = Boolean(sidebarNavigation)

	return (
		<SidebarProvider
			defaultOpen
			style={
				{
					"--sidebar-width": `${SIDEBAR_WIDTH_PRESETS[2].width}px`,
				} as CSSProperties
			}
			className="min-h-screen bg-background"
		>
			{hasSidebarNavigation ? (
				<Sidebar
					collapsible="none"
					className="fixed inset-y-0 left-0 z-20 h-svh border-r border-sidebar-border/80"
					style={{ "--sidebar-width": "4.75rem" } as CSSProperties}
					variant="sidebar"
				>
					<SidebarHeader className="items-center gap-3 border-b border-sidebar-border/80 p-3">
						<Link
							href="/tools"
							className={buttonVariants({
								variant: "ghost",
								size: "icon-sm",
							})}
							aria-label="Back to tools"
						>
							<ArrowLeftIcon />
						</Link>
						<div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground">
							<ToolIcon />
						</div>
					</SidebarHeader>

					<SidebarContent>
						<ScrollArea className="h-full">
							<div className="flex flex-col items-center gap-2 p-3">
								{sidebarNavigation}
							</div>
						</ScrollArea>
					</SidebarContent>
				</Sidebar>
			) : null}

			<Sidebar
				className={cn(
					"border-r border-sidebar-border/80",
					hasSidebarNavigation && "md:left-19!",
				)}
				style={
					{ "--sidebar-width": `${SIDEBAR_WIDTH_PRESETS[2].width}px` } as CSSProperties
				}
				variant="sidebar"
			>
				<SidebarHeader className="gap-3 p-3">
					{hasSidebarNavigation ? null : (
						<div className="flex items-center justify-between gap-2">
							<Link
								href="/tools"
								className={buttonVariants({
									variant: "ghost",
									size: "sm",
									className:
										"justify-start group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0",
								})}
							>
								<ArrowLeftIcon data-icon="inline-start" />
								<span className="group-data-[collapsible=icon]:hidden">
									Back to tools
								</span>
							</Link>
						</div>
					)}
				</SidebarHeader>

				<SidebarContent>
					<ScrollArea className="h-full">
						<div className="flex flex-col gap-4 p-3">{sidebarContent}</div>
					</ScrollArea>
				</SidebarContent>

				<SidebarFooter className="gap-3 p-3 bg-background">
					{sidebarFooter ? (
						<div className="group-data-[collapsible=icon]:hidden">{sidebarFooter}</div>
					) : null}
				</SidebarFooter>
			</Sidebar>

			<SidebarInset
				className={cn("min-h-screen rounded-none!", hasSidebarNavigation && "md:ml-19")}
			>
				<div className="flex min-h-screen flex-col">
					<header className="sticky top-0 z-20 border-b border-border/70 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
						<div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6">
							<div className="flex min-w-0 items-center gap-3">
								<div className="min-w-0">
									<div className="flex flex-wrap items-center gap-2">
										{tool.label}
										<Badge variant="outline" className="capitalize">
											{tool.category}
										</Badge>
									</div>
									<p className="truncate text-sm text-muted-foreground">
										{tool.hero.intro}
									</p>
								</div>
							</div>
							<div className="hidden sm:flex flex-wrap items-center justify-end gap-2">
								{toolbar}
							</div>
						</div>
					</header>
					{children}
				</div>
			</SidebarInset>
		</SidebarProvider>
	)
}
