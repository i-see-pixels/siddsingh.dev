export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params
	return (
		<main className="p-6">
			<h1 className="font-medium">Post: {slug}</h1>
		</main>
	)
}
