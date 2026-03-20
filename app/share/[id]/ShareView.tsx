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
              ar: 'ar',
              pt: 'pt-BR',
              fr: 'fr',
              zh: 'zh-Hans',
              vi: 'vi',
              ko: 'ko',
              hi: 'hi',
              ru: 'ru',
              tl: 'fil',
              ja: 'ja',
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
          background: 'var(--hero-bg-dark)',
          height: '62px',
          padding: '0 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '20px',
              fontWeight: 400,
              color: 'var(--hero-text)',
              lineHeight: 1.1,
            }}
          >
            HealthLiteracy AI
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              letterSpacing: '0.14em',
              color: 'var(--hero-accent-mid)',
              marginTop: '2px',
            }}
          >
            A HEALTH AI TOOL
          </div>
        </div>
        <div
          className="hero-nav-tagline"
          style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: '13px',
            color: 'var(--hero-accent)',
          }}
        >
          Your medical records, in your language.
        </div>
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

      {/* Footer */}
      <footer style={{ marginTop: '4rem' }}>
        {/* Section A — Emergency bar */}
        <div
          style={{
            background: '#1A1614',
            borderTop: '1px solid var(--accent)',
            padding: '10px 2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: 'var(--accent)',
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: '13px', lineHeight: 1.5 }}>
            <span style={{ fontWeight: 500, color: 'var(--hero-text)' }}>Medical emergency?</span>{' '}
            <span style={{ color: 'var(--accent-text)' }}>
              Call 911 immediately. Do not use this tool in an emergency situation.
            </span>
          </span>
        </div>

        {/* Section B — Disclaimer */}
        <div
          style={{
            background: 'var(--hero-bg-dark)',
            borderTop: '1px solid var(--hero-border-subtle)',
            padding: '14px 2rem',
          }}
        >
          <p
            style={{
              fontSize: '12px',
              color: 'var(--hero-accent-mid)',
              lineHeight: 1.6,
              maxWidth: '800px',
            }}
          >
            HealthLiteracy AI is a free tool to help you understand your medical paperwork. It does not provide
            medical advice and is not a substitute for the guidance of your care team. Always follow the instructions
            given to you by your doctor, nurse, or care provider.
          </p>
        </div>

        {/* Section C — Bottom strip */}
        <div
          style={{
            background: 'var(--hero-bg-darkest)',
            borderTop: '1px solid rgba(255,255,255,0.04)',
            padding: '10px 2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '11px', color: 'rgba(93,202,165,0.4)' }}>Free to use. No account needed.</span>
          <span style={{ fontSize: '11px', color: 'rgba(93,202,165,0.4)' }}>A Rohimaya Health AI project</span>
        </div>
      </footer>
    </div>
  )
}
