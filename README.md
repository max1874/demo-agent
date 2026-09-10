<p align="center">
  <img src="assets/brand/original-banner.png" alt="demo-agent — ideas into action" width="100%">
</p>

<p align="center">
  A small TypeScript agent project, starting with an explicit model interface.
</p>

<p align="center">
  <a href="#the-model-layer">Model layer</a> ·
  <a href="#configuration">Configuration</a> ·
  <a href="assets/README.md">Brand assets</a>
</p>

## Status

Early development. The model API adapter is implemented in [`llm.ts`](llm.ts). The agent loop and executable entry point are not present yet.

`package.json` currently points `npm start` at a missing `index.ts` and does not declare dependencies. This checkout is therefore not ready for `npm install && npm start`.

## The model layer

The project exposes a small set of application types around the OpenAI Chat Completions API:

| Interface | Purpose |
| --- | --- |
| `Message` | System, user, assistant, and tool-result history |
| `ToolSchema` | Function descriptions and JSON Schema parameters |
| `LLM.complete()` | Submit messages and optional tools to a model |
| `CompletionResult` | Text, tool calls, finish reason, and token usage |

`createLLM()` accepts explicit configuration. `llmFromEnv()` reads it from the environment. SDK message conversion stays inside `llm.ts`, so callers can use the project's own types.

Tool-call arguments are returned as raw JSON strings. Parsing arguments, executing tools, and continuing the conversation belong to the future agent loop. Endpoint compatibility depends on support for the request fields used by the adapter.

## Configuration

[`.env.example`](.env.example) lists the settings consumed by `llmFromEnv()`:

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | Yes | Credential for the selected endpoint |
| `OPENAI_MODEL` | Yes | Explicit model identifier |
| `OPENAI_BASE_URL` | No | Override the SDK's default API endpoint |

The current code reads `process.env`; it does not load `.env` files automatically. Set these variables in the process environment or configure environment-file loading in the eventual entry point.

The intended calling pattern, once dependencies and an entry point are added:

```ts
import { llmFromEnv } from "./llm.ts"

const llm = llmFromEnv()
const result = await llm.complete({
  messages: [{ role: "user", content: "Turn this idea into a concrete plan." }],
})

console.log(result.content)
```

This example makes one completion request; it does not run tools or implement an agent loop.

## Project layout

```text
assets/
  README.md             Asset guide
  brand/                Logos, icons, original artwork, and visual comparison
llm.ts                  Model API adapter and application interfaces
.env.example            Configuration reference
package.json            Project metadata and intended start command
tsconfig.json           TypeScript configuration
```

## Visual identity

The identity combines a sphere with three layered cards, using charcoal, ivory, and warm light. The original dark icon is the geometry reference for the SVG family.

See the [asset guide](assets/README.md) for recommended files and the [brand notes](assets/brand/README.md) for tracing and typography limitations. Open [`assets/brand/preview.html`](assets/brand/preview.html) locally for the comparison sheet; GitHub displays HTML source rather than running it.
