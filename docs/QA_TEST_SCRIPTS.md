# QA Test Scripts — TotalAssist

> **Version**: 1.0
> **Last Updated**: 2026-02-18
> **App URL**: https://totalassist.tech
> **Total Suites**: 15 | **Total Cases**: ~180

---

## How to Use This Document

Each test case follows this format:

```
#### TC-XX-NN: [Test Name]
**Preconditions**: [Setup needed before running]
**Steps**:
1. Step one
2. Step two
**Expected**: [What should happen — pass/fail criteria]
**Tier**: Free / Home / Pro / All
```

**Tier legend**:
- **Free** — No subscription (default after signup)
- **Home** — Home plan ($9.99/mo or $95.88/yr)
- **Pro** — Pro plan ($19.99/mo or $191.88/yr)
- **All** — Applies to every tier

---

## Table of Contents

1. [Suite 1: Registration & Onboarding (TC-REG)](#suite-1-registration--onboarding)
2. [Suite 2: Email Verification (TC-VER)](#suite-2-email-verification)
3. [Suite 3: Login & Session (TC-LOG)](#suite-3-login--session)
4. [Suite 4: Password Reset (TC-PWD)](#suite-4-password-reset)
5. [Suite 5: Dashboard & Navigation (TC-DASH)](#suite-5-dashboard--navigation)
6. [Suite 6: AI Chat — Scout (TC-CHAT)](#suite-6-ai-chat--scout)
7. [Suite 7: Voice Support (TC-VOICE)](#suite-7-voice-support)
8. [Suite 8: Video Diagnostic (TC-VIDEO)](#suite-8-video-diagnostic)
9. [Suite 9: Case Management (TC-CASE)](#suite-9-case-management)
10. [Suite 10: Device Management (TC-DEV)](#suite-10-device-management)
11. [Suite 11: Billing & Subscriptions (TC-BILL)](#suite-11-billing--subscriptions)
12. [Suite 12: Subscription Lifecycle Emails (TC-EMAIL)](#suite-12-subscription-lifecycle-emails)
13. [Suite 13: Settings & Profile (TC-SET)](#suite-13-settings--profile)
14. [Suite 14: Marketing & Static Pages (TC-PAGE)](#suite-14-marketing--static-pages)
15. [Suite 15: Responsive, PWA & Accessibility (TC-RES)](#suite-15-responsive-pwa--accessibility)

---

## Suite 1: Registration & Onboarding

#### TC-REG-01: Email/Password Signup — Happy Path
**Preconditions**: No existing account for the test email.
**Steps**:
1. Navigate to `/signup`
2. Enter first name, last name, valid email, and password (8+ chars)
3. Click "Create Account"
4. Verify redirect to email verification page
5. Enter the 6-digit OTP from the verification email
6. Complete onboarding steps (tech comfort, home type, primary issues)
**Expected**: Account created. User lands on Dashboard after onboarding. Session cookie set with 7-day expiry.
**Tier**: All

#### TC-REG-02: Weak Password Rejected
**Preconditions**: On `/signup` page.
**Steps**:
1. Enter valid first name, last name, and email
2. Enter a password shorter than 8 characters (e.g., "abc123")
3. Click "Create Account"
**Expected**: Inline validation error: "Password must be at least 8 characters". Form does not submit.
**Tier**: All

#### TC-REG-03: Duplicate Email Rejected
**Preconditions**: An account already exists for `existing@example.com`.
**Steps**:
1. Navigate to `/signup`
2. Enter `existing@example.com` with a valid password
3. Click "Create Account"
**Expected**: Error message indicating email is already registered. No duplicate user created.
**Tier**: All

#### TC-REG-04: Invalid Email Format Rejected
**Preconditions**: On `/signup` page.
**Steps**:
1. Enter "notanemail" in the email field
2. Attempt to submit
**Expected**: Validation error about invalid email format. Form does not submit.
**Tier**: All

#### TC-REG-05: Required Fields Validation
**Preconditions**: On `/signup` page.
**Steps**:
1. Leave all fields empty
2. Click "Create Account"
**Expected**: Validation errors shown for all required fields (first name, last name, email, password).
**Tier**: All

#### TC-REG-06: Trial Eligibility — First-Time User
**Preconditions**: Fresh email/IP/fingerprint not previously used for a trial.
**Steps**:
1. Complete signup with a new email
2. Verify email
3. Check trial status via dashboard or pricing page
**Expected**: 7-day free trial is available or automatically started. Trial badge visible.
**Tier**: Free

#### TC-REG-07: Trial Eligibility — Previously Used
**Preconditions**: Email or fingerprint already used a trial.
**Steps**:
1. Attempt signup with a previously trialed email
2. Complete verification
3. Check trial status
**Expected**: No trial offered. User starts on free tier with standard limits (5 chats/mo, 1 photo/mo).
**Tier**: Free

#### TC-REG-08: Google OAuth Signup — New User
**Preconditions**: Google account not linked to any TotalAssist account.
**Steps**:
1. Navigate to `/signup` or `/login`
2. Click "Continue with Google"
3. Authenticate with Google
4. Complete onboarding steps if prompted
**Expected**: New account created with Google profile data (name, email, profile image). User lands on Dashboard.
**Tier**: All

---

## Suite 2: Email Verification

#### TC-VER-01: Correct OTP — Auto-Login
**Preconditions**: Just completed signup; on the verification page. Verification email received.
**Steps**:
1. Open verification email
2. Copy the 6-digit code
3. Paste or type the code into the OTP input
4. Submit
**Expected**: Code accepted. User is logged in automatically and redirected to Dashboard (or onboarding if first time). `emailVerified` flag set to true.
**Tier**: All

#### TC-VER-02: Invalid OTP Code
**Preconditions**: On verification page with a pending code.
**Steps**:
1. Enter an incorrect 6-digit code (e.g., "000000")
2. Submit
**Expected**: Error message: "Invalid verification code." User remains on verification page. Can retry.
**Tier**: All

#### TC-VER-03: Expired OTP Code
**Preconditions**: Verification code was sent more than 30 minutes ago.
**Steps**:
1. Wait 30+ minutes after requesting the code (or manipulate server-side expiry for testing)
2. Enter the original correct code
3. Submit
**Expected**: Error message: "Verification code has expired. Please request a new one." Resend button available.
**Tier**: All

#### TC-VER-04: Resend Verification — Rate Limit
**Preconditions**: On verification page.
**Steps**:
1. Click "Resend Code"
2. Repeat 10 times within 15 minutes
3. Attempt an 11th resend
**Expected**: First 10 resends succeed (each with 60-second cooldown). 11th attempt returns rate limit error (429). Auth limiter: 10 attempts per 15 minutes.
**Tier**: All

#### TC-VER-05: 60-Second Cooldown Timer
**Preconditions**: On verification page.
**Steps**:
1. Click "Resend Code"
2. Observe the resend button state
3. Attempt to click again before 60 seconds
**Expected**: Button shows countdown timer (e.g., "Resend in 45s"). Button is disabled until timer reaches 0.
**Tier**: All

---

## Suite 3: Login & Session

#### TC-LOG-01: Valid Email/Password Login
**Preconditions**: Verified account exists.
**Steps**:
1. Navigate to `/login`
2. Enter valid email and password
3. Click "Log In"
**Expected**: Redirect to Dashboard. Session cookie set. User data available in header/avatar dropdown.
**Tier**: All

#### TC-LOG-02: Invalid Credentials
**Preconditions**: On `/login` page.
**Steps**:
1. Enter valid email with wrong password
2. Click "Log In"
**Expected**: Error message (generic, e.g., "Invalid email or password" — no enumeration of which field is wrong). No session created.
**Tier**: All

#### TC-LOG-03: Nonexistent Email
**Preconditions**: On `/login` page.
**Steps**:
1. Enter an email that has no account
2. Enter any password
3. Click "Log In"
**Expected**: Same generic error as TC-LOG-02: "Invalid email or password". Does not reveal whether the email exists.
**Tier**: All

#### TC-LOG-04: Unverified Email — Resend Prompt
**Preconditions**: Account exists but email is not verified.
**Steps**:
1. Navigate to `/login`
2. Enter the unverified email and correct password
3. Click "Log In"
**Expected**: User is informed that email verification is required. Option to resend verification code is shown. User is not logged in.
**Tier**: All

#### TC-LOG-05: Google OAuth Login — Existing User
**Preconditions**: Account already linked to a Google identity.
**Steps**:
1. Navigate to `/login`
2. Click "Continue with Google"
3. Authenticate with the linked Google account
**Expected**: Logged in. Redirect to Dashboard. No onboarding shown (returning user).
**Tier**: All

#### TC-LOG-06: Session Persistence Across Refresh
**Preconditions**: Logged in.
**Steps**:
1. Refresh the browser (F5 or Cmd+R)
2. Observe the page
**Expected**: User remains logged in. Dashboard loads. No redirect to login.
**Tier**: All

#### TC-LOG-07: Logout
**Preconditions**: Logged in.
**Steps**:
1. Open avatar dropdown (top-right)
2. Click "Log Out"
**Expected**: Session cookie cleared. Redirect to homepage. Attempting to visit `/dashboard` redirects to login.
**Tier**: All

---

## Suite 4: Password Reset

#### TC-PWD-01: Forgot Password — Valid Email
**Preconditions**: Account exists for the test email.
**Steps**:
1. Navigate to `/forgot-password`
2. Enter the registered email
3. Click "Send Reset Link"
**Expected**: Success message displayed (e.g., "If an account exists, a reset link has been sent"). Email received with reset link. Link expires in 1 hour.
**Tier**: All

#### TC-PWD-02: Forgot Password — Nonexistent Email (No Enumeration)
**Preconditions**: No account for `nobody@example.com`.
**Steps**:
1. Navigate to `/forgot-password`
2. Enter `nobody@example.com`
3. Click "Send Reset Link"
**Expected**: Same success message as TC-PWD-01. No email sent. Response does not reveal that the email is unregistered.
**Tier**: All

#### TC-PWD-03: Reset Password — Valid Token
**Preconditions**: Reset email received with valid link (within 1 hour).
**Steps**:
1. Click the reset link from the email
2. Enter a new password (8+ characters)
3. Confirm the password
4. Submit
**Expected**: Password updated. Success message displayed. User can log in with the new password.
**Tier**: All

#### TC-PWD-04: Reset Password — Expired Token
**Preconditions**: Reset link is older than 1 hour.
**Steps**:
1. Click the expired reset link
2. Attempt to set a new password
**Expected**: Error message: "Password reset link has expired. Please request a new one." Link back to forgot-password page.
**Tier**: All

#### TC-PWD-05: Reset Password — Minimum Length Validation
**Preconditions**: On reset password page with valid token.
**Steps**:
1. Enter a password shorter than 8 characters
2. Submit
**Expected**: Validation error: "Password must be at least 8 characters". Password not changed.
**Tier**: All

---

## Suite 5: Dashboard & Navigation

#### TC-DASH-01: Dashboard Loads for Authenticated User
**Preconditions**: Logged in.
**Steps**:
1. Navigate to `/dashboard`
**Expected**: Dashboard renders with heading "How can we assist you today?", triage tiles, common issue chips, text input bar. No errors in console.
**Tier**: All

#### TC-DASH-02: Unauthenticated Redirect
**Preconditions**: Not logged in. Clear cookies.
**Steps**:
1. Navigate to `/dashboard` directly
**Expected**: Redirect to `/login`. Dashboard content not visible.
**Tier**: All

#### TC-DASH-03: Four Triage Tiles Displayed
**Preconditions**: Logged in, on Dashboard.
**Steps**:
1. Observe the tile grid
**Expected**: Four tiles visible: (1) Ask a Question (chat), (2) Show the Problem (photo), (3) Talk It Out (voice), (4) Live Video Help (video). Each has an icon, title, and description.
**Tier**: All

#### TC-DASH-04: Locked Tiles — Free Tier
**Preconditions**: Logged in as free-tier user.
**Steps**:
1. Observe Voice and Video tiles
**Expected**: Both tiles show a lock badge with "Home+" label and "Upgrade to unlock" CTA. Tiles are visually desaturated. Clicking opens UpgradeModal.
**Tier**: Free

#### TC-DASH-05: Unlocked Tiles — Home Tier
**Preconditions**: Logged in as Home-tier user.
**Steps**:
1. Observe all four tiles
**Expected**: Chat, Photo, and Voice tiles fully accessible (no lock). Video tile accessible (Home gets 4 sessions/month). No lock badges.
**Tier**: Home

#### TC-DASH-06: Unlocked Tiles — Pro Tier
**Preconditions**: Logged in as Pro-tier user.
**Steps**:
1. Observe all four tiles
**Expected**: All four tiles fully unlocked and accessible. No lock badges.
**Tier**: Pro

#### TC-DASH-07: Common Issue Chips
**Preconditions**: Logged in, on Dashboard.
**Steps**:
1. Observe the common issues section below tiles
2. Click "Show more" if visible
**Expected**: Common issue chips displayed (e.g., "Wi-Fi slow", "Smart lock won't pair"). "Show more" toggles additional chips. Clicking a chip navigates to Scout chat with the issue pre-filled.
**Tier**: All

#### TC-DASH-08: CurrentCaseCard — Active Case
**Preconditions**: User has an open (unresolved) case with guided fix steps.
**Steps**:
1. Navigate to Dashboard
2. Observe the CurrentCaseCard
**Expected**: Card shows case title, step progress (completed/in-progress/suggested steps), and "Tap to continue" action. Clicking opens ScoutChatScreen with the case loaded.
**Tier**: All

#### TC-DASH-09: CurrentCaseCard — Empty State
**Preconditions**: User has no open cases.
**Steps**:
1. Navigate to Dashboard
**Expected**: No CurrentCaseCard shown, or a graceful empty state message (e.g., "No active cases"). No errors.
**Tier**: All

#### TC-DASH-10: HistoryList — Recent Cases
**Preconditions**: User has 6+ resolved cases.
**Steps**:
1. Navigate to Dashboard
2. Observe the History section
**Expected**: Up to 5 most recent cases displayed with status icon, title, and relative time (e.g., "2 hours ago"). PDF download and Email report action buttons on each. "View all" link navigates to full history.
**Tier**: All

#### TC-DASH-11: SystemStatusBadge — Online
**Preconditions**: Device has internet connectivity.
**Steps**:
1. Navigate to Dashboard
2. Observe the status badge
**Expected**: Green dot with "Support Available" text.
**Tier**: All

#### TC-DASH-12: SystemStatusBadge — Offline
**Preconditions**: Dashboard loaded.
**Steps**:
1. Disable network (airplane mode or DevTools Network → Offline)
2. Observe the status badge
**Expected**: Badge changes to yellow dot with "Reconnecting..." text. Reverts to green "Support Available" when network restored.
**Tier**: All

#### TC-DASH-13: Mobile Bottom Dock
**Preconditions**: Logged in, viewport ≤1024px (mobile/tablet).
**Steps**:
1. Observe the bottom of the screen
**Expected**: 4-tab dock visible: Home, +New Case (center FAB), History, Settings. Active tab has colored glow indicator. Touch targets ≥48px. Dock has `role="tablist"` and `aria-selected` on active tab.
**Tier**: All

#### TC-DASH-14: Desktop Header Navigation
**Preconditions**: Logged in, viewport >1024px (desktop).
**Steps**:
1. Observe the header bar
**Expected**: Header shows TotalAssist logo, nav links (How It Works, Pricing, FAQ), theme toggle, avatar dropdown. Active nav item has sliding glow indicator. Bottom dock is hidden (`lg:hidden`).
**Tier**: All

#### TC-DASH-15: Theme Toggle
**Preconditions**: Logged in.
**Steps**:
1. Click the theme toggle (sun/moon icon) in header or dock Settings
2. Observe the entire page
**Expected**: Theme switches between light and dark mode. All components render correctly in both themes. Preference persists across page refreshes (localStorage).
**Tier**: All

#### TC-DASH-16: Avatar Dropdown Menu
**Preconditions**: Logged in.
**Steps**:
1. Click the avatar/profile icon in the header
**Expected**: Dropdown menu opens with items: Profile/Settings, Billing, Log Out (at minimum). Each item navigates to the correct view.
**Tier**: All

---

## Suite 6: AI Chat — Scout

#### TC-CHAT-01: Welcome Message with Category Pills
**Preconditions**: Start a new chat session (no prior messages in this case).
**Steps**:
1. Navigate to Scout chat (click "Ask a Question" tile or +New Case)
**Expected**: Welcome message from AI with 5 category pills: "Wi-Fi / Internet", "Smart Home Devices", "Appliances", "HVAC / Thermostat", "TV / Streaming". Pills are tappable buttons.
**Tier**: All

#### TC-CHAT-02: Send Text — Receive AI Response
**Preconditions**: In Scout chat.
**Steps**:
1. Type "My Wi-Fi keeps disconnecting every hour" in the text input
2. Press Send or Enter
**Expected**: User message appears in chat. Loading indicator shown. AI response received within a few seconds. Response is contextually relevant to the Wi-Fi issue.
**Tier**: All

#### TC-CHAT-03: Tap Assist Pill — Selection Sent
**Preconditions**: Welcome message with pills is displayed.
**Steps**:
1. Tap "Smart Home Devices" pill
**Expected**: Pill selection appears as a user message (or visually indicates selection). AI responds with follow-up questions about smart home devices. Pill is highlighted/disabled after selection.
**Tier**: All

#### TC-CHAT-04: Guided Fix — StepCard
**Preconditions**: In an active chat where AI initiates a guided fix.
**Steps**:
1. Describe a problem that triggers step-by-step guidance (e.g., "My router won't connect")
2. Follow the conversation until the AI uses `showStep`
**Expected**: StepCard renders with: step number, title, instruction text, optional tip. Only one step shown at a time. Card has back/next navigation context.
**Tier**: All

#### TC-CHAT-05: Guided Fix — ConfirmButtons
**Preconditions**: AI asks a yes/no confirmation (e.g., "Did that fix the problem?").
**Steps**:
1. Continue a guided fix until the AI uses `confirmResult`
2. Observe the confirm UI
**Expected**: Two buttons rendered with custom labels (e.g., "Yes, it's working" / "No, still broken"). Buttons are semantic `<button>` elements. Disabled during loading to prevent double-tap.
**Tier**: All

#### TC-CHAT-06: Guided Fix — ChoicePills (Max 6)
**Preconditions**: AI presents multiple options via `presentChoices`.
**Steps**:
1. Describe a vague problem (e.g., "Something's wrong with my device")
2. Wait for AI to present choices
**Expected**: Up to 6 choice pills displayed plus a "Something Else" option. Choices are `Array.isArray()` validated. Tapping a choice sends it as a message.
**Tier**: All

#### TC-CHAT-07: Photo Capture via Camera
**Preconditions**: Device has a camera. Camera permissions granted.
**Steps**:
1. In Scout chat, tap the camera/photo button
2. Grant camera permission if prompted
3. Take a photo
4. Confirm/send the photo
**Expected**: PhotoCaptureModal opens. Camera preview displayed. Photo captured and sent to AI. AI analyzes the image and responds with diagnostic insights.
**Tier**: All (photo analysis counts against monthly limit)

#### TC-CHAT-08: Photo Fallback — Camera Denied
**Preconditions**: Camera permission denied or unavailable.
**Steps**:
1. In Scout chat, tap the camera/photo button
2. Deny camera permission (or test on a device without camera)
**Expected**: Graceful fallback to file upload picker. User can select a photo from device storage. Photo is sent and analyzed normally.
**Tier**: All

#### TC-CHAT-09: Device Context Injection
**Preconditions**: User has at least one device saved in Device Management.
**Steps**:
1. In Scout chat, open the device picker
2. Select a device (e.g., "Living Room Router — Netgear R7000")
3. Send a message about the device
**Expected**: Device details (name, type, brand, model, location) injected into the AI context. AI response references the specific device.
**Tier**: All

#### TC-CHAT-10: Case Auto-Created on First Message
**Preconditions**: Start a fresh Scout chat session with no existing case.
**Steps**:
1. Send the first message in a new session
2. After AI responds, check Session History
**Expected**: A new case is automatically created with auto-generated title (via `POST /api/ai/generate-case-name`). Case appears in Session History with prefix (e.g., "ME0000001" for chat).
**Tier**: All

#### TC-CHAT-11: Message Persistence After Reload
**Preconditions**: Active chat with multiple messages.
**Steps**:
1. Note the current messages in the chat
2. Refresh the browser (F5)
3. Navigate back to the same case
**Expected**: All previous messages (user and AI) are reloaded from the server. Guided actions (pills, step cards) are restored.
**Tier**: All

#### TC-CHAT-12: Rate Limit Hit (30/min AI)
**Preconditions**: In Scout chat.
**Steps**:
1. Send messages rapidly (30+ within 1 minute)
**Expected**: After 30 messages in a minute, the next request returns a rate limit error. RateLimitModal or inline error shown: "Too many requests. Please wait a moment." Chat resumes after cooldown.
**Tier**: All

#### TC-CHAT-13: Free Tier — 5 Chats/Month Limit
**Preconditions**: Free-tier user who has used 5 chat sessions this month.
**Steps**:
1. Attempt to start a 6th chat session
**Expected**: Limit message displayed explaining the monthly cap. UpgradeModal or prompt to subscribe to Home/Pro for unlimited chat.
**Tier**: Free

#### TC-CHAT-14: Home/Pro — Unlimited Chat
**Preconditions**: Home or Pro tier user.
**Steps**:
1. Send 10+ chat messages across multiple sessions
**Expected**: No limit reached. All messages processed normally. No upgrade prompts.
**Tier**: Home, Pro

#### TC-CHAT-15: Markdown Rendering in AI Responses
**Preconditions**: In Scout chat.
**Steps**:
1. Ask a question that triggers a formatted response (e.g., "Give me a step-by-step checklist for router troubleshooting")
**Expected**: AI response renders Markdown correctly: headers, bold, italic, bullet lists, numbered lists, code blocks. No raw Markdown syntax visible.
**Tier**: All

#### TC-CHAT-16: Long Conversation Scrolling
**Preconditions**: Chat with 20+ messages.
**Steps**:
1. Continue sending messages until the chat overflows the viewport
2. Observe scroll behavior
**Expected**: Chat auto-scrolls to the newest message. User can scroll up to see history. Scroll-to-bottom button appears when scrolled up. No layout jank.
**Tier**: All

---

## Suite 7: Voice Support

#### TC-VOICE-01: Mic Permission Request
**Preconditions**: Home or Pro tier user. Mic permission not yet granted.
**Steps**:
1. Navigate to Scout chat
2. Select Voice mode (Talk It Out tile or mode dock)
**Expected**: Browser mic permission dialog appears. Clear explanation of why mic access is needed.
**Tier**: Home, Pro

#### TC-VOICE-02: Mic Permission Denied — Graceful Error
**Preconditions**: Home or Pro tier user.
**Steps**:
1. Select Voice mode
2. Deny the mic permission when prompted
**Expected**: Error message explaining mic access is required. Fallback option to use text chat instead. No crash or blank screen.
**Tier**: Home, Pro

#### TC-VOICE-03: Voice Recording — Transcription — AI Response
**Preconditions**: Mic permission granted. Home or Pro tier.
**Steps**:
1. Tap the record/speak button
2. Speak: "My thermostat is showing error code E4"
3. Stop recording
**Expected**: Waveform visualization during recording. After stop, speech is transcribed. Transcription sent to AI. AI responds with relevant troubleshooting.
**Tier**: Home, Pro

#### TC-VOICE-04: Waveform Visualization
**Preconditions**: Voice mode active, mic permission granted.
**Steps**:
1. Start speaking
2. Observe the voice overlay
**Expected**: Real-time waveform/audio visualization while speaking. Visualization stops when recording ends.
**Tier**: Home, Pro

#### TC-VOICE-05: End Voice Session — Summary
**Preconditions**: Voice session with at least 2 exchanges.
**Steps**:
1. Tap "End Session" or equivalent
**Expected**: Session ends. AI generates a summary of the conversation. VoiceReportModal appears.
**Tier**: Home, Pro

#### TC-VOICE-06: VoiceReportModal — Summary + Email
**Preconditions**: Voice session just ended; VoiceReportModal is showing.
**Steps**:
1. Observe the modal content
2. Click "Email Report"
**Expected**: Modal shows the session summary text. "Email Report" triggers `POST /api/send-session-guide` with `credentials: 'include'`. Success message displayed.
**Tier**: Home, Pro

#### TC-VOICE-07: Free Tier — UpgradeModal
**Preconditions**: Free-tier user.
**Steps**:
1. Attempt to use Voice mode (Talk It Out tile)
**Expected**: UpgradeModal appears explaining voice is a Home+ feature. Options to upgrade. Voice session does not start.
**Tier**: Free

#### TC-VOICE-08: Home/Pro — Voice Accessible
**Preconditions**: Home or Pro tier user.
**Steps**:
1. Select Voice mode
2. Grant mic permission
**Expected**: Voice session starts successfully. No upgrade prompts.
**Tier**: Home, Pro

---

## Suite 8: Video Diagnostic

#### TC-VIDEO-01: Camera + Mic Permission Request
**Preconditions**: Home or Pro tier user with video credits. Permissions not yet granted.
**Steps**:
1. Select Video mode (Live Video Help tile)
**Expected**: Browser prompts for both camera and microphone permissions.
**Tier**: Home, Pro

#### TC-VIDEO-02: Permission Denied — Error with Retry
**Preconditions**: Home or Pro tier user.
**Steps**:
1. Select Video mode
2. Deny camera or mic permission
**Expected**: Error message with clear explanation of which permission is missing. Retry button to re-request. Option to check browser settings.
**Tier**: Home, Pro

#### TC-VIDEO-03: WebSocket Auth — Valid Session
**Preconditions**: Logged in as Home/Pro user with credits.
**Steps**:
1. Start a video session
2. Observe WebSocket connection (DevTools → Network → WS)
**Expected**: WebSocket connects to `/live`. Session cookie parsed and authenticated server-side. Connection established. `userId` derived from session (not query param).
**Tier**: Home, Pro

#### TC-VIDEO-04: WebSocket Auth — No Session (4401 Rejection)
**Preconditions**: Not logged in, or session expired.
**Steps**:
1. Attempt to connect to the WebSocket endpoint `/live` directly (or clear cookies and try video)
**Expected**: WebSocket connection rejected with code 4401. No video session established. UI shows authentication error.
**Tier**: All

#### TC-VIDEO-05: Live Video Stream + AI Analysis
**Preconditions**: Camera/mic granted. WebSocket connected.
**Steps**:
1. Point camera at a home issue (e.g., blinking router lights)
2. Speak: "Can you see the lights? What do they mean?"
**Expected**: Video stream is live. AI analyzes the visual feed and provides real-time verbal/text guidance. Transcript panel shows conversation.
**Tier**: Home, Pro

#### TC-VIDEO-06: Transcript Panel Auto-Scroll
**Preconditions**: Active video session with multiple exchanges.
**Steps**:
1. Continue the video session for 5+ exchanges
2. Observe the transcript panel
**Expected**: Transcript auto-scrolls to show the latest message. Can scroll up to review history.
**Tier**: Home, Pro

#### TC-VIDEO-07: Mute/Unmute Toggle
**Preconditions**: Active video session.
**Steps**:
1. Tap the mute button
2. Speak (should not be heard by AI)
3. Tap unmute
4. Speak again
**Expected**: Mute icon changes state. AI does not respond to speech while muted. Normal operation resumes after unmute.
**Tier**: Home, Pro

#### TC-VIDEO-08: End Session — CaseCompletionModal
**Preconditions**: Active video session with at least one exchange.
**Steps**:
1. Tap "End Session"
2. Observe the modal
**Expected**: Session ends. CaseCompletionModal appears with: summary text, "Download PDF" button, "Email Report" button. Loading/error/success states for each action.
**Tier**: Home, Pro

#### TC-VIDEO-09: Video Credit Deducted
**Preconditions**: User has 3 video credits before session.
**Steps**:
1. Start and complete a video session
2. Check video credit balance
**Expected**: Credit balance decreases by 1 (now 2). Usage bar updates on dashboard/billing page.
**Tier**: Home, Pro

#### TC-VIDEO-10: No Credits — UpgradeModal
**Preconditions**: User has 0 video credits.
**Steps**:
1. Attempt to start a video session
**Expected**: UpgradeModal appears with options to buy single credit ($3) or 5-pack ($12). Session does not start.
**Tier**: Home, Pro

#### TC-VIDEO-11: Free Tier — UpgradeModal
**Preconditions**: Free-tier user.
**Steps**:
1. Tap the Video tile on Dashboard
**Expected**: UpgradeModal appears explaining video is a Home+ feature. Tile shows lock badge. Session does not start.
**Tier**: Free

---

## Suite 9: Case Management

#### TC-CASE-01: Create New Case
**Preconditions**: Logged in.
**Steps**:
1. Start a new Scout chat session
2. Send a message (e.g., "My dishwasher won't drain")
**Expected**: New case created via `POST /api/cases`. Case ID assigned with prefix (ME for chat, VI for video, TA for voice, PH for photo). Case title auto-generated by AI.
**Tier**: All

#### TC-CASE-02: View Case List in Session History
**Preconditions**: User has 3+ cases.
**Steps**:
1. Navigate to History (via bottom dock or header)
**Expected**: All cases listed with: title, status (open/resolved/escalated), session mode icon, creation date. Sorted by most recent first.
**Tier**: All

#### TC-CASE-03: Search Cases by Title/Keyword
**Preconditions**: User has multiple cases with varied titles.
**Steps**:
1. Navigate to Session History
2. Type a keyword in the search bar (e.g., "Wi-Fi")
**Expected**: Case list filters to show only cases matching the keyword. Search is case-insensitive. Results update as user types.
**Tier**: All

#### TC-CASE-04: Filter by Status
**Preconditions**: User has cases in different statuses.
**Steps**:
1. Navigate to Session History
2. Apply filter: "Open"
3. Apply filter: "Resolved"
4. Apply filter: "Escalated"
5. Apply filter: "All"
**Expected**: Each filter shows only cases with the matching status. "All" shows everything. Counts update accordingly.
**Tier**: All

#### TC-CASE-05: View Case Detail
**Preconditions**: User has a case with multiple messages.
**Steps**:
1. Click on a case from the list
**Expected**: Full message history loaded with timestamps. User and AI messages distinguished visually. Guided actions (step cards, pills) rendered inline.
**Tier**: All

#### TC-CASE-06: Download PDF Report
**Preconditions**: User has a resolved case.
**Steps**:
1. Click the PDF download button on a case (in HistoryList or CaseCompletionModal)
2. Observe the download
**Expected**: `GET /api/cases/:id/report` returns a PDF. Browser downloads the file. `URL.revokeObjectURL()` called after download to free memory.
**Tier**: All

#### TC-CASE-07: Email PDF Report
**Preconditions**: User has a resolved case.
**Steps**:
1. Click the Email report button on a case
**Expected**: `POST /api/cases/:id/report/email` triggered. Success message displayed (e.g., "Report sent to your email"). Email arrives with PDF attachment.
**Tier**: All

#### TC-CASE-08: Reopen Resolved Case
**Preconditions**: User has a resolved case.
**Steps**:
1. From Session History, click on a resolved case
2. Click "Continue" or "Reopen"
**Expected**: ScoutChatScreen opens with the case's full message history loaded. User can continue the conversation.
**Tier**: All

#### TC-CASE-09: Delete Single Case
**Preconditions**: User has a case.
**Steps**:
1. Click delete on a specific case
2. Confirmation dialog appears
3. Confirm deletion
**Expected**: Confirmation dialog shown before deletion. After confirm, case removed via `DELETE /api/cases/:id`. Case disappears from list. Toast/success message.
**Tier**: All

#### TC-CASE-10: Delete All Cases
**Preconditions**: User has multiple cases.
**Steps**:
1. Click "Delete All" in Session History
2. Confirmation dialog appears
3. Confirm deletion
**Expected**: Confirmation dialog with clear warning. After confirm, all cases removed via `DELETE /api/cases`. History is empty. Success message.
**Tier**: All

#### TC-CASE-11: Escalate Case
**Preconditions**: Active case where AI recommends escalation.
**Steps**:
1. In an active case, trigger escalation (AI suggests or user requests)
2. Confirm escalation
**Expected**: Case status changes to "escalated". `POST /api/ai/escalation-report` generates a report. Case details include specialist referral information.
**Tier**: All

#### TC-CASE-12: Specialist Token Email
**Preconditions**: Case has been escalated.
**Steps**:
1. After escalation, check email (specialist receives notification)
**Expected**: Specialist receives email with a unique token link. Token valid for 7 days. Link format: `/specialist/:token`.
**Tier**: All

#### TC-CASE-13: Specialist Views Case via Token
**Preconditions**: Valid specialist token.
**Steps**:
1. Open the specialist link `/specialist/:token` (no login required)
**Expected**: Case details visible: user's issue description, AI conversation summary, escalation report. No authentication required (token-based access).
**Tier**: All

#### TC-CASE-14: Specialist Submits Response
**Preconditions**: Specialist has a valid token and is viewing a case.
**Steps**:
1. Specialist types a response/recommendation
2. Submit via `POST /api/specialist/:token/respond`
**Expected**: Response saved. User receives notification email (`sendSpecialistResponseEmail`). Response visible in the user's case detail view.
**Tier**: All

---

## Suite 10: Device Management

#### TC-DEV-01: Add Device
**Preconditions**: Logged in.
**Steps**:
1. Navigate to Device Management (via Settings or Scout)
2. Click "Add Device"
3. Fill in: Name ("Living Room Router"), Type ("Router"), Brand ("Netgear"), Model ("R7000"), Location ("Living Room"), Notes ("Dual band, 5GHz preferred")
4. Save
**Expected**: Device created via `POST /api/devices`. Appears in device list with correct icon for type. All fields saved.
**Tier**: All

#### TC-DEV-02: Edit Device
**Preconditions**: User has at least one device.
**Steps**:
1. Click edit on an existing device
2. Change the name and location
3. Save
**Expected**: Device updated via `PATCH /api/devices/:id`. Changes reflected in device list immediately.
**Tier**: All

#### TC-DEV-03: Delete Device
**Preconditions**: User has a device.
**Steps**:
1. Click delete on a device
2. Confirm in the confirmation dialog
**Expected**: Device removed via `DELETE /api/devices/:id`. No longer appears in device list or device picker.
**Tier**: All

#### TC-DEV-04: Device List with Type Icons
**Preconditions**: User has devices of different types (Router, Thermostat, TV, etc.).
**Steps**:
1. Navigate to device list
**Expected**: Each device shows an appropriate icon based on its type. List is readable and well-formatted.
**Tier**: All

#### TC-DEV-05: Associate Device with Case
**Preconditions**: User has at least one device. In an active Scout chat.
**Steps**:
1. Open the device picker in Scout chat
2. Select a device
3. Send a message about the device
**Expected**: Device context (name, type, brand, model, location) injected into the AI prompt. AI references the specific device in its response.
**Tier**: All

#### TC-DEV-06: Device Count in History
**Preconditions**: Case was created with a device associated.
**Steps**:
1. Navigate to Session History
2. Observe case entries
**Expected**: Cases that have associated devices show a device indicator or count.
**Tier**: All

---

## Suite 11: Billing & Subscriptions

#### TC-BILL-01: Pricing Page — 3 Tiers Displayed
**Preconditions**: Navigate to `/pricing`.
**Steps**:
1. Observe the pricing cards
**Expected**: Three tiers displayed: Free ($0), Home ($9.99/mo), Pro ($19.99/mo). Each shows: price, description, feature highlights.
**Tier**: All

#### TC-BILL-02: Annual/Monthly Toggle
**Preconditions**: On Pricing page.
**Steps**:
1. Toggle from Monthly to Annual
**Expected**: Prices update: Home → $7.99/mo ($95.88/yr), Pro → $15.99/mo ($191.88/yr). Savings highlighted. Toggle animation smooth.
**Tier**: All

#### TC-BILL-03: Subscribe to Home — Stripe Checkout
**Preconditions**: Logged in as free-tier user.
**Steps**:
1. On Pricing page, click "Subscribe" on Home plan (monthly)
2. Complete Stripe Checkout with test card `4242 4242 4242 4242`
3. Return to app
**Expected**: Stripe Checkout session created via `POST /api/stripe/create-checkout-session`. After payment, subscription status updates to "home". Dashboard tiles unlocked (Voice). Confirmation email received.
**Tier**: Free → Home

#### TC-BILL-04: Subscribe to Pro
**Preconditions**: Logged in as free-tier user.
**Steps**:
1. Click "Subscribe" on Pro plan
2. Complete Stripe Checkout with test card
**Expected**: Subscription set to "pro". All tiles unlocked. 15 video sessions/month included. Multi-home support enabled.
**Tier**: Free → Pro

#### TC-BILL-05: Upgrade Home → Pro
**Preconditions**: Active Home subscription.
**Steps**:
1. Navigate to Pricing or Billing
2. Click "Upgrade to Pro"
3. Complete checkout
**Expected**: Prorated billing applied. Subscription immediately changes to Pro. Upgrade email sent. Video session limit increases from 4/mo to 15/mo.
**Tier**: Home → Pro

#### TC-BILL-06: Downgrade Pro → Home
**Preconditions**: Active Pro subscription.
**Steps**:
1. Navigate to Billing
2. Click "Downgrade to Home"
3. Confirm
**Expected**: Prorated credit applied. Subscription changes to Home at next billing cycle. Downgrade email sent. Multi-home disabled. Video limit reduces to 4/mo.
**Tier**: Pro → Home

#### TC-BILL-07: Cancel Subscription — ChurnPreventionModal
**Preconditions**: Active paid subscription (Home or Pro).
**Steps**:
1. Navigate to Billing
2. Click "Cancel Subscription"
**Expected**: ChurnPreventionModal appears with retention offer (20% discount). Does NOT immediately cancel.
**Tier**: Home, Pro

#### TC-BILL-08: Accept Retention Discount
**Preconditions**: ChurnPreventionModal is showing.
**Steps**:
1. Click "Accept 20% Off" (or equivalent retention offer)
**Expected**: `POST /api/subscription/apply-retention-discount` called. Subscription continues at discounted rate. Modal closes. Success message.
**Tier**: Home, Pro

#### TC-BILL-09: Decline Retention — Cancel at Period End
**Preconditions**: ChurnPreventionModal is showing.
**Steps**:
1. Click "Cancel Anyway" (decline the retention offer)
**Expected**: `POST /api/subscription/cancel` called. Subscription marked for cancellation at period end. Access continues until period expires. Cancellation scheduled email sent.
**Tier**: Home, Pro

#### TC-BILL-10: Reactivate Before Period End
**Preconditions**: Subscription is canceled but still within the current billing period.
**Steps**:
1. Navigate to Billing
2. Click "Reactivate Subscription"
**Expected**: `POST /api/subscription/reactivate` called. Cancellation reversed. Subscription continues normally. Reactivation email sent.
**Tier**: Home, Pro

#### TC-BILL-11: Subscription Expires After Period
**Preconditions**: Subscription was canceled and current period has ended.
**Steps**:
1. Wait for (or simulate) period expiry
2. Check user's tier
**Expected**: User reverts to free tier. Tier-gated features (Voice, Video) locked again. Subscription ended email sent. Usage limits reset to free-tier values.
**Tier**: Home/Pro → Free

#### TC-BILL-12: Buy Single Video Credit ($3)
**Preconditions**: Logged in (any tier).
**Steps**:
1. Navigate to Buy Credits (via UpgradeModal or Billing)
2. Select "1 Video Diagnostic — $3"
3. Complete Stripe Checkout
**Expected**: `POST /api/stripe/create-checkout-session` with single credit price ID. After payment, `videoCredits` incremented by 1. Credit balance updates in UI.
**Tier**: All

#### TC-BILL-13: Buy 5-Credit Pack ($12)
**Preconditions**: Logged in.
**Steps**:
1. Select "5 Video Diagnostics — $12 (Save $3)"
2. Complete Stripe Checkout
**Expected**: After payment, `videoCredits` incremented by 5. Savings displayed during checkout ($3 saved vs individual).
**Tier**: All

#### TC-BILL-14: Manage Billing — Stripe Portal
**Preconditions**: Active subscription.
**Steps**:
1. Navigate to Billing
2. Click "Manage Billing" (or "Manage Subscription")
**Expected**: `POST /api/stripe/create-portal-session` called. Redirects to Stripe Customer Portal where user can update payment method, view invoices, cancel.
**Tier**: Home, Pro

#### TC-BILL-15: Billing Status Display
**Preconditions**: Active subscription.
**Steps**:
1. Navigate to Billing/Settings
**Expected**: Displays: current tier badge (Home/Pro), renewal date, billing cycle (monthly/annual), usage bars for chat/photo/video sessions consumed vs limits.
**Tier**: Home, Pro

#### TC-BILL-16: Promo Code — Valid
**Preconditions**: On checkout or Pricing page. A valid promo code exists.
**Steps**:
1. Enter a valid promo code
2. Click "Apply"
**Expected**: `POST /api/promo-codes/validate` returns success. Discount reflected in pricing. Code applied to checkout.
**Tier**: All

#### TC-BILL-17: Promo Code — Invalid
**Preconditions**: On checkout or Pricing page.
**Steps**:
1. Enter "FAKECODE123"
2. Click "Apply"
**Expected**: Validation returns error. Inline error message (e.g., "Invalid promo code"). No discount applied.
**Tier**: All

#### TC-BILL-18: Payment Failure — Past Due
**Preconditions**: Subscription active. Simulate payment failure (Stripe test card `4000 0000 0000 0341`).
**Steps**:
1. Trigger a subscription renewal with a failing card
**Expected**: Stripe webhook `invoice.payment_failed` fires. Subscription status set to "past_due". Payment failed email sent. User sees a banner or warning in the app.
**Tier**: Home, Pro

#### TC-BILL-19: Usage Bars Update
**Preconditions**: Free-tier user with 0 chats used.
**Steps**:
1. Complete 1 chat session
2. Navigate to Billing/Dashboard
**Expected**: Chat usage bar shows 1/5. After another session: 2/5. Photo and video bars also reflect current usage.
**Tier**: Free

#### TC-BILL-20: Video Credit Balance Updates
**Preconditions**: User has purchased credits.
**Steps**:
1. Check credit balance (e.g., 5 credits)
2. Complete one video session
3. Check balance again
**Expected**: Balance decreases by 1 (now 4). UI updates without requiring full page refresh.
**Tier**: All

---

## Suite 12: Subscription Lifecycle Emails

> **Note**: If `RESEND_API_KEY` is not configured, emails are logged in simulation mode. Check server logs for email content.

#### TC-EMAIL-01: Welcome Email
**Preconditions**: New user completes signup.
**Steps**:
1. Register a new account
2. Complete email verification
3. Check inbox
**Expected**: Welcome email from `support@totalassist.tech` received. Includes user's first name, getting-started tips, link to dashboard.
**Tier**: All

#### TC-EMAIL-02: Verification Email with OTP
**Preconditions**: User just registered.
**Steps**:
1. Complete signup form
2. Check inbox
**Expected**: Verification email received with 6-digit OTP code. Preheader text includes the code. Code expires in 30 minutes.
**Tier**: All

#### TC-EMAIL-03: Password Reset Email
**Preconditions**: User requests password reset.
**Steps**:
1. Submit forgot-password form
2. Check inbox
**Expected**: Email received with reset link. Email states "expires in 1 hour". Link contains a unique token.
**Tier**: All

#### TC-EMAIL-04: Subscription Confirmation (Free → Paid)
**Preconditions**: Free user subscribes to Home or Pro.
**Steps**:
1. Complete subscription checkout
2. Check inbox
**Expected**: `sendSubscriptionConfirmationEmail` triggered. Email confirms plan name, price, billing cycle, next renewal date.
**Tier**: Home, Pro

#### TC-EMAIL-05: Plan Upgrade (Home → Pro)
**Preconditions**: Home user upgrades to Pro.
**Steps**:
1. Complete upgrade
2. Check inbox
**Expected**: `sendPlanUpgradeEmail` triggered. Email confirms new plan (Pro), updated features, prorated billing note.
**Tier**: Pro

#### TC-EMAIL-06: Plan Downgrade (Pro → Home)
**Preconditions**: Pro user downgrades to Home.
**Steps**:
1. Complete downgrade
2. Check inbox
**Expected**: `sendPlanDowngradeEmail` triggered. Email confirms new plan (Home), effective date, features that will be lost.
**Tier**: Home

#### TC-EMAIL-07: Cancellation Scheduled
**Preconditions**: User cancels subscription (decline retention).
**Steps**:
1. Cancel subscription
2. Check inbox
**Expected**: `sendCancellationScheduledEmail` triggered. Email includes: cancellation confirmation, access-until date (end of current period), reactivation instructions.
**Tier**: Home, Pro

#### TC-EMAIL-08: Subscription Ended
**Preconditions**: Canceled subscription's billing period has expired.
**Steps**:
1. Period expires (or simulate via webhook)
2. Check inbox
**Expected**: `sendSubscriptionEndedEmail` triggered. Email confirms access has ended. CTA to re-subscribe.
**Tier**: Free (previously paid)

#### TC-EMAIL-09: Reactivation Email
**Preconditions**: User reactivates a canceled subscription.
**Steps**:
1. Reactivate subscription before period end
2. Check inbox
**Expected**: `sendReactivationEmail` triggered. Email confirms subscription restored, next billing date.
**Tier**: Home, Pro

#### TC-EMAIL-10: Payment Failed
**Preconditions**: Subscription renewal fails.
**Steps**:
1. Trigger payment failure (Stripe test card for decline)
2. Check inbox
**Expected**: `sendPaymentFailedEmail` triggered. Email explains payment issue, asks to update payment method, includes portal link.
**Tier**: Home, Pro

#### TC-EMAIL-11: Trial Ending — 3-Day Warning
**Preconditions**: User is on day 4 of 7-day trial.
**Steps**:
1. Trigger trial notification (or wait for `POST /api/admin/run-trial-notifications`)
2. Check inbox
**Expected**: `sendTrialEndingEmail` triggered. Email warns trial ends in 3 days. CTA to subscribe.
**Tier**: Free (trial)

#### TC-EMAIL-12: Trial Ending — 1-Day Warning
**Preconditions**: User is on day 6 of 7-day trial.
**Steps**:
1. Trigger trial notification
2. Check inbox
**Expected**: `sendTrialEndingEmail` triggered with 1-day variant. Urgent tone. CTA to subscribe before access expires.
**Tier**: Free (trial)

#### TC-EMAIL-13: Session Guide Email
**Preconditions**: User completes a voice/video session.
**Steps**:
1. End a session
2. Click "Email Report" in VoiceReportModal or CaseCompletionModal
**Expected**: `sendSessionGuideEmail` triggered via `POST /api/send-session-guide`. Email sent to session user's email (not request body — server-enforced). Contains session summary/PDF.
**Tier**: Home, Pro

#### TC-EMAIL-14: Specialist Notifications
**Preconditions**: Case is escalated with specialist email.
**Steps**:
1. Escalate a case
2. Specialist submits a response
**Expected**: Two emails: (a) `sendEscalationEmail` to specialist with token link, (b) `sendSpecialistResponseEmail` to user when specialist responds.
**Tier**: All

---

## Suite 13: Settings & Profile

#### TC-SET-01: View Profile Fields
**Preconditions**: Logged in.
**Steps**:
1. Navigate to Settings/Profile
**Expected**: Profile displays: first name (editable), last name (editable), email (read-only), phone (editable), profile image.
**Tier**: All

#### TC-SET-02: Update Profile — Save
**Preconditions**: On profile page.
**Steps**:
1. Change first name to "TestName"
2. Click "Save"
**Expected**: `PUT /api/auth/user/:id` called. Success confirmation (toast or inline message). Changes persist after page refresh.
**Tier**: All

#### TC-SET-03: Upload Profile Image — Valid
**Preconditions**: On profile page.
**Steps**:
1. Click upload/change image
2. Select a JPEG file under 3MB
**Expected**: `POST /api/auth/user/:id/profile-image` called. Image uploaded, processed, and displayed as the new avatar. Avatar updates in header/dropdown.
**Tier**: All

#### TC-SET-04: Upload Profile Image — Oversized
**Preconditions**: On profile page.
**Steps**:
1. Select an image file larger than 3MB
2. Attempt upload
**Expected**: Error message: "Image too large. Maximum size is 3MB." Image not changed.
**Tier**: All

#### TC-SET-05: Remove Profile Image
**Preconditions**: User has a profile image set.
**Steps**:
1. Click "Remove" on the profile image
**Expected**: `DELETE /api/auth/user/:id/profile-image` called. Image removed. Default avatar/initials shown instead.
**Tier**: All

#### TC-SET-06: Toggle Email Notification Preferences
**Preconditions**: On Settings page.
**Steps**:
1. Toggle email notifications off
2. Save
3. Toggle back on
4. Save
**Expected**: Preference saved. Toggle reflects current state after refresh.
**Tier**: All

#### TC-SET-07: Toggle Session Guide Email
**Preconditions**: On Settings page.
**Steps**:
1. Toggle session guide emails off
2. Save
**Expected**: Preference saved. Future session completions do not auto-send guide emails.
**Tier**: All

#### TC-SET-08: Delete Account
**Preconditions**: Logged in.
**Steps**:
1. Navigate to Settings
2. Click "Delete Account"
3. Confirmation dialog appears with clear warning
4. Confirm deletion
**Expected**: `DELETE /api/auth/user/:id` called. Session destroyed. Redirect to homepage. Attempting to log in with deleted email fails. All user data removed.
**Tier**: All

---

## Suite 14: Marketing & Static Pages

#### TC-PAGE-01: Homepage — Hero Section
**Preconditions**: Not logged in (or logged in — both work).
**Steps**:
1. Navigate to `/` (homepage)
**Expected**: Centered hero with gradient headline "Get help with [typewriter animation]". Subtitle about AI-powered support. CTA button. Carousel below in 16:9 rounded container.
**Tier**: All

#### TC-PAGE-02: Homepage — How It Works Section
**Preconditions**: On homepage.
**Steps**:
1. Scroll below the hero
**Expected**: How It Works section visible with clear step-by-step explanation of the service. Well-formatted with icons/illustrations.
**Tier**: All

#### TC-PAGE-03: Homepage — FAQ Section
**Preconditions**: On homepage.
**Steps**:
1. Scroll to FAQ section
**Expected**: FAQ accordion visible. Questions expand/collapse on click. Answers readable.
**Tier**: All

#### TC-PAGE-04: Homepage — Footer
**Preconditions**: On homepage.
**Steps**:
1. Scroll to bottom
**Expected**: Footer with: company info, Services links (Chat, Photo, Voice, Video), legal links (Privacy, Terms, Cancellation), support email.
**Tier**: All

#### TC-PAGE-05: Service Page — Chat (/services/chat)
**Preconditions**: None.
**Steps**:
1. Navigate to `/services/chat`
**Expected**: Service page renders with: hero section, how-it-works (3 steps), features (4 items), FAQ accordion (3 service-specific items), CTA. Lazy-loaded (~7KB chunk).
**Tier**: All

#### TC-PAGE-06: Service Page — Photo (/services/photo)
**Preconditions**: None.
**Steps**:
1. Navigate to `/services/photo`
**Expected**: Photo service page with photo-specific content, tips, and FAQs. Same layout structure as chat service page.
**Tier**: All

#### TC-PAGE-07: Service Page — Voice (/services/voice)
**Preconditions**: None.
**Steps**:
1. Navigate to `/services/voice`
**Expected**: Voice service page with mic requirements, session info, and FAQs.
**Tier**: All

#### TC-PAGE-08: Service Page — Video (/services/video)
**Preconditions**: None.
**Steps**:
1. Navigate to `/services/video`
**Expected**: Video service page with credit info, camera requirements, and FAQs.
**Tier**: All

#### TC-PAGE-09: Service Page CTA Routing
**Preconditions**: Test both logged-in and logged-out states.
**Steps**:
1. Navigate to any service page while logged out → click CTA
2. Navigate to any service page while logged in → click CTA
**Expected**: Unauthenticated → redirect to `/signup`. Authenticated → redirect to Dashboard.
**Tier**: All

#### TC-PAGE-10: Privacy Policy
**Preconditions**: None.
**Steps**:
1. Navigate to `/privacy`
2. Test in both light and dark mode
**Expected**: Privacy policy renders completely. Correct theme styling in both modes (`bg-light-50 dark:bg-midnight-950`). No hardcoded dark theme.
**Tier**: All

#### TC-PAGE-11: Terms of Service + Cancellation Policy
**Preconditions**: None.
**Steps**:
1. Navigate to `/terms`
2. Navigate to `/cancellation`
**Expected**: Both pages render with full content. Correct theme styling. All links functional.
**Tier**: All

#### TC-PAGE-12: 404 Page
**Preconditions**: None.
**Steps**:
1. Navigate to `/some-nonexistent-page`
**Expected**: Proper 404 page displayed (not a silent redirect to home). Shows "Page Not Found" message with "Go Home" button. Button navigates to `/`.
**Tier**: All

---

## Suite 15: Responsive, PWA & Accessibility

### Responsive Layout

#### TC-RES-01: Mobile Layout (375px)
**Preconditions**: Set viewport to 375px width (iPhone SE).
**Steps**:
1. Navigate through: Homepage, Dashboard, Scout Chat, Settings, History
**Expected**: Single-column layout on all pages. Bottom dock visible. Hamburger menu in header. Triage tiles stack vertically (compact 72px horizontal bars). No horizontal scrollbar.
**Tier**: All

#### TC-RES-02: Tablet Layout (768px)
**Preconditions**: Set viewport to 768px width (iPad).
**Steps**:
1. Navigate through all main pages
**Expected**: 2-column grid where appropriate (e.g., triage tiles). Bottom dock visible. Content uses available width without excessive whitespace.
**Tier**: All

#### TC-RES-03: Desktop Layout (1024px+)
**Preconditions**: Set viewport to 1280px.
**Steps**:
1. Navigate through all main pages
**Expected**: Full multi-column layout. Header nav visible (no hamburger). Bottom dock hidden (`lg:hidden`). Triage tiles as large cards with `aspect-[16/10]`. Desktop-only background images on "Show the Problem" card.
**Tier**: All

#### TC-RES-04: Safe Area Padding (Notched Devices)
**Preconditions**: Test on iPhone with notch/Dynamic Island (or simulate via DevTools).
**Steps**:
1. Open the app in Safari on a notched device
2. Check top and bottom content areas
**Expected**: No content hidden behind notch or home indicator. `pt-safe`, `pb-safe` classes applied to overlays. `viewport-fit=cover` and `interactive-widget=resizes-content` meta tags present.
**Tier**: All

#### TC-RES-05: No Horizontal Scroll
**Preconditions**: Test at 375px, 768px, 1280px viewports.
**Steps**:
1. On each viewport, attempt to scroll horizontally on every page
**Expected**: No horizontal overflow on any page or viewport width.
**Tier**: All

#### TC-RES-06: Touch Targets ≥ 44px
**Preconditions**: Mobile viewport.
**Steps**:
1. Inspect all interactive elements: buttons, links, dock tabs, card tiles, form inputs
**Expected**: All touch targets are at least 44px × 44px. Dock tabs are 48px+. Mobile triage tiles are 72px min-height.
**Tier**: All

### PWA

#### TC-RES-07: Chrome/Edge Install Banner
**Preconditions**: Chrome or Edge on Android or desktop. Clear localStorage. Engage with app (navigate 2+ pages).
**Steps**:
1. Visit the app and interact
2. Observe for install banner
**Expected**: Bottom-anchored PWA install banner appears. Banner below main CTA, z-index below modals. "Install" and "Dismiss" buttons visible.
**Tier**: All

#### TC-RES-08: Dismiss Banner — 14-Day Cooldown
**Preconditions**: Install banner is showing.
**Steps**:
1. Click "Dismiss" on the install banner
2. Refresh the page
3. Check localStorage for dismiss timestamp
**Expected**: Banner disappears. Does not reappear for 14 days (stored in localStorage). After 14 days, banner reappears.
**Tier**: All

#### TC-RES-09: iOS Safari — No Banner (Graceful No-Op)
**Preconditions**: iOS Safari.
**Steps**:
1. Visit the app
2. Check for install banner
**Expected**: No install banner shown (iOS doesn't support `beforeinstallprompt`). No errors in console. Users must use Share → Add to Home Screen manually.
**Tier**: All

#### TC-RES-10: Service Worker Caching
**Preconditions**: App loaded for the first time.
**Steps**:
1. Open DevTools → Application → Service Workers
2. Check DevTools → Network tab
3. Reload the page
**Expected**: Service worker registered (`sw.js`, CACHE_NAME v2). Key assets served from cache on subsequent loads. Network tab shows "(ServiceWorker)" source for cached resources.
**Tier**: All

### Accessibility

#### TC-RES-11: Keyboard Navigation
**Preconditions**: Desktop browser. Mouse not required.
**Steps**:
1. Starting from the top of any page, press Tab repeatedly
2. Use Enter/Space to activate focused elements
3. Navigate through: header nav, triage tiles, chat input, dock tabs
**Expected**: All interactive elements reachable via Tab. Logical tab order (left-to-right, top-to-bottom). No focus traps (except modals — see TC-RES-17).
**Tier**: All

#### TC-RES-12: Focus Rings
**Preconditions**: Desktop browser.
**Steps**:
1. Tab through interactive elements
**Expected**: Visible focus ring on all focusable elements. `focus-visible:ring-white/60` on dock (dark background), `focus-visible:ring-white/40` on header. Standard focus styles on forms and buttons.
**Tier**: All

#### TC-RES-13: Screen Reader — Headings & Labels
**Preconditions**: Screen reader active (VoiceOver, NVDA, or similar).
**Steps**:
1. Navigate the homepage with screen reader
2. Navigate the Dashboard
3. Navigate Scout chat
**Expected**: Headings announce correctly (h1, h2, etc.). Form fields have associated labels. Buttons have accessible names. Images have alt text.
**Tier**: All

#### TC-RES-14: ARIA Labels on Custom Components
**Preconditions**: Screen reader or Accessibility inspector.
**Steps**:
1. Inspect dock tabs, triage cards, guided action buttons
**Expected**: Dock tabs have `role="tab"`, `aria-selected`, `aria-current="page"`, `aria-label`. Cards have `aria-label`. Decorative overlays have `aria-hidden="true"`.
**Tier**: All

#### TC-RES-15: Color Contrast (WCAG AA)
**Preconditions**: Use a contrast checker tool (e.g., browser DevTools accessibility panel).
**Steps**:
1. Check text contrast on: Dashboard tiles, chat messages, header nav, form labels, buttons
2. Check in both light and dark modes
**Expected**: All text meets WCAG AA minimum: 4.5:1 for normal text, 3:1 for large text. Status indicators use color + text labels (not color alone).
**Tier**: All

#### TC-RES-16: Dark/Light Mode Rendering
**Preconditions**: App loaded.
**Steps**:
1. Switch to light mode → navigate all pages
2. Switch to dark mode → navigate all pages
**Expected**: All pages render correctly in both themes. No hardcoded colors that break in either mode. Privacy Policy, Terms, Cancellation all use `bg-light-50 dark:bg-midnight-950` pattern.
**Tier**: All

#### TC-RES-17: Modal Focus Trap + Escape Close
**Preconditions**: Any modal can be triggered (e.g., UpgradeModal, PhotoCaptureModal, CaseCompletionModal).
**Steps**:
1. Open a modal
2. Press Tab — focus should cycle within the modal
3. Press Escape
**Expected**: Focus trapped within modal (cannot Tab to elements behind it). Escape key closes the modal. `overflow: hidden` on body while modal is open.
**Tier**: All

### Security Spot Checks

#### TC-RES-18: API 401 for Unauthenticated Requests
**Preconditions**: Not logged in.
**Steps**:
1. Call `GET /api/cases` without authentication (use curl or DevTools)
2. Call `GET /api/devices`
3. Call `POST /api/ai/chat`
**Expected**: All return 401 Unauthorized. No data leaked.
**Tier**: All

#### TC-RES-19: Cross-User Data Isolation
**Preconditions**: Two test accounts (User A and User B), each with cases and devices.
**Steps**:
1. Log in as User A
2. Attempt to access User B's case: `GET /api/cases/:userB_caseId`
3. Attempt to access User B's profile: `GET /api/auth/user/:userB_id`
4. Attempt to access User B's devices: `GET /api/devices` (should only return User A's)
**Expected**: User A cannot see User B's cases (403 or 404). User A cannot access User B's profile (403). Device list only contains User A's devices. `requireSelf` middleware enforced.
**Tier**: All

#### TC-RES-20: No Stack Traces in Error Responses
**Preconditions**: None.
**Steps**:
1. Trigger a server error (e.g., malformed request body to `POST /api/ai/chat`)
2. Observe the response body
**Expected**: Generic error message (e.g., "Internal server error"). No stack trace, file paths, or internal details exposed. Global error handler catches unhandled exceptions.
**Tier**: All

#### TC-RES-21: Rate Limit — Proper Error (Not Crash)
**Preconditions**: None.
**Steps**:
1. Send 101+ requests to any API endpoint within 1 minute (general limiter: 100/min)
2. Send 31+ requests to `/api/ai/chat` within 1 minute (AI limiter: 30/min)
3. Send 11+ requests to `/api/auth/login` within 15 minutes (auth limiter: 10/15min)
**Expected**: Rate-limited requests return 429 Too Many Requests. Response includes a clear error message. Server does not crash. Normal operation resumes after cooldown.
**Tier**: All

---

## Test Execution Summary Template

| Suite | Total | Passed | Failed | Blocked | Notes |
|-------|-------|--------|--------|---------|-------|
| TC-REG (Registration) | 8 | | | | |
| TC-VER (Verification) | 5 | | | | |
| TC-LOG (Login & Session) | 7 | | | | |
| TC-PWD (Password Reset) | 5 | | | | |
| TC-DASH (Dashboard) | 16 | | | | |
| TC-CHAT (AI Chat) | 16 | | | | |
| TC-VOICE (Voice) | 8 | | | | |
| TC-VIDEO (Video) | 11 | | | | |
| TC-CASE (Case Mgmt) | 14 | | | | |
| TC-DEV (Devices) | 6 | | | | |
| TC-BILL (Billing) | 20 | | | | |
| TC-EMAIL (Emails) | 14 | | | | |
| TC-SET (Settings) | 8 | | | | |
| TC-PAGE (Static Pages) | 12 | | | | |
| TC-RES (Responsive/A11y) | 21 | | | | |
| **TOTAL** | **171** | | | | |

---

## Appendix: Test Data Reference

### Stripe Test Cards
| Card Number | Scenario |
|---|---|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0341` | Attach succeeds, charge fails |
| `4000 0000 0000 9995` | Insufficient funds |

### Subscription Price IDs
| Plan | Interval | Price ID |
|---|---|---|
| Home | Monthly | `price_1SxBdZPeLuLIM8GmEUA9WuJH` |
| Home | Annual | `price_1SxBKmPeLuLIM8Gmv3EbHR44` |
| Pro | Monthly | `price_1SxBdvPeLuLIM8GmXo3KCqT2` |
| Pro | Annual | `price_1SxBefPeLuLIM8GmlwmfnA2C` |
| Video Single | One-time | `price_1SxBftPeLuLIM8GmX9sxeASx` |
| Video 5-Pack | One-time | `price_1SzOhPPeLuLIM8GmXLqoj7yt` |

### Plan Limits
| Feature | Free | Home | Pro |
|---|---|---|---|
| Chat sessions/mo | 5 | Unlimited | Unlimited |
| Photo analyses/mo | 1 | Unlimited | Unlimited |
| Video sessions/mo | 0 (locked) | 4 included | 15 included |
| Multi-home | No | No | Yes (up to 5) |

### Rate Limits
| Limiter | Limit | Window |
|---|---|---|
| General API | 100 requests | 1 minute |
| AI endpoints | 30 requests | 1 minute |
| Auth endpoints | 10 attempts | 15 minutes |

### Expiry Timers
| Token/Code | Expiry |
|---|---|
| Email verification OTP | 30 minutes |
| Password reset link | 1 hour |
| Session cookie | 7 days |
| Specialist token | 7 days |
| Trial period | 7 days |
| OTP resend cooldown | 60 seconds |
| PWA dismiss cooldown | 14 days |

### Case ID Prefixes
| Mode | Prefix | Example |
|---|---|---|
| Chat (message) | ME | ME0000001 |
| Video | VI | VI0000001 |
| Voice (talk) | TA | TA0000001 |
| Photo | PH | PH0000001 |
