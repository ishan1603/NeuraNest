<div align="center">

  <div>
    <img src="https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Supabase_pgvector-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
    <img src="https://img.shields.io/badge/Vapi_Voice_AI-10B981?style=for-the-badge&logoColor=white" alt="Vapi" />
    <img src="https://img.shields.io/badge/Google_Gemini_2.5-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white" alt="Google Gemini" />
    <img src="https://img.shields.io/badge/Clerk-6C47FF?style=for-the-badge&logo=clerk&logoColor=white" alt="Clerk" />
    <img src="https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  </div>

  <br />

  <h1>NeuraNest: Real-Time AI Voice Tutoring and Live Whiteboard Studio</h1>

  <p align="center">
    An interactive AI learning platform combining <strong>low-latency WebRTC voice companions</strong>, <strong>verified RAG document grounding (pgvector)</strong>, a <strong>topic-specific Mermaid and KaTeX live whiteboard</strong>, <strong>SuperMemo SM-2 spaced repetition flashcards</strong>, and <strong>deterministic gamification analytics</strong>.
  </p>

</div>

---

## Interface Gallery

### Editorial Notebook Hero and Interactive Lesson Dossier (Light Mode)
![NeuraNest Light Mode Hero](public/images/screenshots/hero-light.png)

### Warm Espresso Ink Theme and Live Subject Dossier Switcher (Dark Mode)
![NeuraNest Dark Mode Hero](public/images/screenshots/hero-dark.png)

### Studio Pillars, Featured Voice Companions, and Session Ledger
![NeuraNest Dashboard Sections](public/images/screenshots/dashboard-sections.png)

### Companion Marketplace and Subject Filters
![NeuraNest Companion Library](public/images/screenshots/companions-library.png)

---

## Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [System Architecture](#system-architecture)
4. [Voice Session, Live Whiteboard, and Insights Pipeline](#voice-session-live-whiteboard-and-insights-pipeline)
5. [RAG Knowledge Base and Citation Proof Pipeline](#rag-knowledge-base-and-citation-proof-pipeline)
6. [Database Schema (ERD)](#database-schema-erd)
7. [Tech Stack](#tech-stack)
8. [Local Setup and Environment Variables](#local-setup-and-environment-variables)
9. [Production Deployment Guide (Vercel)](#production-deployment-guide-vercel)
10. [Testing and Verification](#testing-and-verification)

---

## Overview

**NeuraNest** turns passive self-study into an active, multi-modal voice tutoring studio. Learners create or select specialized AI voice companions across subjects (`Maths`, `Science`, `Coding`, `Language`, `History`, `Economics`), attach their own PDF lecture notes from a vector knowledge base, and converse naturally over low-latency WebRTC audio.

During a live voice session, the platform provides:
- **Turn-Coalesced, Deduplicated Live Transcripts**: Consecutive phrases from the same speaker are merged into a single conversational turn so natural speech pauses never fragment a sentence into multiple transcript lines.
- **Verified PDF Grounding and Live Citation Proof**: Learners select which uploaded PDFs to attach before starting a call. Whenever the student speaks, semantic vector search (`pgvector` + Google `gemini-embedding-001`) retrieves the top matching chunks and displays them inside an expandable **Citation Proof Drawer** with similarity scores.
- **Topic-Specific Live Whiteboard**: Powered by Google `gemini-2.5-flash` (`/api/ai/visual`), the live board synthesizes real-time **Mermaid.js** flowcharts tailored to the exact concepts discussed. **KaTeX** mathematical formulas are rendered strictly for numeric subjects (`Maths`, `Science`, `Coding`, `Economics`) and automatically suppressed for humanities subjects (`History`, `Language`).
- **Automated Post-Session Synthesis**: When a session concludes, Gemini generates structured study notes, key concepts, multiple-choice quizzes, and **SuperMemo SM-2 flashcards** ready for spaced-repetition review.

---

## Key Features

- **Real-Time WebRTC Voice Companions**: Configurable AI tutors powered by `@vapi-ai/web` v3, Deepgram Nova-3/Nova-2 speech-to-text, Google `gemini-2.5-flash`, and ElevenLabs voices with sub-second response latency.
- **Dynamic AI Whiteboard (`/api/ai/visual`)**: Synthesizes live Mermaid architecture/process diagrams from the active conversation transcript alongside Vapi client tool calls (`render_diagram` and `render_equation`), with subject-aware KaTeX math gating (`isNumericSubject`).
- **RAG Knowledge Base with Vector Proof (`/knowledge`)**: Server-side PDF text extraction via `unpdf`, adaptive sliding-window chunking that respects free-tier embedding quotas, `1536`-dimensional `gemini-embedding-001` vectors stored in Supabase `pgvector` with an HNSW cosine index, and in-call chunk citation verification.
- **SuperMemo SM-2 Flashcard Studio (`/review`)**: Anki-style spaced repetition deck with four grading buttons (`Again`, `Hard`, `Good`, `Easy`), live next-interval previews, and keyboard shortcuts (`Space`, `1` to `4`).
- **Deterministic Gamification Engine (`/my-journey`)**: XP, level progression, daily and longest study streaks, and 10 achievement badges computed as a pure function over session, quiz, and flashcard records.
- **Zero-Lag Notebook Design System**: Crafted with `Caveat`, `Plus Jakarta Sans`, and `JetBrains Mono` on a warm ruled-notebook surface (`#F6F2E6` Light / `#141311` Dark). Animations follow Emil Kowalski's design engineering rules: composite-only `transform` and `opacity` transitions, custom `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` curves, zero `background-attachment: fixed` repaints, capability-gated hover lifts (`@media (hover: hover) and (pointer: fine)`), and full `prefers-reduced-motion` support.

---

## System Architecture

```mermaid
flowchart TB
  subgraph Client["Client Layer (Next.js 15 App Router & React 19)"]
    UI["Notebook UI + Light/Dark Theme (Tailwind v4)"]
    VoiceSDK["Vapi Web SDK v3 (WebRTC Audio + Coalesced Transcripts)"]
    WB["Live AI Whiteboard (Mermaid.js + Numeric-Gated KaTeX)"]
    ProofUI["Live PDF Citation Proof Drawer"]
    SRSUI["SM-2 Flashcard Review Studio"]
    KBUI["PDF Knowledge Base Manager"]
  end

  subgraph EdgeServer["Next.js Server Actions & Route Handlers"]
    Actions["Server Actions (Companions, Flashcards, Gamification, Knowledge)"]
    DocAPI["POST /api/documents/process (Adaptive PDF Chunker + Embeddings)"]
    VisualAPI["POST /api/ai/visual (Live Topic Diagram & Formula Synthesis)"]
    WebhookAPI["POST /api/vapi/webhook (Call Lifecycle & RAG Tool Handler)"]
    InsightsAPI["POST /api/ai/insights (Post-Session Structured Synthesis)"]
  end

  subgraph ExternalAI["AI & Voice Infrastructure"]
    VapiCloud["Vapi Orchestrator (Deepgram Nova-3 STT + ElevenLabs TTS)"]
    GeminiLLM["Google Gemini 2.5 Flash (Tutoring, Live Visuals & Insights)"]
    GeminiEmbed["Google gemini-embedding-001 (1536-dim Embeddings)"]
  end

  subgraph DataAuth["Data, Auth & Observability"]
    Clerk["Clerk Auth, Middleware & Plan Gating"]
    SupabaseDB["Supabase PostgreSQL + Row Level Security"]
    PgVector["Supabase pgvector (HNSW Cosine Index)"]
    Sentry["Sentry Error & Trace Monitoring"]
  end

  UI --> Clerk
  UI --> Actions
  VoiceSDK <-->|"Low-latency WebRTC Audio"| VapiCloud
  VoiceSDK -->|"Turn Transcript Updates"| VisualAPI
  VisualAPI -->|"Mermaid Diagram + KaTeX"| WB
  VoiceSDK -->|"retrieveDocumentContext()"| ProofUI
  KBUI --> DocAPI
  SRSUI --> Actions

  DocAPI -->|"Adaptive Chunks"| GeminiEmbed
  GeminiEmbed -->|"1536-dim Vectors"| PgVector

  VapiCloud <-->|"Conversation Turns"| GeminiLLM
  VapiCloud -->|"Server Tool Call (search_knowledge_base)"| WebhookAPI
  VapiCloud -->|"end-of-call-report"| WebhookAPI

  WebhookAPI -->|"match_document_chunks RPC"| PgVector
  WebhookAPI -->|"Trigger Async Analysis"| InsightsAPI
  InsightsAPI -->|"Zod Schema Validation"| GeminiLLM
  InsightsAPI -->|"Persist Insights & Flashcards"| SupabaseDB
  Actions --> SupabaseDB
```

---

## Voice Session, Live Whiteboard, and Insights Pipeline

```mermaid
sequenceDiagram
  autonumber
  actor Student
  participant Browser as CompanionComponent (Browser)
  participant Visual as /api/ai/visual
  participant Vapi as Vapi Voice Cloud
  participant Webhook as /api/vapi/webhook
  participant Insights as /api/ai/insights
  participant Gemini as Google Gemini 2.5 Flash
  participant DB as Supabase (PostgreSQL + pgvector)

  Student->>Browser: Select attached PDFs & click "Start Session"
  Browser->>Vapi: vapi.start(assistant, variableValues)
  Vapi-->>Browser: call-start + callId
  Browser->>DB: addToSessionHistory(status = "in_progress")

  loop Real-Time Voice & Multi-Modal Tutoring
    Student->>Vapi: Speaks question
    Vapi-->>Browser: Streaming transcripts (coalesced & deduplicated per turn)
    Browser->>DB: retrieveDocumentContext(query, selectedDocIds)
    DB-->>Browser: Top-K matched PDF chunks + similarity % (shown in Proof Drawer)
    Browser->>Visual: POST /api/ai/visual (recent transcript + subject)
    Visual->>Gemini: Synthesize topic-specific Mermaid diagram (+ KaTeX if numeric subject)
    Gemini-->>Visual: JSON { title, caption, diagram, formula }
    Visual-->>Browser: Update Live Whiteboard
    Vapi-->>Student: Low-latency ElevenLabs voice response
  end

  Student->>Browser: Click "End Session"
  Vapi->>Webhook: end-of-call-report (transcript, duration)
  Webhook->>DB: Update session_history (status = "finalizing")
  Webhook->>Insights: POST /api/ai/insights { callId }
  Insights->>Gemini: Generate structured insights (summary, concepts, quiz, flashcards)
  Gemini-->>Insights: Validated JSON payload
  Insights->>DB: Insert due SM-2 flashcards + mark session status = "completed"
```

---

## RAG Knowledge Base and Citation Proof Pipeline

```mermaid
flowchart LR
  PDF["User PDF Upload"] --> Parse["unpdf Text Extraction"]
  Parse --> Chunk["Adaptive Sliding-Window Chunker (<= 45 chunks per PDF)"]
  Chunk --> Embed["Google gemini-embedding-001 (1536 dims + Retry Backoff)"]
  Embed --> Store["Supabase document_chunks (HNSW Vector Index)"]
  Store --> Verify["Live Session Proof Drawer: match_document_chunks()"]
```

---

## Database Schema (ERD)

```mermaid
erDiagram
  COMPANIONS ||--o{ SESSION_HISTORY : "hosts"
  COMPANIONS ||--o{ BOOKMARKS : "bookmarked_in"
  COMPANIONS ||--o{ COMPANION_RATINGS : "rated_in"
  COMPANIONS ||--o{ FLASHCARDS : "sources"
  COMPANIONS ||--o{ DOCUMENTS : "scopes"
  SESSION_HISTORY ||--o{ FLASHCARDS : "generates"
  SESSION_HISTORY ||--o{ QUIZ_ATTEMPTS : "evaluates"
  DOCUMENTS ||--o{ DOCUMENT_CHUNKS : "contains"

  COMPANIONS {
    uuid id PK
    text author
    text name
    text subject
    text topic
    text voice
    text style
    int duration
    boolean is_public
    text language
    int session_count
    numeric rating_avg
  }

  SESSION_HISTORY {
    uuid id PK
    uuid companion_id FK
    text user_id
    text status
    text vapi_call_id
    int duration_seconds
    text transcript_source
    jsonb insights
    text insights_status
  }

  FLASHCARDS {
    uuid id PK
    text user_id
    uuid session_id FK
    uuid companion_id FK
    text front
    text back
    real ease_factor
    int interval_days
    int repetitions
    int lapses
    timestamptz due_at
  }

  DOCUMENTS {
    uuid id PK
    text user_id
    uuid companion_id FK
    text name
    int size_bytes
    int chunk_count
    text status
  }

  DOCUMENT_CHUNKS {
    uuid id PK
    uuid document_id FK
    text user_id
    int chunk_index
    text content
    vector_1536 embedding
  }
```

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 15.3 (App Router, Server Actions, Turbopack), React 19, TypeScript 5 |
| **Typography & Design** | Tailwind CSS v4, Caveat, Plus Jakarta Sans, JetBrains Mono, Radix UI / shadcn/ui |
| **Voice & AI** | Vapi Web SDK (`@vapi-ai/web` v3.0.1), Google Gemini (`gemini-2.5-flash`, `gemini-embedding-001`), Deepgram, ElevenLabs |
| **Visual Whiteboard** | Mermaid.js v11 (Flowcharts & Architecture Diagrams), KaTeX (Numeric-Gated LaTeX Math) |
| **Database & Vector Search** | Supabase PostgreSQL, `pgvector` (HNSW Cosine Index), Row Level Security (RLS) |
| **Authentication** | Clerk (`@clerk/nextjs`) Middleware Route Protection & Subscription Plan Gating |
| **Observability & Testing** | Sentry (`@sentry/nextjs`), Vitest (Unit Testing) |

---

## Local Setup and Environment Variables

### 1. Clone and install dependencies

```bash
git clone https://github.com/ishan1603/NeuraNest.git
cd NeuraNest
npm install
```

### 2. Run Supabase migrations

In your Supabase project's **SQL Editor**, execute the migrations in order:
1. `supabase/migrations/0001_base_schema.sql`
2. `supabase/migrations/0002_v2_platform.sql`

### 3. Configure `.env.local`

Create a `.env.local` file in the project root:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Supabase (Database + pgvector)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Vapi Voice AI (Either variable name is supported)
NEXT_PUBLIC_VAPI_WEB_TOKEN=your_vapi_public_web_token
NEXT_PUBLIC_VAPI_PUBLIC_KEY=your_vapi_public_web_token

# Google Gemini API (Insights, Live Whiteboard Visuals, and 1536-dim Embeddings)
GEMINI_API_KEY=AIzaSy...

# Public App URL (Used by Vapi Server Webhooks)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Start the development server

```bash
npm run dev
```

---

## Production Deployment Guide (Vercel)

### Step 1: Import Repository into Vercel
1. Push your latest `main` branch to GitHub.
2. Open the [Vercel Dashboard](https://vercel.com/new) and import `ishan1603/NeuraNest`.
3. Note that `.npmrc` includes `legacy-peer-deps=true` in the repository root, so Vercel's `npm install` step automatically resolves `@vapi-ai/web@3.0.1` peer dependencies without custom install flags.

### Step 2: Configure Vercel Environment Variables
In **Vercel Project Settings -> Environment Variables**, add the following keys for **Production**, **Preview**, and **Development**:

| Variable Name | Required | Description |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Yes | Google AI Studio API key (`AIzaSy...`). Powers `/api/ai/insights`, `/api/ai/visual`, and `gemini-embedding-001` PDF vectorization. (Replaces any legacy `OPENAI_API_KEY`.) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk Publishable Key (`pk_live_...` or `pk_test_...`). |
| `CLERK_SECRET_KEY` | Yes | Clerk Secret Key (`sk_live_...` or `sk_test_...`). |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Yes | Set to `/sign-in`. |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Yes | Set to `/sign-up`. |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL (`https://<project-ref>.supabase.co`). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase `anon` public key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase `service_role` secret key (used server-side for PDF vector ingestion and webhook updates). |
| `NEXT_PUBLIC_VAPI_WEB_TOKEN` | Yes | Your Vapi Public Key / Web Token from the Vapi Dashboard. |
| `NEXT_PUBLIC_APP_URL` | Yes | Your production domain (for example, `https://neuranest.vercel.app`) with no trailing slash. |
| `VAPI_WEBHOOK_SECRET` | Optional | Shared secret header if you enable webhook signature verification in Vapi. |

### Step 3: Post-Deployment Checklist
1. **Clerk Allowed Domains**: In the Clerk Dashboard, add your Vercel production domain (`https://your-domain.vercel.app`) to allowed origins/redirects.
2. **Supabase JWT Template**: Ensure your Clerk `supabase` JWT template is active if using RLS policies tied to `auth.jwt() ->> 'sub'`.
3. **Redeploy after Env Updates**: Anytime you add or change a `NEXT_PUBLIC_*` variable in Vercel, trigger a fresh deployment so Next.js inlines the updated public values at build time.

---

## Testing and Verification

```bash
# Run unit tests (SM-2 Spaced Repetition, Gamification Engine, Plan Quotas)
npx vitest run

# Type-check and lint
npx tsc --noEmit
npm run lint

# Production build check
npm run build
```
