'use client'

import { useEffect, useState } from 'react'
import { ShareSession, LANGUAGE_LABELS, READING_LEVEL_LABELS, ReadingLevel, Language } from '@/lib/types'

export default function ShareView({ id }: { id: string }) {
  const [session, setSession] = useState<ShareSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/share?id=${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setSession(data)
        document.documentElement.lang =
          (
            {
              en: 'en',
              es: 'es',
              ht: 'ht',
              pt: 'pt-BR',
              fr: 'fr',
              zh: 'zh-Hans',
              vi: 'vi',
              tl: 'fil',
            } as Record<Language, string>
          )[data.language as Language] ?? 'en'
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading...
      </div>
    )
  }

  if (error || !session) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--urgent-text)' }}>
        {error ?? 'Session not found.'}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '1rem 2rem',
        }}
      >
        <a
          href="/"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.375rem',
            fontWeight: 500,
            color: 'var(--text-primary)',
            textDecoration: 'none',
          }}
        >
          HealthLiteracy AI
        </a>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          Shared plain-language translation
        </p>
      </header>

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        <div
          style={{
            background: 'var(--primary-light)',
            border: '1px solid var(--primary)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          <p style={{ color: 'var(--primary-text)', fontWeight: 500, lineHeight: 1.5 }}>
            {session.summaryLine}
          </p>
        </div>

        {session.urgentItems.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                letterSpacing: '0.08em',
                color: 'var(--urgent-text)',
                marginBottom: '0.75rem',
              }}
            >
              IMPORTANT — DO THESE THINGS
            </p>
            {session.urgentItems.map((item, i) => (
              <div key={i} className="urgent-card" style={{ marginBottom: '8px' }}>
                <div className="urgent-dot" />
                <p style={{ color: 'var(--urgent-text)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                  {item}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="card" style={{ padding: '1.75rem', marginBottom: '1rem' }}>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              letterSpacing: '0.08em',
              color: 'var(--primary)',
              marginBottom: '1.25rem',
            }}
          >
            PLAIN LANGUAGE ·{' '}
            {READING_LEVEL_LABELS[session.readingLevel as ReadingLevel]?.toUpperCase()} ·{' '}
            {LANGUAGE_LABELS[session.language as Language]?.toUpperCase()}
          </p>
          <div className="translation-content">
            {session.translation.split('\n\n').map((para, i) => (
              <p key={i} style={{ fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.75 }}>
                {para}
              </p>
            ))}
          </div>
        </div>

        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          This translation was created with HealthLiteracy AI. It is for patient education only.{' '}
          <a href="/" style={{ color: 'var(--primary)' }}>
            Translate your own document free.
          </a>
        </p>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.75rem' }}>
          This translation is for patient education only. Always follow the instructions of your care team.
        </p>
      </main>
    </div>
  )
}
