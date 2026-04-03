import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const TIMEOUT_MS = 90_000
const MAX_RETRIES = 2

export async function createMessageWithRetry(
  params: Anthropic.MessageCreateParams
): Promise<Anthropic.Message> {
  let lastError: unknown
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      const raw = await client.messages.create(params, {
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      const message = raw as Anthropic.Message
      const content = message.content?.[0]
      if (!content) {
        throw new Error('Empty response from Claude')
      }
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude')
      }

      return message
    } catch (err) {
      clearTimeout(timeoutId)
      lastError = err
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

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
