import { Separator } from "@workspace/ui/components/separator"
import { CommandMenu } from "@/components/command-menu"
import { NavLinks } from "@/components/nav-links"

/** Phone-only floating nav: search plus page links. */
export function SiteBottomNav() {
	return (
		<>
			<div
				aria-hidden
				className="pointer-events-none fixed inset-x-0 bottom-0 z-40 h-(--fade-bottom-height) bg-linear-to-b from-transparent to-background md:hidden"
			/>
			<div className="fixed bottom-[calc(--spacing(2)+env(safe-area-inset-bottom,0px))] left-1/2 z-50 flex -translate-x-1/2 items-center rounded-xl bg-popover py-1 pr-3 pl-1 shadow-md ring-1 ring-foreground/10 md:hidden">
				<CommandMenu className="[&_[data-slot=kbd-group]]:hidden" />
				<Separator
					orientation="vertical"
					className="mr-3 ml-1 data-vertical:h-5 data-vertical:self-center bg-line"
				/>
				<NavLinks className="gap-3" />
			</div>
		</>
	)
}
