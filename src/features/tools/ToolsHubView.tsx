import { Button, Column, Heading, Text } from "@once-ui-system/core"

import { getAllTools, getFeaturedTool, getLiveToolEntries } from "./registry"
import styles from "./tools.module.scss"
import type { ToolEntry } from "./types"

function ToolCard({ tool }: { tool: ToolEntry }) {
	const isLive = tool.status === "live"

	return (
		<article
			className={`${styles.toolCard} ${tool.featured ? styles.featuredCard : ""}`}
		>
			<div
				className={`${styles.cardArt} ${!isLive ? styles.comingArt : ""}`}
				aria-hidden="true"
			>
				<div className={styles.artMesh} />
				<div className={styles.browserPreview}>
					<div className={styles.previewContent} />
				</div>
			</div>

			<div className={styles.cardHeader}>
				<div className={styles.cardMeta}>
					<span
						className={`${styles.statusPill} ${!isLive ? styles.statusSoon : ""}`}
					>
						{isLive ? "Live now" : "Coming soon"}
					</span>
					<span className={styles.metaPill}>{tool.category}</span>
				</div>
				<Heading as="h2" variant="heading-strong-l">
					{tool.name}
				</Heading>
				<Text onBackground="neutral-weak" variant="body-default-m">
					{tool.summary}
				</Text>
			</div>

			<div className={styles.cardHighlights}>
				{tool.highlights.slice(0, 2).map((highlight) => (
					<span key={highlight} className={styles.highlightPill}>
						{highlight}
					</span>
				))}
			</div>

			<div className={styles.cardActions}>
				{isLive ? (
					<Button
						href={tool.path}
						variant="secondary"
						size="m"
						prefixIcon="sparkle"
					>
						Open tool
					</Button>
				) : (
					<span className={styles.mutedAction}>
						Planned for the next release.
					</span>
				)}
			</div>
		</article>
	)
}

export function ToolsHubView() {
	const featuredTool = getFeaturedTool()
	const remainingTools = getAllTools().filter(
		(tool) => tool.slug !== featuredTool.slug,
	)
	const liveTools = getLiveToolEntries()
	const faqs = liveTools.flatMap((tool) => tool.faq || [])

	return (
		<Column fillWidth gap="40" paddingTop="24">
			<section className={styles.hero}>
				<div className={styles.heroPanel}>
					<span className={styles.eyebrow}>Free tools for builders</span>
					<Column gap="16" marginTop="16">
						<Heading variant="display-strong-m">
							A growing set of browser-based utilities for screenshots, assets,
							and launch-ready visuals
						</Heading>
						<Text variant="body-default-l" onBackground="neutral-weak">
							This section is equipped with practical tools that help turn
							product work into clearer outputs. Everything here is focused on
							speed, polish, and zero-install workflows.
						</Text>
					</Column>
				</div>
			</section>

			<Column fillWidth gap="20">
				<div>
					<Column gap="8">
						<Text variant="label-default-m" onBackground="brand-weak">
							Available now and next
						</Text>
						<Heading as="h2" variant="heading-strong-xl">
							Tool lineup
						</Heading>
					</Column>
					<Text onBackground="neutral-weak">
						Live tools open in their own editor pages. Roadmap cards stay
						visible so the section feels intentional from day one.
					</Text>
				</div>
				<div className={styles.toolGrid}>
					<ToolCard tool={featuredTool} />
					{remainingTools.map((tool) => (
						<ToolCard key={tool.slug} tool={tool} />
					))}
				</div>
			</Column>

			{faqs.length > 0 && (
				<section className={styles.detailShell} style={{ marginTop: "2rem" }}>
					<div className={styles.detailHeader}>
						<Text variant="label-default-m" onBackground="brand-weak">
							Quick FAQ
						</Text>
						<Heading as="h2" variant="heading-strong-xl">
							Common questions about these tools
						</Heading>
					</div>
					<div className={styles.faqList}>
						{faqs.map((item) => (
							<details key={item.question} className={styles.faqItem}>
								<summary>{item.question}</summary>
								<p className={styles.faqAnswer}>{item.answer}</p>
							</details>
						))}
					</div>
				</section>
			)}
		</Column>
	)
}
