"use client"

import { Button } from "@workspace/ui/components/button"
import {
	Command,
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@workspace/ui/components/command"
import { Kbd, KbdGroup } from "@workspace/ui/components/kbd"
import { cn } from "@workspace/ui/lib/utils"
import {
	CalendarIcon,
	FileTextIcon,
	MailIcon,
	MonitorIcon,
	MoonIcon,
	SearchIcon,
	SunIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import * as React from "react"
import { navItems, siteConfig } from "@/lib/site-config"

/**
 * Search trigger plus its dialog. Rendered in the header and in the mobile
 * bottom nav; only the instance with `hotkey` listens for Ctrl/⌘ K.
 */
export function CommandMenu({
	hotkey = false,
	className,
}: {
	hotkey?: boolean
	className?: string
}) {
	const [open, setOpen] = React.useState(false)
	const router = useRouter()
	const { setTheme } = useTheme()

	React.useEffect(() => {
		if (!hotkey) return
		function onKeyDown(event: KeyboardEvent) {
			// Autofill dispatches keydown events without a key.
			if (event.key?.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
				event.preventDefault()
				setOpen((value) => !value)
			}
		}

		window.addEventListener("keydown", onKeyDown)
		return () => window.removeEventListener("keydown", onKeyDown)
	}, [hotkey])

	function run(action: () => void) {
		setOpen(false)
		action()
	}

	return (
		<>
			<Button
				variant="ghost"
				size="sm"
				aria-label="Search"
				className={cn("gap-1.5 px-1.5 text-muted-foreground", className)}
				onClick={() => setOpen(true)}
			>
				<SearchIcon />
				<KbdGroup>
					<Kbd>Ctrl</Kbd>
					<Kbd>K</Kbd>
				</KbdGroup>
			</Button>
			<CommandDialog open={open} onOpenChange={setOpen}>
				<Command>
					<CommandInput placeholder="Search pages and links…" />
					<CommandList>
						<CommandEmpty>No results.</CommandEmpty>
						<CommandGroup heading="Pages">
							<CommandItem onSelect={() => run(() => router.push("/"))}>
								<FileTextIcon />
								Home
							</CommandItem>
							{navItems.map((item) => (
								<CommandItem
									key={item.href}
									onSelect={() => run(() => router.push(item.href))}
								>
									<FileTextIcon />
									{item.title}
								</CommandItem>
							))}
						</CommandGroup>
						<CommandGroup heading="Links">
							<CommandItem
								onSelect={() =>
									run(() => window.open(`mailto:${siteConfig.email}`))
								}
							>
								<MailIcon />
								Email me
							</CommandItem>
							<CommandItem onSelect={() => run(() => router.push("/about"))}>
								<FileTextIcon />
								View resume
							</CommandItem>
							<CommandItem
								onSelect={() =>
									run(() => window.open(siteConfig.callUrl, "_blank", "noopener"))
								}
							>
								<CalendarIcon />
								Book a call
							</CommandItem>
						</CommandGroup>
						<CommandGroup heading="Theme">
							<CommandItem onSelect={() => run(() => setTheme("light"))}>
								<SunIcon />
								Light
							</CommandItem>
							<CommandItem onSelect={() => run(() => setTheme("dark"))}>
								<MoonIcon />
								Dark
							</CommandItem>
							<CommandItem onSelect={() => run(() => setTheme("system"))}>
								<MonitorIcon />
								System
							</CommandItem>
						</CommandGroup>
					</CommandList>
				</Command>
			</CommandDialog>
		</>
	)
}
