'use client'

import { useState } from 'react'

interface VerifyResult {
  passed: boolean
  confidence: 'high' | 'medium' | 'low'
  omissions: string[]
  inaccuracies: string[]
}

interface VerifyPanelProps {
  original: string
  translation: string
  onRetranslate?: () => void
}

export function VerifyPanel({ original, translation, onRetranslate }: VerifyPanelProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const runVerify = async () => {
    setStatus('loading')
    setResult(null)
    setErrorMsg(null)

    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ original, translation }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
      setStatus('done')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Verification failed')
      setStatus('error')
    }
  }

  const totalIssues = (result?.omissions.length ?? 0) + (result?.inaccuracies.length ?? 0)
  const hasIssues = totalIssues > 0

  return (
    <div
      style={{
        borderTop: '1px solid var(--border)',
        paddingTop: '1.25rem',
        marginTop: '1.25rem',
      }}
    >
      {status === 'idle' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <p
              style={{
                fontSize: '0.9375rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
                marginBottom: '2px',
              }}
            >
              Want a second check?
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Tap below and we will look again to make sure nothing important was left out.
            </p>
          </div>
          <button
            className="btn btn-secondary"
            onClick={runVerify}
            style={{
              flexShrink: 0,
              border: '1.5px solid var(--accent)',
              backgroundColor: 'transparent',
              color: 'var(--accent)',
              borderRadius: 'var(--radius-md)',
              padding: '0.625rem 1.25rem',
            }}
          >
            <CheckShieldIcon />
            Check for Missing Info
          </button>
        </div>
      )}

      {status === 'loading' && (
        <div
          role="status"
          aria-live="polite"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: 'var(--text-secondary)',
            fontSize: '0.9375rem',
            background: 'var(--surface-2)',
            padding: '0.875rem 1rem',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <SpinnerIcon />
          <span className="loading-pulse">Looking through your document again...</span>
        </div>
      )}

      {status === 'error' && (
        <div
          role="alert"
          style={{
            padding: '0.875rem 1rem',
            background: 'var(--urgent-bg)',
            border: '1px solid var(--urgent-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--urgent-text)',
            fontSize: '0.875rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <span>{errorMsg}</span>
          <button
            className="btn btn-ghost"
            onClick={() => setStatus('idle')}
            style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}
          >
            Try again
          </button>
        </div>
      )}

      {status === 'done' && result && (
        <div>
          {/* Passed */}
          {!hasIssues && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '1rem 1.25rem',
                background: 'var(--success-light)',
                border: '1px solid var(--success)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <CheckCircleIcon />
              <div>
                <p
                  style={{
                    fontWeight: 500,
                    color: 'var(--success)',
                    fontSize: '0.9375rem',
                    marginBottom: '2px',
                  }}
                >
                  Everything looks complete.
                </p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--success)', opacity: 0.8 }}>
                  We checked the translation against your original document and did not find anything missing.
                </p>
              </div>
              <ConfidenceBadge confidence={result.confidence} />
            </div>
          )}

          {/* Has issues */}
          {hasIssues && (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.875rem',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <WarningIcon />
                  <p
                    style={{
                      fontWeight: 500,
                      color: 'var(--urgent-text)',
                      fontSize: '0.9375rem',
                    }}
                  >
                    {totalIssues} item{totalIssues !== 1 ? 's' : ''} may need attention.
                  </p>
                  <ConfidenceBadge confidence={result.confidence} />
                </div>
                {onRetranslate && (
                  <button
                    className="btn btn-primary"
                    onClick={onRetranslate}
                    style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                  >
                    Re-translate
                  </button>
                )}
              </div>

              {result.omissions.length > 0 && (
                <div style={{ marginBottom: '0.875rem' }}>
                  <p
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.7rem',
                      letterSpacing: '0.07em',
                      color: 'var(--text-muted)',
                      marginBottom: '0.5rem',
                    }}
                  >
                    MAY NEED CHECKING
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {result.omissions.map((item, i) => (
                      <IssueCard key={i} text={item} type="omission" />
                    ))}
                  </div>
                </div>
              )}

              {result.inaccuracies.length > 0 && (
                <div>
                  <p
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.7rem',
                      letterSpacing: '0.07em',
                      color: 'var(--text-muted)',
                      marginBottom: '0.5rem',
                    }}
                  >
                    WORTH REVIEWING
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {result.inaccuracies.map((item, i) => (
                      <IssueCard key={i} text={item} type="inaccuracy" />
                    ))}
                  </div>
                </div>
              )}

              <p
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--text-muted)',
                  marginTop: '0.875rem',
                  fontStyle: 'italic',
                }}
              >
                This is an automated check and may not catch everything. If something seems wrong, compare the translation to the original above.
              </p>
            </div>
          )}

          <button
            className="btn btn-secondary"
            onClick={() => { setStatus('idle'); setResult(null) }}
            style={{
              border: '1.5px solid var(--accent)',
              backgroundColor: 'transparent',
              color: 'var(--accent)',
              borderRadius: 'var(--radius-md)',
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              marginTop: '0.75rem',
            }}
          >
            Check again
          </button>
        </div>
      )}
    </div>
  )
}

function IssueCard({ text, type }: { text: string; type: 'omission' | 'inaccuracy' }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '10px',
        alignItems: 'flex-start',
        padding: '0.75rem 1rem',
        background: type === 'omission' ? 'var(--urgent-bg)' : 'var(--warning-bg)',
        border: `1px solid ${type === 'omission' ? 'var(--urgent-border)' : 'var(--warning-border)'}`,
        borderRadius: 'var(--radius-sm)',
      }}
    >
      <div
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: type === 'omission' ? 'var(--urgent-icon)' : 'var(--warning-icon)',
          marginTop: '7px',
          flexShrink: 0,
        }}
      />
      <p
        style={{
          fontSize: '0.875rem',
          color: type === 'omission' ? 'var(--urgent-text)' : 'var(--warning-text)',
          lineHeight: 1.6,
        }}
      >
        {text}
      </p>
    </div>
  )
}

function ConfidenceBadge({ confidence }: { confidence: 'high' | 'medium' | 'low' }) {
  const colors = {
    high: { bg: 'var(--primary-light)', text: 'var(--primary-text)', border: 'var(--primary)' },
    medium: { bg: 'var(--warning-bg)', text: 'var(--warning-text)', border: 'var(--warning-border)' },
    low: { bg: 'var(--surface-2)', text: 'var(--text-secondary)', border: 'var(--border)' },
  }
  const c = colors[confidence]
  const labelByConfidence: Record<'high' | 'medium' | 'low', string> = {
    high: 'THOROUGH CHECK',
    medium: 'PARTIAL CHECK',
    low: 'QUICK CHECK',
  }
  return (
    <span
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.65rem',
        letterSpacing: '0.07em',
        padding: '2px 7px',
        borderRadius: '4px',
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {labelByConfidence[confidence]}
    </span>
  )
}

/* Icons */
function CheckShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M8 1.5L2.5 3.5v4c0 3 2.5 5.5 5.5 6 3-0.5 5.5-3 5.5-6v-4L8 1.5z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
      <path d="M5.5 8l1.75 1.75L10.5 6.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginTop: '1px' }} aria-hidden>
      <circle cx="10" cy="10" r="8" stroke="var(--success)" strokeWidth="1.5"/>
      <path d="M6.5 10l2.5 2.5 4.5-4.5" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }} aria-hidden>
      <path d="M9 2L1.5 15h15L9 2z" stroke="var(--urgent-icon)" strokeWidth="1.25" strokeLinejoin="round"/>
      <line x1="9" y1="7" x2="9" y2="11" stroke="var(--urgent-icon)" strokeWidth="1.25" strokeLinecap="round"/>
      <circle cx="9" cy="13" r="0.75" fill="var(--urgent-icon)"/>
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, animation: 'spin 0.8s linear infinite' }}
      aria-hidden
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="8" cy="8" r="6" stroke="var(--border-strong)" strokeWidth="1.5"/>
      <path d="M8 2a6 6 0 016 6" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
