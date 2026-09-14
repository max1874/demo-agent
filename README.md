<div align="center">
  <img src="assets/brand/original-icon-dark.png" width="160" alt="demo-agent icon">
  <h1>demo-agent</h1>
  <p><strong>Ideas into action.</strong></p>
  <p>
    <img alt="TypeScript 7" src="https://img.shields.io/badge/TypeScript-7-3178C6?logo=typescript&logoColor=white">
    <img alt="Node 24+" src="https://img.shields.io/badge/Node-24%2B-5FA04E?logo=nodedotjs&logoColor=white">
    <img alt="OpenAI-compatible" src="https://img.shields.io/badge/API-OpenAI--compatible-111827?logo=openai&logoColor=white">
    <img alt="PolyForm Noncommercial License" src="https://img.shields.io/badge/license-Noncommercial-f59e0b">
    <img alt="No framework" src="https://img.shields.io/badge/framework-none-06b6d4">
  </p>
  <p><a href="#what-does-the-model-layer-look-like"><strong>Read the model layer</strong></a> · <a href="assets/README.md">Brand assets</a></p>
</div>

demo-agent is an agent written from scratch in TypeScript: no framework, no
abstraction you did not read, no file long enough to lose your place in. It is
where ideas about how an agent should actually be built get tried out, which
only works if the whole thing stays small enough to hold in your head.

Every layer is a plain file at the root of the repository. The model call is
`llm.ts`. The types everyone shares are `types.ts`. When the loop arrives it
will be `agent.ts`, and it will be one file you can read top to bottom.

## What state is this in?

Early. The model layer is implemented and the agent loop is not.

| Piece | File | State |
| --- | --- | --- |
| Shared types | [`types.ts`](types.ts) | Implemented |
| Model calls | [`llm.ts`](llm.ts) | Implemented, not yet exercised against a live endpoint |
| Agent loop | `agent.ts` | Not started |
| Tools | `tools/` | Not started |
| Entry point | `index.ts` | Not started — `pnpm start` points at a file that does not exist yet |

Nothing here has been run against a real model yet, and the types have not been
compiled. Treat the code as read-only until `index.ts` lands.

## Why not just use a framework?

Because the loop is the point. A framework earns its keep by letting you skip
the question of how the agent works; this project exists to answer that
question, so importing someone else's answer would leave nothing behind.

The practical version of the same argument: an agent is a `while` loop around
one HTTP call. The interesting decisions are which messages you keep, how tools
describe themselves, and what you do when the model returns something you did
not expect. None of those get easier by being wrapped.

## What does the model layer look like?

One file talks to the model API, and it exposes one function.

```ts
import { createLLM } from "./llm.js"

const llm = createLLM({
  apiKey: process.env.OPENAI_API_KEY!,
  model: "gpt-5.5",
})

const result = await llm.complete({
  messages: [{ role: "user", content: "What is in this directory?" }],
  tools: [readDirectory],
})

for (const call of result.tool_calls) {
  // call.function.name, call.function.arguments
}
```

The types split along a line that decides how wide each side should be:

| Direction | Type | Source | Why |
| --- | --- | --- | --- |
| Request | `CompletionRequest` | The SDK's own type, minus `model` and `stream` | We are the writer. Extra fields are optional and cost nothing, and every knob the API grows — `tool_choice`, `reasoning_effort`, `verbosity`, `response_format` — arrives without anyone remembering to add it |
| Response | `CompletionResult` | Written by hand, narrowed | We are the reader. A wide type means handling variants this project never produces |

Three details in `llm.ts` exist because the API punishes the obvious version:

- **Sampling knobs are omitted, never defaulted.** Reasoning models reject an
  explicit `temperature` other than 1 with a 400, so a hardcoded default would
  lock the project out of the models it most wants to run on.
- **`arguments` stays a raw JSON string.** Models emit invalid JSON; what to do
  about that belongs to the tool layer, not to the transport.
- **An assistant message carrying `tool_calls` goes back into history verbatim,
  and every call it made needs its own `tool` reply.** Breaking either rule is
  a 400 on the next turn.

Because the dialect is OpenAI Chat Completions, any endpoint that implements it
— OpenRouter, DeepSeek, vLLM, Ollama — works by pointing `baseURL` at it.

## What do I need to run it?

- Node 24 or later
- pnpm (the repository pins it through `packageManager`)
- An API key for any service speaking the OpenAI Chat Completions format

```bash
pnpm install
```

Configuration is read from the environment. Nothing is written to disk.

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Credential for whichever endpoint you point at |
| `OPENAI_MODEL` | Model id, for example `gpt-5.5` |
| `OPENAI_BASE_URL` | Optional. Any OpenAI-compatible endpoint |

## License

[PolyForm Noncommercial 1.0.0](LICENSE) © 2026 Max.

Free to use, change, and share for any noncommercial purpose — personal work,
research, teaching, charity. Commercial use needs a separate licence; open an
issue. This is source-available rather than open source: an open-source licence
cannot restrict the field of use, and this one does.
