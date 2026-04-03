import { z } from 'zod'

const READING_LEVELS = ['5th', '8th', 'college'] as const
const LANGUAGES = ['en', 'es', 'zh', 'ar', 'fr', 'pt', 'vi', 'ko', 'hi', 'ru', 'tl', 'ja'] as const

export const translateSchema = z.object({
  text: z.string().min(1, 'No text provided').transform((s) => s.trim()).refine((s) => s.length >= 20, {
    message: 'Document appears too short. Please paste or upload a complete medical document.',
  }).refine((s) => s.length <= 15000, { message: 'Document is too long. Please shorten to under 15,000 characters.' }),
  readingLevel: z.enum(READING_LEVELS),
  language: z.enum(LANGUAGES),
})

export const verifySchema = z.object({
  original: z.string().min(1, 'Missing original').transform((s) => s.trim()).refine((s) => s.length <= 12000, {
    message: 'Original text is too long.',
  }),
  translation: z.string().min(1, 'Missing translation').transform((s) => s.trim()).refine((s) => s.length <= 8000, {
    message: 'Translation text is too long.',
  }),
})

export const sharePostSchema = z.object({
  original: z.string().min(1, 'Missing original').refine((s) => s.length <= 50000, { message: 'Original text is too long.' }),
  translation: z.string().min(1, 'Missing translation').refine((s) => s.length <= 100000, { message: 'Translation text is too long.' }),
  urgentItems: z.array(z.string()).optional().default([]),
  summaryLine: z.string().optional().default(''),
  readingLevel: z.enum(READING_LEVELS),
  language: z.enum(LANGUAGES),
})

export type TranslateInput = z.infer<typeof translateSchema>
export type VerifyInput = z.infer<typeof verifySchema>
export type SharePostInput = z.infer<typeof sharePostSchema>
