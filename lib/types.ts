export type ReadingLevel = '5th' | '8th' | 'college'

export type Language =
  | 'en'
  | 'es'
  | 'ht'
  | 'pt'
  | 'fr'
  | 'zh'
  | 'vi'
  | 'tl'

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  es: 'Spanish',
  ht: 'Haitian Creole',
  pt: 'Portuguese',
  fr: 'French',
  zh: 'Mandarin (简体)',
  vi: 'Vietnamese',
  tl: 'Tagalog',
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
