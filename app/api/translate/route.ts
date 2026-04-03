import { NextRequest, NextResponse } from 'next/server'
import { SYSTEM_PROMPT } from '@/lib/system-prompt'
import { ReadingLevel } from '@/lib/types'
import { createMessageWithRetry } from '@/lib/anthropic'
import { translateSchema } from '@/lib/validators'
import { rateLimit, getIdentifier } from '@/lib/rate-limit'

const READING_LEVEL_NAMES: Record<ReadingLevel, string> = {
  '5th': 'Simple — very short sentences, everyday words only, one idea per sentence',
  '8th': 'Clear — easy to follow, medical terms always explained in plain words in the same sentence',
  college: 'Complete — full detail, thorough explanations, medical terms explained but nothing left out',
}

const limiter = rateLimit({ windowMs: 60_000, maxRequests: 20 })

export async function POST(req: NextRequest) {
  const id = getIdentifier(req)
  const limit = limiter(id)
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment and try again.' },
      {
        status: 429,
        headers: limit.retryAfter ? { 'Retry-After': String(limit.retryAfter) } : {},
      }
    )
  }

  try {
    const body = await req.json()
    const parsed = translateSchema.safeParse(body)
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? 'Invalid request'
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const { text, readingLevel, language } = parsed.data

    const userPrompt = `Reading level: ${READING_LEVEL_NAMES[readingLevel] ?? readingLevel}
Target language: ${language}
${language !== 'en' ? 'Translate the plain-language output to the target language. Do not translate the original clinical text first.' : ''}

Clinical document to translate:
---
${text.slice(0, 15000)}
---

Respond with only the JSON object as specified. No preamble.`

    const message = await createMessageWithRetry({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    let parsedJson
    try {
      const raw = content.text.replace(/```json\n?|\n?```/g, '').trim()
      parsedJson = JSON.parse(raw)
    } catch {
      throw new Error('Failed to parse Claude response as JSON')
    }

    if (!parsedJson.translation || !Array.isArray(parsedJson.urgentItems)) {
      throw new Error('Claude response missing required fields')
    }

    return NextResponse.json({
      urgentItems: parsedJson.urgentItems ?? [],
      translation: parsedJson.translation ?? '',
      summaryLine: parsedJson.summaryLine ?? '',
    })
  } catch (error) {
    console.error('[translate] error:', error)
    const message = error instanceof Error ? error.message : 'Translation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
