import { MDXRemote, type MDXRemoteProps } from "next-mdx-remote/rsc"
import type React from "react"
import { type ReactNode, isValidElement } from "react"
import remarkGfm from "remark-gfm"
import { slugify as transliterate } from "transliteration"

import {
	Accordion,
	AccordionGroup,
	Button,
	Card,
	CodeBlock,
	Column,
	Feedback,
	Grid,
	Heading,
	HeadingLink,
	Icon,
	InlineCode,
	Line,
	List,
	ListItem,
	Media,
	type MediaProps,
	Row,
	SmartLink,
	Table,
	Text,
	type TextProps,
} from "@once-ui-system/core"

type CustomLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
	href: string
	children: ReactNode
}

function CustomLink({ href, children, ...props }: CustomLinkProps) {
	if (href.startsWith("/")) {
		return (
			<SmartLink href={href} {...props}>
				{children}
			</SmartLink>
		)
	}

	if (href.startsWith("#")) {
		return (
			<a href={href} {...props}>
				{children}
			</a>
		)
	}

	return (
		<a href={href} target="_blank" rel="noopener noreferrer" {...props}>
			{children}
		</a>
	)
}

function createImage({ alt, src, ...props }: MediaProps & { src: string }) {
	if (!src) {
		console.error("Media requires a valid 'src' property.")
		return null
	}

	return (
		<Media
			marginTop="8"
			marginBottom="16"
			enlarge
			radius="m"
			border="neutral-alpha-medium"
			sizes="(max-width: 960px) 100vw, 960px"
			alt={alt}
			src={src}
			{...props}
		/>
	)
}

function slugify(str: string): string {
	const strWithAnd = str.replace(/&/g, " and ") // Replace & with 'and'
	return transliterate(strWithAnd, {
		lowercase: true,
		separator: "-", // Replace spaces with -
	}).replace(/\-\-+/g, "-") // Replace multiple - with single -
}

function createHeading(as: "h1" | "h2" | "h3" | "h4" | "h5" | "h6") {
	const CustomHeading = ({
		children,
		...props
	}: Omit<React.ComponentProps<typeof HeadingLink>, "as" | "id">) => {
		const slug = slugify(children as string)
		return (
			<HeadingLink marginTop="24" marginBottom="12" as={as} id={slug} {...props}>
				{children}
			</HeadingLink>
		)
	}

	CustomHeading.displayName = `${as}`

	return CustomHeading
}

function createParagraph({ children }: TextProps) {
	return (
		<Text
			style={{ lineHeight: "175%" }}
			variant="body-default-m"
			onBackground="neutral-medium"
			marginTop="8"
			marginBottom="12"
		>
			{children}
		</Text>
	)
}

function createInlineCode({ children }: { children: ReactNode }) {
	return <InlineCode>{children}</InlineCode>
}

function getCodeText(children: ReactNode): string {
	if (typeof children === "string") {
		return children
	}

	if (Array.isArray(children)) {
		return children.map(getCodeText).join("")
	}

	return String(children ?? "")
}

function createPlainCodeBlock(code: string) {
	return (
		<pre
			style={{
				overflowX: "auto",
				lineHeight: "1.6",
				marginTop: "8px",
				marginBottom: "16px",
				padding: "16px",
				borderRadius: "12px",
				border: "1px solid var(--neutral-alpha-weak)",
				background: "var(--neutral-alpha-weak)",
			}}
		>
			<code>{code}</code>
		</pre>
	)
}

function createCodeBlock(props: React.ComponentProps<"pre">) {
	const child = props.children

	// For pre tags that contain code blocks
	if (
		isValidElement<{ className?: unknown; children?: ReactNode }>(child) &&
		("children" in child.props || typeof child.props?.className === "string")
	) {
		const { className, children } = child.props
		const code = getCodeText(children)

		// Extract language from className (format: language-xxx)
		const language =
			typeof className === "string" ? className.replace(/^language-/, "").trim() : ""

		if (!language || ["plain", "plaintext", "text", "txt"].includes(language)) {
			return createPlainCodeBlock(code)
		}

		const label = language.charAt(0).toUpperCase() + language.slice(1)

		return (
			<CodeBlock
				marginTop="8"
				marginBottom="16"
				codes={[
					{
						code,
						language,
						label,
					},
				]}
				copyButton={true}
			/>
		)
	}

	// Fallback for other pre tags or empty code blocks
	return <pre {...props} />
}

function createList(as: "ul" | "ol") {
	return ({ children }: { children: ReactNode }) => <List as={as}>{children}</List>
}

function createListItem({ children }: { children: ReactNode }) {
	return (
		<ListItem marginTop="4" marginBottom="8" style={{ lineHeight: "175%" }}>
			{children}
		</ListItem>
	)
}

function createHR() {
	return (
		<Row fillWidth horizontal="center">
			<Line maxWidth="40" />
		</Row>
	)
}

function createTable(props: React.TableHTMLAttributes<HTMLTableElement>) {
	return (
		<div
			style={{
				marginTop: "16px",
				marginBottom: "24px",
				overflowX: "auto",
				width: "100%",
			}}
		>
			<table
				{...props}
				style={{
					borderCollapse: "collapse",
					minWidth: "100%",
					...props.style,
				}}
			/>
		</div>
	)
}

function getTableTextAlign(align: string | undefined): React.CSSProperties["textAlign"] {
	return align === "center" || align === "right" || align === "justify" ? align : "left"
}

function createTableHeaderCell(props: React.ThHTMLAttributes<HTMLTableCellElement>) {
	return (
		<th
			{...props}
			style={{
				borderBottom: "1px solid var(--neutral-alpha-medium)",
				fontWeight: 600,
				padding: "10px 12px",
				textAlign: getTableTextAlign(props.align),
				verticalAlign: "top",
				...props.style,
			}}
		/>
	)
}

function createTableCell(props: React.TdHTMLAttributes<HTMLTableCellElement>) {
	return (
		<td
			{...props}
			style={{
				borderBottom: "1px solid var(--neutral-alpha-weak)",
				padding: "10px 12px",
				textAlign: getTableTextAlign(props.align),
				verticalAlign: "top",
				...props.style,
			}}
		/>
	)
}

const components = {
	p: createParagraph,
	h1: createHeading("h1"),
	h2: createHeading("h2"),
	h3: createHeading("h3"),
	h4: createHeading("h4"),
	h5: createHeading("h5"),
	h6: createHeading("h6"),
	img: createImage,
	a: CustomLink,
	code: createInlineCode,
	pre: createCodeBlock,
	table: createTable,
	th: createTableHeaderCell,
	td: createTableCell,
	ol: createList("ol"),
	ul: createList("ul"),
	li: createListItem,
	hr: createHR,
	Heading,
	Text,
	CodeBlock,
	InlineCode,
	Accordion,
	AccordionGroup,
	Table,
	Feedback,
	Button,
	Card,
	Grid,
	Row,
	Column,
	Icon,
	Media,
	SmartLink,
}

type CustomMDXProps = MDXRemoteProps & {
	components?: typeof components
}

export function CustomMDX({ components: customComponents, options, ...props }: CustomMDXProps) {
	const mdxOptions = options?.mdxOptions
	const remarkPlugins = mdxOptions?.remarkPlugins ?? []

	return (
		<MDXRemote
			{...props}
			options={{
				...options,
				blockJS: options?.blockJS ?? false,
				mdxOptions: {
					...mdxOptions,
					remarkPlugins: [remarkGfm, ...remarkPlugins],
				},
			}}
			components={{ ...components, ...(customComponents || {}) }}
		/>
	)
}
