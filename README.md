# HealthLiteracy AI

**Your medical records, in your language.**

A free, patient-facing tool that translates clinical documentation into plain language. Paste a discharge summary, lab result, radiology report, or any after-visit note and receive a translation written at the reading level and in the language your family actually uses.

Built by [Hannah Kraulik Pagade](https://rohimaya.ai) — clinical AI from the floor up.

---

## What it does

- **Three input methods** — paste text, upload a PDF, or speak your document aloud using your browser's microphone
- **Reading level selector** — 5th Grade (simple), 8th Grade (moderate), College (thorough)
- **Eight languages** — English, Spanish, Haitian Creole, Portuguese, French, Mandarin, Vietnamese, Tagalog
- **Urgent flag cards** — follow-up dates, new medications, warning signs, and care instructions surfaced at the top in clear visual cards
- **Side-by-side view** — original clinical text on the left, plain-language translation on the right
- **Copy and share** — copy translation to clipboard or generate a shareable URL via Supabase-persisted sessions

No login required. No data sold. Free to use.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + CSS custom properties |
| AI | Claude API (claude-sonnet-4-20250514) |
| Database | Supabase (sessions, share URLs) |
| PDF parsing | pdf-parse |
| Voice input | Web Speech API (browser-native) |
| Deployment | Vercel |

---

## Design system

**Candlelight Clarity** — a patient-facing palette distinct from Rohimaya Health AI's Meridian Oracle system.

- Background: `#FAFAF8` (warm off-white)
- Primary: `#2C7A6E` (forest teal)
- Accent: `#C2662B` (warm terracotta)
- Typography: Cormorant Garamond (display) + DM Sans (body) + DM Mono (labels)
- WCAG AA compliant throughout

---

## Project structure

```
healthliteracy-ai/
├── app/
│   ├── api/
│   │   ├── translate/route.ts     Claude API — translates clinical text
│   │   ├── parse-pdf/route.ts     PDF text extraction via pdf-parse
│   │   └── share/route.ts         GET and POST for Supabase sessions
│   ├── share/[id]/
│   │   ├── page.tsx               Share URL route
│   │   └── ShareView.tsx          Client component for shared sessions
│   ├── globals.css                Candlelight Clarity design tokens
│   ├── layout.tsx                 Root layout with font loading
│   └── page.tsx                   Main app UI
├── lib/
│   ├── types.ts                   Shared TypeScript interfaces
│   ├── system-prompt.ts           Claude system prompt (production)
│   └── supabase.ts                Supabase client
├── supabase-schema.sql            Run once to set up the database
├── .env.example                   Environment variable template
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

---

## Claude system prompt design

The system prompt instructs the model to:

- Never use jargon without immediately explaining it in plain terms in the same sentence
- Rewrite at the selected reading level (5th, 8th, or college)
- Preserve every piece of critical information — diagnoses, medications, dosages, follow-up dates, warning signs
- Flag urgent items as a structured array of action-oriented sentences surfaced above the translation
- Use warm, reassuring tone ("your care team says..." not "you have...")
- Never diagnose or interpret, only attribute
- Translate the plain-language output (not the original clinical note) when a non-English language is selected
- Return a strict JSON structure so the UI can render urgentItems as visual cards separate from the main translation body

---

## Roadmap

- [ ] Reverse-check feature: "Did I get everything right?" — Claude verifies the translation against the original for omissions
- [ ] Audio playback of the translation (Web Speech Synthesis API)
- [ ] Scanned PDF support via OCR
- [ ] Provider portal: clinicians can generate share links to send to patients

---

## About

HealthLiteracy AI is a portfolio project under [Rohimaya Health AI](https://rohimaya.ai), built by [Hannah Kraulik Pagade](https://pagadeventures.com) — CEO of Pagade Ventures, Licensed Practical Nurse, and MS AI/ML candidate at CU Boulder.

This project exists because discharge instructions written at a clinical level do not help a patient who reads at a normal level, speaks Haitian Creole at home, and is scared. That gap is preventable with a two-second API call.

---

## License

MIT
