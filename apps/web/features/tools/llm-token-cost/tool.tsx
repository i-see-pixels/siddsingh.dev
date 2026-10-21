"use client"

import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import { cn } from "@workspace/ui/lib/utils"
import { countTokens } from "gpt-tokenizer/encoding/o200k_base"
import { useDeferredValue, useMemo, useState } from "react"
import { monoTextarea, Pane, SplitLayout } from "../tool-ui"
import { models, pricesCheckedOn, tokenizerRatio } from "./models"

const SAMPLE = `You are a helpful assistant. Summarise the following support ticket in two sentences and suggest the next action.

Ticket: The checkout page throws a 500 error when a customer applies a discount code and a gift card in the same order.`

const formatWindow = (tokens: number) =>
	tokens >= 1_000_000 ? `${Math.round(tokens / 100_000) / 10}M` : `${Math.round(tokens / 1000)}k`

const money = (value: number) =>
	value < 0.01 && value > 0
		? `$${value.toFixed(5)}`
		: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)

export function LlmTokenCostTool() {
	const [text, setText] = useState(SAMPLE)
	const [outputTokens, setOutputTokens] = useState(500)
	const [requests, setRequests] = useState(1)
	const [prices, setPrices] = useState<Record<string, { input: number; output: number }>>({})

	const deferredText = useDeferredValue(text)
	const baseTokens = useMemo(() => countTokens(deferredText), [deferredText])

	const rows = models.map((model) => {
		const exact = model.provider === "OpenAI"
		const inputTokens = Math.round(baseTokens * tokenizerRatio[model.provider])
		const price = prices[model.id] ?? { input: model.inputPrice, output: model.outputPrice }
		const perRequest = (inputTokens * price.input + outputTokens * price.output) / 1_000_000
		return { model, exact, inputTokens, price, perRequest, total: perRequest * requests }
	})

	const setPrice = (id: string, key: "input" | "output", value: number) =>
		setPrices((current) => {
			const model = models.find((item) => item.id === id)
			if (!model) return current
			const existing = current[id] ?? { input: model.inputPrice, output: model.outputPrice }
			return { ...current, [id]: { ...existing, [key]: Number.isFinite(value) ? value : 0 } }
		})

	return (
		<SplitLayout>
			<Pane title="Prompt">
				<Textarea
					aria-label="Prompt text"
					className={monoTextarea}
					value={text}
					onChange={(event) => setText(event.target.value)}
					placeholder="Paste a prompt, document or code here"
					spellCheck={false}
				/>
				<div className="screen-line-top grid grid-cols-2 gap-3 p-3">
					<label className="flex flex-col gap-1 text-xs text-muted-foreground">
						Expected output tokens
						<Input
							type="number"
							min={0}
							value={outputTokens}
							onChange={(event) =>
								setOutputTokens(Math.max(0, Number(event.target.value)))
							}
						/>
					</label>
					<label className="flex flex-col gap-1 text-xs text-muted-foreground">
						Requests
						<Input
							type="number"
							min={1}
							value={requests}
							onChange={(event) =>
								setRequests(Math.max(1, Number(event.target.value)))
							}
						/>
					</label>
				</div>
			</Pane>
			<Pane
				title={`${baseTokens.toLocaleString()} tokens · ${deferredText.length.toLocaleString()} characters`}
			>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-line text-left font-mono text-xs text-muted-foreground uppercase">
								<th className="px-2.5 py-2 font-normal">Model</th>
								<th className="px-2.5 py-2 text-right font-normal">Context</th>
								<th className="px-2.5 py-2 text-right font-normal">Cost</th>
								<th className="px-2.5 py-2 text-right font-normal">
									$/1M in · out
								</th>
							</tr>
						</thead>
						<tbody>
							{rows.map(({ model, exact, inputTokens, price, perRequest, total }) => {
								const fit = (inputTokens + outputTokens) / model.contextWindow
								return (
									<tr
										key={model.id}
										className="border-b border-line align-top last:border-b-0"
									>
										<td className="px-2.5 py-2">
											<div className="font-medium whitespace-nowrap">
												{model.name}
											</div>
											<div className="text-xs text-muted-foreground">
												{model.provider} · {exact ? "" : "≈ "}
												{inputTokens.toLocaleString()} tokens
											</div>
										</td>
										<td className="px-2.5 py-2 text-right whitespace-nowrap tabular-nums">
											<span className={cn(fit > 1 && "text-destructive")}>
												{fit > 1
													? "Too long"
													: `${(fit * 100).toFixed(fit < 0.01 ? 2 : 1)}%`}
											</span>
											<div className="text-xs text-muted-foreground">
												of {formatWindow(model.contextWindow)}
											</div>
										</td>
										<td className="px-2.5 py-2 text-right whitespace-nowrap tabular-nums">
											<div className="font-medium">{money(total)}</div>
											{requests > 1 && (
												<div className="text-xs text-muted-foreground">
													{money(perRequest)} each
												</div>
											)}
										</td>
										<td className="px-2.5 py-2">
											<div className="flex justify-end gap-1">
												<PriceInput
													label={`${model.name} input price`}
													value={price.input}
													onChange={(value) =>
														setPrice(model.id, "input", value)
													}
												/>
												<PriceInput
													label={`${model.name} output price`}
													value={price.output}
													onChange={(value) =>
														setPrice(model.id, "output", value)
													}
												/>
											</div>
										</td>
									</tr>
								)
							})}
						</tbody>
					</table>
				</div>
				<p className="screen-line-top p-3 text-xs text-muted-foreground">
					OpenAI counts use OpenAI's published o200k_base tokenizer and should be very
					close. Anthropic and Google do not publish theirs, so those counts (≈) are
					estimates. Prices were read from each provider's pricing page on{" "}
					{pricesCheckedOn} and can change: edit any of them, and check the pricing page
					before relying on them.
				</p>
			</Pane>
		</SplitLayout>
	)
}

function PriceInput({
	label,
	value,
	onChange,
}: {
	label: string
	value: number
	onChange: (value: number) => void
}) {
	return (
		<Input
			type="number"
			min={0}
			step="any"
			aria-label={label}
			value={value}
			onChange={(event) => onChange(Number(event.target.value))}
			className="h-7 w-16 px-1.5 text-right text-xs tabular-nums"
		/>
	)
}
