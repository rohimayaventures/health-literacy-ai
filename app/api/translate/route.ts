import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { SYSTEM_PROMPT } from '@/lib/system-prompt'
import { ReadingLevel, Language } from '@/lib/types'

const client = new Anthropic()

const READING_LEVEL_NAMES: Record<ReadingLevel, string> = {
  '5th': 'Simple — very short sentences, everyday words only, one idea per sentence',
  '8th': 'Clear — easy to follow, medical terms always explained in plain words in the same sentence',
  college: 'Complete — full detail, thorough explanations, medical terms explained but nothing left out',
}

export async function POST(req: NextRequest) {
  try {
    const { text, readingLevel, language } = (await req.json()) as {
      text: string
      readingLevel: ReadingLevel
      language: Language
    }

    if (!text?.trim()) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 })
    }

    if (text.trim().length < 20) {
      return NextResponse.json(
        { error: 'Document appears too short. Please paste or upload a complete medical document.' },
        { status: 400 }
      )
    }

    const userPrompt = `Reading level: ${READING_LEVEL_NAMES[readingLevel] || readingLevel}
Target language: ${language}
${language !== 'en' ? 'Translate the plain-language output to the target language. Do not translate the original clinical text first.' : ''}

Clinical document to translate:
---
${text.slice(0, 15000)}
---

Respond with only the JSON object as specified. No preamble.`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    let parsed
    try {
      const raw = content.text.replace(/```json\n?|\n?```/g, '').trim()
      parsed = JSON.parse(raw)
    } catch {
      throw new Error('Failed to parse Claude response as JSON')
    }

    if (!parsed.translation || !Array.isArray(parsed.urgentItems)) {
      throw new Error('Claude response missing required fields')
    }

    return NextResponse.json({
      urgentItems: parsed.urgentItems ?? [],
      translation: parsed.translation ?? '',
      summaryLine: parsed.summaryLine ?? '',
    })
  } catch (error) {
    console.error('[translate] error:', error)
    const message = error instanceof Error ? error.message : 'Translation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
