import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getIdentifier } from '@/lib/rate-limit'

export const runtime = 'nodejs'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const limiter = rateLimit({ windowMs: 60_000, maxRequests: 30 })

export async function POST(req: NextRequest) {
  const id = getIdentifier(req)
  const limit = limiter(id)
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many uploads. Please wait a moment and try again.' },
      {
        status: 429,
        headers: limit.retryAfter ? { 'Retry-After': String(limit.retryAfter) } : {},
      }
    )
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const validTypes = ['application/pdf', 'text/plain']
    if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.txt')) {
      return NextResponse.json(
        { error: 'Please upload a PDF or plain text file.' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File is too large. Please upload a file under 10MB.' },
        { status: 400 }
      )
    }

    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      const text = await file.text()
      return NextResponse.json({ text: text.trim() })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const pdfParse = (await import('pdf-parse')).default
    const data = await pdfParse(buffer)

    const text = data.text
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim()

    if (!text || text.length < 20) {
      return NextResponse.json(
        { error: 'Could not extract text from this PDF. It may be a scanned image. Please try copying and pasting the text directly.' },
        { status: 422 }
      )
    }

    return NextResponse.json({ text })
  } catch (error) {
    console.error('[parse-pdf] error:', error)
    return NextResponse.json(
      { error: 'Failed to read the file. Please try uploading again or paste the text directly.' },
      { status: 500 }
    )
  }
}
