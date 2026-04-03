import { NextRequest, NextResponse } from 'next/server'
import { createMessageWithRetry } from '@/lib/anthropic'
import { verifySchema } from '@/lib/validators'
import { rateLimit, getIdentifier } from '@/lib/rate-limit'

const VERIFY_SYSTEM_PROMPT = `You are a clinical translation quality auditor for HealthLiteracy AI. Your job is to compare an original clinical document against a plain-language translation and identify anything that was omitted or meaningfully changed.

You are NOT rewriting or grading the translation. You are only checking for:
1. Missing critical content — diagnoses, medications with dosages, follow-up appointments with dates/providers, warning signs, activity restrictions, diet restrictions, wound care instructions, or any other required patient action that appears in the original but not in the translation
2. Meaningful inaccuracies — cases where the translation changes the clinical meaning of something important (wrong dosage, wrong timeframe, wrong body part, inverted instruction)

Do NOT flag:
- Simpler wording or paraphrasing — this is expected and correct
- Medical jargon replaced with plain language — this is the point
- Reordering of information
- Added reassuring language not in the original — this is expected
- Stylistic differences

Be precise and specific. If you flag an omission, quote the relevant phrase from the original. If you flag an inaccuracy, quote both the original and the translation text.

Respond ONLY with this exact JSON structure. No preamble, no explanation, no markdown fences:

{
  "passed": true or false,
  "confidence": "high" or "medium" or "low",
  "omissions": [
    "Specific item from the original that is missing from the translation"
  ],
  "inaccuracies": [
    "Specific inaccuracy: original says X, translation says Y"
  ]
}

If nothing is missing and nothing is inaccurate, return:
{ "passed": true, "confidence": "high", "omissions": [], "inaccuracies": [] }

confidence levels:
- "high": you are confident the check is thorough and the result is reliable
- "medium": the document was complex or ambiguous and there is some chance of false positives or false negatives
- "low": the document was very long, highly technical, or structured in a way that made comparison difficult`

const limiter = rateLimit({ windowMs: 60_000, maxRequests: 15 })

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
    const parsed = verifySchema.safeParse(body)
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? 'Invalid request'
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const { original, translation } = parsed.data

    const userPrompt = `ORIGINAL CLINICAL DOCUMENT:
---
${original.slice(0, 12000)}
---

PLAIN-LANGUAGE TRANSLATION:
---
${translation.slice(0, 8000)}
---

Check the translation against the original. Identify any critical clinical information that was omitted or meaningfully changed. Return only the JSON object.`

    const message = await createMessageWithRetry({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: VERIFY_SYSTEM_PROMPT,
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
      throw new Error('Failed to parse verification response')
    }

    return NextResponse.json({
      passed: Boolean(parsedJson.passed),
      confidence: parsedJson.confidence ?? 'medium',
      omissions: Array.isArray(parsedJson.omissions) ? parsedJson.omissions : [],
      inaccuracies: Array.isArray(parsedJson.inaccuracies) ? parsedJson.inaccuracies : [],
    })
  } catch (error) {
    console.error('[verify] error:', error)
    const message = error instanceof Error ? error.message : 'Verification failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
