import {
	ArrowLeftRightIcon,
	BracesIcon,
	ClockIcon,
	CoinsIcon,
	GitCompareIcon,
	ImageIcon,
	KeyRoundIcon,
	type LucideIcon,
	MessageSquareTextIcon,
	RegexIcon,
	WorkflowIcon,
	WrenchIcon,
} from "lucide-react"

export const toolIcons: Record<string, LucideIcon> = {
	"cron-expression": ClockIcon,
	"diff-checker": GitCompareIcon,
	"json-formatter": BracesIcon,
	"jwt-decoder": KeyRoundIcon,
	"llm-token-cost": CoinsIcon,
	"mermaid-previewer": WorkflowIcon,
	"prompt-playground": MessageSquareTextIcon,
	"regex-tester": RegexIcon,
	"screenshot-mockup": ImageIcon,
	"tool-schema-converter": ArrowLeftRightIcon,
}

/** The icon shown for a tool wherever tools are listed. */
export function ToolIcon({ slug }: { slug: string }) {
	const Icon = toolIcons[slug] ?? WrenchIcon
	return <Icon />
}
