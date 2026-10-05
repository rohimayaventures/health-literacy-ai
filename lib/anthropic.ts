import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const TIMEOUT_MS = 90_000
const MAX_RETRIES = 2

function readEnv(name: string, fallback: string): string {
  const value = process.env[name]
  return value && value.trim() ? value.trim() : fallback
}

export const ANTHROPIC_MODEL = readEnv('ANTHROPIC_MODEL', 'claude-sonnet-5-5')
export const ANTHROPIC_FALLBACK_MODEL = readEnv(
  'ANTHROPIC_FALLBACK_MODEL',
  'claude-haiku-4-5-20251001'
)

type MessageParams = Omit<Anthropic.MessageCreateParams, 'model'>

function isModelUnavailable(err: unknown): boolean {
  const status =
    err && typeof err === 'object' && 'status' in err
      ? (err as { status?: number }).status
      : undefined
  if (status === 404) return true

  const message = err instanceof Error ? err.message : ''
  const detail =
    err && typeof err === 'object' && 'error' in err
      ? JSON.stringify((err as { error?: unknown }).error ?? '')
      : ''
  const text = `${message} ${detail}`.toLowerCase()
  return (
    text.includes('not_found_error') ||
    text.includes('not_found') ||
    text.includes('model_not_found') ||
    (text.includes('model') &&
      (text.includes('not found') || text.includes('does not exist') || text.includes('invalid model')))
  )
}

function usesTextOnlyThinking(model: string): boolean {
  return model === 'claude-sonnet-5-5' || model.startsWith('claude-sonnet-5-5-')
}

export function getAssistantText(message: Anthropic.Message): string {
  const block = message.content?.find((part) => part.type === 'text')
  if (block && block.type === 'text') return block.text

  const types = message.content?.map((part) => part.type).join(', ') || 'none'
  throw new Error(`Unexpected response type from Claude (${types})`)
}

async function createWithModel(
  params: MessageParams,
  model: string
): Promise<Anthropic.Message> {
  let lastError: unknown
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      const request = {
        ...params,
        model,
        ...(usesTextOnlyThinking(model) ? { thinking: { type: 'between_tools' } } : {}),
      } as Anthropic.MessageCreateParams

      const raw = await client.messages.create(request, {
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      const message = raw as Anthropic.Message
      getAssistantText(message)
      return message
    } catch (err) {
      clearTimeout(timeoutId)
      lastError = err
      if (isModelUnavailable(err)) break
      const isRetryable =
        err instanceof Error &&
        (err.name === 'AbortError' ||
          err.message?.includes('timeout') ||
          err.message?.includes('503') ||
          err.message?.includes('529'))
      if (!isRetryable || attempt === MAX_RETRIES) break
      await sleep(1000 * (attempt + 1))
    }
  }
  throw lastError
}

export async function createMessageWithRetry(
  params: MessageParams
): Promise<Anthropic.Message> {
  try {
    return await createWithModel(params, ANTHROPIC_MODEL)
  } catch (err) {
    if (!isModelUnavailable(err) || ANTHROPIC_MODEL === ANTHROPIC_FALLBACK_MODEL) {
      throw err
    }
    console.error(`Primary model unavailable, used fallback: ${ANTHROPIC_FALLBACK_MODEL}`)
    console.error(err)
    return await createWithModel(params, ANTHROPIC_FALLBACK_MODEL)
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
