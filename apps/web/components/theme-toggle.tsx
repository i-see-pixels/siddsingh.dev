"use client"

import { Button } from "@workspace/ui/components/button"
import { Kbd } from "@workspace/ui/components/kbd"
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip"
import { useTheme } from "next-themes"

export function ThemeToggle() {
	const { resolvedTheme, setTheme } = useTheme()

	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Toggle mode"
						onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
					>
						<HalfCircleIcon />
					</Button>
				}
			/>
			<TooltipContent className="pr-2 pl-3">
				Toggle mode <Kbd>D</Kbd>
			</TooltipContent>
		</Tooltip>
	)
}

// A half-filled circle that turns over when the mode changes. `transition-transform!`
// overrides next-themes' `disableTransitionOnChange`.
function HalfCircleIcon() {
	return (
		<svg viewBox="0 0 32 32" fill="currentColor" aria-hidden>
			<path
				d="M16 .5C7.4.5.5 7.4.5 16S7.4 31.5 16 31.5 31.5 24.6 31.5 16 24.6.5 16 .5zm0 28.1V3.4C23 3.4 28.6 9 28.6 16S23 28.6 16 28.6z"
				className="origin-center motion-safe:transition-transform! motion-safe:duration-500 dark:rotate-180"
			/>
		</svg>
	)
}
