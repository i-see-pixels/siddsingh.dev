import { Card, Column, Grid, Line, Row, Skeleton } from "@once-ui-system/core"

function TextSkeleton({
	width = "m",
	height = "s",
	delay,
}: {
	width?: React.ComponentProps<typeof Skeleton>["width"]
	height?: React.ComponentProps<typeof Skeleton>["height"]
	delay?: React.ComponentProps<typeof Skeleton>["delay"]
}) {
	return <Skeleton shape="line" width={width} height={height} delay={delay} />
}

function MediaSkeleton({
	aspectRatio = "16 / 9",
	delay,
}: {
	aspectRatio?: string
	delay?: React.ComponentProps<typeof Skeleton>["delay"]
}) {
	return (
		<Skeleton
			shape="block"
			delay={delay}
			style={{
				aspectRatio,
				display: "block",
				width: "100%",
			}}
		/>
	)
}

function AvatarLineSkeleton({ delay }: { delay?: React.ComponentProps<typeof Skeleton>["delay"] }) {
	return (
		<Row gap="12" vertical="center">
			<Skeleton shape="circle" width="s" height="s" delay={delay} />
			<TextSkeleton width="s" height="xs" delay={delay} />
		</Row>
	)
}

function PageHeaderSkeleton() {
	return (
		<Column maxWidth="s" gap="16" horizontal="center" align="center" fillWidth>
			<TextSkeleton width="xs" height="xs" />
			<TextSkeleton width="s" height="xs" delay="1" />
			<TextSkeleton width="xl" height="xl" delay="2" />
			<TextSkeleton width="l" height="m" delay="3" />
			<TextSkeleton width="m" height="m" delay="4" />
			<Row gap="8" horizontal="center" wrap>
				<TextSkeleton width="xs" height="xs" delay="2" />
				<TextSkeleton width="xs" height="xs" delay="3" />
				<TextSkeleton width="xs" height="xs" delay="4" />
			</Row>
		</Column>
	)
}

function ArticleBodySkeleton() {
	return (
		<Column maxWidth="s" gap="20" fillWidth>
			{["1", "2", "3", "4", "5", "6"].map((delay, index) => (
				<Column key={delay} gap="8" fillWidth>
					{index % 2 === 0 && <TextSkeleton width="m" height="m" delay={delay as "1"} />}
					<TextSkeleton width="xl" height="s" delay={delay as "1"} />
					<TextSkeleton width="xl" height="s" delay={delay as "1"} />
					<TextSkeleton width={index % 2 === 0 ? "l" : "m"} height="s" delay={delay as "1"} />
				</Column>
			))}
		</Column>
	)
}

function PostCardSkeleton({ thumbnail = false }: { thumbnail?: boolean }) {
	return (
		<Card fillWidth border="transparent" background="transparent" padding="4" radius="l-4">
			<Column fillWidth gap="16">
				{thumbnail && <MediaSkeleton delay="1" />}
				<Column paddingY="24" paddingX="l" gap="20">
					<Row gap="24" vertical="center">
						<AvatarLineSkeleton />
						<TextSkeleton width="xs" height="xs" delay="2" />
					</Row>
					<TextSkeleton width="l" height="m" delay="3" />
					<TextSkeleton width="m" height="s" delay="4" />
				</Column>
			</Column>
		</Card>
	)
}

function ProjectCardSkeleton() {
	return (
		<Column fillWidth gap="m">
			<MediaSkeleton delay="1" />
			<Column fillWidth paddingX="s" paddingTop="12" paddingBottom="24" gap="16">
				<TextSkeleton width="l" height="l" delay="2" />
				<Row gap="8">
					<Skeleton shape="circle" width="s" height="s" delay="2" />
					<Skeleton shape="circle" width="s" height="s" delay="3" />
				</Row>
				<TextSkeleton width="xl" height="s" delay="3" />
				<TextSkeleton width="l" height="s" delay="4" />
			</Column>
		</Column>
	)
}

function BlogListSkeleton() {
	return (
		<Column maxWidth="m" paddingTop="24">
			<Column gap="16" marginBottom="l" paddingX="24">
				<TextSkeleton width="m" height="l" />
				<TextSkeleton width="xl" height="m" delay="1" />
				<Row gap="12" wrap>
					<TextSkeleton width="s" height="m" delay="2" />
					<TextSkeleton width="s" height="m" delay="3" />
				</Row>
			</Column>
			<Grid columns="1" fillWidth marginBottom="40" gap="16">
				<PostCardSkeleton thumbnail />
			</Grid>
			<Grid columns="2" s={{ columns: 1 }} fillWidth marginBottom="40" gap="16">
				<PostCardSkeleton thumbnail />
				<PostCardSkeleton thumbnail />
			</Grid>
		</Column>
	)
}

function BlogPostSkeleton() {
	return (
		<Row fillWidth horizontal="center">
			<Column as="section" maxWidth="m" horizontal="center" gap="l" paddingTop="24">
				<PageHeaderSkeleton />
				<Row marginBottom="32" horizontal="center">
					<AvatarLineSkeleton />
				</Row>
				<MediaSkeleton delay="2" />
				<ArticleBodySkeleton />
				<Column fillWidth gap="40" horizontal="center" marginTop="40">
					<Line maxWidth="40" />
					<TextSkeleton width="m" height="l" delay="3" />
					<Grid columns="2" s={{ columns: 1 }} fillWidth marginBottom="40" gap="16">
						<PostCardSkeleton thumbnail />
						<PostCardSkeleton thumbnail />
					</Grid>
				</Column>
			</Column>
		</Row>
	)
}

function HomePageSkeleton() {
	return (
		<Column maxWidth="m" gap="xl" paddingY="12" horizontal="center">
			<Row fillWidth gap="40" s={{ direction: "column" }}>
				<Column flex={1} gap="24">
					<TextSkeleton width="s" height="s" />
					<TextSkeleton width="xl" height="xl" delay="1" />
					<TextSkeleton width="xl" height="l" delay="2" />
					<TextSkeleton width="m" height="m" delay="3" />
				</Column>
				<Column flex={1}>
					<MediaSkeleton aspectRatio="3 / 4" delay="2" />
				</Column>
			</Row>
			<Column fillWidth gap="24" paddingX="l">
				<TextSkeleton width="s" height="s" delay="2" />
				<TextSkeleton width="xl" height="l" delay="3" />
				<TextSkeleton width="xl" height="s" delay="4" />
				<TextSkeleton width="l" height="s" delay="5" />
			</Column>
			<ProjectCardSkeleton />
			<Grid columns="2" s={{ columns: 1 }} fillWidth gap="16">
				<PostCardSkeleton />
				<PostCardSkeleton />
			</Grid>
		</Column>
	)
}

function WorkListSkeleton() {
	return (
		<Column maxWidth="m" fillWidth paddingTop="24" gap="40">
			<Column paddingX="l" gap="16">
				<TextSkeleton width="m" height="l" />
				<TextSkeleton width="xl" height="m" delay="1" />
			</Column>
			<ProjectCardSkeleton />
			<ProjectCardSkeleton />
		</Column>
	)
}

function ProjectPageSkeleton() {
	return (
		<Column as="section" maxWidth="m" horizontal="center" gap="l">
			<PageHeaderSkeleton />
			<Row marginBottom="32" horizontal="center">
				<AvatarLineSkeleton />
			</Row>
			<TextSkeleton width="s" height="m" delay="2" />
			<MediaSkeleton delay="3" />
			<ArticleBodySkeleton />
			<Column fillWidth gap="40" horizontal="center" marginTop="40">
				<Line maxWidth="40" />
				<TextSkeleton width="m" height="l" delay="2" />
				<ProjectCardSkeleton />
			</Column>
		</Column>
	)
}

function ToolsPageSkeleton() {
	return (
		<Column fillWidth gap="40" paddingBottom="64" paddingX="24" maxWidth="l">
			<Column fillWidth gap="24">
				<Row fillWidth horizontal="between" vertical="end" gap="16" wrap>
					<Row gap="16" vertical="center">
						<TextSkeleton width="m" height="l" />
						<TextSkeleton width="xs" height="m" delay="1" />
					</Row>
					<Row gap="8" wrap>
						<TextSkeleton width="xs" height="m" delay="2" />
						<TextSkeleton width="s" height="m" delay="3" />
						<TextSkeleton width="s" height="m" delay="4" />
					</Row>
				</Row>
				<Grid columns="4" l={{ columns: 3 }} m={{ columns: 2 }} s={{ columns: 1 }} gap="16">
					{["1", "2", "3", "4"].map((delay) => (
						<Card key={delay} direction="column" gap="20" padding="20" radius="xl" fillHeight>
							<MediaSkeleton delay={delay as "1"} />
							<TextSkeleton width="l" height="m" delay={delay as "1"} />
							<TextSkeleton width="m" height="s" delay={delay as "1"} />
							<TextSkeleton width="s" height="m" delay={delay as "1"} />
						</Card>
					))}
				</Grid>
			</Column>
		</Column>
	)
}

export {
	BlogListSkeleton,
	BlogPostSkeleton,
	HomePageSkeleton,
	ProjectPageSkeleton,
	ToolsPageSkeleton,
	WorkListSkeleton,
}
