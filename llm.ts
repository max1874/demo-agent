/**
 * The LLM call layer — the only file in this project that touches the model API.
 *
 * The agent loop consumes `Message` and `CompletionResult` and never sees an SDK
 * type, so changing provider or SDK means editing this file and nothing else.
 *
 * The dialect is OpenAI Chat Completions. Any endpoint implementing it
 * (OpenRouter, DeepSeek, vLLM, Ollama, ...) works by pointing `baseURL` at it.
 */

import OpenAI from "openai"

/** A tool the model may call. `parameters` is a JSON Schema object. */
export interface ToolSchema {
  name: string
  description: string
  parameters: Record<string, unknown>
}

/**
 * One tool invocation requested by the model.
 *
 * `arguments` stays a raw JSON string. The model can and does emit invalid
 * JSON, and choosing what to do about that is the tool layer's decision, not
 * this layer's — parsing here would force a policy on every caller.
 */
export interface ToolCall {
  id: string
  name: string
  arguments: string
}

export type Message =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  /** `content` is null when the model replied with tool calls only. */
  | { role: "assistant"; content: string | null; toolCalls?: ToolCall[] }
  /** One tool's result. `toolCallId` must match the id the model sent. */
  | { role: "tool"; toolCallId: string; content: string }

/**
 * Sampling controls. Every field is optional, and an absent field is dropped
 * from the request body entirely rather than defaulted.
 *
 * This matters: reasoning models (GPT-5 and later) reject any explicit
 * `temperature` other than 1 with a 400, so a hardcoded default here would make
 * the agent unable to run on the models it most wants to run on. Absent fields
 * work everywhere.
 */
export interface Sampling {
  temperature?: number
  topP?: number
  maxTokens?: number
}

export interface CompletionRequest {
  messages: Message[]
  tools?: ToolSchema[]
  sampling?: Sampling
}

export type FinishReason =
  | "stop"
  | "tool_calls"
  | "length"
  | "content_filter"
  | "unknown"

export interface Usage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export interface CompletionResult {
  content: string | null
  /** Empty unless `finishReason` is "tool_calls". Can hold several calls. */
  toolCalls: ToolCall[]
  finishReason: FinishReason
  usage: Usage
}

export interface LLMConfig {
  apiKey: string
  model: string
  /** Any OpenAI-compatible endpoint. Defaults to the OpenAI API. */
  baseURL?: string
}

export interface LLM {
  readonly model: string
  complete(req: CompletionRequest): Promise<CompletionResult>
}

export function createLLM(config: LLMConfig): LLM {
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  })

  return {
    model: config.model,

    async complete(req: CompletionRequest): Promise<CompletionResult> {
      const response = await client.chat.completions.create({
        model: config.model,
        messages: toApiMessages(req.messages),
        ...(req.tools?.length ? { tools: req.tools.map(toApiTool) } : {}),
        ...withoutUndefined({
          temperature: req.sampling?.temperature,
          top_p: req.sampling?.topP,
          // `max_tokens` is the legacy name and is rejected on strict reasoning
          // routes. If you point baseURL at an older compatible endpoint that
          // only knows `max_tokens`, this is the line to change.
          max_completion_tokens: req.sampling?.maxTokens,
        }),
      })

      const choice = response.choices[0]
      if (!choice) {
        throw new Error("Model returned no choices")
      }

      return {
        content: choice.message.content,
        toolCalls: (choice.message.tool_calls ?? [])
          .filter((call) => call.type === "function")
          .map((call) => ({
            id: call.id,
            name: call.function.name,
            arguments: call.function.arguments,
          })),
        finishReason: toFinishReason(choice.finish_reason),
        usage: {
          // Some compatible endpoints omit usage entirely.
          promptTokens: response.usage?.prompt_tokens ?? 0,
          completionTokens: response.usage?.completion_tokens ?? 0,
          totalTokens: response.usage?.total_tokens ?? 0,
        },
      }
    },
  }
}

/**
 * Build an LLM from the environment: OPENAI_API_KEY, OPENAI_MODEL, and
 * optionally OPENAI_BASE_URL. Both required variables must be set explicitly —
 * a default model would silently pin the project to whatever was current the
 * day it was written.
 */
export function llmFromEnv(): LLM {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set")
  }

  const model = process.env.OPENAI_MODEL
  if (!model) {
    throw new Error("OPENAI_MODEL is not set")
  }

  return createLLM({ apiKey, model, baseURL: process.env.OPENAI_BASE_URL })
}

type ApiMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam

function toApiMessages(messages: Message[]): ApiMessage[] {
  return messages.map((message): ApiMessage => {
    switch (message.role) {
      case "system":
      case "user":
        return { role: message.role, content: message.content }

      case "assistant":
        // The assistant message carrying tool_calls has to go back into history
        // verbatim. Drop it and the following "tool" messages reference call
        // ids the model can no longer see, which is a 400.
        return {
          role: "assistant",
          content: message.content,
          ...(message.toolCalls?.length
            ? {
                tool_calls: message.toolCalls.map((call) => ({
                  id: call.id,
                  type: "function" as const,
                  function: { name: call.name, arguments: call.arguments },
                })),
              }
            : {}),
        }

      case "tool":
        // Every tool call the model requested needs its own result message.
        // Answering two calls with one message is also a 400.
        return {
          role: "tool",
          tool_call_id: message.toolCallId,
          content: message.content,
        }
    }
  })
}

function toApiTool(tool: ToolSchema): OpenAI.Chat.Completions.ChatCompletionTool {
  return {
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }
}

function toFinishReason(reason: string | null): FinishReason {
  switch (reason) {
    case "stop":
    case "length":
    case "tool_calls":
    case "content_filter":
      return reason
    default:
      return "unknown"
  }
}

function withoutUndefined<T extends Record<string, unknown>>(
  object: T,
): Partial<T> {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== undefined),
  ) as Partial<T>
}
