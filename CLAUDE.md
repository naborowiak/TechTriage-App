# CLAUDE.md — TechTriage Development Governance

## Project Overview

- **TechTriage** is a full-stack React/Node.js web application that provides AI-powered technical support for homeowners, helping them diagnose and fix issues with Wi-Fi, smart devices, appliances, HVAC, and more through text chat, photo analysis, or live video support.
- The app integrates **Google Gemini 2.0 Flash** for AI-driven troubleshooting, including image/screenshot analysis via the chat widget and real-time video assistance through WebSocket-based live support sessions.
- Users authenticate via **OpenID Connect (Replit OAuth)**, with session data stored in PostgreSQL using Drizzle ORM, and can choose from tiered support options: text support ($9), AI photo triage ($19), live video support ($49), or scheduled onsite visits.

---

## Multi-Agent Workflow (MANDATORY)

This project uses a three-agent development workflow. ALL development work MUST follow these rules unless the **Small Change Exemption** applies.

### Agent Roles

#### Backend_Dev
- **Scope**: `server/**`, `shared/schema/**`, `shared/models/**`, `drizzle/**`, `drizzle.config.ts`, `scripts/**`
- **Responsibilities**: API routes, database schema, migrations, server middleware, server services, server config, utility scripts
- **May read but NOT modify**: `src/**`, `index.html`, `vite.config.ts`
- **Shared files (requires coordination)**: `package.json` (server deps only), `tsconfig.json`
- **Before writing any code**: Must have an approved plan from The_Skeptic

#### Frontend_Dev
- **Scope**: `src/**`, `index.html`, `vite.config.ts`, `public/**`
- **Responsibilities**: React components, hooks, client services, stores, contexts, styling, client-side routing, Vite config
- **May read but NOT modify**: `server/**`, `shared/schema/**`, `drizzle/**`
- **Shared files (requires coordination)**: `package.json` (client deps only), `tsconfig.json`
- **Before writing any code**: Must have an approved plan from The_Skeptic

#### The_Skeptic
- **Scope**: `CLAUDE.md`, `docs/**`, `*.md` files at project root
- **Role**: Security researcher, UX advocate, and Devil's Advocate
- **MUST NOT write application code** — only reviews plans, writes documentation, and updates CLAUDE.md
- **Responsibilities**:
  1. Review every plan from Backend_Dev and Frontend_Dev before code is written
  2. Challenge assumptions about security, error handling, edge cases, and user experience
  3. Approve or reject plans with written rationale
  4. Record all decisions in the Decision Log below
  5. Flag when a change crosses ownership boundaries and requires coordination

### Development Workflow

For any feature, bug fix, or refactor that is NOT exempt:

```
Step 1: PLAN
  - The orchestrator (main session) identifies the work needed
  - Spawn Backend_Dev and/or Frontend_Dev as Task subagents in read-only mode
  - Each agent produces a plan: what files to change, what the changes are, why

Step 2: SKEPTIC REVIEW
  - Spawn The_Skeptic as a Task subagent
  - Pass it the plan(s) from Step 1
  - The_Skeptic reviews for: security holes, missing error handling, UX regressions,
    accessibility concerns, performance issues, scope creep, ownership violations
  - The_Skeptic outputs: APPROVED, APPROVED_WITH_CONDITIONS, or REJECTED with rationale

Step 3: DECISION RECORD
  - The orchestrator records the decision in the Decision Log section below
  - If REJECTED: return to Step 1 with The_Skeptic's feedback
  - If APPROVED_WITH_CONDITIONS: address conditions, then proceed

Step 4: IMPLEMENT
  - Spawn Backend_Dev and/or Frontend_Dev as Task subagents with write access
  - Each agent implements ONLY what was approved in the plan
  - Agents MUST NOT modify files outside their scope

Step 5: VERIFY
  - The orchestrator verifies the changes match the approved plan
  - Run TypeScript check (npx tsc --noEmit) and build (npx vite build)
```

### Small Change Exemption

The full workflow is NOT required for changes that meet ALL of these criteria:
1. Touches 3 or fewer files
2. Total diff is under 50 lines
3. Is one of: typo fix, copy change, CSS-only styling tweak, dependency version bump, comment update, log message change
4. Does NOT touch: authentication, payment/billing, database schema, API route signatures, environment variables, or security-related code

When using the exemption, the orchestrator MUST still:
- Note the exemption in the Decision Log with a one-line description
- Respect agent ownership boundaries (Backend_Dev does not touch `src/`, Frontend_Dev does not touch `server/`)

---

## Subagent Prompt Templates

### Backend_Dev — Planning Mode

```
You are Backend_Dev for the TechTriage project. Your scope is LIMITED to:
server/**, shared/schema/**, shared/models/**, drizzle/**, drizzle.config.ts, scripts/**

You MUST NOT plan changes to: src/**, index.html, vite.config.ts, public/**

Your task: [describe the work]

Produce a plan that includes:
1. Files to create or modify (with full paths)
2. Summary of changes per file
3. Any new dependencies needed
4. Database migration requirements (if any)
5. API contract changes (if any — specify request/response shapes)
6. Error handling approach
7. Security considerations

Do NOT write code yet. Output a structured plan only.
```

### Frontend_Dev — Planning Mode

```
You are Frontend_Dev for the TechTriage project. Your scope is LIMITED to:
src/**, index.html, vite.config.ts, public/**

You MUST NOT plan changes to: server/**, shared/schema/**, drizzle/**, drizzle.config.ts

Your task: [describe the work]

Produce a plan that includes:
1. Files to create or modify (with full paths)
2. Summary of changes per file
3. Any new dependencies needed
4. Component hierarchy changes
5. State management approach
6. API endpoints consumed (specify expected request/response shapes)
7. Accessibility considerations
8. Loading/error states handled

Do NOT write code yet. Output a structured plan only.
```

### The_Skeptic — Review Mode

```
You are The_Skeptic for the TechTriage project — a security researcher and UX
advocate who plays Devil's Advocate on all development plans.

CRITICAL RULES:
- You MUST NOT write, edit, or create any application code files
- You MAY use Read, Glob, and Grep to examine the codebase for context
- Your output is ONLY a structured review verdict

CONTEXT:
TechTriage is a home tech support app targeting non-technical homeowners. It handles
payments (Stripe), authentication (OpenID Connect), AI interactions (Gemini), and
real-time video (WebSocket). Security and usability are paramount.

PLANS TO REVIEW:
[Insert plan(s) here]

REVIEW CHECKLIST:

SECURITY:
- Injection vectors (SQL, XSS, command)?
- Authentication/authorization checks present?
- User input validated and sanitized?
- Secrets or PII exposed in logs, responses, or client bundles?
- Rate limiting on new endpoints?

ERROR HANDLING:
- What happens when the database is down?
- What happens with malformed input?
- Race conditions?
- Error messages safe (no stack traces to users)?

UX / ACCESSIBILITY:
- Loading and error states handled in UI?
- Accessible (keyboard nav, screen readers, contrast)?
- Understandable by non-technical homeowners?
- Mobile-friendly?

ARCHITECTURE:
- Respects agent ownership boundaries?
- Proportional to the problem?
- Simpler alternatives exist?
- Backward compatible?

OUTPUT FORMAT:
Verdict: [APPROVED | APPROVED_WITH_CONDITIONS | REJECTED]
Rationale: [2-5 sentences]
Security Findings: [list or "None"]
UX Findings: [list or "None"]
Architecture Findings: [list or "None"]
Conditions (if applicable): [numbered list]
Risks Accepted: [any acknowledged risks]
```

### Backend_Dev — Implementation Mode

```
You are Backend_Dev for the TechTriage project. Implement the following APPROVED plan.

Your scope is LIMITED to: server/**, shared/schema/**, shared/models/**, drizzle/**,
drizzle.config.ts, scripts/**

You MUST NOT modify: src/**, index.html, vite.config.ts, public/**, CLAUDE.md

APPROVED PLAN:
[Insert approved plan]

SKEPTIC CONDITIONS (if any):
[Insert conditions]

Implement exactly what was approved. Do not add scope.
```

### Frontend_Dev — Implementation Mode

```
You are Frontend_Dev for the TechTriage project. Implement the following APPROVED plan.

Your scope is LIMITED to: src/**, index.html, vite.config.ts, public/**

You MUST NOT modify: server/**, shared/schema/**, drizzle/**, drizzle.config.ts, CLAUDE.md

APPROVED PLAN:
[Insert approved plan]

SKEPTIC CONDITIONS (if any):
[Insert conditions]

Implement exactly what was approved. Do not add scope.
```

---

## Coordination Protocols

### Cross-Boundary Changes (Frontend + Backend)

When a feature requires both frontend and backend changes:
1. Backend_Dev plans first (API contract is the source of truth)
2. Frontend_Dev plans against the proposed API contract
3. The_Skeptic reviews BOTH plans together
4. Backend_Dev implements first (API must exist before frontend consumes it)
5. Frontend_Dev implements second

### Shared File Modifications

- **shared/schema/schema.ts**: Backend_Dev owns. Frontend_Dev may propose changes via plan.
- **shared/models/**: Backend_Dev owns. Frontend_Dev may propose changes via plan.
- **package.json**: Backend_Dev adds server deps. Frontend_Dev adds client deps. Both must note additions in their plan for Skeptic review.
- **tsconfig.json**: Requires agreement from both agents; change must be in an approved plan.

### Dispute Resolution

If The_Skeptic and a Dev agent disagree:
1. The_Skeptic's REJECTED verdict stands — the Dev must revise
2. If a Dev believes The_Skeptic is wrong, they may submit a counter-argument in a revised plan
3. After two rejections of the same plan, escalate to the human operator
4. The human operator's decision is final and recorded in the Decision Log

---

## Decision Log

<!-- DECISIONS START — append new entries below this line -->

### Decision: Phase 2 — Enable Voice + Video Support (2026-02-10)
- **Scope**: Frontend only (src/**). Backend already complete.
- **Files**: ScoutChatScreen.tsx, ModeDock.tsx, HowItWorks.tsx, Pricing.tsx, VideoSessionModal.tsx
- **Verdict**: APPROVED_WITH_CONDITIONS by The_Skeptic
- **Conditions addressed**:
  1. Add camera/mic permission error handling in VideoSessionModal
  2. Add WebSocket error/access-denied handling in VideoSessionModal
  3. Follow-up ticket: Backend WebSocket auth bypass (server/index.ts:1637 allows connections without userId)
  4. Upgrade modal text updated for voice/video locked features
- **Risks accepted**: Client-server credit desync on failed video launch (mitigated by syncVideoCreditsFromServer); ScriptProcessorNode deprecation (works in all current browsers)

### Decision: Dashboard Control Center Overhaul (2026-02-10)
- **Scope**: Frontend only — `src/components/Dashboard.tsx` (single file)
- **Verdict**: APPROVED_WITH_CONDITIONS by The_Skeptic
- **Conditions**: All met by plan — 18-20px text, 44px+ touch targets, tier gating with plain-language text on locked tiles, graceful empty case state, keyboard/ARIA accessibility, native `<button>` elements throughout

### Phase 3: Polish & Personalize (Feb 10, 2026)

**Verdict: APPROVED_WITH_CONDITIONS** (The_Skeptic)

#### Changes:
1. **FAQ.tsx, App.tsx** — Small Change Exemption: Fixed 3 stale "Coming Soon" references for video support, made footer Help Center link functional
2. **server/routes/ai.ts** — AI personalization: Added `fetchUserContext()` with 5-min cache, `buildUserContextBlock()`, injected user onboarding data (techComfort, homeType, primaryIssues) into all 3 system prompts (chat, live-agent, voice)
3. **server/index.ts** — WebSocket personalization: Same pattern for live voice/video sessions via `setupGeminiLive()`
4. **Dashboard.tsx** — Added dismissible welcome banner for 0-case users, video credit purchase CTA for home/pro users with ≤1 credit remaining

#### Key Skeptic Conditions Applied:
- Auth check before personalization (graceful null fallback)
- 5-minute in-memory cache to avoid per-message DB queries
- No PII logged; only firstName used in prompts
- Loading/disabled state on purchase buttons
- Aria-labels on all interactive elements
- Mobile-responsive welcome banner

#### Risks Accepted:
- Hardcoded Stripe price IDs duplicated across BillingManagement.tsx and Dashboard.tsx
- In-memory cache not shared across server instances (acceptable for single-instance deployment)

### Phase 4: Guided Fix Engine (Feb 10, 2026)

**Verdict: APPROVED_WITH_CONDITIONS** (The_Skeptic)

#### Changes:
1. **server/routes/ai.ts** — Added 3 Gemini function declarations (`presentChoices`, `showStep`, `confirmResult`), GUIDED FIX MODE prompt block in `SYSTEM_INSTRUCTION` and `LIVE_AGENT_INSTRUCTION`, registered tools in both chat endpoints
2. **src/types.ts** — Added `GuidedAction` union type (`PresentChoicesAction | ShowStepAction | ConfirmResultAction`), extended `ChatMessage` with `guidedAction` field
3. **src/components/scout/ScoutChatScreen.tsx** — Added `ChoicePills`, `StepCard`, `ConfirmButtons` rendering components, function-call-to-guidedAction conversion with defensive validation, `handleGuidedAction` callback, guidedAction persistence in message saves/loads

#### Key Skeptic Conditions Applied:
- No `dangerouslySetInnerHTML` in guided components (plain JSX text rendering)
- All interactive elements are semantic `<button>` elements
- Defensive type validation: `Array.isArray()` on choices, `typeof` on stepNumber, fallback to no guided action if malformed
- Choices array capped at 6 to prevent UI overflow
- Disabled state during loading to prevent double-taps

#### Risks Accepted:
- Gemini may not consistently use guided tools (graceful fallback to plain text)
- No function-response pairing — user choices sent as text, Gemini infers from context
- Pre-existing XSS in `renderMarkdown` via `dangerouslySetInnerHTML` not addressed

### Phase 5: WebSocket Auth Fix + Case Completion Report (Feb 10, 2026)

**Verdict: APPROVED_WITH_CONDITIONS** (The_Skeptic)

#### Changes:
1. **server/index.ts** — WebSocket auth bypass fix: Extract session secret to constant, add `authenticateWebSocket()` helper that parses session cookie, unsigns it, looks up session in PostgreSQL store, extracts Passport user. Replace WS connection handler to use authenticated userId instead of untrusted query param. Reject unauthenticated connections with 4401.
2. **server/routes/cases.ts** — Two new endpoints: `GET /api/cases/:id/report` (PDF download), `POST /api/cases/:id/report/email` (email PDF). Shared `buildCasePDFData()` helper. Auth + ownership checks on both.
3. **src/components/scout/CaseCompletionModal.tsx** — New modal shown after chat case resolution with Download PDF and Email Report buttons. Loading/error/success states.
4. **src/components/scout/ScoutChatScreen.tsx** — Trigger CaseCompletionModal from `handleSessionEnd` (chat path only, not voice/video).
5. **package.json** — Add `cookie` and `cookie-signature` as explicit dependencies.

#### Key Skeptic Conditions Applied:
- Do not log raw cookie values or session IDs; log only IP + generic failure message
- Every branch in `authenticateWebSocket` returns null gracefully (wrapped in try/catch)
- `userId` query param completely ignored after auth; `sessionUser.id` is sole source of truth
- Generic error messages on 500 responses (no stack traces)
- `URL.revokeObjectURL()` called after download
- Error text uses `role="alert"` for screen reader announcement
- `overflow: hidden` on body when modal is open

#### Risks Accepted:
- PDF generation is synchronous/CPU-bound (matches existing PATCH handler pattern)
- General rate limiter (100 req/min) covers report endpoints (may need tightening later)
- `cookie`/`cookie-signature` already transitive deps; making explicit adds no new code

<!-- DECISIONS END -->

---

## Directory Ownership Map

```
server/                    -> Backend_Dev
  config/                  -> Backend_Dev
  middleware/              -> Backend_Dev
  routes/                  -> Backend_Dev
  services/                -> Backend_Dev
  db.ts                    -> Backend_Dev
  index.ts                 -> Backend_Dev
shared/
  schema/                  -> Backend_Dev (Frontend_Dev may propose)
  models/                  -> Backend_Dev (Frontend_Dev may propose)
src/                       -> Frontend_Dev
  components/              -> Frontend_Dev
  hooks/                   -> Frontend_Dev
  services/                -> Frontend_Dev
  stores/                  -> Frontend_Dev
  context/                 -> Frontend_Dev
  App.tsx                  -> Frontend_Dev
  types.ts                 -> Frontend_Dev
public/                    -> Frontend_Dev
index.html                 -> Frontend_Dev
vite.config.ts             -> Frontend_Dev
drizzle/                   -> Backend_Dev
drizzle.config.ts          -> Backend_Dev
scripts/                   -> Backend_Dev
docs/                      -> The_Skeptic
CLAUDE.md                  -> The_Skeptic
package.json               -> Shared (see Coordination Protocols)
tsconfig.json              -> Shared (see Coordination Protocols)
```

## Technical Reference

### Existing API Routes

- `POST /api/login` — Initiate OAuth flow
- `GET /api/callback` — OAuth callback
- `GET /api/auth/user` — Current authenticated user
- `POST /api/logout` — Destroy session
- `POST /api/ai/chat` — AI chat endpoint
- `POST /api/ai/analyze-image` — Image analysis
- `/api/cases/*` — Case management CRUD
- `/api/devices/*` — Device management
- `/api/specialist/*` — Specialist routing
- `WS /live` — WebSocket for live video/voice support

### Key Conventions

- **Server**: Express 5 on port 3001, TypeScript with tsx loader
- **Client**: React 19, Vite on port 5000, Tailwind via CDN
- **Database**: PostgreSQL via Drizzle ORM, schema in `shared/schema/schema.ts`
- **Auth**: OpenID Connect (Replit OAuth), sessions in PostgreSQL
- **AI**: Google Gemini 2.0 Flash via `@google/genai`
- **Payments**: Stripe integration in `server/config/stripe.ts` and `server/services/stripeService.ts`
