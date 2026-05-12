"use client"

import { useMemo, useState } from "react"

import { Badge, Button, Card, Column, Grid, Heading, Media, Row, Text } from "@once-ui-system/core"

import { getAllTools } from "./registry"
import styles from "./tools.module.scss"
import type { ToolCategory, ToolEntry } from "./types"

type ToolFilter = ToolCategory | "all"

function ToolCard({ tool }: { tool: ToolEntry }) {
	const isLive = tool.status === "live"

	return (
		<Card
			direction="column"
			gap="20"
			padding="20"
			radius="xl"
			fillHeight
			className={styles.galleryCard}
		>
			{tool.image && (
				<Row>
					<Media
						width={480}
						height={360}
						src={tool.image.path}
						alt={tool.image.alt}
						objectFit="cover"
					/>
				</Row>
			)}
			<Row fillWidth horizontal="between" vertical="start" gap="16">
				<Row vertical="center" gap="12">
					<Column gap="4">
						<Heading as="h3" variant="heading-strong-l" wrap="balance">
							{tool.name}
						</Heading>
						<Text onBackground="neutral-weak" variant="body-default-xs">
							{tool.summary}
						</Text>
					</Column>
				</Row>
			</Row>

			<Row className={styles.cardAction} align="center" fillWidth>
				{isLive ? (
					<Button href={tool.path} variant="secondary" fillWidth arrowIcon>
						Try tool
					</Button>
				) : (
					<Text onBackground="neutral-weak" variant="body-default-xs" align="center">
						Planned for the next release.
					</Text>
				)}
			</Row>
		</Card>
	)
}

const categoryNames: Record<ToolCategory, string> = {
	image: "Image utilities",
	content: "Content creation",
	marketing: "Marketing tools",
	ai: "AI tools",
}

export function ToolsHubView() {
	const allTools = getAllTools()
	const [activeFilter, setActiveFilter] = useState<ToolFilter>("all")

	const filters = useMemo(() => {
		const categories = Array.from(new Set(allTools.map((tool) => tool.category)))

		return [
			{ value: "all" as const, label: "All", count: allTools.length },
			...categories.map((category) => ({
				value: category,
				label: categoryNames[category],
				count: allTools.filter((tool) => tool.category === category).length,
			})),
		]
	}, [allTools])

	const visibleTools = useMemo(
		() =>
			activeFilter === "all"
				? allTools
				: allTools.filter((tool) => tool.category === activeFilter),
		[activeFilter, allTools],
	)

	return (
		<Column
			fillWidth
			gap="40"
			paddingBottom="64"
			paddingX="24"
			maxWidth="l"
			className={styles.hubShell}
		>
			<Column fillWidth gap="24">
				<Row fillWidth horizontal="between" vertical="end" gap="16" wrap>
					<Row gap="16">
						<Heading as="h2" variant="heading-strong-xl">
							Browse tools
						</Heading>
						<Badge
							title={`${visibleTools.length} ${visibleTools.length === 1 ? "tool" : "tools"}`}
							effect={false}
							paddingX="16"
							paddingY="8"
							textVariant="label-default-s"
						/>
					</Row>
					<Row gap="8" wrap className={styles.filterBar}>
						{filters.map((filter) => {
							const isActive = activeFilter === filter.value

							return (
								<Button
									key={filter.value}
									variant={isActive ? "secondary" : "tertiary"}
									size="s"
									rounded
									aria-pressed={isActive}
									onClick={() => setActiveFilter(filter.value)}
									className={
										isActive ? styles.filterButtonActive : styles.filterButton
									}
								>
									<Text variant="label-default-s">{filter.label}</Text>
									<Text
										variant="label-default-xs"
										onBackground="accent-weak"
										marginLeft="xs"
									>
										{filter.count}
									</Text>
								</Button>
							)
						})}
					</Row>
				</Row>
				<Grid columns="4" l={{ columns: 3 }} m={{ columns: 2 }} s={{ columns: 1 }} gap="16">
					{visibleTools.map((tool) => (
						<ToolCard key={tool.slug} tool={tool} />
					))}
				</Grid>
			</Column>
		</Column>
	)
}
