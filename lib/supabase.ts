import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string
          original: string
          translation: string
          urgent_items: string[]
          summary_line: string
          reading_level: string
          language: string
          created_at: string
        }
        Insert: {
          id?: string
          original: string
          translation: string
          urgent_items: string[]
          summary_line: string
          reading_level: string
          language: string
          created_at?: string
        }
      }
    }
  }
}
