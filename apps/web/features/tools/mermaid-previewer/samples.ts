export const samples = [
	{
		name: "Flowchart",
		code: `flowchart TD
    A([Request]):::start --> B{Cached?}:::decision
    B -- yes --> C[Return cached response]:::ok
    B -- no --> D[Call the model]
    D --> E[Store in cache]
    E --> C
    classDef start fill:#dcfce7,stroke:#22c55e,color:#14532d
    classDef decision fill:#fef3c7,stroke:#f59e0b,color:#78350f
    classDef ok fill:#ede9fe,stroke:#8b5cf6,color:#3b0764`,
	},
	{
		name: "Sequence",
		code: `sequenceDiagram
    participant U as User
    participant A as API
    participant M as LLM
    U->>A: POST /chat
    A->>M: messages + tools
    M-->>A: tool_use
    A->>A: run tool
    A->>M: tool_result
    M-->>A: final answer
    A-->>U: 200 OK`,
	},
	{
		name: "Entity relationship",
		code: `erDiagram
    USER ||--o{ CONVERSATION : starts
    CONVERSATION ||--|{ MESSAGE : contains
    USER {
        string id
        string email
    }
    MESSAGE {
        string id
        string role
        text content
    }`,
	},
	{
		name: "State machine",
		code: `stateDiagram-v2
    [*] --> Idle
    Idle --> Running: start
    Running --> Idle: stop
    Running --> Failed: error
    Failed --> Idle: reset
    Failed --> [*]`,
	},
	{
		name: "Gantt",
		code: `gantt
    title Launch plan
    dateFormat YYYY-MM-DD
    section Build
    API           :a1, 2026-01-05, 10d
    Frontend      :a2, after a1, 8d
    section Ship
    Beta          :b1, after a2, 5d`,
	},
]
