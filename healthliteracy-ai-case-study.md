# HEALTHLITERACY AI — CASE STUDY

*Reference document. Does not render on site. All visitor-facing content lives in caseStudies.ts.*
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
| **Key outcome** | Free, no-login patient document translation tool with twelve-language support, three reading levels, AI-verified output, and shareable sessions |
| **Stack** | Next.js 15 · TypeScript · Tailwind CSS v4 · Claude API · Supabase · Vercel |

---

## SECTION 1 — THE PROOF POINT

Every shift for fifteen years, I watched the same thing happen.

A patient would receive discharge instructions at the nurses' station. Maybe they had a procedure that morning. Maybe they had been in the hospital for a week. They would take the papers, fold them, and put them in a bag. Some of them could not read the papers. Some of them could read the words but not understand what they meant. Some of them spoke a different language at home and had been nodding politely throughout a conversation they were translating in their head.

We handed them a document written at a ninth-grade reading level and sent them home.

The readmissions I saw were not always the result of complex diagnoses. Sometimes they were the result of a patient who did not understand that "take with food" meant with every dose, not just the first one. Sometimes they were the result of a patient who stopped taking a medication because a side effect scared them and there was no phone number to call at 11pm. Sometimes they were the result of a patient who did not speak English as a primary language, whose discharge instructions were in English, and who had no way to ask anyone to explain them.

This tool exists because that gap is preventable. Not later. Now.

---

## SECTION 2 — THE PROBLEM

### The data

**88% of American adults have less-than-proficient health literacy.**
Only 12% of U.S. adults meet the threshold for proficient health literacy, according to the U.S. Department of Health and Human Services. This is not a niche population. It is nearly everyone. [1]

**Discharge instructions are written at the wrong level, consistently.**
The American Medical Association, the Department of Health and Human Services, and the National Institutes of Health all recommend patient-facing materials be written at or below a sixth-grade reading level. Research published in the Journal of General Internal Medicine found that 88.7% of discharge instructions analyzed were inaccessible to the patients they were intended for, with a mean Flesch-Kincaid grade level of 9.1. Only 11.3% of instructions fell within recommended guidelines. [2]

**The language gap compounds the literacy gap.**
The United States has no dominant second language. A tool that handles Spanish but not Haitian Creole, Vietnamese, or Somali does not solve the problem for the patients who are actually in the room. HealthLiteracy AI launched with twelve languages because the minimum viable product for equity is not English plus one. [3]

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

**Attribution language that prevents misreading as diagnosis.** The output includes framing that tells the patient this is a translation, not a diagnosis or medical advice. This is not a disclaimer bolted on at the bottom. It is part of the output architecture.

**Twelve languages at launch, not deferred.**
The standard MVP pattern would be to launch in English and Spanish and "add languages later." That pattern does not serve the populations that are most underserved by health literacy tools. Vietnamese, Haitian Creole, Somali, Arabic, Portuguese, Hindi, Tagalog, Korean, Mandarin, French, and Spanish were all supported at launch. Later never comes.

### The core design decision: two-pass translation

The single most important architectural decision in HealthLiteracy AI is the verification pass.

A one-pass Claude translation would produce a translation. A two-pass system produces a translation that has been checked against itself. The first call translates. The second call compares the translation against the original and reports omissions.

This matters because clinical language is dense. A discharge instruction might say "avoid strenuous activity for six weeks, which includes heavy lifting, vigorous exercise, and sexual activity." A translation might drop the third item. A one-pass system would not catch it. A two-pass system does.

The verification output is not shown to the patient as an error state. It is shown as a confidence indicator: "This translation was reviewed and matched the original with high accuracy." If the review pass detects a material omission, the system flags it and re-renders the section.

### The reading level system

Three reading levels: Simple, Clear, and Complete. Each level changes not just vocabulary but sentence length, paragraph structure, and the degree to which the AI explains concepts versus simply translates them. Simple assumes the patient has low prior clinical knowledge and explains everything. Complete assumes literacy but not clinical training and preserves full detail.

The reading level selector is surfaced immediately on the interface, not buried in settings. The assumption is that the person choosing the reading level may be a family member, a home health aide, or the patient themselves, not a clinician.

### Side-by-side view

The original and translation render side by side on larger screens. This was a deliberate design choice for a specific use case: a caregiver or care coordinator who needs to verify that a translation is accurate before presenting it to a patient. The side-by-side view makes the verification workflow possible without requiring any export or copy-paste.

---

## SECTION 4 — WHAT SHIPPED

### Input and access
- Paste, type, or upload input methods
- No login, no setup, no credit card
- Works on mobile, tablet, and desktop
- Free, permanently

### Translation engine
- Claude API (`claude-sonnet-4-20250514` for translation and verification)
- Twelve-language support: English, Spanish, French, Portuguese, Haitian Creole, Somali, Vietnamese, Tagalog, Arabic, Hindi, Korean, Mandarin
- Three reading levels: Simple, Clear, Complete
- Medical term explanation built into every output
- Attribution language preventing misreading as diagnosis

### Output features
- Urgent item extraction: high-priority clinical items surfaced as a separate card array at the top
- Side-by-side view (original and translation rendered together)
- AI verification pass: second Claude call checks translation against original for omissions
- Confidence indicator reflecting verification result
- Copy and share functionality
- Session persistence via Supabase

### Infrastructure
- Next.js 15, App Router, TypeScript
- Tailwind CSS v4
- Claude API (`claude-sonnet-4-20250514`)
- Supabase for session storage
- Deployed on Vercel at literacy.rohimaya.ai

---

## SECTION 5 — TECHNICAL ARCHITECTURE

| Component | Decision | Rationale |
|---|---|---|
| AI model | `claude-sonnet-4-20250514` (single model) | Translation and verification both call the same model string in code. There is no Haiku route or env-based model switch today. |
| Translation architecture | Two-pass: translate then verify | One-pass translation has no error correction. The verification pass catches omissions that would be clinically meaningful. |
| Urgent item extraction | Structured array output, separate from translation body | Urgency classification is a first-class output, not a secondary feature. The system prompt instructs the AI to extract urgency-flagged items before generating the translation. |
| Reading level system | Three tiers with distinct prompt instructions per tier | Vocabulary change alone is insufficient. Each tier has a different instruction set for sentence structure, explanation depth, and concept unpacking. |
| Session storage | Supabase | Sessions are persisted so a patient can share a URL and return to the same translation. No authentication required. |
| Language selection | Twelve at launch | The decision to not defer languages was a product principle, not a technical one. All twelve languages are live on the first deployment. |
| Input methods | Paste, type, upload | Upload handles PDF and image formats. The tool processes them through text extraction before passing to Claude. |
| Attribution framing | Baked into output, not footer disclaimer | The framing that this is a translation and not medical advice is part of the structured output, not added after the fact. |

---

## SECTION 6 — STATUS MATRIX

| Area | Status | Notes |
|---|---|---|
| Core translation | Working | All twelve languages operational. Reading levels functional. |
| Urgent item extraction | Working | Structured array surfaces at the top of output on every run. |
| AI verification pass | Working | Two-pass architecture operational. Confidence indicator renders correctly. |
| Side-by-side view | Working | Renders correctly on desktop and tablet. Mobile collapses to single-column. |
| Session persistence | Working | Supabase sessions persist. Share URL functional. |
| PDF upload | Partially working | Text-heavy PDFs extract correctly. Scanned or image-heavy PDFs may return incomplete extraction. |
| Voice input | Not yet built | Roadmap item. Web Speech API integration planned. |
| Provider-facing mode | Not yet built | A future version would offer a provider interface for creating templated plain-language instructions at discharge. |
| Offline mode | Not yet built | Currently requires network connection for all Claude API calls. |

---

## SECTION 7 — PORTFOLIO COPY

### Proof point (short callout for site)
Fifteen years of watching patients fold their discharge papers into a bag and go home without understanding them. This tool closes one piece of that gap, for free, in twelve languages, with no login required.

### Stats
- 12 languages at launch
- 3 reading levels
- 88% of Americans have less than proficient health literacy [1]

### Card summary
Free patient document translation in twelve languages and three reading levels. Paste, type, or upload. The AI extracts urgent items first, translates with medical term explanations, and runs a verification pass to check its own work. No login. No setup. Live at literacy.rohimaya.ai.

### Project description
HealthLiteracy AI translates clinical documents into plain language. Any document. Any language from the twelve supported. Any reading level: Simple, Clear, or Complete. The output surfaces urgent items at the top, explains every medical term in plain language, and runs a second AI pass to verify the translation against the original for omissions. It is built for patients, built for caregivers, and built to be accessible at any hour with no account required.

### Problem statement
Clinical documentation is written for providers. Patients receive the same documents at discharge, often scared, sometimes in pain, frequently in a language they do not read fluently, and are expected to manage their own care from them. 88% of American adults have less-than-proficient health literacy. Patients who understand their discharge instructions are 30% less likely to be readmitted. That gap is not inevitable. It is addressable with a well-designed AI tool.

### Process steps (for interactive section on work page)
1. **The constraint set** — No login. No setup. Urgent items first. Medical terms explained in the same sentence. Twelve languages at launch, not deferred. Attribution language in the output, not the footer. Every constraint came from fifteen years of watching what patients actually do when they leave a care setting.
2. **The core architecture decision** — One-pass Claude translation produces a translation. Two-pass produces a translation that has been checked against itself. The second call compares the output against the original and flags omissions. This decision exists because clinical language is dense and a dropped instruction can mean a readmission.
3. **What shipped** — A free, no-login patient document translation tool with three input methods, twelve languages, three reading levels, urgent item cards, side-by-side view, copy and share, and a built-in AI verification pass. Deployed at literacy.rohimaya.ai, sessions persisted in Supabase.

### Process steps interactive (sidebar anchors)
- The Constraint Set
- Two-Pass Architecture
- Reading Level System
- What Shipped

### Pivot story
The expected pattern was to build in English and Spanish and add languages later. That pattern was rejected before the first commit.

The principle: the populations most underserved by health literacy tools are not the populations served by English plus one language. Haitian Creole, Somali, Vietnamese, and Tagalog were not afterthoughts. They were in the first deploy.

**Lesson:** "Add it later" is not a product decision. It is a choice about whose needs get deferred. This product made the opposite choice.

### What shipped (grouped, for ShippedGrid)
- **Input and access:** Paste, type, or upload. No login. No setup. Free. Works on mobile, tablet, and desktop.
- **Translation engine:** Twelve languages. Three reading levels. Medical term explanation. Attribution language. Claude Sonnet (`claude-sonnet-4-20250514`).
- **Output features:** Urgent item extraction, side-by-side view, AI verification pass, confidence indicator, copy and share, session persistence.
- **Infrastructure:** Next.js 15, Tailwind CSS v4, Claude API, Supabase, Vercel.

### Stack highlighted
Claude API (two-pass architecture), Next.js 15 (App Router), Supabase (session persistence), Vercel

### Stack standard
TypeScript, Tailwind CSS v4, Zod

### Impact quote
This project exists because discharge instructions written at a 12th-grade reading level do not help a patient who reads at a 5th-grade level, speaks Haitian Creole at home, and is scared. That gap is preventable with a two-second API call. The research agrees.

### Honest summary

**Technical understanding:**
The two-pass Claude architecture is the technical proof of this case study. A single API call translates. The second call verifies the translation against the source for omissions. The system prompt for each pass is distinct: the first pass is a translation agent, the second is a review agent with a specific brief to surface discrepancies. The reading level system is implemented as three separate instruction sets, not a vocabulary filter. The urgent item extraction is a structured output contract, not regex on the result.

**Product understanding:**
Every design constraint in this product came from a clinical observation, not a user story. No login because patients who have just been discharged will not create an account. Urgent items first because the most safety-critical information must not be buried. Twelve languages at launch because deferring any language is a product decision about whose needs matter. The honest gap is PDF upload on image-heavy documents, which is in the status matrix and on the roadmap.

**Design understanding:**
The interface is built for a specific emotional state: someone who is worried, possibly unfamiliar with the language on the page, and needs information immediately. Every design decision serves speed of access. The side-by-side view was built for a secondary use case: a caregiver or care coordinator who needs to verify a translation. The reading level selector is surfaced at the top of the interface, not in settings, because the person choosing may not be the person receiving the document.

### What this demonstrates
- Ability to design for emotionally vulnerable, non-technical users with zero tolerance for friction
- Understanding of two-pass AI architecture and verification design
- Patient safety framing applied to product decisions, not just UI copy
- Multilingual product development with accessibility as a launch requirement, not a roadmap item
- Full-stack build from problem definition to deployed product
- Clinical operations background applied directly to product constraint design

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