import { cn } from "@workspace/ui/lib/utils"

/** "sidd" in mono, ending in a drafting-blue cursor block. Sized by font size. */
export function BrandMark({ className }: { className?: string }) {
	return (
		<span
			className={cn(
				"inline-flex items-baseline font-mono font-medium tracking-tight leading-none",
				className,
			)}
			aria-hidden
		>
			sidd
			<span className="ml-[0.08em] inline-block size-[0.32em] bg-brand" />
		</span>
	)
}
