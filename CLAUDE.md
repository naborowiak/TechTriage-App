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

### Phase 6: Mobile Viewport Fix + PWA Install Prompt (Feb 11, 2026)

**Verdict: APPROVED_WITH_CONDITIONS** (The_Skeptic)

#### Changes:
1. **index.html** — Added `viewport-fit=cover` and `interactive-widget=resizes-content` to viewport meta tag
2. **src/index.css** — Added CSS utility classes: `.h-screen-safe` (100dvh with 100vh fallback), `.pt-safe`, `.pb-safe`, `.pb-safe-4/6/8` (safe-area-inset + padding)
3. **src/App.tsx** — Replaced `h-screen` with `h-screen-safe` in dashboard/scout layouts, wired PWA install banner
4. **src/components/Dashboard.tsx** — Replaced `h-screen` with `h-screen-safe`
5. **src/components/scout/ScoutChatScreen.tsx** — `h-screen-safe` + `pb-safe-4` on input area
6. **src/components/scout/VoiceOverlay.tsx** — Added `pt-safe pb-safe` to overlay, `pb-safe-6` to controls
7. **src/components/scout/VideoSessionModal.tsx** — Added `pt-safe` to overlay/header, `pb-safe-4` to bottom controls
8. **src/components/scout/PhotoCaptureModal.tsx** — Added `pt-safe` to overlay/header, `pb-safe-8` to controls
9. **src/components/LiveSupport.tsx** — Added `pt-safe pb-safe` to overlay, `pt-safe` to header
10. **src/components/voice/VoiceOverlay.tsx** — Added `pt-safe pb-safe` to overlay
11. **src/components/ChatWidget.tsx** — Added `pt-safe pb-safe` in fullscreen mode
12. **src/hooks/usePWAInstall.ts** (NEW) — beforeinstallprompt hook, 14-day dismiss, localStorage persistence
13. **src/components/PWAInstallBanner.tsx** (NEW) — Bottom-anchored dismissible install banner
14. **public/sw.js** — Bumped CACHE_NAME to v2, removed unreliable assets, added .catch fallback
15. **public/site.webmanifest** — Added narrow (mobile) screenshot

#### Key Skeptic Conditions Applied:
- PWA banner bottom-anchored below main CTA, z-index below modals
- Dismiss interval set to 14 days (not 7)
- iOS Safari gap documented in usePWAInstall.ts (hook is no-op on iOS)
- ChatWidget confirmed to have fullscreen mode — kept in plan
- Narrow screenshot uses existing chatgpt-mobile.jpg (1080x2340)
- SW CACHE_NAME bumped from v1 to v2

#### Risks Accepted:
- `100dvh` fallback to `100vh` on browsers without dvh support (negligible in 2026)
- beforeinstallprompt is Chrome/Edge-only; banner won't appear on Firefox/Safari (no broken UI)
- PWA install banner is no-op on iOS (users must use Share > Add to Home Screen)

### Decision: Assist Pills First-Turn Consistency (Feb 11, 2026)
- **Scope**: Cross-boundary (Frontend + Backend)
- **Files**: ScoutChatScreen.tsx, geminiService.ts, server/routes/ai.ts
- **Verdict**: APPROVED by The_Skeptic
- **Changes**:
  1. Welcome message now includes hardcoded `presentChoices` guidedAction with 5 categories (Wi-Fi/Internet, Smart Home Devices, Appliances, HVAC/Thermostat, TV/Streaming)
  2. Welcome message filtered from Gemini API history to prevent invalid functionCall/functionResponse pairing
  3. Added explicit first-turn instruction to both SYSTEM_INSTRUCTION and LIVE_AGENT_INSTRUCTION
- **Risks accepted**: Gemini may still occasionally skip pills (graceful fallback to plain text)

### Phase 7: Security Hardening for Soft Launch (Feb 11, 2026)

**Verdict: APPROVED_WITH_CONDITIONS** (The_Skeptic)

#### Changes (all in `server/index.ts` + 2 exempt fixes):
1. **HAR file deleted** — `src/components/scout/har files/` contained plaintext credentials (Small Change Exemption)
2. **Meta description added** — `index.html` SEO tag (Small Change Exemption)
3. **Session secret validation** — Fail fast with `process.exit(1)` if `SESSION_SECRET` not set in production
4. **CORS lockdown** — Replaced `origin: true` with domain allowlist (`APP_DOMAINS` env var, defaults to `totalassist.tech`, allows `*.replit.dev`). Dev mode remains permissive.
5. **CSP enabled** — Production-only Content Security Policy via Helmet with directives for self, Tailwind CDN, Stripe, Google Fonts, WebSocket, data/blob URIs. `unsafe-inline` for scripts/styles (required for inline `<script>` tags and Tailwind). Disabled in dev.
6. **sameSite cookie** — Changed from `"none"` (production) to `"lax"` (universal). App is same-origin.
7. **Test endpoints gated** — `/api/test-email`, `/api/email-diagnostics`, `/api/test-email-resend` only registered when `NODE_ENV !== "production"`. API key prefix logging removed.
8. **Auth on user endpoints** — Added `requireAuth` + `requireSelf` middleware to GET/PUT/DELETE `/api/auth/user/:id`. Users can only access their own profile. Session destroyed after account deletion.
9. **Auth rate limiting** — Applied `authLimiter` (15min/10 attempts) to `verify-email`, `resend-verification`, `forgot-password`, `reset-password`.
10. **Auth on session guide** — `/api/send-session-guide` now requires authentication. Email forced to session user's email (not request body).
11. **Global error handler** — Express 4-arg error middleware returns generic 500. `process.on('uncaughtException')` exits after 1s delay. `process.on('unhandledRejection')` logs warning.
12. **VoiceReportModal.tsx** — Added missing `credentials: 'include'` to fetch call (required after auth enforcement)

#### Key Skeptic Conditions Applied:
- `requireAuth` and `requireSelf` defined as new middleware in index.ts
- Email endpoint uses session user's email, not request body (prevents spam relay)
- `uncaughtException` handler exits after 1s delay for in-flight responses
- `unsafe-inline` for script-src documented as required (inline `<script>` tags in index.html)
- API key prefix logging removed from test endpoints

#### Risks Accepted:
- `unsafe-inline` in CSP script-src weakens XSS protection (required for theme detection inline script)
- General rate limiter (100/min) covers email endpoint; dedicated email limiter deferred
- In-memory user context cache not invalidated by profile updates (pre-existing, not in scope)

### Phase 7b: Tailwind CDN → Compiled CSS + UX Polish (Feb 11, 2026)

**Verdict: Small Change Exemption (theme/style changes) + Frontend_Dev scope**

#### Changes:
1. **Tailwind migration** — Removed `cdn.tailwindcss.com` CDN script and inline `tailwind.config` from `index.html`. Installed `tailwindcss@3`, `postcss`, `autoprefixer`. Created `tailwind.config.js` and `postcss.config.js`. Moved inline styles to `src/index.css`. Added `import './index.css'` to `src/index.tsx`. Production CSS now compiled to ~111KB static file.
2. **CSP updated** — Removed `cdn.tailwindcss.com` from CSP `scriptSrc` and `styleSrc` directives (no longer needed)
3. **PrivacyPolicy.tsx** — Fixed hardcoded dark theme → proper `bg-light-50 dark:bg-midnight-950` pattern
4. **CancellationPolicy.tsx** — Same fix
5. **Dashboard.tsx** — Fixed support email from `totalassist.app` to `totalassist.tech`
6. **404 page** — Added `PageView.NOT_FOUND` enum value. Unknown routes now show a proper 404 page instead of silently redirecting to home.
7. **VoiceReportModal.tsx** — Added `credentials: 'include'` to session guide fetch

#### Risks Accepted:
- Tailwind v3 chosen over v4 for compatibility with existing class names and config patterns

### Phase 8: Dashboard Overhaul — Desktop + Mobile Redesign (Feb 12, 2026)

**Verdict: APPROVED_WITH_CONDITIONS** (The_Skeptic)

#### Changes:
1. **src/components/Dashboard.tsx** — Major rewrite: Removed sidebar, emergency bar, welcome modal, card-based recent cases grid, video credit CTA. Replaced with single-panel layout: minimal header with TA logo + avatar dropdown, "Support Available" status badge, compact triage tiles (2x2 mobile / 4-col desktop), common issues chips with mobile "Show more", retained text input, CurrentCaseCard with step progress, compact HistoryList.
2. **src/components/dashboard/MobileBottomDock.tsx** (NEW) — 4-tab bottom dock: Home, +New Case (center FAB), History, Settings. `lg:hidden`, safe-area padding, 48px touch targets, ARIA tablist.
3. **src/components/dashboard/CurrentCaseCard.tsx** (NEW) — Shows most recent open case with step-by-step progress (completed/suggested/in-progress) derived from Guided Fix Engine `showStep`/`confirmResult` actions.
4. **src/components/dashboard/HistoryList.tsx** (NEW) — Compact list of resolved cases with status icon, relative time, inline PDF/Email report actions. Max 5 items with "View all" link.
5. **src/components/dashboard/SystemStatusBadge.tsx** (NEW) — Online/offline status indicator using navigator.onLine events. Shows "Support Available" or "Reconnecting..." with green/yellow dot.
6. **src/hooks/useCaseProgress.ts** (NEW) — Fetches messages for active case, extracts guided actions to build progress step array. Handles no-messages, no-actions, and API failure gracefully.
7. **src/types.ts** — Added `CaseProgressStep` interface and `DashboardTab` type.

#### Key Skeptic Conditions Applied:
- "Diagnostics" tab removed from dock (jargon for non-technical homeowners) — 4-tab layout: Home, +New, History, Settings
- Text input retained (removing it was a UX regression — lowest-friction path to help)
- "System Ready" renamed to "Support Available" (plain language for homeowners)
- "Unlock more quick actions" renamed to "Show more" (avoids paywall implication)
- All dock tabs have `aria-label`, `role="tab"`, `aria-selected`, `aria-current="page"`
- 44px+ touch targets on all interactive elements
- Status indicators use color + text labels (not color alone) for accessibility
- `useCaseProgress` handles three edge cases: no messages, no guided actions, API failure
- (+) New Case dock goes directly to ScoutChatScreen; Home screen tiles allow mode selection (complementary, not redundant)

#### Risks Accepted:
- Sidebar removal is a one-way door — returning users who relied on always-visible case list must use History tab
- Bottom dock consumes ~56px vertical space on mobile (acceptable trade-off for always-visible nav)
- Current Case progress depends on Gemini emitting guided actions (graceful fallback: "Case in progress — tap to continue")
- Analytics/Diagnostics has no direct navigation path from new dashboard (accessible via header dropdown in App.tsx if needed later)

### Premium Triage Card Redesign (Feb 12, 2026)

**Verdict: APPROVED_WITH_CONDITIONS** (The_Skeptic)

#### Changes:
1. **src/components/Dashboard.tsx** — Replaced diagonal gradient card styling with layered "Apple-ish" design: mesh gradient backgrounds (color-tinted per card identity), dark overlay for text readability, soft vignette, frosted-glass icon containers. Locked tiles now show at full opacity with pill-shaped lock badge ("Home+"), "Upgrade to unlock" CTA with ArrowRight, and cursor-pointer (since they open upgrade modal). "Type a Question" tile gets subtle primary accent via CSS class. Added `ArrowRight` import from lucide-react.
2. **src/index.css** — Increased dark noise opacity from 0.06 to 0.08. Added `.tile-card-locked` (saturate(0.85) with hover-to-0.95). Added `.tile-card-primary` with 3s breathing border glow animation (light/dark variants). Animation respects `prefers-reduced-motion` via existing global rule.

#### Key Skeptic Conditions Applied:
- Locked tiles visually distinct via desaturation filter + lock badge pill + "Upgrade to unlock" CTA text (not color alone)
- `prefers-reduced-motion` neutralizes breathing glow via existing global `animation-duration: 0.01ms` rule (documented in CSS comment)
- Light mode gradient opacities set to .12/.08 (not .08/.05) per Skeptic recommendation for tile differentiation
- Light mode shadow reduced to `rgba(0,0,0,.08)` vs dark mode `rgba(0,0,0,.35)` — scoped via `dark:` prefix
- All overlay divs have `aria-hidden="true"`, buttons remain semantic, aria-labels preserved

#### Risks Accepted:
- Multiple compositing layers may cause minor jank on very low-end devices
- Inline `style={}` for mesh gradients bypasses Tailwind utility system (required for dynamic radial-gradient combos)

### Dashboard Visual Overhaul — Mockup Match (Feb 13, 2026)

**Verdict: APPROVED_WITH_CONDITIONS** (The_Skeptic)

#### Changes:
1. **src/components/Dashboard.tsx** — Card grid changed from `grid-cols-2 lg:grid-cols-4` to `grid-cols-1 md:grid-cols-2`. Desktop cards use `aspect-[16/10]` with `max-h-[260px]`, `justify-end` for content-at-bottom layout, `rounded-3xl`. Mobile cards are compact 72px horizontal bars. "Show the Problem" card gets `tech-life-home.png` as desktop-only background with gradient overlay. Heading "How can we assist you today?" added. Card descriptions updated to match mockup. Icon containers scale to 48px on desktop.
2. **No CSS changes required** — existing `.tile-card` classes with `border-radius: inherit` and `overflow: hidden` handle new rounded corners.

#### Key Skeptic Conditions Applied:
- `md:max-h-[260px]` prevents excessive card height on ultra-wide viewports
- Photo gradient overlay `from-black/10 via-black/40 to-black/75` ensures WCAG AA text contrast
- Mobile cards maintain 72px min-height (exceeds 44px touch target requirement)
- Desktop content uses `md:p-6` (24px) keeping text clear of rounded corners
- Heading uses `text-xl sm:text-2xl md:text-4xl` progressive sizing to prevent mobile overflow

#### Risks Accepted:
- Taller desktop cards push Common Issues / History further below the fold
- Single-column mobile layout increases scroll depth vs previous 2×2 grid
- `tech-life-home.png` has TechTriage branding visible through overlay (mitigated by `bg-top` positioning)
- `(tile as any)` type cast for backgroundImage property (TypeScript union inference workaround)

### Algolia-Style Service Cards + Dedicated Service Pages (Feb 13, 2026)

**Verdict: APPROVED_WITH_CONDITIONS** (The_Skeptic)

#### Changes:
1. **src/data/servicePageData.ts** (NEW) — Centralized content config for 4 services (chat, photo, voice, video). Static data only: names, taglines, descriptions, icons, colors, how-it-works steps, features, FAQs, CTA text.
2. **src/components/ServicesSection.tsx** (NEW) — Algolia-inspired card grid for HOME view with service-colored hover glow effects. Semantic `<button>` elements with `aria-label`.
3. **src/components/ServicePage.tsx** (NEW) — Data-driven shared service page: hero, how-it-works (3 steps), features (4 items), FAQ accordion (3 items), CTA section. Lazy-loaded via `React.lazy()`.
4. **src/types.ts** — Added `SERVICE_CHAT`, `SERVICE_PHOTO`, `SERVICE_VOICE`, `SERVICE_VIDEO` to PageView enum.
5. **src/App.tsx** — Added lazy import, 4 pathToView/viewToPath entries, `startsWith('/services/')` in `getInitialView()`, 4 renderContent switch cases, ServicesSection between HowItWorksSimple and WhatWeHelpWith on HOME, footer "Services" sub-section with 4 links.

#### Key Skeptic Conditions Applied:
- `ServicePage.tsx` lazy-loaded (7.41 KB chunk, 1.94 KB gzipped)
- `getInitialView()` uses `startsWith('/services/')` pattern matching `/specialist/` precedent
- CTA routes authenticated users to dashboard, unauthenticated to signup (uses `useAuth()`)
- `servicePageData.ts` contains only static data (icon component references from lucide-react, no React imports, no side effects)
- Per-service FAQs are strictly service-specific (session limits, photo tips, mic requirements, video credits) — no overlap with existing FAQ.tsx content
- Cards use semantic `<button>` elements with `aria-label` for accessibility

#### Risks Accepted:
- Content overlap between HowItWorks.tsx and service pages (acceptable: HowItWorks is high-level overview, service pages go deeper with FAQs and features)
- New `src/data/` directory convention (first usage; future data files should follow same pattern)
- Four new routes increase client-side routing surface (negligible: static marketing pages with no API calls)

### Animated Glow Dock + Header Glow Treatment (Feb 17, 2026)

**Verdict: APPROVED_WITH_CONDITIONS** (The_Skeptic)

#### Changes:
1. **src/components/dashboard/MobileBottomDock.tsx** — Replaced flat dock with animated dark glow dock: sliding colored light bar, trapezoid beam, per-tab brand colors (indigo/cyan/purple/glow), icon drop-shadow glow, CSS grid layout
2. **src/index.css** — Added `.dock-glow`, `.dock-glow-light`, `.dock-glow-bar`, `.dock-glow-beam`, `.dock-icon-glow` classes; added `.header-glow`, `.header-glow-indicator` classes
3. **src/App.tsx (Header)** — Replaced light/dark conditional header with universal dark (#191919) header matching dock aesthetic. Added sliding glow indicator under active nav item with per-item colors (cyan/indigo/purple). Logo always uses light variant. Mobile menu also dark. Measured via refs + getBoundingClientRect.

#### Key Skeptic Conditions Applied:
- Text labels retained on dock tabs
- New `.dock-glow` class (`.dock-clean` untouched)
- CSS comment documenting universal-dark design decision
- `focus-visible:ring-white/60` (dock) and `focus-visible:ring-white/40` (header) for contrast
- Decorative elements `aria-hidden="true"` + `pointer-events: none`

#### Risks Accepted:
- Universal dark nav in light mode (deliberate design decision for glow visibility)
- `clip-path: polygon()` graceful degradation on very old browsers

### Homepage Polish — Hero Simplification + Section Cleanup (Feb 17, 2026)

**Verdict: APPROVED** (The_Skeptic)

#### Changes:
1. **src/App.tsx (Hero)** — Replaced two-column hero with centered layout. Headline simplified to "Get help with [typewriter]" (large gradient text). Subtitle: single line about AI-powered support. Carousel moved below text in contained 16:9 rounded box — text can never be covered by images. Removed value-prop bullet grid. Removed all `hero-scroll-*` fade-away classes (title, subtitle, CTA, bg).
2. **src/App.tsx (HOME view)** — Removed `<ServicesSection>` (displayed poorly on various viewports). Service pages still accessible via footer links and `/services/*` routes.
3. **src/components/FeatureShowcases.tsx** — Case history image now theme-aware (`case_history-white.png` / `case_history-dark.png`). Internal showcase padding reduced from `pt-16 pb-16` (4rem) to `pt-10 pb-10` (2.5rem).
4. **src/index.css** — Scroll-driven animation range changed from `entry 0% entry 30%` to `entry 15% entry 50%` (Phantom-style conservative triggers).

#### Risks Accepted:
- ServicesSection removed from homepage (content accessible via dedicated service pages)
- Hero carousel images now `object-contain` in fixed 16:9 box (may show background around edges)

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
