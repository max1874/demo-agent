/**
 * The shapes this project sends and receives.
 *
 * Requests are the SDK's own type, minus what this layer already decides — we
 * are the writer there, and a wide type costs nothing because every extra field
 * is optional. Taking it from the SDK means every knob the API grows arrives on
 * its own instead of waiting for someone to remember it.
 *
 * Responses are narrowed by hand — we are the reader there, and a wide type
 * means handling variants that this project never produces.
 */

import type {
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions"

/** One message, exactly as the API defines it. */
export type Message = ChatCompletionMessageParam

/**
 * `model` is fixed when the client is built; streaming is not implemented yet.
 * Everything else the API accepts — `tool_choice`, `reasoning_effort`,
 * `verbosity`, `response_format`, the prompt-cache options — comes through.
 */
export type CompletionRequest = Omit<
  ChatCompletionCreateParamsNonStreaming,
  "model" | "stream"
>

/**
 * What a tool declares about itself. Kept narrow on purpose: the tool layer
 * only ever writes function tools, and should not have to know that the API's
 * `tools` array accepts other shapes.
 */
export interface ToolSchema {
  type: "function"
  function: {
    name: string
    description: string
    /** JSON Schema. */
    parameters: Record<string, unknown>
  }
}

export interface ToolCall {
  id: string
  type: "function"
  function: {
    name: string
    /** Raw JSON. Models emit invalid JSON; parsing is the tool layer's decision. */
    arguments: string
  }
}

export interface CompletionResult {
  content: string | null
  /** Non-empty only when `finish_reason` is "tool_calls"; may hold several. */
  tool_calls: ToolCall[]
  finish_reason: string
  usage: {
    prompt_tokens: number
    completion_tokens: number
    /** Thinking tokens, billed as output. Zero on non-reasoning models. */
    reasoning_tokens: number
    /** Prompt tokens served from cache, billed at a discount. */
    cached_tokens: number
  }
}
