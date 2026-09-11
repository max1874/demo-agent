/**
 * The only file that talks to the model API.
 *
 * The dialect is OpenAI Chat Completions, so any compatible endpoint
 * (OpenRouter, DeepSeek, vLLM, Ollama, ...) works by pointing `baseURL` at it.
 */

import OpenAI from "openai"

import type { CompletionRequest, CompletionResult } from "./types.js"

export interface LLMConfig {
  apiKey: string
  model: string
  /** Any OpenAI-compatible endpoint. Defaults to the OpenAI API. */
  baseURL?: string
}

export type LLM = ReturnType<typeof createLLM>

/**
 * Holds one model's configuration. Call it once per model you use — the caller
 * decides how many exist and how long they live, which is why this is a factory
 * and not a module-level singleton.
 */
export function createLLM({ apiKey, model, baseURL }: LLMConfig) {
  const client = new OpenAI({ apiKey, baseURL })

  return {
    model,

    async complete(req: CompletionRequest): Promise<CompletionResult> {
      // `req` already carries OpenAI's own field names, so it goes out as is.
      const res = await client.chat.completions.create({ model, ...req })

      // `choices` is a legacy array that holds exactly one entry in practice.
      // Failing here keeps a missing result from surfacing three layers away.
      const choice = res.choices[0]
      if (!choice) throw new Error("Model returned no choices")

      return {
        content: choice.message.content,
        tool_calls: (choice.message.tool_calls ?? []).filter(
          (call) => call.type === "function",
        ),
        finish_reason: choice.finish_reason ?? "unknown",
        usage: {
          // Some compatible endpoints omit usage, or parts of it, entirely.
          prompt_tokens: res.usage?.prompt_tokens ?? 0,
          completion_tokens: res.usage?.completion_tokens ?? 0,
          reasoning_tokens:
            res.usage?.completion_tokens_details?.reasoning_tokens ?? 0,
          cached_tokens: res.usage?.prompt_tokens_details?.cached_tokens ?? 0,
        },
      }
    },
  }
}
