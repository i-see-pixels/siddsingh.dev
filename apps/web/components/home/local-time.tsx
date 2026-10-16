"use client"

import * as React from "react"

/** Current time in `timeZone`; renders nothing on the server to avoid a hydration mismatch. */
export function LocalTime({ timeZone, label }: { timeZone: string; label: string }) {
	const [now, setNow] = React.useState<Date | null>(null)

	React.useEffect(() => {
		setNow(new Date())
		const id = setInterval(() => setNow(new Date()), 30_000)
		return () => clearInterval(id)
	}, [])

	if (!now) return <span className="text-muted-foreground">--:--</span>

	const time = new Intl.DateTimeFormat("en-US", {
		timeZone,
		hour: "2-digit",
		minute: "2-digit",
	}).format(now)

	return (
		<>
			{time} <span className="text-muted-foreground">{`// ${label}`}</span>
		</>
	)
}
