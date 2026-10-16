import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"

export default function Page() {
	return (
		<main className="p-6">
			<Card className="max-w-md">
				<CardHeader>
					<CardTitle>siddsingh.dev</CardTitle>
				</CardHeader>
				<CardContent>
					<Button>Button</Button>
				</CardContent>
			</Card>
		</main>
	)
}
