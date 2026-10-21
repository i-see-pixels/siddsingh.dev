export type SchemaFormat = "json-schema" | "anthropic" | "openai-chat" | "openai-responses"

export const formatLabels: Record<SchemaFormat, string> = {
	"json-schema": "JSON Schema",
	anthropic: "Anthropic tool",
	"openai-chat": "OpenAI Chat Completions",
	"openai-responses": "OpenAI Responses",
}

type Json = Record<string, unknown>

export type ToolDefinition = {
	name: string
	description: string
	schema: Json
}

const isObject = (value: unknown): value is Json =>
	typeof value === "object" && value !== null && !Array.isArray(value)

const text = (value: unknown) => (typeof value === "string" ? value : "")

/** Work out which shape the pasted JSON has and pull the common parts out of it. */
export function parseDefinition(
	input: string,
): { ok: true; format: SchemaFormat; tool: ToolDefinition } | { ok: false; error: string } {
	let data: unknown
	try {
		data = JSON.parse(input)
	} catch (error) {
		return { ok: false, error: error instanceof Error ? error.message : "Invalid JSON" }
	}
	if (!isObject(data)) return { ok: false, error: "Expected a JSON object at the top level." }

	// Chat Completions: { type: "function", function: { name, description, parameters } }
	if (isObject(data.function)) {
		const fn = data.function
		return {
			ok: true,
			format: "openai-chat",
			tool: {
				name: text(fn.name),
				description: text(fn.description),
				schema: isObject(fn.parameters) ? fn.parameters : {},
			},
		}
	}
	// Anthropic: { name, description, input_schema }
	if (isObject(data.input_schema)) {
		return {
			ok: true,
			format: "anthropic",
			tool: {
				name: text(data.name),
				description: text(data.description),
				schema: data.input_schema,
			},
		}
	}
	// Responses (flat function) or legacy function: { name, description, parameters }
	if (isObject(data.parameters)) {
		return {
			ok: true,
			format: "openai-responses",
			tool: {
				name: text(data.name),
				description: text(data.description),
				schema: data.parameters,
			},
		}
	}
	// Otherwise treat it as a bare JSON Schema.
	return {
		ok: true,
		format: "json-schema",
		tool: { name: "", description: text(data.description), schema: data },
	}
}

export function buildDefinition(
	format: SchemaFormat,
	tool: ToolDefinition,
	options: { strict: boolean },
): Json {
	const { name, description, schema } = tool
	switch (format) {
		case "json-schema":
			return schema
		case "anthropic":
			return { name, description, input_schema: schema }
		case "openai-chat":
			return {
				type: "function",
				function: {
					name,
					description,
					parameters: schema,
					...(options.strict ? { strict: true } : {}),
				},
			}
		case "openai-responses":
			return {
				type: "function",
				name,
				description,
				parameters: schema,
				...(options.strict ? { strict: true } : {}),
			}
	}
}

/**
 * OpenAI strict mode needs every object to list all properties as required and to
 * forbid extras. Returns a copy of the schema with those rules applied.
 */
export function makeStrict(schema: unknown): unknown {
	if (Array.isArray(schema)) return schema.map(makeStrict)
	if (!isObject(schema)) return schema
	const copy: Json = {}
	for (const [key, value] of Object.entries(schema)) copy[key] = makeStrict(value)
	if (copy.type === "object" && isObject(copy.properties)) {
		copy.required = Object.keys(copy.properties)
		copy.additionalProperties = false
	}
	return copy
}

const NAME_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/

/** Problems that make a provider reject the tool; shown next to the output. */
export function validate(format: SchemaFormat, tool: ToolDefinition, strict: boolean): string[] {
	const issues: string[] = []
	const { schema } = tool

	if (format !== "json-schema") {
		if (!tool.name) issues.push("Add a tool name.")
		else if (!NAME_PATTERN.test(tool.name))
			issues.push(
				"Tool names may only use letters, numbers, underscores and hyphens (max 64).",
			)
		if (!tool.description)
			issues.push("A description helps the model decide when to call the tool.")
	}
	if (format !== "json-schema" && schema.type !== "object") {
		issues.push('The root of the input schema must have "type": "object".')
	}

	const walk = (node: unknown, path: string) => {
		if (!isObject(node)) return
		if (isObject(node.properties)) {
			const keys = Object.keys(node.properties)
			if (Array.isArray(node.required)) {
				for (const key of node.required) {
					if (typeof key === "string" && !keys.includes(key))
						issues.push(
							`${path || "root"}: "${key}" is required but not defined in properties.`,
						)
				}
			}
			if (strict) {
				const required = Array.isArray(node.required) ? node.required : []
				if (keys.some((key) => !required.includes(key)))
					issues.push(
						`${path || "root"}: strict mode needs every property listed in required.`,
					)
				if (node.additionalProperties !== false)
					issues.push(
						`${path || "root"}: strict mode needs "additionalProperties": false.`,
					)
			}
			for (const [key, child] of Object.entries(node.properties))
				walk(child, `${path}.${key}`.replace(/^\./, ""))
		}
		if (isObject(node.items)) walk(node.items, `${path}[]`)
	}
	walk(schema, "")
	return issues
}

/** Shorter names for the output tabs, so they fit on one row. */
export const tabLabels: Record<SchemaFormat, string> = {
	"json-schema": "JSON Schema",
	anthropic: "Anthropic",
	"openai-chat": "OpenAI Chat",
	"openai-responses": "OpenAI Responses",
}
