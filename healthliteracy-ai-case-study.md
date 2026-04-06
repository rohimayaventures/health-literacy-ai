# HEALTHLITERACY AI — CASE STUDY

*Reference document. Does not render on site. All visitor-facing content lives in the portfolio site at hannahkraulikpagade.com.*
*Case study updated April 2026. Hannah Kraulik Pagade, Rohimaya Health AI.*

---

## PROJECT METADATA

| Field | Value |
|---|---|
| **Product name** | HealthLiteracy AI |
| **Status** | Live |
| **Primary URL** | literacy.rohimaya.ai |
| **Repo** | github.com/rohimayaventures/healthliteracy-ai |
| **Tags** | HEALTH-EQUITY · AI-PRODUCT · FULL-STACK · PATIENT-FACING |
| **Role** | Product design, conversation design, full-stack build |
| **Timeline** | 2025 — Present |
| **Key outcome** | Free, no-login patient document translation tool with twelve-language support, three reading levels, user-initiated AI verification, voice input, and 90-day shareable sessions |
| **Stack** | Next.js 15 · TypeScript · Tailwind CSS v4 · Claude API (claude-sonnet-4-20250514) · Supabase · Zod · Vercel |

---

## SECTION 1 — THE PROOF POINT

Every shift for fifteen years, I watched the same thing happen.

A patient would receive discharge instructions at the nurses' station. Maybe they had a procedure that morning. Maybe they had been in the hospital for a week. They would take the papers, fold them, and put them in a bag. Some of them could not read the papers. Some of them could read the words but not understand what they meant. Some of them spoke a different language at home and had been nodding politely throughout a conversation they were translating in their head.

We handed them a document written at a ninth-grade reading level and sent them home.

The readmissions I saw were not always the result of complex diagnoses. Sometimes they were the result of a patient who did not understand that "take with food" meant with every dose, not just the first one. Sometimes they were the result of a patient who stopped taking a medication because a side effect scared them and there was no phone number to call at 11pm. Sometimes they were the result of a patient whose primary language was Vietnamese, or Tagalog, or Korean, whose discharge instructions were in English, and who had no way to ask anyone to explain them.

This tool exists because that gap is preventable. Not later. Now.

---

## SECTION 2 — THE PROBLEM

### The data

**88% of American adults have less-than-proficient health literacy.**
Only 12% of U.S. adults meet the threshold for proficient health literacy, according to the U.S. Department of Health and Human Services. This is not a niche population. It is nearly everyone. [1]

**Discharge instructions are written at the wrong level, consistently.**
The American Medical Association, the Department of Health and Human Services, and the National Institutes of Health all recommend patient-facing materials be written at or below a sixth-grade reading level. Research has consistently found that the majority of discharge instructions exceed recommended reading levels, with mean Flesch-Kincaid grade levels well above the sixth-grade threshold. Only a small fraction of instructions fall within recommended guidelines. [2]

**The language gap compounds the literacy gap.**
The United States has no dominant second language. The twelve languages supported at launch were chosen for coverage across the largest underserved patient populations in U.S. healthcare and for script diversity: Arabic, French, Hindi, Japanese, Korean, Mandarin, Portuguese, Russian, Spanish, Tagalog, Vietnamese, and English. A tool that supports only English and Spanish does not solve the problem for the patients who are actually in the room. [3]

**Comprehension failures have clinical consequences.**
Patients who understand their discharge instructions are 30% less likely to be readmitted within thirty days. That statistic is not about improving satisfaction scores. It is about readmission rates, adverse events, and whether a patient takes the right medication at the right time or the wrong one at the wrong time. [4]

**The population this tool serves does not have a workaround.**
Hiring a medical interpreter costs between $75 and $150 per hour. Plain-language health literacy consultants are not available at 2am on a Saturday. HealthLiteracy AI is available at any hour, on any device, at no cost.

---

## SECTION 3 — THE PROCESS

### The constraint set

Before a single component was built, the constraints were locked. These are not constraints that came from user research. They came from fifteen years of watching what patients actually do when they leave a care setting.

**No login.** A patient who just left the hospital and is scared will not create an account. They will close the tab. The entire product is accessible without any authentication.

**No setup.** Three input methods: paste, type, or upload. The tool works the moment someone lands on it.

**Urgent items at the top.** The most important thing a patient needs to know comes first, not buried in a translation. The AI is explicitly instructed to extract and surface urgent items as a separate structured array before the translation body.

**Medical terms explained in the same sentence.** A translation that replaces "hypertension" with "high blood pressure" and nothing else is not useful. Every medical term is followed by a plain-language explanation within the same clause. The instruction is in the system prompt and verified in the review pass.

**Attribution language that prevents misreading as diagnosis.** The output includes framing that tells the patient this is a translation, not a diagnosis or medical advice. This is part of the output architecture, not a footer disclaimer bolted on after the fact.

**Twelve languages at launch, not deferred.**
The standard MVP pattern is to launch in English and Spanish and add languages later. That pattern was rejected before the first commit. The twelve languages in the first deploy represent meaningful coverage across script diversity and the largest underserved patient populations in U.S. healthcare. Later never comes.

### The core design decision: two-pass translation

The single most important architectural decision in HealthLiteracy AI is the verification pass.

A one-pass Claude translation produces a translation. A two-pass system produces a translation that can be checked against itself. The first call always runs and produces the translation. The second call is user-initiated: when a patient or caregiver requests a second check, it compares the translation against the original and reports omissions.

This matters because clinical language is dense. A discharge instruction might say "avoid strenuous activity for six weeks, which includes heavy lifting, vigorous exercise, and sexual activity." A translation might drop the third item. A one-pass system would not catch it. A user-initiated second pass does.

The verification pass is user-initiated, not automatic. When a patient or caregiver requests a second check, the system runs the verify call and returns issue cards flagging any omissions or inaccuracies detected. The badges are THOROUGH CHECK, PARTIAL CHECK, and QUICK CHECK depending on the result. The user decides what to do from there.

This is the right product decision. Doubling latency and cost by default on a free tool that serves scared patients prioritizes the tool's architecture over the patient's experience. Making verification explicit and on-demand respects autonomy, controls cost, and maintains trust.

### The reading level system

Three reading levels: Simple, Clear, and Complete. Each level changes not just vocabulary but sentence length, paragraph structure, and the degree to which the AI explains concepts versus simply translates them. Simple assumes the patient has low prior clinical knowledge and explains everything. Complete preserves full clinical detail for patients or caregivers who need it.

The labels are deliberately plain. Grade-level framing, "5th grade" or "college-level," introduces shame and confusion into a moment that already carries enough of both. Simple, Clear, and Complete are labels a patient can choose without feeling categorized.

The reading level selector is surfaced immediately on the interface, not buried in settings. The person choosing the reading level may be a family member, a home health aide, or the patient themselves.

### Side-by-side view

The original and translation render side by side on larger screens. This was a deliberate design choice for a specific use case: a caregiver or care coordinator who needs to verify that a translation is accurate before presenting it to a patient. The side-by-side view makes the verification workflow possible without requiring any export or copy-paste.

### Pivot stories

**Pivot 1 — Languages: principle over inventory**
The original narrative named Haitian Creole and Somali as launch languages because they represent patient populations that are genuinely underserved by English-only tools. The repo launched with a different twelve: Arabic, French, Hindi, Japanese, Korean, Mandarin, Portuguese, Russian, Spanish, Tagalog, Vietnamese, and English. This set was chosen for translation quality, system prompt feasibility, and script diversity. The equity principle is unchanged. Every language added at launch instead of deferred is a choice about whose needs come first. The specific twelve reflect what could be done responsibly at launch, not a limit on the principle.

**Pivot 2 — Reading levels: patient language over grade labels**
Internally the system maps to depth tiers equivalent to 5th grade, 8th grade, and college-level comprehension. The UI ships Simple, Clear, and Complete. Grade-level labels are accurate but they do the wrong thing at the point of use. A patient choosing their reading level is already in a vulnerable moment. Grade framing adds shame to a process that should only add clarity. The labels in the interface are chosen for the emotional context of use, not for technical precision.

**Pivot 3 — Verification: second pass on the patient's terms**
The original product spec described the verification pass as automatic: translate, verify, detect omission, re-render the flagged section without user action. The shipped version is user-initiated. The patient or caregiver requests the second check explicitly. The system returns issue cards. The user decides what to do next.

The automatic version doubles latency and cost on every translation by default. For a free, no-login tool where the primary user is a scared patient who needs an answer quickly, that tradeoff was wrong. User-initiated verification treats the second pass as a tool the patient controls, not a pipeline step that adds delay to every interaction.

**Lesson:** "Automated" is not always more trustworthy. In a clinical context, making the verification visible and explicit builds more trust than running it silently.

**Pivot 4 — Sonnet for clinical text**
The original architecture spec called for Haiku as the default model for speed with Sonnet invoked when document complexity exceeded a threshold. The repo uses `claude-sonnet-4-20250514` for both the translate and verify calls with no model router.

Clinical plain-language translation is not a context where the faster, cheaper model is the right default. The instruction set is complex: medical term explanation in the same clause, urgent item extraction as a structured array, attribution framing that prevents misreading as diagnosis, reading level adherence across three distinct instruction sets. Haiku produces acceptable results on simple documents. It produces less reliable results on dense clinical language. Sonnet is the right model for this use case until there is enough volume data to build a confident routing layer.

**Lesson:** Model selection is a product safety decision in clinical contexts, not just a cost optimization. Default to the model that gets the clinical output right.

---

## SECTION 4 — WHAT SHIPPED

### Input and access
- Paste, type, or voice input (Web Speech API, Chrome and Edge best support)
- PDF and .txt upload via server-side text extraction (text-layer only, no OCR)
- No login, no setup, no credit card
- Works on mobile, tablet, and desktop
- Free

### Translation engine
- Claude API (`claude-sonnet-4-20250514` for both translate and verify calls)
- Twelve languages: Arabic, French, Hindi, Japanese, Korean, Mandarin, Portuguese, Russian, Spanish, Tagalog, Vietnamese, English
- Three reading levels: Simple, Clear, Complete
- Medical term explanation built into every output
- Attribution language preventing misreading as diagnosis
- Zod validation on API request bodies. Manual validation on Claude responses with retry logic on transport failures.

### Verification
- User-initiated second Claude pass comparing translation against original
- Issue cards flagging detected omissions or inaccuracies
- Result badges: THOROUGH CHECK, PARTIAL CHECK, QUICK CHECK
- Does not auto re-translate; user decides next action

### Output features
- Urgent item extraction: high-priority clinical items surfaced as a separate card array at the top
- Side-by-side view (original and translation rendered together on larger screens)
- Copy and share functionality
- PDF export with branded disclaimer
- Session persistence via Supabase with 90-day expiry
- Expired share links return 410

### Accessibility
- Skip link, tab semantics, keyboard navigation throughout
- Focus moves to results on translation complete
- `prefers-reduced-motion` respected for any animated elements
- Visible error states for PDF extraction failures and share failures

### Infrastructure
- Next.js 15, App Router, TypeScript
- Tailwind CSS v4
- Claude API (`claude-sonnet-4-20250514`)
- Zod validation on API request bodies, manual validation on Claude responses, retry on transport failures
- Rate limiting on translate, verify, share (POST and GET), and parse routes
- Supabase with versioned SQL migrations, 90-day session expiry, 410 for expired links
- Vercel

---

## SECTION 5 — TECHNICAL ARCHITECTURE

| Component | Decision | Rationale |
|---|---|---|
| AI model | `claude-sonnet-4-20250514` for both translate and verify | Clinical plain-language translation requires reliable structured output across complex instruction sets. Sonnet is used for both passes. No Haiku default or model router currently implemented. |
| Translation architecture | Two-pass: translate then user-initiated verify | One-pass has no error correction. Verify is explicit and on-demand, not automatic, to avoid doubling latency and cost on every free session. |
| Urgent item extraction | Structured array output, separate from translation body | Urgency classification is a first-class output. The system prompt extracts urgency-flagged items before generating the translation body. |
| Reading level system | Three tiers: Simple, Clear, Complete | Each tier has a distinct instruction set for sentence structure, explanation depth, and concept unpacking. Labels are plain language, not grade-level framing. |
| Verification output | Issue cards with THOROUGH CHECK / PARTIAL CHECK / QUICK CHECK badges | Result is surfaced as actionable items. No auto-patch. User decides next action. |
| Session storage | Supabase with 90-day `expires_at`, versioned SQL migrations | Sessions persist for sharing. 90-day TTL limits long-lived exposure of translated clinical text. Expired links return 410. |
| Rate limiting | Applied to translate, verify, share (POST and GET), and parse routes | Abuse resistance for a free, no-login tool. Invisible to users until a wall is hit. |
| Zod validation | Applied to API request bodies. Manual validation on Claude responses with retry on transport failures. | Zod enforces incoming payload shape. Claude JSON responses use JSON.parse with manual checks. Retry fires on network/transport failures, not parse errors. |
| Voice input | Web Speech API, browser-native | Third input method for patients who cannot type or paste. Chrome and Edge best support. Browser support messaging shown inline. |
| PDF upload | `parse-pdf` route, text-layer extraction only | PDF and .txt supported. No image upload or OCR. Copy in the UI reflects this accurately. |
| Attribution framing | Baked into Claude output via system prompt | The framing that this is a translation and not medical advice is part of the structured output, not a static footer. |
| Accessibility | Skip link, tab semantics, keyboard nav, focus-to-results, `prefers-reduced-motion` | Designed for users under stress. Assistive technology support is a launch requirement, not a roadmap item. |

---

## SECTION 6 — STATUS MATRIX

| Area | Status | Notes |
|---|---|---|
| Core translation | Working | All twelve languages operational. Three reading levels functional. |
| Urgent item extraction | Working | Structured array surfaces at the top of output on every run. |
| AI verification pass | Working | User-initiated. Issue cards with THOROUGH CHECK / PARTIAL CHECK / QUICK CHECK badges. No auto re-render. |
| Side-by-side view | Working | Renders on desktop and tablet. Mobile collapses to single-column. |
| Session persistence | Working | 90-day Supabase sessions. Share URL functional. Expired links return 410. |
| Voice input | Working | Web Speech API. Chrome and Edge best support. Browser support messaging shown inline. |
| Zod validation and retry | Working | Zod validates API request bodies. Claude responses use manual validation with retry on transport failures. |
| Rate limiting | Working | Applied to translate, verify, share (POST and GET), and parse routes. |
| Accessibility patterns | Working | Skip link, keyboard navigation, focus-to-results, `prefers-reduced-motion`. Ongoing audit. |
| PDF upload (text-heavy) | Working | Text extraction functional for standard PDFs and .txt files. |
| PDF upload (scanned / image) | Not supported | No OCR. Scanned image PDFs require paste or voice input. UI reflects this accurately. |
| Auto re-render on omission | Not built | Verification flags omissions as issue cards. User initiates any re-translation. |
| Provider-facing mode | Not built | Roadmap: provider interface for templated plain-language discharge instructions. |
| Image upload | Not built | OCR is a different product surface. Not in current scope. |

---

## SECTION 7 — PORTFOLIO COPY

### Proof point (short callout for site)
Fifteen years of watching patients fold their discharge papers into a bag and go home without understanding them. This tool closes one piece of that gap, for free, in twelve languages, with no login required.

### Stats
- 12 languages at launch
- 3 reading levels: Simple, Clear, Complete
- 88% of Americans have less than proficient health literacy [1]

### Card summary
Free patient document translation in twelve languages and three reading levels. Paste, type, upload, or speak. The AI extracts urgent items first, translates with medical term explanations, and offers a user-initiated verification pass to check its own work. No login. No setup. Live at literacy.rohimaya.ai.

### Project description
HealthLiteracy AI translates clinical documents into plain language. Any document. Any of the twelve supported languages. Any reading level: Simple, Clear, or Complete. The output surfaces urgent items at the top, explains every medical term in plain language, and offers a second AI pass on demand to verify the translation against the original for omissions. Built for patients, caregivers, and anyone who needs clinical information in a form they can actually use. Accessible at any hour with no account required.

### Problem statement
Clinical documentation is written for providers. Patients receive the same documents at discharge, often scared, sometimes in pain, frequently in a language they do not read fluently, and are expected to manage their own care from them. 88% of American adults have less-than-proficient health literacy. Patients who understand their discharge instructions are 30% less likely to be readmitted. That gap is not inevitable. It is addressable with a well-designed AI tool.

### Process steps (for interactive section on work page)
1. **The constraint set** — No login. No setup. Urgent items first. Medical terms explained in the same sentence. Twelve languages at launch, not deferred. Attribution language in the output, not the footer. Every constraint came from fifteen years of watching what patients actually do when they leave a care setting.
2. **The core architecture decision** — One-pass Claude translation produces a translation. Two-pass produces a translation that has been checked against itself. The second call is user-initiated and returns issue cards flagging omissions. The patient decides what to do next. Verification is a tool the patient controls, not a pipeline step that adds delay to every interaction.
3. **What shipped** — A free, no-login patient document translation tool with paste, type, voice, and upload input, twelve languages, three reading levels, urgent item extraction, side-by-side view, user-initiated verification with issue cards, copy and share, 90-day session persistence, and PDF export. Deployed at literacy.rohimaya.ai.

### Process steps interactive (sidebar anchors)
- The Constraint Set
- Two-Pass Architecture
- Reading Level System
- Pivot Stories
- What Shipped

### Pivot stories (for PivotAccordion)

**Pivot 1 — Languages: principle over inventory**
The equity principle: twelve languages at launch, not two. The specific twelve were chosen for translation quality, system prompt feasibility, and script diversity across the largest underserved patient populations in U.S. healthcare. The principle does not depend on any single language being in the list. It depends on not deferring the decision.
**Lesson:** "Add it later" is a choice about whose needs wait. This product made the opposite choice at launch.

**Pivot 2 — Reading levels: patient language over grade labels**
Internally the system maps to depth tiers. The interface ships Simple, Clear, and Complete. Grade-level labels are technically accurate and emotionally wrong at the point of use.
**Lesson:** In a clinical context, the label a patient sees is a design decision with real consequences. Plain language applies to the interface, not just the translation.

**Pivot 3 — Verification: second pass on the patient's terms**
The original spec called for automatic verification on every translation. The shipped version is user-initiated. Making verification explicit and on-demand respects autonomy, controls cost on a free tool, and maintains trust by keeping the patient in control of what happens next.
**Lesson:** Automated is not always more trustworthy. Visible and explicit builds more trust than silent in a clinical context.

**Pivot 4 — Sonnet for clinical text**
The original spec called for Haiku by default with Sonnet escalation on complex documents. The repo uses Sonnet for both translate and verify calls. Clinical plain-language translation across twelve languages with structured urgent item extraction and reading level adherence is not a context where the faster model is the right default.
**Lesson:** Model selection is a product safety decision in clinical contexts. Default to the model that gets the clinical output right until there is enough volume data to build a confident routing layer.

### What shipped (grouped, for ShippedGrid)
- **Input and access:** Paste, type, voice (Web Speech API), PDF and .txt upload. No login. No setup. Free. Mobile, tablet, and desktop.
- **Translation engine:** Twelve languages. Simple, Clear, Complete reading levels. Medical term explanation. Attribution language. Claude Sonnet (`claude-sonnet-4-20250514`). Zod on request bodies, manual validation on Claude responses.
- **Verification:** User-initiated second Claude pass. Issue cards. THOROUGH CHECK / PARTIAL CHECK / QUICK CHECK badges. No auto re-render.
- **Output features:** Urgent item extraction, side-by-side view, copy and share, PDF export with disclaimer, 90-day session persistence, 410 for expired links.
- **Infrastructure:** Next.js 15, Tailwind CSS v4, Claude API, Zod, rate limiting, Supabase with versioned migrations, Vercel.

### Stack highlighted
Claude API (two-pass architecture, `claude-sonnet-4-20250514`), Zod (API request validation), Supabase (90-day sessions, versioned migrations)

### Stack standard
Next.js 15, TypeScript, Tailwind CSS v4, Vercel

### Impact quote
This project exists because discharge instructions written at a 12th-grade reading level do not help a patient who reads at a 5th-grade level, speaks Vietnamese or Tagalog at home, and is scared. That gap is preventable with a two-second API call. The research agrees.

### Honest summary

**Technical understanding:**
The two-pass Claude architecture uses `claude-sonnet-4-20250514` for both the translate and verify calls. There is no Haiku default or model router currently implemented. Sonnet is the right choice for this use case: the instruction set is complex across all three reading levels, urgent item extraction is a structured output contract, and translation quality on clinical terminology matters more than marginal latency savings from a smaller model. Zod validates incoming API request bodies. Claude JSON responses use manual validation with retry logic on transport failures, not on parse errors after text has been returned. Rate limiting is applied to translate, verify, share (POST and GET), and parse routes. Supabase sessions use 90-day expiry with versioned SQL migrations. Expired links return 410.

**Product understanding:**
Every design constraint in this product came from a clinical observation. No login because patients who have just been discharged will not create an account. Urgent items first because the most safety-critical information must not be buried. Twelve languages at launch because deferring language support is a choice about whose needs wait. Verification user-initiated rather than automatic because doubling latency on every free translation prioritizes pipeline architecture over the patient's experience. The four pivot stories in Section 3 each represent a real product decision with a real tradeoff.

**Design understanding:**
The interface is built for a specific emotional state: someone who is worried, possibly unfamiliar with the language on the page, and needs information immediately. Every design decision serves speed of access. The reading level labels Simple, Clear, and Complete are plain language applied to the interface itself. The side-by-side view was built for a secondary use case: a caregiver or coordinator who needs to verify a translation. The reading level selector is surfaced at the top of the interface because the person choosing may not be the person receiving the document. Accessibility patterns including skip link, keyboard navigation, focus-to-results, and `prefers-reduced-motion` are launch requirements, not roadmap items.

### What this demonstrates
- Designing for emotionally vulnerable, non-technical users with zero tolerance for friction
- Two-pass AI architecture and on-demand verification design for patient safety contexts
- Patient safety framing applied to product decisions including model selection, verification UX, and language scope
- Multilingual product development with accessibility as a launch requirement, not a roadmap item
- Full-stack build from problem definition to deployed product with Zod validation, rate limiting, and versioned database migrations
- Clinical operations background applied directly to product constraint design
- Accessibility-oriented engineering: skip links, keyboard navigation, focus management, motion preferences

---

## SECTION 8 — CITATIONS

[1] U.S. Department of Health and Human Services, Office of Disease Prevention and Health Promotion. "Health Literacy in Healthy People 2030." healthypeople.gov.

[2] Samuels-Kalow ME, Stack AM, Porter SC. "Effective discharge communication in the emergency department." Annals of Emergency Medicine. 2012;60(2):152-9. doi:10.1016/j.annemergmed.2011.10.023.

[3] Jager AJ, Wynia MK. "Who gets a teach-back? Patient-reported incidence of experiencing a teach-back." Journal of Health Communication. 2012;17(Suppl 3):294-302. doi:10.1080/10810730.2012.712624.

[4] Jack BW, Chetty VK, Anthony D, et al. "A reengineered hospital discharge program to decrease rehospitalization: a randomized trial." Annals of Internal Medicine. 2009;150(3):178-87. doi:10.7326/0003-4819-150-3-200902030-00007.

[5] U.S. Department of Health and Human Services. "Quick Guide to Health Literacy." odphp.health.gov.

[6] Weiss BD. "Health Literacy and Patient Safety: Help Patients Understand." American Medical Association Foundation, 2007.

[7] Kessels RP. "Patients' memory for medical information." Journal of the Royal Society of Medicine. 2003;96(5):219-22. doi:10.1258/jrsm.96.5.219.

[8] Berkman ND, Sheridan SL, Donahue KE, et al. "Low health literacy and health outcomes: an updated systematic review." Annals of Internal Medicine. 2011;155(2):97-107. doi:10.7326/0003-4819-155-2-201107190-00005.

[9] National Institutes of Health, National Library of Medicine. "Plain Language at NIH." nih.gov.