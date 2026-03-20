export type ReadingLevel = '5th' | '8th' | 'college'

export type Language =
  | 'en'
  | 'es'
  | 'zh'
  | 'ar'
  | 'fr'
  | 'pt'
  | 'vi'
  | 'ko'
  | 'hi'
  | 'ru'
  | 'tl'
  | 'ja'

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  es: 'Spanish',
  zh: 'Mandarin (简体)',
  ar: 'Arabic',
  fr: 'French',
  pt: 'Portuguese',
  vi: 'Vietnamese',
  ko: 'Korean',
  hi: 'Hindi',
  ru: 'Russian',
  tl: 'Tagalog',
  ja: 'Japanese',
}

export const READING_LEVEL_LABELS: Record<ReadingLevel, string> = {
  '5th': 'Simple',
  '8th': 'Clear',
  college: 'Complete',
}

export const READING_LEVEL_DESCRIPTIONS: Record<ReadingLevel, string> = {
  '5th': 'Short words, short sentences',
  '8th': 'Easy to follow, medical terms explained',
  college: 'Full detail, nothing left out',
}

export const LANGUAGES: Language[] = ['en', 'es', 'zh', 'ar', 'fr', 'pt', 'vi', 'ko', 'hi', 'ru', 'tl', 'ja']

export interface TranslateRequest {
  text: string
  readingLevel: ReadingLevel
  language: Language
}

export interface TranslateResponse {
  urgentItems: string[]
  translation: string
  summaryLine: string
}

export interface ShareSession {
  id: string
  original: string
  translation: string
  urgentItems: string[]
  summaryLine: string
  readingLevel: ReadingLevel
  language: Language
  createdAt: string
}

export interface VerifyResponse {
  passed: boolean
  confidence: 'high' | 'medium' | 'low'
  omissions: string[]
  inaccuracies: string[]
}
