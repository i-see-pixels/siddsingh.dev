"use client"

import { PlusIcon, Trash2Icon } from "lucide-react"
import { type PointerEvent as ReactPointerEvent, useMemo, useRef, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldContent, FieldGroup, FieldLabel } from "@/components/ui/field"
import { cn } from "@/lib/utils"
import { ColorField, SliderField } from "./fields"
import type { GradientConfig, GradientStop } from "./types"

type GradientEditorProps = {
	config: GradientConfig
	onChangeAction: (config: GradientConfig) => void
}

function clamp(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value))
}

function createGradientStopId() {
	return globalThis.crypto?.randomUUID?.() ?? `gradient-stop-${Date.now()}`
}

function sortGradientStops(stops: GradientStop[]) {
	return [...stops].sort((firstStop, secondStop) => firstStop.position - secondStop.position)
}

function hexToRgb(hex: string) {
	const value = hex.replace("#", "")
	const expanded =
		value.length === 3
			? value
					.split("")
					.map((char) => char + char)
					.join("")
			: value

	return {
		r: Number.parseInt(expanded.slice(0, 2), 16) || 0,
		g: Number.parseInt(expanded.slice(2, 4), 16) || 0,
		b: Number.parseInt(expanded.slice(4, 6), 16) || 0,
	}
}

function rgbToHex(red: number, green: number, blue: number) {
	return `#${[red, green, blue]
		.map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0"))
		.join("")
		.toUpperCase()}`
}

function colorToRgba(color: string, opacity: number) {
	const rgb = hexToRgb(color)

	return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clamp(opacity, 0, 100) / 100})`
}

function buildGradientPreview(direction: number, stops: GradientStop[]) {
	const sortedStops = sortGradientStops(stops)
	const cssStops = sortedStops
		.map((stop) => `${colorToRgba(stop.color, stop.opacity)} ${stop.position}%`)
		.join(", ")

	return `linear-gradient(${direction}deg, ${cssStops})`
}

function getStopAtPosition(position: number, stops: GradientStop[]) {
	const sortedStops = sortGradientStops(stops)
	const previousStop =
		[...sortedStops].reverse().find((stop) => stop.position <= position) ?? sortedStops[0]
	const nextStop =
		sortedStops.find((stop) => stop.position >= position) ?? sortedStops[sortedStops.length - 1]

	if (!previousStop || !nextStop || previousStop.id === nextStop.id) {
		return {
			color: previousStop?.color ?? "#A8EDEA",
			opacity: previousStop?.opacity ?? 100,
		}
	}

	const distance = nextStop.position - previousStop.position
	const amount = distance === 0 ? 0 : (position - previousStop.position) / distance
	const previousColor = hexToRgb(previousStop.color)
	const nextColor = hexToRgb(nextStop.color)

	return {
		color: rgbToHex(
			previousColor.r + (nextColor.r - previousColor.r) * amount,
			previousColor.g + (nextColor.g - previousColor.g) * amount,
			previousColor.b + (nextColor.b - previousColor.b) * amount,
		),
		opacity: Math.round(
			previousStop.opacity + (nextStop.opacity - previousStop.opacity) * amount,
		),
	}
}

function getLargestGapPosition(stops: GradientStop[]) {
	const sortedStops = sortGradientStops(stops)
	let largestGap = 0
	let position = 50

	for (let index = 0; index < sortedStops.length - 1; index += 1) {
		const currentStop = sortedStops[index]
		const nextStop = sortedStops[index + 1]
		const gap = nextStop.position - currentStop.position

		if (gap > largestGap) {
			largestGap = gap
			position = currentStop.position + gap / 2
		}
	}

	return Math.round(position)
}

export function GradientEditor({ config, onChangeAction }: GradientEditorProps) {
	const barRef = useRef<HTMLDivElement | null>(null)
	const [activeStopId, setActiveStopId] = useState(config.stops[0]?.id ?? null)
	const sortedStops = useMemo(() => sortGradientStops(config.stops), [config.stops])
	const preview = useMemo(
		() => buildGradientPreview(config.direction, sortedStops),
		[config.direction, sortedStops],
	)

	const updateConfig = (nextPatch: Partial<GradientConfig>) => {
		onChangeAction({
			...config,
			...nextPatch,
		})
	}

	const updateStop = (stopId: string, patch: Partial<GradientStop>) => {
		updateConfig({
			stops: config.stops.map((stop) =>
				stop.id === stopId
					? {
							...stop,
							...patch,
							position:
								patch.position === undefined
									? stop.position
									: Math.round(clamp(patch.position, 0, 100)),
							opacity:
								patch.opacity === undefined
									? stop.opacity
									: Math.round(clamp(patch.opacity, 0, 100)),
						}
					: stop,
			),
		})
	}

	const deleteStop = (stopId: string) => {
		if (config.stops.length <= 2) {
			return
		}

		const nextStops = config.stops.filter((stop) => stop.id !== stopId)
		setActiveStopId(nextStops[0]?.id ?? null)
		updateConfig({ stops: nextStops })
	}

	const addStopAtPosition = (position: number) => {
		const nextPosition = Math.round(clamp(position, 0, 100))
		const stopBase = getStopAtPosition(nextPosition, config.stops)
		const nextStop: GradientStop = {
			id: createGradientStopId(),
			position: nextPosition,
			color: stopBase.color,
			opacity: stopBase.opacity,
		}

		setActiveStopId(nextStop.id)
		updateConfig({ stops: [...config.stops, nextStop] })
	}

	const getPointerPosition = (clientX: number) => {
		const bar = barRef.current

		if (!bar) {
			return 50
		}

		const bounds = bar.getBoundingClientRect()

		return clamp(((clientX - bounds.left) / bounds.width) * 100, 0, 100)
	}

	const handleStopPointer = (event: ReactPointerEvent<HTMLButtonElement>, stopId: string) => {
		event.preventDefault()
		event.stopPropagation()
		setActiveStopId(stopId)
		event.currentTarget.setPointerCapture(event.pointerId)
		updateStop(stopId, { position: getPointerPosition(event.clientX) })
	}

	return (
		<FieldGroup>
			<SliderField
				id="gradient-direction"
				label="Gradient angle"
				min={0}
				max={360}
				value={config.direction}
				description="Controls the direction of the gradient wash."
				onValueChangeAction={(nextValue) => updateConfig({ direction: nextValue })}
			/>

			<Field>
				<div className="flex items-center justify-between gap-3">
					<FieldLabel>Gradient stops</FieldLabel>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => addStopAtPosition(getLargestGapPosition(config.stops))}
					>
						<PlusIcon data-icon="inline-start" />
						Add
					</Button>
				</div>
				<FieldContent>
					<div
						ref={barRef}
						className="relative h-12 w-full rounded-md border border-border/60"
					>
						<button
							type="button"
							className="absolute inset-0 cursor-crosshair rounded-md"
							style={{ background: preview }}
							onClick={(event) =>
								addStopAtPosition(getPointerPosition(event.clientX))
							}
							aria-label="Add gradient stop"
						/>
						{sortedStops.map((stop) => (
							<span
								key={stop.id}
								className="absolute top-1/2"
								style={{ left: `${stop.position}%` }}
							>
								<button
									type="button"
									className={cn(
										"absolute left-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background shadow-sm ring-offset-background transition",
										activeStopId === stop.id
											? "ring-2 ring-primary ring-offset-2"
											: "ring-1 ring-border/70",
									)}
									style={{ backgroundColor: stop.color }}
									onClick={(event) => event.stopPropagation()}
									onPointerDown={(event) => handleStopPointer(event, stop.id)}
									onPointerMove={(event) => {
										if (event.buttons === 1) {
											updateStop(stop.id, {
												position: getPointerPosition(event.clientX),
											})
										}
									}}
									aria-label={`Gradient stop at ${stop.position}%`}
								/>
							</span>
						))}
					</div>
				</FieldContent>
			</Field>

			<div className="flex flex-col gap-3">
				{sortedStops.map((stop, index) => (
					<div
						key={stop.id}
						className={cn(
							"flex flex-col gap-3 rounded-lg border border-border/70 bg-background p-3",
							activeStopId === stop.id && "border-primary/60",
						)}
					>
						<div className="flex items-center justify-between gap-3">
							<Badge variant="outline">Stop {index + 1}</Badge>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={() => deleteStop(stop.id)}
								disabled={config.stops.length <= 2}
								aria-label={`Delete stop ${index + 1}`}
							>
								<Trash2Icon />
							</Button>
						</div>
						<ColorField
							id={`gradient-color-${stop.id}`}
							label="Color"
							value={stop.color}
							onChangeAction={(nextValue) => updateStop(stop.id, { color: nextValue })}
						/>
						<div className="grid gap-4 sm:grid-cols-2">
							<SliderField
								id={`gradient-position-${stop.id}`}
								label="Position"
								min={0}
								max={100}
								value={stop.position}
								onValueChangeAction={(nextValue) =>
									updateStop(stop.id, { position: nextValue })
								}
							/>
							<SliderField
								id={`gradient-opacity-${stop.id}`}
								label="Opacity"
								min={0}
								max={100}
								value={stop.opacity}
								onValueChangeAction={(nextValue) =>
									updateStop(stop.id, { opacity: nextValue })
								}
							/>
						</div>
					</div>
				))}
			</div>
		</FieldGroup>
	)
}
