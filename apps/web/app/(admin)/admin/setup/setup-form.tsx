"use client"

import { Button } from "@workspace/ui/components/button"
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { useActionState } from "react"
import { MIN_PASSWORD_LENGTH } from "@/modules/auth/domain/admin"
import { createAdminAction } from "../auth-actions"

export function SetupForm({ email }: { email: string }) {
	const [state, formAction, pending] = useActionState(createAdminAction, null)
	const errors = state?.fieldErrors

	return (
		<form action={formAction}>
			<FieldGroup>
				<Field>
					<FieldLabel htmlFor="email">Email</FieldLabel>
					<Input id="email" value={email} readOnly autoComplete="username" />
					<FieldDescription>Set by ADMIN_EMAIL.</FieldDescription>
				</Field>
				<Field>
					<FieldLabel htmlFor="name">Name</FieldLabel>
					<Input id="name" name="name" autoComplete="name" />
				</Field>
				<Field data-invalid={Boolean(errors?.password) || undefined}>
					<FieldLabel htmlFor="password">Password</FieldLabel>
					<Input
						id="password"
						name="password"
						type="password"
						autoComplete="new-password"
						minLength={MIN_PASSWORD_LENGTH}
						required
						aria-invalid={Boolean(errors?.password) || undefined}
					/>
					<FieldError>{errors?.password}</FieldError>
				</Field>
				<Field data-invalid={Boolean(errors?.confirm) || undefined}>
					<FieldLabel htmlFor="confirm">Confirm password</FieldLabel>
					<Input
						id="confirm"
						name="confirm"
						type="password"
						autoComplete="new-password"
						required
						aria-invalid={Boolean(errors?.confirm) || undefined}
					/>
					<FieldError>{errors?.confirm}</FieldError>
				</Field>
				{state?.message && !errors && <FieldError>{state.message}</FieldError>}
				<Button type="submit" size="lg" disabled={pending}>
					{pending ? "Creating…" : "Create account"}
				</Button>
			</FieldGroup>
		</form>
	)
}
