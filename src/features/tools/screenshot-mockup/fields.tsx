"use client"

import { useEffect, useRef, useState } from "react"

import { Field, FieldContent, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"

export type SelectOption<T extends string> = {
	value: T
	label: string
}

function getSingleValue(value: number | readonly number[]) {
	return Array.isArray(value) ? (value[0] ?? 0) : value
}

function clampNumber(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value))
}

function normalizeHexColor(value: string, fallback: string) {
	const cleanValue = value
		.trim()
		.replace(/^#/, "")
		.replace(/[^0-9a-f]/gi, "")

	if (cleanValue.length === 3) {
		return `#${cleanValue
			.split("")
			.map((char) => char + char)
			.join("")
			.toUpperCase()}`
	}

	if (cleanValue.length === 6) {
		return `#${cleanValue.toUpperCase()}`
	}

	return fallback
}

function toHexInputValue(value: string) {
	return normalizeHexColor(value, "#000000").slice(1)
}

type SelectFieldProps<T extends string> = {
	id: string
	label: string
	value: T
	options: SelectOption<T>[]
	description?: string
	onValueChangeAction: (value: T) => void
}

export function SelectField<T extends string>({
	id,
	label,
	value,
	options,
	description,
	onValueChangeAction,
}: SelectFieldProps<T>) {
	return (
		<Field>
			<FieldLabel htmlFor={id}>{label}</FieldLabel>
			<FieldContent>
				<Select
					items={options}
					value={value}
					onValueChange={(nextValue) => {
						if (typeof nextValue === "string") {
							onValueChangeAction(nextValue as T)
						}
					}}
				>
					<SelectTrigger id={id} className="w-full" aria-label={label}>
						<SelectValue placeholder={label} />
					</SelectTrigger>
					<SelectContent align="start">
						<SelectGroup>
							{options.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
				{description ? <FieldDescription>{description}</FieldDescription> : null}
			</FieldContent>
		</Field>
	)
}

type SliderFieldProps = {
	id: string
	label: string
	value: number
	min: number
	max: number
	step?: number
	description?: string
	onValueChangeAction: (value: number) => void
}

export function SliderField({
	id,
	label,
	value,
	min,
	max,
	step = 1,
	description,
	onValueChangeAction,
}: SliderFieldProps) {
	const [localValue, setLocalValue] = useState(value)
	const [inputValue, setInputValue] = useState(String(value))
	const pendingValueRef = useRef(value)
	const animationFrameRef = useRef<number | null>(null)

	useEffect(() => {
		setLocalValue(value)
		setInputValue(String(value))
		pendingValueRef.current = value
	}, [value])

	useEffect(() => {
		return () => {
			if (animationFrameRef.current !== null) {
				cancelAnimationFrame(animationFrameRef.current)
			}
		}
	}, [])

	const commitValue = (nextValue: number) => {
		const safeValue = clampNumber(nextValue, min, max)

		pendingValueRef.current = safeValue
		setLocalValue(safeValue)
		setInputValue(String(safeValue))

		if (animationFrameRef.current !== null) {
			return
		}

		animationFrameRef.current = requestAnimationFrame(() => {
			animationFrameRef.current = null
			onValueChangeAction(pendingValueRef.current)
		})
	}

	return (
		<Field>
			<div className="flex items-center justify-between gap-3">
				<FieldLabel htmlFor={id}>{label}</FieldLabel>
				<Input
					type="number"
					min={min}
					max={max}
					step={step}
					value={inputValue}
					onChange={(event) => setInputValue(event.target.value)}
					onBlur={() => {
						const nextValue = Number(inputValue)
						commitValue(Number.isFinite(nextValue) ? nextValue : value)
					}}
					onKeyDown={(event) => {
						if (event.key === "Enter") {
							event.currentTarget.blur()
						}

						if (event.key === "Escape") {
							setInputValue(String(value))
							event.currentTarget.blur()
						}
					}}
					className="h-7 w-20 px-2 text-right text-xs"
					aria-label={`${label} value`}
				/>
			</div>
			<FieldContent>
				<Slider
					id={id}
					min={min}
					max={max}
					step={step}
					value={localValue}
					onValueChange={(nextValue) => commitValue(getSingleValue(nextValue))}
				/>
				{description ? <FieldDescription>{description}</FieldDescription> : null}
			</FieldContent>
		</Field>
	)
}

type ColorFieldProps = {
	id: string
	label: string
	value: string
	description?: string
	onChangeAction: (value: string) => void
}

export function ColorField({ id, label, value, description, onChangeAction }: ColorFieldProps) {
	const normalizedValue = normalizeHexColor(value, "#000000")
	const [inputValue, setInputValue] = useState(toHexInputValue(normalizedValue))

	useEffect(() => {
		setInputValue(toHexInputValue(normalizedValue))
	}, [normalizedValue])

	const commitInputValue = (nextInputValue: string) => {
		const nextColor = normalizeHexColor(nextInputValue, normalizedValue)

		setInputValue(toHexInputValue(nextColor))

		if (nextColor !== normalizedValue) {
			onChangeAction(nextColor)
		}
	}

	return (
		<Field>
			<FieldLabel htmlFor={id}>{label}</FieldLabel>
			<FieldContent>
				<div className="flex w-[108px] items-center gap-0 rounded-md border border-border/50 bg-secondary/40 p-1 transition-all hover:bg-secondary/60 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20">
					<div className="relative">
						<button
							type="button"
							tabIndex={-1}
							className="size-[22px] rounded-[4px] border border-border/50 shadow-sm"
							style={{ backgroundColor: normalizedValue }}
							aria-hidden="true"
						/>
						<Input
							id={id}
							type="color"
							value={normalizedValue}
							onChange={(event) => onChangeAction(event.target.value.toUpperCase())}
							className="absolute inset-0 size-[22px] cursor-pointer opacity-0"
							aria-label={label}
						/>
					</div>
					<Input
						value={inputValue}
						onChange={(event) => {
							const nextValue = event.target.value
								.replace(/^#/, "")
								.replace(/[^0-9a-f]/gi, "")
								.slice(0, 6)
								.toUpperCase()

							setInputValue(nextValue)
						}}
						onBlur={() => commitInputValue(inputValue)}
						onKeyDown={(event) => {
							if (event.key === "Enter") {
								event.currentTarget.blur()
							}

							if (event.key === "Escape") {
								setInputValue(toHexInputValue(normalizedValue))
								event.currentTarget.blur()
							}
						}}
						className="h-[22px] min-w-0 flex-1 border-0 bg-transparent px-1.5 py-0 font-mono text-[11px] uppercase shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
						aria-label={`${label} hex value`}
					/>
				</div>
				{description ? <FieldDescription>{description}</FieldDescription> : null}
			</FieldContent>
		</Field>
	)
}
