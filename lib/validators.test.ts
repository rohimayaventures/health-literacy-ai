import { describe, it, expect } from 'vitest'
import { translateSchema, verifySchema, sharePostSchema } from './validators'

describe('translateSchema', () => {
  it('accepts valid input', () => {
    const result = translateSchema.safeParse({
      text: 'This is a valid clinical document with enough content to pass validation.',
      readingLevel: '8th',
      language: 'en',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty text', () => {
    const result = translateSchema.safeParse({
      text: '',
      readingLevel: '8th',
      language: 'en',
    })
    expect(result.success).toBe(false)
  })

  it('rejects text that is too short', () => {
    const result = translateSchema.safeParse({
      text: 'Short',
      readingLevel: '8th',
      language: 'en',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid readingLevel', () => {
    const result = translateSchema.safeParse({
      text: 'A valid document with enough characters to pass the minimum length check here.',
      readingLevel: 'invalid',
      language: 'en',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid language', () => {
    const result = translateSchema.safeParse({
      text: 'A valid document with enough characters to pass the minimum length check here.',
      readingLevel: '8th',
      language: 'xx',
    })
    expect(result.success).toBe(false)
  })
})

describe('verifySchema', () => {
  it('accepts valid input', () => {
    const result = verifySchema.safeParse({
      original: 'Original clinical text content.',
      translation: 'Plain language translation.',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing original', () => {
    const result = verifySchema.safeParse({
      original: '',
      translation: 'Some translation',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing translation', () => {
    const result = verifySchema.safeParse({
      original: 'Some original',
      translation: '',
    })
    expect(result.success).toBe(false)
  })
})

describe('sharePostSchema', () => {
  it('accepts valid input', () => {
    const result = sharePostSchema.safeParse({
      original: 'Original text',
      translation: 'Translation text',
      urgentItems: ['Item 1'],
      summaryLine: 'Summary',
      readingLevel: '5th',
      language: 'es',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing original', () => {
    const result = sharePostSchema.safeParse({
      original: '',
      translation: 'Translation',
      readingLevel: '8th',
      language: 'en',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing translation', () => {
    const result = sharePostSchema.safeParse({
      original: 'Original',
      translation: '',
      readingLevel: '8th',
      language: 'en',
    })
    expect(result.success).toBe(false)
  })
})
