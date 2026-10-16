export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params
	return (
		<main className="p-6">
			<h1 className="font-medium">Tool: {slug}</h1>
		</main>
	)
}
