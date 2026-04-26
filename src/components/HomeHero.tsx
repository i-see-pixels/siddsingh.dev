import Image from "next/image"

import { about, home, person } from "@/resources"
import { Avatar, Badge, Button, Column, Heading, RevealFx, Row, Text } from "@once-ui-system/core"

import styles from "./HomeHero.module.scss"

export function HomeHero() {
	return (
		<section className={styles.heroSection}>
			<Column fillWidth className={styles.heroCopy} gap="24">
				{home.featured.display && (
					<RevealFx fillWidth paddingTop="16" paddingBottom="8">
						<Badge
							background="brand-alpha-weak"
							paddingX="12"
							paddingY="4"
							onBackground="neutral-strong"
							textVariant="label-default-s"
							arrow={false}
							href={home.featured.href}
						>
							<Row paddingY="2">{home.featured.title}</Row>
						</Badge>
					</RevealFx>
				)}
				<RevealFx translateY={4} fillWidth>
					<Text
						className={styles.heroEyebrow}
						variant="label-default-m"
						onBackground="brand-weak"
					>
						What I do
					</Text>
				</RevealFx>
				<RevealFx translateY={6} fillWidth>
					<Heading
						as="h1"
						className={styles.heroTitle}
						wrap="balance"
						variant="display-strong-l"
					>
						{home.headline}
					</Heading>
				</RevealFx>
				<RevealFx translateY={8} delay={0.15} fillWidth>
					<Text
						className={styles.heroDescription}
						wrap="balance"
						onBackground="neutral-weak"
						variant="heading-default-xl"
					>
						{home.subline}
					</Text>
				</RevealFx>
				<RevealFx translateY={10} delay={0.25} fillWidth>
					<Column fillWidth horizontal="center" gap="m">
						<Button
							id="about"
							data-border="rounded"
							href={about.path}
							variant="secondary"
							size="m"
							weight="default"
							arrowIcon
						>
							<Row gap="8" vertical="center" paddingRight="4">
								{about.avatar.display && (
									<Avatar
										marginRight="8"
										style={{ marginLeft: "-0.75rem" }}
										src={person.avatar}
										size="m"
									/>
								)}
								{about.label}
							</Row>
						</Button>
					</Column>
				</RevealFx>
			</Column>
			<RevealFx translateY={12} delay={0.45}>
				<div className={styles.heroVisual}>
					<div className={styles.heroVisualAccent} aria-hidden="true" />
					<div className={styles.heroPopup}>
						<div className={styles.heroPopupBody}>
							<Text className={styles.heroPopupTag} variant="label-default-s">
								Sr. Software Engineer
							</Text>
							<Image
								priority
								className={styles.heroImage}
								src="/images/halftone_hero.png"
								alt={`${person.name} halftone portrait`}
								width={250}
								height={832}
							/>
							<div className={styles.heroPopupNote}>
								<Text variant="label-default-s" onBackground="brand-weak">
									Current focus
								</Text>
								<Text variant="body-default-m" onBackground="neutral-weak">
									Becoming visible to the world 😎
								</Text>
							</div>
						</div>
					</div>
				</div>
			</RevealFx>
		</section>
	)
}
