import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sharePostSchema } from '@/lib/validators'
import { rateLimit, getIdentifier } from '@/lib/rate-limit'

const SESSION_TTL_DAYS = 90

const limiter = rateLimit({ windowMs: 60_000, maxRequests: 30 })

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
    const parsed = sharePostSchema.safeParse(body)
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? 'Invalid request'
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const {
      original,
      translation,
      urgentItems,
      summaryLine,
      readingLevel,
      language,
    } = parsed.data

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS)

    const { data, error } = await supabase
      .from('sessions')
      .insert({
        original: original.slice(0, 20000),
        translation,
        urgent_items: urgentItems ?? [],
        summary_line: summaryLine ?? '',
        reading_level: readingLevel,
        language,
        expires_at: expiresAt.toISOString(),
      })
      .select('id')
      .single()

    if (error || !data) {
      console.error('[share] supabase insert error:', error)
      return NextResponse.json({ error: 'Failed to save session' }, { status: 500 })
    }

    return NextResponse.json({ id: data.id })
  } catch (error) {
    console.error('[share] error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'No session ID provided' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const expiresAt = data.expires_at ? new Date(data.expires_at) : null
    if (expiresAt && expiresAt < new Date()) {
      return NextResponse.json({ error: 'This share link has expired' }, { status: 410 })
    }

    return NextResponse.json({
      id: data.id,
      original: data.original,
      translation: data.translation,
      urgentItems: data.urgent_items,
      summaryLine: data.summary_line,
      readingLevel: data.reading_level,
      language: data.language,
      createdAt: data.created_at,
      expiresAt: data.expires_at ?? null,
    })
  } catch (error) {
    console.error('[share/get] error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
