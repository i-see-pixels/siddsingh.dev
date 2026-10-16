import type { MDXComponents } from "mdx/types"

// Prose styles for blog posts (content/blog/*.mdx). Required by @next/mdx.
const components: MDXComponents = {
	h2: (props) => (
		<h2
			className="mt-10 scroll-mt-20 text-2xl font-medium tracking-tight text-balance first:mt-0"
			{...props}
		/>
	),
	h3: (props) => (
		<h3
			className="mt-8 scroll-mt-20 text-xl font-medium tracking-tight text-balance"
			{...props}
		/>
	),
	p: (props) => <p className="mt-4 leading-7 first:mt-0" {...props} />,
	a: (props) => (
		<a
			className="text-brand underline decoration-brand/40 underline-offset-4 transition-[text-decoration-color] ease-out hover:decoration-brand"
			{...props}
		/>
	),
	ul: (props) => <ul className="mt-4 list-disc space-y-2 pl-6 leading-7" {...props} />,
	ol: (props) => <ol className="mt-4 list-decimal space-y-2 pl-6 leading-7" {...props} />,
	blockquote: (props) => (
		<blockquote
			className="mt-4 border-l-2 border-brand pl-4 text-muted-foreground"
			{...props}
		/>
	),
	hr: () => <hr className="my-8 border-line" />,
	code: (props) => (
		<code
			className="rounded-md border bg-muted px-1 py-0.5 font-mono text-sm [pre_&]:border-0 [pre_&]:bg-transparent [pre_&]:p-0"
			{...props}
		/>
	),
	pre: (props) => (
		<pre
			className="mt-4 overflow-x-auto rounded-lg border bg-muted p-4 font-mono text-sm leading-6"
			{...props}
		/>
	),
	img: ({ alt, ...props }) => (
		// biome-ignore lint/performance/noImgElement: MDX images have no known size.
		<img alt={alt} className="mt-4 rounded-xl border" {...props} />
	),
}

export function useMDXComponents(): MDXComponents {
	return components
}
