import { ArrowUpRightIcon, BoxIcon } from "lucide-react"
import { IconTile, StatusTag, Tag } from "@/components/badges"
import { PageHeading, Panel, PanelHeader, PanelTitle, Separator } from "@/components/panel"
import { products } from "@/lib/content"

export default function ProductsPage() {
	return (
		<>
			<PageHeading
				tagline="Products"
				title="Things I'm building"
				description="Tools I make for myself and ship for everyone: open source, free to try, each on its own subdomain."
			/>
			<Separator />
			<Panel id="products">
				<PanelHeader>
					<PanelTitle sheet="01" count={products.length} anchor="products">
						All products
					</PanelTitle>
				</PanelHeader>
				<ul className="grid gap-px bg-line sm:grid-cols-2 sm:[&>li:last-child:nth-child(odd)]:col-span-2">
					{products.map((product) => (
						<li key={product.name} className="bg-background">
							<a
								href={product.href}
								target="_blank"
								rel="noopener"
								className="group flex h-full flex-col gap-3 p-4 transition-[background-color] ease-out hover:bg-accent-muted"
							>
								<div className="flex items-center gap-3">
									<IconTile>
										<BoxIcon />
									</IconTile>
									<h2 className="flex-1 text-lg/snug font-medium">
										{product.name}
									</h2>
									<StatusTag status={product.status} />
								</div>
								<p className="text-sm text-muted-foreground">{product.pitch}</p>
								<ul className="flex flex-wrap gap-1.5">
									{product.stack.map((item) => (
										<li key={item}>
											<Tag>{item}</Tag>
										</li>
									))}
								</ul>
								<div className="mt-auto flex items-center justify-between gap-2 pt-1 font-mono text-xs text-muted-foreground">
									<span className="truncate">
										{new URL(product.href).host}
										{"metric" in product && product.metric && (
											<span className="ml-2 text-brand">
												{product.metric}
											</span>
										)}
									</span>
									<ArrowUpRightIcon className="size-4 shrink-0 transition-[translate,color] ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand" />
								</div>
							</a>
						</li>
					))}
				</ul>
			</Panel>
		</>
	)
}
