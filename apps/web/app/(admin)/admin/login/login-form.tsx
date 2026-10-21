"use client"

import { Button } from "@workspace/ui/components/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { useActionState } from "react"
import { signInAction } from "../auth-actions"

export function LoginForm() {
	const [state, formAction, pending] = useActionState(signInAction, null)

	return (
		<form action={formAction}>
			<FieldGroup>
				<Field>
					<FieldLabel htmlFor="email">Email</FieldLabel>
					<Input id="email" name="email" type="email" autoComplete="username" required />
				</Field>
				<Field data-invalid={state?.ok === false || undefined}>
					<FieldLabel htmlFor="password">Password</FieldLabel>
					<Input
						id="password"
						name="password"
						type="password"
						autoComplete="current-password"
						required
						aria-invalid={state?.ok === false || undefined}
					/>
					<FieldError>{state?.message}</FieldError>
				</Field>
				<Button type="submit" size="lg" disabled={pending}>
					{pending ? "Signing in…" : "Sign in"}
				</Button>
			</FieldGroup>
		</form>
	)
}
