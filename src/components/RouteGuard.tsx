"use client"

import NotFound from "@/app/not-found"
import { protectedRoutes, routes } from "@/resources"
import { Button, Column, Heading, PasswordInput, Row, Skeleton } from "@once-ui-system/core"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

interface RouteGuardProps {
	children: React.ReactNode
}

const RouteGuard: React.FC<RouteGuardProps> = ({ children }) => {
	const pathname = usePathname()
	const [isRouteEnabled, setIsRouteEnabled] = useState(false)
	const [isPasswordRequired, setIsPasswordRequired] = useState(false)
	const [password, setPassword] = useState("")
	const [isAuthenticated, setIsAuthenticated] = useState(false)
	const [error, setError] = useState<string | undefined>(undefined)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const performChecks = async () => {
			setLoading(true)
			setIsRouteEnabled(false)
			setIsPasswordRequired(false)
			setIsAuthenticated(false)

			const checkRouteEnabled = () => {
				if (!pathname) return false

				if (pathname in routes) {
					return routes[pathname as keyof typeof routes]
				}

				const dynamicRoutes = ["/blog", "/work", "/tools"] as const
				for (const route of dynamicRoutes) {
					if (pathname?.startsWith(route) && routes[route]) {
						return true
					}
				}

				return false
			}

			const routeEnabled = checkRouteEnabled()
			setIsRouteEnabled(routeEnabled)

			if (protectedRoutes[pathname as keyof typeof protectedRoutes]) {
				setIsPasswordRequired(true)

				const response = await fetch("/api/check-auth")
				if (response.ok) {
					setIsAuthenticated(true)
				}
			}

			setLoading(false)
		}

		performChecks()
	}, [pathname])

	const handlePasswordSubmit = async () => {
		const response = await fetch("/api/authenticate", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ password }),
		})

		if (response.ok) {
			setIsAuthenticated(true)
			setError(undefined)
		} else {
			setError("Incorrect password")
		}
	}

	if (loading) {
		return (
			<Column fillWidth paddingY="128" paddingX="24" horizontal="center" gap="24">
				<Column maxWidth="s" fillWidth gap="16" horizontal="center" align="center">
					<Skeleton shape="line" width="s" height="s" />
					<Skeleton shape="line" width="xl" height="xl" delay="1" />
					<Skeleton shape="line" width="l" height="m" delay="2" />
					<Row gap="12" vertical="center">
						<Skeleton shape="circle" width="s" height="s" delay="3" />
						<Skeleton shape="line" width="s" height="xs" delay="3" />
					</Row>
					<Skeleton
						shape="block"
						delay="4"
						style={{
							aspectRatio: "16 / 9",
							display: "block",
							width: "100%",
						}}
					/>
				</Column>
			</Column>
		)
	}

	if (!isRouteEnabled) {
		return <NotFound />
	}

	if (isPasswordRequired && !isAuthenticated) {
		return (
			<Column paddingY="128" maxWidth={24} gap="24" center>
				<Heading align="center" wrap="balance">
					This page is password protected
				</Heading>
				<Column fillWidth gap="8" horizontal="center">
					<PasswordInput
						id="password"
						label="Password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						errorMessage={error}
					/>
					<Button onClick={handlePasswordSubmit}>Submit</Button>
				</Column>
			</Column>
		)
	}

	return <>{children}</>
}

export { RouteGuard }
