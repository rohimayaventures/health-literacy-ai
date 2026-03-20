import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ReadingLevel, Language } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      original,
      translation,
      urgentItems,
      summaryLine,
      readingLevel,
      language,
    } = body as {
      original: string
      translation: string
      urgentItems: string[]
      summaryLine: string
      readingLevel: ReadingLevel
      language: Language
    }

    if (!translation || !original) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('sessions')
      .insert({
        original: original.slice(0, 20000),
        translation,
        urgent_items: urgentItems ?? [],
        summary_line: summaryLine ?? '',
        reading_level: readingLevel,
        language,
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

    return NextResponse.json({
      id: data.id,
      original: data.original,
      translation: data.translation,
      urgentItems: data.urgent_items,
      summaryLine: data.summary_line,
      readingLevel: data.reading_level,
      language: data.language,
      createdAt: data.created_at,
    })
  } catch (error) {
    console.error('[share/get] error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
