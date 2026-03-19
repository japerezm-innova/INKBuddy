import { createOpenRouter } from '@openrouter/ai-sdk-provider'

export const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
})

export const MODELS = {
  fast: 'google/gemma-3-4b-it:free',
  vision: 'google/gemma-3-4b-it:free',
} as const

export const VISION_FALLBACKS = [
  'google/gemma-3-4b-it:free',
  'google/gemma-3-12b-it:free',
  'google/gemma-3-27b-it:free',
  'mistralai/mistral-small-3.1-24b-instruct:free',
  'nvidia/nemotron-nano-12b-v2-vl:free',
] as const

export type ModelKey = keyof typeof MODELS
