'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  ReadingLevel,
  Language,
  TranslateResponse,
  LANGUAGE_LABELS,
  READING_LEVEL_LABELS,
  READING_LEVEL_DESCRIPTIONS,
} from '@/lib/types'
import { VerifyPanel } from '@/components/VerifyPanel'

type InputTab = 'paste' | 'upload' | 'voice'

const LANGUAGES: Language[] = ['en', 'es', 'ht', 'pt', 'fr', 'zh', 'vi', 'tl']
const READING_LEVELS: ReadingLevel[] = ['5th', '8th', 'college']

export default function HomePage() {
  const [tab, setTab] = useState<InputTab>('paste')
  const [pasteText, setPasteText] = useState('')
  const [readingLevel, setReadingLevel] = useState<ReadingLevel>('5th')
  const [language, setLanguage] = useState<Language>('en')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TranslateResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadFileName, setUploadFileName] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [copied, setCopied] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)
  const [originalText, setOriginalText] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<unknown>(null)
  const outputRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setVoiceSupported('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
  }, [])

  const handleUpload = useCallback(async (file: File) => {
    setUploadError(null)
    setUploadFileName(file.name)
    setPasteText('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/parse-pdf', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPasteText(data.text)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
      setUploadFileName(null)
    }
  }, [])

  const handleVoice = useCallback(() => {
    if (!voiceSupported) return

    if (isListening) {
      ;(recognitionRef.current as { stop: () => void })?.stop()
      setIsListening(false)
      return
    }

    const SpeechRecognition =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition

    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    let finalTranscript = pasteText

    recognition.onresult = (event: { results: SpeechRecognitionResultList; resultIndex: number }) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += (finalTranscript ? ' ' : '') + t
        } else {
          interim = t
        }
      }
      setPasteText(finalTranscript + (interim ? ' ' + interim : ''))
    }

    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)

    recognition.start()
    setIsListening(true)
  }, [isListening, pasteText, voiceSupported])

  const handleTranslate = async () => {
    const text = pasteText.trim()
    if (!text) return

    setLoading(true)
    setError(null)
    setResult(null)
    setShareUrl(null)
    setOriginalText(text)

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, readingLevel, language }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
      setTimeout(() => {
        outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        outputRef.current?.focus()
      }, 100)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!result) return
    const text = [
      result.summaryLine,
      '',
      result.urgentItems.length > 0 ? 'Important actions:\n' + result.urgentItems.map(i => '• ' + i).join('\n') : '',
      '',
      result.translation,
    ]
      .filter(Boolean)
      .join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError("Couldn't copy automatically. Long-press the link to copy it.")
    }
  }

  const handleShare = async () => {
    if (!result || sharing) return
    setSharing(true)
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original: originalText,
          translation: result.translation,
          urgentItems: result.urgentItems,
          summaryLine: result.summaryLine,
          readingLevel,
          language,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const url = `${window.location.origin}/share/${data.id}`
      setShareUrl(url)
      try {
        await navigator.clipboard.writeText(url)
      } catch {
        setError("Couldn't copy automatically. Long-press the link to copy it.")
      }
    } catch {
      setError('Could not create share link. Please try again.')
    } finally {
      setSharing(false)
    }
  }

  const clearAll = () => {
    setPasteText('')
    setResult(null)
    setError(null)
    setShareUrl(null)
    setUploadFileName(null)
    setUploadError(null)
    setOriginalText('')
  }

  const hasInput = pasteText.trim().length > 0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '0 2rem',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.5rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
                lineHeight: 1.1,
              }}
            >
              HealthLiteracy AI
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                letterSpacing: '0.06em',
                marginTop: '2px',
              }}
            >
              A ROHIMAYA HEALTH AI TOOL
            </div>
          </div>
          <div
            style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              fontStyle: 'italic',
              fontFamily: 'var(--font-display)',
            }}
          >
            Your medical records, in your language.
          </div>
        </div>
      </header>

      {/* Hero */}
      {!result && (
        <section
          style={{
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface)',
            padding: '3rem 2rem 2.5rem',
          }}
        >
          <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center' }}>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2rem, 5vw, 3rem)',
                fontWeight: 500,
                color: 'var(--text-primary)',
                lineHeight: 1.2,
                marginBottom: '1rem',
              }}
            >
              Understand your medical records.
            </h1>
            <p
              style={{
                fontSize: '1.125rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                maxWidth: '560px',
                margin: '0 auto',
              }}
            >
              Paste the paperwork you got from your doctor, hospital, or lab. We'll explain it in plain words you and your family can understand.
            </p>
          </div>
        </section>
      )}

      {/* Main */}
      <main
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '2rem',
        }}
        id="main-content"
      >
        {/* Input section */}
        {!result && (
          <div className="card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
            {/* Input tabs */}
            <div className="tab-bar" style={{ marginBottom: '1.25rem' }}>
              {(['paste', 'upload', 'voice'] as InputTab[]).map((t) => (
                <button
                  key={t}
                  className={`tab${tab === t ? ' active' : ''}`}
                  onClick={() => setTab(t)}
                >
                  {t === 'paste' && <PasteIcon />}
                  {t === 'upload' && <UploadIcon />}
                  {t === 'voice' && <MicIcon />}
                  {t === 'paste' ? 'Paste Text' : t === 'upload' ? 'Upload PDF' : 'Speak'}
                </button>
              ))}
            </div>

            {/* Paste tab */}
            {tab === 'paste' && (
              <textarea
                placeholder="Paste the text from your medical paperwork here..."
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                style={{ minHeight: '200px', marginBottom: '1rem' }}
                aria-label="Clinical document text input"
              />
            )}

            {/* Upload tab */}
            {tab === 'upload' && (
              <div style={{ marginBottom: '1rem' }}>
                <div
                  style={{
                    border: '2px dashed var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '2.5rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: uploadFileName ? 'var(--primary-light)' : 'var(--surface-2)',
                    transition: 'background 0.15s',
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      fileInputRef.current?.click()
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const file = e.dataTransfer.files[0]
                    if (file) handleUpload(file)
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleUpload(file)
                    }}
                  />
                  <UploadIcon size={32} />
                  {uploadFileName ? (
                    <p
                      style={{
                        marginTop: '0.75rem',
                        color: 'var(--primary)',
                        fontWeight: 500,
                        fontSize: '0.9375rem',
                      }}
                    >
                      {uploadFileName}
                    </p>
                  ) : (
                    <>
                      <p
                        style={{
                          marginTop: '0.75rem',
                          color: 'var(--text-secondary)',
                          fontWeight: 500,
                        }}
                      >
                        Drop a PDF here, or click to browse
                      </p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
                        PDF or .txt, up to 10MB
                      </p>
                    </>
                  )}
                </div>
                {uploadError && (
                  <p style={{ color: 'var(--urgent-text)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    {uploadError}
                  </p>
                )}
                {pasteText && uploadFileName && (
                  <p style={{ color: 'var(--primary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    Text extracted. You can review it in the Paste tab.
                  </p>
                )}
              </div>
            )}

            {/* Voice tab */}
            {tab === 'voice' && (
              <div style={{ marginBottom: '1rem' }}>
                {voiceSupported ? (
                  <>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '2rem',
                        gap: '1rem',
                      }}
                    >
                      <button
                        onClick={handleVoice}
                        style={{
                          width: '72px',
                          height: '72px',
                          borderRadius: '50%',
                          background: isListening ? 'var(--urgent-icon)' : 'var(--primary)',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'background 0.2s, transform 0.1s',
                          transform: isListening ? 'scale(1.05)' : 'scale(1)',
                          boxShadow: isListening
                            ? '0 0 0 8px rgba(194,102,43,0.15), 0 0 0 16px rgba(194,102,43,0.08)'
                            : 'var(--shadow-float)',
                        }}
                        aria-label={isListening ? 'Stop recording' : 'Start recording'}
                      >
                        <MicIcon size={28} color="#fff" />
                      </button>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                        {isListening ? 'Listening... tap to stop.' : 'Tap the microphone and speak your document aloud.'}
                      </p>
                    </div>
                    {pasteText && (
                      <textarea
                        value={pasteText}
                        onChange={(e) => setPasteText(e.target.value)}
                        style={{ minHeight: '120px' }}
                        placeholder="Transcribed text will appear here..."
                        aria-label="Voice transcription"
                      />
                    )}
                  </>
                ) : (
                  <div
                    style={{
                      background: 'var(--surface-2)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.5rem',
                      textAlign: 'center',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <p>Voice input is not supported in this browser.</p>
                    <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                      Please use Chrome or Edge, or paste your text directly.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Options row */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1rem',
                alignItems: 'flex-end',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border)',
              }}
            >
              {/* Reading level */}
              <div style={{ flex: '1 1 auto' }}>
                <label
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    letterSpacing: '0.06em',
                    color: 'var(--text-muted)',
                    marginBottom: '8px',
                  }}
                >
                  READING LEVEL
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {READING_LEVELS.map((lvl) => (
                    <button
                      key={lvl}
                      className={`level-chip${readingLevel === lvl ? ' active' : ''}`}
                      onClick={() => setReadingLevel(lvl)}
                      aria-pressed={readingLevel === lvl}
                    >
                      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
                        <span>{READING_LEVEL_LABELS[lvl]}</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.75, letterSpacing: '0.02em' }}>
                          {READING_LEVEL_DESCRIPTIONS[lvl]}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div style={{ flex: '1 1 auto' }}>
                <label
                  htmlFor="language-select"
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    letterSpacing: '0.06em',
                    color: 'var(--text-muted)',
                    marginBottom: '8px',
                  }}
                >
                  YOUR LANGUAGE
                </label>
                <select
                  id="language-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  style={{ maxWidth: '240px' }}
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {LANGUAGE_LABELS[lang]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Translate button */}
              <button
                className="btn btn-primary"
                onClick={handleTranslate}
                disabled={!hasInput || loading}
                style={{ flexShrink: 0, padding: '0.75rem 1.75rem', fontSize: '1rem' }}
              >
                {loading ? (
                  <span className="loading-pulse">Translating...</span>
                ) : (
                  'Translate'
                )}
              </button>
            </div>

            {error && !loading && (
              <div
                role="alert"
                style={{
                  marginTop: '1rem',
                  padding: '0.875rem 1rem',
                  background: 'var(--urgent-bg)',
                  border: '1px solid var(--urgent-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--urgent-text)',
                  fontSize: '0.9375rem',
                }}
              >
                {error}
              </div>
            )}
          </div>
        )}

        {/* Output section */}
        {result && (
          <div ref={outputRef} tabIndex={-1}>
            {/* Summary line */}
            <div
              style={{
                background: 'var(--primary-light)',
                border: '1px solid var(--primary)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem 1.25rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
              }}
            >
              <span style={{ color: 'var(--primary)', fontSize: '1.125rem', lineHeight: 1, marginTop: '2px' }}>
                ✓
              </span>
              <p
                style={{
                  color: 'var(--primary-text)',
                  fontWeight: 500,
                  fontSize: '1.0625rem',
                  lineHeight: 1.5,
                }}
              >
                {result.summaryLine}
              </p>
            </div>

            {/* Urgent flags */}
            {result.urgentItems.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '0.75rem',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      letterSpacing: '0.08em',
                      color: 'var(--urgent-text)',
                      background: 'var(--urgent-bg)',
                      border: '1px solid var(--urgent-border)',
                      borderRadius: '4px',
                      padding: '2px 8px',
                    }}
                  >
                    IMPORTANT — DO THESE THINGS
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {result.urgentItems.map((item, i) => (
                    <div key={i} className="urgent-card">
                      <div className="urgent-dot" />
                      <p style={{ color: 'var(--urgent-text)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Side-by-side panels */}
            <div
              className="side-by-side"
              style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start',
                marginBottom: '1.25rem',
              }}
            >
              {/* Original */}
              <div
                className="card"
                style={{
                  flex: '1 1 0',
                  minWidth: 0,
                  padding: '1.5rem',
                  maxHeight: '560px',
                  overflowY: 'auto',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem',
                    letterSpacing: '0.08em',
                    color: 'var(--text-muted)',
                    marginBottom: '1rem',
                  }}
                >
                  ORIGINAL DOCUMENT
                </div>
                <pre
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.7,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {originalText}
                </pre>
              </div>

              {/* Translation */}
              <div
                className="card"
                style={{
                  flex: '1 1 0',
                  minWidth: 0,
                  padding: '1.5rem',
                  maxHeight: '560px',
                  overflowY: 'auto',
                  borderColor: 'var(--primary)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.7rem',
                      letterSpacing: '0.08em',
                      color: 'var(--primary)',
                    }}
                  >
                    PLAIN LANGUAGE · {READING_LEVEL_LABELS[readingLevel].toUpperCase()} ·{' '}
                    {LANGUAGE_LABELS[language].toUpperCase()}
                  </div>
                </div>
                <div className="translation-content">
                  {result.translation.split('\n\n').map((para, i) => (
                    <p key={i} style={{ fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.75 }}>
                      {para}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions row */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.75rem',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button className="btn btn-secondary" onClick={handleCopy}>
                  <CopyIcon />
                  {copied ? 'Copied!' : 'Copy Translation'}
                </button>
                <button className="btn btn-secondary" onClick={handleShare} disabled={sharing}>
                  <ShareIcon />
                  {shareUrl ? 'Link Copied!' : sharing ? 'Creating link...' : 'Share as Link'}
                </button>
              </div>

              <button className="btn btn-ghost" onClick={clearAll}>
                Start Over
              </button>
            </div>

            {shareUrl && (
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem 1rem',
                  background: 'var(--success-light)',
                  border: '1px solid var(--success)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  color: 'var(--success)',
                }}
              >
                Share link copied to clipboard:{' '}
                <a href={shareUrl} style={{ color: 'var(--success)', fontWeight: 500 }}>
                  {shareUrl}
                </a>
              </div>
            )}

            {/* Reverse-check */}
            <VerifyPanel
              original={originalText}
              translation={result.translation}
              onRetranslate={() => {
                setResult(null)
                setShareUrl(null)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            />
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="card" role="status" aria-live="polite" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <div className="loading-pulse" style={{ color: 'var(--text-secondary)', fontSize: '1.0625rem' }}>
              Translating your document into plain language...
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.75rem' }}>
              This usually takes 10 to 20 seconds.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          marginTop: '4rem',
          borderTop: '1px solid var(--border)',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          HealthLiteracy AI is a free tool to help you understand your medical paperwork. It does not provide medical advice.{' '}
          <span style={{ color: 'var(--text-secondary)' }}>
            Always follow the instructions of your care team.
          </span>
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
          A{' '}
          <a
            href="https://rohimaya.ai"
            style={{ color: 'var(--primary)', textDecoration: 'none' }}
          >
            Rohimaya Health AI
          </a>{' '}
          project.
        </p>
      </footer>
    </div>
  )
}

/* Inline SVG icons */
function PasteIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="3" y="2" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
      <line x1="5.5" y1="6" x2="10.5" y2="6" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <line x1="5.5" y1="8.5" x2="10.5" y2="8.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <line x1="5.5" y1="11" x2="8.5" y2="11" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  )
}

function UploadIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M8 2v8M5 5l3-3 3 3" stroke={color ?? 'currentColor'} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 11v2h10v-2" stroke={color ?? 'currentColor'} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MicIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="5.5" y="1.5" width="5" height="8" rx="2.5" stroke={color ?? 'currentColor'} strokeWidth="1.25" />
      <path d="M3 8.5a5 5 0 0010 0" stroke={color ?? 'currentColor'} strokeWidth="1.25" strokeLinecap="round" />
      <line x1="8" y1="13.5" x2="8" y2="14.5" stroke={color ?? 'currentColor'} strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="5" y="5" width="8" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
      <path d="M3 10V3.5A1.5 1.5 0 014.5 2H11" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="12" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="12" cy="13" r="1.5" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="4" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.25" />
      <line x1="5.3" y1="7.3" x2="10.7" y2="3.7" stroke="currentColor" strokeWidth="1.25" />
      <line x1="5.3" y1="8.7" x2="10.7" y2="12.3" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  )
}
