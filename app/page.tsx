'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  ReadingLevel,
  Language,
  TranslateResponse,
  LANGUAGES,
  LANGUAGE_LABELS,
  READING_LEVEL_LABELS,
  READING_LEVEL_DESCRIPTIONS,
} from '@/lib/types'
import { VerifyPanel } from '@/components/VerifyPanel'

type InputTab = 'paste' | 'upload' | 'voice'

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

      {/* Hero */}
      {!result && (
        <section
          className="hero-section"
          style={{
            background: 'var(--hero-bg)',
            padding: '3.5rem 2rem 0',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            minHeight: '320px',
          }}
        >
          {/* Decorative rings */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                position: 'absolute',
                width: '300px',
                height: '300px',
                top: '50%',
                left: '12%',
                transform: 'translate(-50%, -50%)',
                border: '1px solid var(--hero-accent-mid)',
                borderRadius: '50%',
                animation: 'hlPulseRing 4s ease-in-out infinite',
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: '480px',
                height: '480px',
                top: '50%',
                left: '12%',
                transform: 'translate(-50%, -50%)',
                border: '1px solid var(--hero-accent-mid)',
                borderRadius: '50%',
                animation: 'hlPulseRingB 5s ease-in-out infinite 0.8s',
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: '640px',
                height: '640px',
                top: '50%',
                left: '12%',
                transform: 'translate(-50%, -50%)',
                border: '1px solid var(--hero-accent-mid)',
                borderRadius: '50%',
                animation: 'hlPulseRingC 6s ease-in-out infinite 1.6s',
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: '260px',
                height: '260px',
                top: '40%',
                right: '6%',
                transform: 'translate(50%, -50%)',
                border: '1px solid var(--hero-accent-mid)',
                borderRadius: '50%',
                animation: 'hlPulseRing 4.5s ease-in-out infinite 1s',
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: '420px',
                height: '420px',
                top: '40%',
                right: '6%',
                transform: 'translate(50%, -50%)',
                border: '1px solid var(--hero-accent-mid)',
                borderRadius: '50%',
                animation: 'hlPulseRingB 5.5s ease-in-out infinite 2s',
              }}
            />

            {/* Floating document shapes */}
            <div
              className="hl-doc-a"
              style={{
                position: 'absolute',
                width: '34px',
                height: '42px',
                top: '18%',
                left: '8%',
                border: '1.5px solid rgba(93,202,165,0.3)',
                borderRadius: '4px',
                animation: 'hlFloatA 5s ease-in-out infinite',
              }}
            />
            <div
              className="hl-doc-b"
              style={{
                position: 'absolute',
                width: '26px',
                height: '32px',
                top: '28%',
                right: '10%',
                border: '1.5px solid rgba(93,202,165,0.3)',
                borderRadius: '4px',
                animation: 'hlFloatB 6.5s ease-in-out infinite 0.5s',
              }}
            />

            {/* Dots */}
            <div
              style={{
                position: 'absolute',
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: 'rgba(93,202,165,0.4)',
                top: '62%',
                left: '6%',
                animation: 'hlShimmer 3s ease-in-out infinite',
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: 'rgba(93,202,165,0.28)',
                top: '28%',
                right: '22%',
                animation: 'hlShimmer 4s ease-in-out infinite 0.8s',
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'rgba(194,102,43,0.38)',
                top: '72%',
                right: '12%',
                animation: 'hlShimmer 3.5s ease-in-out infinite 1.2s',
              }}
            />

            {/* Cross marks */}
            <div
              className="hl-cross hl-cross-a"
              style={{
                position: 'absolute',
                top: '52%',
                left: '21%',
                animation: 'hlFloatC 7s ease-in-out infinite',
              }}
            />
            <div
              className="hl-cross hl-cross-b"
              style={{
                position: 'absolute',
                top: '22%',
                right: '28%',
                animation: 'hlFloatA 8s ease-in-out infinite 1s',
              }}
            />
          </div>

          <div
            style={{
              position: 'relative',
              zIndex: 2,
              animation: 'hlFadeUp 0.6s ease-out both',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.16em',
                color: 'var(--hero-accent-mid)',
                marginBottom: '1.25rem',
              }}
            >
              FREE · NO LOGIN REQUIRED · 12 LANGUAGES
            </div>

            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2rem, 5vw, 2.75rem)',
                fontWeight: 400,
                color: 'var(--hero-text)',
                lineHeight: 1.18,
                marginBottom: '1.2rem',
              }}
            >
              Understand your <em style={{ color: 'var(--hero-accent)', fontStyle: 'italic' }}>medical records.</em>
            </h1>

            <p
              style={{
                fontSize: '1rem',
                color: 'var(--hero-accent)',
                lineHeight: 1.65,
                maxWidth: '480px',
                margin: '0 auto 1.75rem',
              }}
            >
              Paste the paperwork you got from your doctor, hospital, or lab. We'll explain it in plain words you and your family can understand.
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '8px',
                flexWrap: 'wrap',
                marginBottom: '2.5rem',
              }}
            >
              {['Discharge summaries', 'Lab results', 'Radiology reports', 'After-visit notes'].map((pill) => (
                <span
                  key={pill}
                  style={{
                    background: 'rgba(93,202,165,0.1)',
                    border: '1px solid rgba(93,202,165,0.26)',
                    borderRadius: '999px',
                    padding: '4px 13px',
                    fontSize: '11px',
                    letterSpacing: '0.07em',
                    color: 'var(--hero-accent)',
                  }}
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>

          <style jsx>{`
            .hl-doc-a::after,
            .hl-doc-b::after {
              content: '';
              position: absolute;
              top: 8px;
              left: 6px;
              right: 6px;
              height: 1.5px;
              background: rgba(93, 202, 165, 0.25);
              box-shadow: 0 5px 0 rgba(93, 202, 165, 0.18), 0 10px 0 rgba(93, 202, 165, 0.12);
              border-radius: 1px;
              pointer-events: none;
            }

            .hl-cross {
              width: 12px;
              height: 12px;
              pointer-events: none;
            }

            .hl-cross::before,
            .hl-cross::after {
              content: '';
              position: absolute;
              top: 50%;
              left: 50%;
              background: rgba(93, 202, 165, 0.18);
              border-radius: 1px;
              pointer-events: none;
            }

            .hl-cross::before {
              width: 12px;
              height: 1.5px;
              transform: translate(-50%, -50%);
            }

            .hl-cross::after {
              width: 1.5px;
              height: 12px;
              transform: translate(-50%, -50%);
            }
          `}</style>
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
        className="main-content"
      >
        {/* Input section */}
        {!result && (
          <div
            className="card-outer-wrap"
            style={{
              background: 'var(--hero-bg)',
              padding: '0 2rem 2.5rem',
              position: 'relative',
              zIndex: 2,
            }}
          >
            <div
              className="card"
              style={{
                background: 'var(--surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                overflow: 'hidden',
                padding: '2rem',
              }}
            >
            {/* Input tabs */}
            <div
              style={{
                background: 'var(--primary-dark)',
                display: 'flex',
                marginBottom: '1.25rem',
                borderRadius: '12px 12px 0 0',
                overflow: 'hidden',
              }}
            >
              {(['paste', 'upload', 'voice'] as InputTab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    flex: 1,
                    padding: '13px 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '7px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: tab === t ? 'var(--primary-dark)' : 'var(--hero-accent)',
                    cursor: 'pointer',
                    border: 'none',
                    background: tab === t ? 'var(--surface)' : 'transparent',
                    borderRadius: tab === t ? '12px 12px 0 0' : '0',
                    fontFamily: 'var(--font-body)',
                  }}
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
                  DETAIL LEVEL
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {READING_LEVELS.map((lvl) => (
                    <button
                      key={lvl}
                      className="level-chip"
                      onClick={() => setReadingLevel(lvl)}
                      aria-pressed={readingLevel === lvl}
                      style={{
                        background: readingLevel === lvl ? 'var(--primary-light)' : 'var(--surface)',
                        border: `1.5px solid ${
                          readingLevel === lvl ? 'var(--primary)' : 'var(--border-strong)'
                        }`,
                        color: readingLevel === lvl ? 'var(--primary-text)' : 'var(--text-primary)',
                        borderRadius: '999px',
                        padding: '7px 14px',
                        fontSize: '12px',
                        fontWeight: 500,
                      }}
                    >
                      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span>{READING_LEVEL_LABELS[lvl]}</span>
                        <span
                          className="level-chip-description"
                          style={{
                            fontSize: '9px',
                            color: readingLevel === lvl ? 'var(--primary)' : 'var(--text-muted)',
                            marginTop: '1px',
                          }}
                        >
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
                  style={{
                    border: '1.5px solid var(--border-strong)',
                    borderRadius: 'var(--radius-md)',
                    padding: '9px 12px',
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    background: 'var(--surface)',
                    width: '100%',
                  }}
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
                style={{
                  flexShrink: 0,
                  border: 'none',
                  padding: '12px 28px',
                  fontSize: '1rem',
                  fontWeight: 500,
                }}
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
        </div>
        )}

        {/* Stats row */}
        {!result && (
          <div
            className="stats-row"
            style={{
              background: 'var(--hero-bg-dark)',
              display: 'flex',
              justifyContent: 'center',
              gap: '3rem',
              padding: '1.75rem 2rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '28px',
                  fontWeight: 400,
                  color: 'var(--hero-text)',
                  lineHeight: 1,
                  textAlign: 'center',
                }}
              >
                88%
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  letterSpacing: '0.09em',
                  color: 'var(--hero-accent-mid)',
                  marginTop: '5px',
                  textAlign: 'center',
                  maxWidth: '110px',
                  lineHeight: 1.4,
                }}
              >
                OF ADULTS HAVE LIMITED HEALTH LITERACY
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '28px',
                  fontWeight: 400,
                  color: 'var(--hero-text)',
                  lineHeight: 1,
                  textAlign: 'center',
                }}
              >
                12
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  letterSpacing: '0.09em',
                  color: 'var(--hero-accent-mid)',
                  marginTop: '5px',
                  textAlign: 'center',
                  maxWidth: '110px',
                  lineHeight: 1.4,
                }}
              >
                LANGUAGES SUPPORTED
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '28px',
                  fontWeight: 400,
                  color: 'var(--hero-text)',
                  lineHeight: 1,
                  textAlign: 'center',
                }}
              >
                30%
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  letterSpacing: '0.09em',
                  color: 'var(--hero-accent-mid)',
                  marginTop: '5px',
                  textAlign: 'center',
                  maxWidth: '110px',
                  lineHeight: 1.4,
                }}
              >
                LOWER READMISSION WHEN PATIENTS UNDERSTAND
              </div>
            </div>
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
          <span style={{ fontSize: '11px', color: 'rgba(93,202,165,0.4)' }}>
            A Rohimaya Health AI project
          </span>
        </div>
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
