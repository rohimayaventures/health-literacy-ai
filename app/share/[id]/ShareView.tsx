'use client'

import { useEffect, useState } from 'react'
import { ShareSession, LANGUAGE_LABELS, READING_LEVEL_LABELS, ReadingLevel, Language } from '@/lib/types'
import { generateTranslationPDF } from '@/lib/generate-pdf'

export default function ShareView({ id }: { id: string }) {
  const [session, setSession] = useState<ShareSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

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

  const handleDownloadPDF = async () => {
    if (downloading) return
    setDownloading(true)
    try {
      await generateTranslationPDF({
        urgentItems: session.urgentItems,
        translation: session.translation,
        summaryLine: session.summaryLine,
        readingLevel: session.readingLevel,
        language: session.language,
      })
    } catch (err) {
      console.error('PDF generation failed:', err)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header
        style={{
          background: 'var(--hero-bg)',
          borderBottom: '1px solid var(--hero-border-subtle)',
          height: '68px',
          padding: '0 2.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: '3px',
              height: '40px',
              background: 'var(--accent)',
              borderRadius: '2px',
              flexShrink: 0,
              marginRight: '12px',
            }}
          />
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '22px',
              fontWeight: 400,
              color: 'var(--hero-text)',
              lineHeight: 1.1,
            }}
          >
            HealthLiteracy <span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>AI</span>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        <div
          style={{
            background: 'var(--accent-light)',
            border: '1px solid rgba(212,136,42,0.4)',
            borderLeft: '3px solid var(--accent)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
          }}
        >
          <span style={{ color: 'var(--accent)', fontSize: '18px', lineHeight: 1 }}>✓</span>
          <p style={{ color: 'var(--accent-text)', fontWeight: 500, lineHeight: 1.5 }}>
            {session.summaryLine}
          </p>
        </div>

        {session.urgentItems.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
                letterSpacing: '0.1em',
                color: 'var(--accent-text)',
                background: 'var(--accent-light)',
                border: '1px solid rgba(212,136,42,0.3)',
                borderRadius: '4px',
                padding: '2px 8px',
                display: 'inline-block',
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

        <div className="card results-panels" style={{ padding: '1.75rem', marginBottom: '1rem', border: '2px solid var(--accent)' }}>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              letterSpacing: '0.1em',
              color: 'var(--accent)',
              marginBottom: '1.25rem',
            }}
          >
            PLAIN LANGUAGE ·{' '}
            {READING_LEVEL_LABELS[session.readingLevel as ReadingLevel]?.toUpperCase()} ·{' '}
            {LANGUAGE_LABELS[session.language as Language]?.toUpperCase()}
          </p>
          <div className="translation-content">
            {session.translation.split('\n\n').map((para, i) => (
              <p key={i} style={{ fontSize: '0.9375rem', color: 'var(--text-primary)', lineHeight: 1.75 }}>
                {para}
              </p>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <button className="btn btn-secondary" onClick={handleDownloadPDF} disabled={downloading}>
            <DownloadIcon />
            {downloading ? 'Generating PDF...' : 'Download PDF'}
          </button>
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
          className="footer-emergency"
          style={{
            background: 'var(--hero-bg)',
            borderTop: '2px solid var(--accent)',
            padding: '14px 2.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: 'rgba(212,136,42,0.15)',
              border: '1px solid rgba(212,136,42,0.4)',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertIcon />
          </div>
          <span style={{ fontSize: '13px', lineHeight: 1.5 }}>
            <span style={{ fontWeight: 600, color: '#FFFFFF' }}>Medical emergency?</span>{' '}
            <span style={{ color: 'rgba(240,237,232,0.85)' }}>
              Call 911 immediately. Do not use this tool in an emergency situation.
            </span>
          </span>
        </div>

        {/* Section B — Disclaimer */}
        <div
          className="footer-disclaimer"
          style={{
            background: 'var(--hero-bg-mid)',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            padding: '16px 2.5rem',
          }}
        >
          <p
            style={{
              fontSize: '12.5px',
              color: 'rgba(240,237,232,0.6)',
              lineHeight: 1.7,
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
          className="footer-bottom"
          style={{
            background: 'var(--hero-bg-dark)',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            padding: '13px 2.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(212,136,42,0.8)', letterSpacing: '0.06em', fontWeight: 500 }}>
            FREE TO USE · NO ACCOUNT NEEDED
          </span>
          <span style={{ fontSize: '12px', color: 'rgba(240,237,232,0.55)' }}>A Rohimaya Health AI project</span>
        </div>
      </footer>
    </div>
  )
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M8 2v8M5 11l3 3 3-3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 13h10" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M8 2.2L14 13H2L8 2.2Z" stroke="var(--accent)" strokeWidth="1.25" strokeLinejoin="round" />
      <path d="M8 6v3.2" stroke="var(--accent)" strokeWidth="1.25" strokeLinecap="round" />
      <circle cx="8" cy="11.2" r="0.7" fill="var(--accent)" />
    </svg>
  )
}
