<div align="center">

  <div>
    <img src="https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Supabase_pgvector-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
    <img src="https://img.shields.io/badge/Vapi_Voice_AI-10B981?style=for-the-badge&logoColor=white" alt="Vapi" />
    <img src="https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white" alt="Google Gemini" />
    <img src="https://img.shields.io/badge/Clerk-6C47FF?style=for-the-badge&logo=clerk&logoColor=white" alt="Clerk" />
    <img src="https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  </div>

  <br />

  <h1>NeuraNest — Real-Time AI Voice Tutoring & Adaptive Learning Platform</h1>

  <p align="center">
    An interactive AI learning platform combining <strong>low-latency voice companions</strong>, <strong>RAG document grounding (pgvector)</strong>, a <strong>live Mermaid & KaTeX visual whiteboard</strong>, <strong>SuperMemo SM-2 spaced repetition flashcards</strong>, and <strong>deterministic gamification analytics</strong>.
  </p>

  <img src="public/images/Screenshot 2025-07-15 201156.png" alt="NeuraNest Platform Preview" />
</div>

---

## 📋 Table of Contents

1. [Overview](#-overview)
2. [System Architecture](#-system-architecture)
3. [Voice Session & AI Insights Pipeline](#-voice-session--ai-insights-pipeline)
4. [RAG Knowledge Base Pipeline](#-rag-knowledge-base-pipeline)
5. [Database Schema (ERD)](#-database-schema-erd)
6. [Key Features](#-key-features)
7. [Tech Stack](#-tech-stack)
8. [Local Setup & Environment Variables](#-local-setup--environment-variables)
9. [Testing & Verification](#-testing--verification)

---

## 🧠 Overview

**NeuraNest** transforms passive self-study into an active, multi-modal tutoring experience. Students create or pick specialized AI voice companions across subjects (`Maths`, `Science`, `Coding`, `Language`, `History`, `Economics`), upload their own PDF lecture notes into a vector knowledge base, and converse naturally in real time.

During a live voice session, the AI tutor can:
- **Search uploaded study notes** via semantic vector similarity (`pgvector` + Google `gemini-embedding-001`) to ground answers in the student's curriculum.
- **Draw live visual explanations** on an interactive split-screen whiteboard using **Mermaid.js** flowcharts/diagrams and **KaTeX** mathematical equations.
- **Automatically synthesize post-session learning artifacts** (structured summary, key concepts, multiple-choice quizzes, and **SM-2 spaced repetition flashcards**) when the call ends.

---

## 🏗️ System Architecture

```mermaid
flowchart TB
  subgraph Client["Client Layer (Next.js 15 App Router & React 19)"]
    UI["Responsive UI + Dark Mode (Tailwind v4)"]
    VoiceSDK["Vapi Web SDK (WebRTC Audio + Partial Transcripts)"]
    WB["Live Whiteboard (Mermaid.js + KaTeX)"]
    SRSUI["SM-2 Flashcard Review Studio"]
    KBUI["PDF Knowledge Base Manager"]
  end

  subgraph EdgeServer["Next.js Server Actions & Route Handlers"]
    Actions["Server Actions (Companions, Flashcards, Gamification, Knowledge)"]
    DocAPI["POST /api/documents/process (PDF -> Chunks -> Embeddings)"]
    WebhookAPI["POST /api/vapi/webhook (Call Lifecycle & RAG Tool Handler)"]
    InsightsAPI["POST /api/ai/insights (Structured Output Synthesis)"]
  end

  subgraph ExternalAI["AI & Voice Infrastructure"]
    VapiCloud["Vapi Orchestrator (Deepgram Nova-3 STT + ElevenLabs TTS)"]
    GeminiLLM["Google Gemini 2.5 Flash (Tutoring + Zod Structured Insights)"]
    GeminiEmbed["Google gemini-embedding-001 (1536-dim Embeddings)"]
  end

  subgraph DataAuth["Data, Auth & Observability"]
    Clerk["Clerk Auth & Billing Subscriptions"]
    SupabaseDB["Supabase PostgreSQL + Row Level Security"]
    PgVector["Supabase pgvector (HNSW Cosine Index)"]
    Sentry["Sentry Error & Trace Monitoring"]
  end

  UI --> Clerk
  UI --> Actions
  VoiceSDK <-->|"Low-latency WebRTC Audio"| VapiCloud
  VoiceSDK -->|"Client Tool Calls (render_diagram / render_equation)"| WB
  KBUI --> DocAPI
  SRSUI --> Actions

  DocAPI -->|"Chunked Text"| GeminiEmbed
  GeminiEmbed -->|"1536-dim Vectors"| PgVector

  VapiCloud <-->|"Conversation Turns"| GeminiLLM
  VapiCloud -->|"Server Tool Call (search_knowledge_base)"| WebhookAPI
  VapiCloud -->|"end-of-call-report"| WebhookAPI

  WebhookAPI -->|"match_document_chunks RPC"| PgVector
  WebhookAPI -->|"Trigger Async Analysis"| InsightsAPI
  InsightsAPI -->|"Zod Schema Parse"| GeminiLLM
  InsightsAPI -->|"Persist Insights & Flashcards"| SupabaseDB
  Actions --> SupabaseDB
```

---

## 🎙️ Voice Session & AI Insights Pipeline

```mermaid
sequenceDiagram
  autonumber
  actor Student
  participant Browser as CompanionComponent (Browser)
  participant Vapi as Vapi Voice Cloud
  participant Webhook as /api/vapi/webhook
  participant Insights as /api/ai/insights
  participant Gemini as Google Gemini API
  participant DB as Supabase (PostgreSQL + pgvector)

  Student->>Browser: Click "Start Session"
  Browser->>Vapi: vapi.start(assistant, variableValues)
  Vapi-->>Browser: call-start + callId
  Browser->>DB: addToSessionHistory(status = "in_progress")

  loop Real-Time Voice & Multi-Modal Tutoring
    Student->>Vapi: Speaks question
    Vapi-->>Browser: Streaming partial & final transcripts
    alt Student asks about uploaded PDF notes
      Vapi->>Webhook: tool-calls (search_knowledge_base)
      Webhook->>Gemini: Embed query (gemini-embedding-001, 1536 dims)
      Webhook->>DB: RPC match_document_chunks (HNSW cosine similarity)
      DB-->>Webhook: Top-K relevant document chunks
      Webhook-->>Vapi: Grounded context
    else Concept benefits from visual explanation
      Vapi-->>Browser: Client tool-call (render_diagram / render_equation)
      Browser->>Browser: Render live Mermaid SVG or KaTeX formula on Whiteboard
    end
    Vapi-->>Student: Low-latency ElevenLabs voice response
  end

  Student->>Browser: Click "End Session"
  Vapi->>Webhook: end-of-call-report (transcript, duration, cost)
  Webhook->>DB: Update session_history (status = "finalizing")
  Webhook->>Insights: POST /api/ai/insights { callId }
  Insights->>Gemini: chat.completions.parse (Zod InsightsSchema)
  Gemini-->>Insights: { summary, key_concepts, flashcards, quiz }
  Insights->>DB: Insert due flashcards + mark session status = "completed"
```

---

## 📄 RAG Knowledge Base Pipeline

```mermaid
flowchart LR
  PDF["User PDF Upload"] --> Parse["unpdf Text Extraction"]
  Parse --> Chunk["Sliding-Window Chunker (1000 chars, 200 overlap)"]
  Chunk --> Embed["Google gemini-embedding-001 (1536 dims)"]
  Embed --> Store["Supabase document_chunks (HNSW Vector Index)"]
  Store --> Search["Live Vapi Tool Call: match_document_chunks()"]
```

---

## 🗄️ Database Schema (ERD)

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

## ✨ Key Features

- **🎙️ Real-Time Voice AI Companions**: Configurable voice tutors powered by Vapi, Deepgram Nova-3/Nova-2 speech-to-text, Google `gemini-2.5-flash`, and ElevenLabs voices with live partial-to-final transcript streaming.
- **📐 Live Interactive Whiteboard**: Client-side Vapi function tools (`render_diagram` and `render_equation`) dynamically open a split-screen canvas rendering **Mermaid.js** diagrams and **KaTeX** equations during the conversation.
- **📚 RAG Knowledge Base (`pgvector`)**: Upload PDF study notes in `/knowledge`. Documents are parsed server-side with `unpdf`, chunked with sliding-window overlap, embedded with Google `gemini-embedding-001` (`1536` dimensions), indexed with an HNSW cosine index, and queried mid-call via `search_knowledge_base`.
- **🧠 SuperMemo SM-2 Spaced Repetition**: Post-call transcripts are analyzed with Zod structured outputs to generate flashcards. Review due cards at `/review` with Anki-style grade buttons (`Again`, `Hard`, `Good`, `Easy`), live next-interval previews, and instant keyboard shortcuts (`Space`, `1`–`4`).
- **🏆 Deterministic Gamification Engine**: XP, level progression, daily/longest study streaks, and 10 achievement badges on `/my-journey` are computed as a pure function over source-of-truth session, quiz, and flashcard records—preventing state drift and enabling fast unit testing.
- **🎨 Design-Engineered UI**: Built with custom cubic-bezier easing curves, GPU-accelerated transitions, capability-gated hover states (`@media (hover: hover) and (pointer: fine)`), `prefers-reduced-motion` support, and mobile-native viewport handling (`100dvh`, safe-area insets, zero tap-highlight flash).

---

## ⚙️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 15.3 (App Router, Server Actions, Turbopack), React 19, TypeScript 5 |
| **Styling & Motion** | Tailwind CSS v4, Radix UI / shadcn/ui, Lucide Icons, Lottie, Custom CSS Easing Tokens |
| **Voice & AI** | Vapi Web SDK (`@vapi-ai/web`), Google Gemini (`gemini-2.5-flash`, `gemini-embedding-001`), Deepgram, ElevenLabs |
| **Visual Rendering** | Mermaid.js v12 (Diagrams), KaTeX (LaTeX Math Rendering) |
| **Database & Vector Search** | Supabase PostgreSQL, `pgvector` (HNSW Cosine Index), Row Level Security (RLS) |
| **Auth & Billing** | Clerk (`@clerk/nextjs`) Authentication & Subscription Plan Gating |
| **Observability & Testing** | Sentry (`@sentry/nextjs`), Vitest (Unit Testing) |

---

## 🚀 Local Setup & Environment Variables

### 1. Clone and install dependencies

```bash
git clone https://github.com/ishan1603/NeuraNest.git
cd NeuraNest
npm install
```

### 2. Run Supabase migrations

In your Supabase project's **SQL Editor**, run the migrations in order:
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
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Supabase (Database + pgvector)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Vapi Voice AI
NEXT_PUBLIC_VAPI_PUBLIC_KEY=your_vapi_public_key

# Google Gemini (Structured Insights + 1536-dim Embeddings)
GEMINI_API_KEY=AIzaSy...

# Public App URL (for Vapi Webhooks)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Start the development server

```bash
npm run dev
```

---

## 🧪 Testing & Verification

```bash
# Run unit tests (SM-2 Spaced Repetition, Gamification Engine, Plan Quotas)
npx vitest run

# Type-check and lint
npx tsc --noEmit
npm run lint

# Production build
npm run build
```
