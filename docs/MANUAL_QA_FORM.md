# Manual QA Form — TotalAssist

> **Version**: 1.0
> **Last Updated**: 2026-02-19
> **App URL**: https://totalassist.tech
> **Total Questions**: 33
> **Scope**: Items that require a real browser, device, Stripe checkout, email inbox, or camera/mic — cannot be verified through code inspection alone.

---

## Instructions

- **Tester Name**: ___
- **Date**: ___
- **Browser / Device**: ___
- **Stripe Test Card**: `4242 4242 4242 4242` (Exp: any future date, CVC: any 3 digits)
- **Stripe Failure Card**: `4000 0000 0000 0341` (Attach succeeds, charge fails)

For each question, select **Pass**, **Fail**, or **Blocked** and add notes if applicable.

---

## 1. OAuth Flows (2 questions)

#### Q1: Google OAuth Signup — New User
Click "Continue with Google" on `/signup` with a Google account not linked to any TotalAssist account. Does the OAuth redirect work, account get created, and user land on Dashboard?

> **Answer**: Pass / Fail / Blocked
> **Notes**:

#### Q2: Google OAuth Login — Existing User
Click "Continue with Google" on `/login` with an already-linked Google account. Does it log you in and skip onboarding?

> **Answer**: Pass / Fail / Blocked
> **Notes**:

---

## 2. Email Delivery (7 questions)

> **Note**: If `RESEND_API_KEY` is not configured, emails are logged in simulation mode. Check server logs for email content.

#### Q3: Verification Email Arrives
After signup, does the verification email actually arrive from `support@totalassist.tech` with the 6-digit OTP in the preheader?

> **Answer**: Pass / Fail / Blocked
> **Notes**:

#### Q4: Password Reset Email Arrives
After submitting the forgot-password form, does the reset email arrive with a working link that expires in 1 hour?

> **Answer**: Pass / Fail / Blocked
> **Notes**:

#### Q5: Subscription Confirmation Email
After subscribing (Free → Home or Pro), does a confirmation email arrive with plan name, price, billing cycle, and renewal date?

> **Answer**: Pass / Fail / Blocked
> **Notes**:

#### Q6: Cancellation Email
After canceling a subscription (declining the retention offer), does a cancellation email arrive with the access-until date and reactivation instructions?

> **Answer**: Pass / Fail / Blocked
> **Notes**:

#### Q7: Session Guide Email
After ending a voice/video session and clicking "Email Report" in the VoiceReportModal or CaseCompletionModal, does the session guide email arrive?

> **Answer**: Pass / Fail / Blocked
> **Notes**:

#### Q8: Specialist Escalation Email
After escalating a case, does the specialist receive an email with a working token link (`/specialist/:token`)?

> **Answer**: Pass / Fail / Blocked
> **Notes**:

#### Q9: Specialist Response Notification
After the specialist submits a response via the token link, does the user receive a notification email?

> **Answer**: Pass / Fail / Blocked
> **Notes**:

---

## 3. Stripe Checkout (5 questions)

#### Q10: Subscribe to Home Plan
As a free user, click "Subscribe" on the Home plan. Does Stripe Checkout open? Complete with test card `4242 4242 4242 4242`. Does the tier update to "home" and Voice tile unlock?

> **Answer**: Pass / Fail / Blocked
> **Notes**:

#### Q11: Upgrade Home → Pro
As a Home user, upgrade to Pro via checkout. Is prorated billing applied? Does the tier change immediately? Does the video session limit increase to 15/mo?

> **Answer**: Pass / Fail / Blocked
> **Notes**:

#### Q12: Stripe Customer Portal
With an active subscription, click "Manage Billing". Does the Stripe Customer Portal open with invoices, payment method management, and cancel option?

> **Answer**: Pass / Fail / Blocked
> **Notes**:

#### Q13: Buy Single Video Credit
Purchase a single video credit ($3) through checkout. Does the `videoCredits` balance increment by 1 in the UI?

> **Answer**: Pass / Fail / Blocked
> **Notes**:

#### Q14: Payment Failure Handling
Simulate payment failure using card `4000 0000 0000 0341`. Does the subscription status go to "past_due"? Is there a warning banner in the app? Does a payment failed email arrive?

> **Answer**: Pass / Fail / Blocked
> **Notes**:

---

## 4. Camera / Mic / Media (5 questions)

#### Q15: Photo Capture — Camera Granted
In Scout chat, tap the camera button. Does the PhotoCaptureModal open with a live camera preview? Take a photo — does the AI analyze it and respond with diagnostic insights?

> **Answer**: Pass / Fail / Blocked
> **Notes**:

#### Q16: Photo Capture — Camera Denied
Deny camera permission when prompted. Does it gracefully fall back to a file upload picker? Can you select and send a photo normally?

> **Answer**: Pass / Fail / Blocked
> **Notes**:

#### Q17: Voice Mode — Mic Granted + Waveform
Select Voice mode as a Home+ user. Does the browser mic dialog appear? After granting, does a real-time waveform visualization render while speaking? Is speech transcribed and does the AI respond?

> **Answer**: Pass / Fail / Blocked
> **Notes**:

#### Q18: Voice Mode — Mic Denied
Deny mic permission in Voice mode. Does an error message appear explaining mic access is required? Is there a fallback to text chat? No crash or blank screen?

> **Answer**: Pass / Fail / Blocked
> **Notes**:

#### Q19: Video Session — Live Camera + AI Analysis
Start a Video session with camera/mic granted. Does the live camera feed display? Point the camera at something and speak — does the AI respond to both what it sees and what you say?

> **Answer**: Pass / Fail / Blocked
> **Notes**:

---

## 5. Live WebSocket Sessions (3 questions)

#### Q20: WebSocket Connection Established
Start a video session and check DevTools → Network → WS. Is there an active WebSocket connection to `/live`? Does it stay connected throughout the session?

> **Answer**: Pass / Fail / Blocked
> **Notes**:

#### Q21: Mute / Unmute Toggle
During a live video session, tap Mute. Speak while muted — does the AI stay silent? Unmute and speak — does the AI respond normally?

> **Answer**: Pass / Fail / Blocked
> **Notes**:

#### Q22: End Session — Completion Modal
End a video session after at least one exchange. Does the CaseCompletionModal appear with Download PDF and Email Report buttons? Do both buttons work (loading/success/error states)?

> **Answer**: Pass / Fail / Blocked
> **Notes**:

---

## 6. Responsive / Physical Device (4 questions)

#### Q23: Safe Area — Notched Device
On a real iPhone with a notch or Dynamic Island (or simulated), is all content clear of the notch and home indicator? No content hidden behind safe areas on any page or overlay?

> **Answer**: Pass / Fail / Blocked
> **Notes**:

#### Q24: Mobile Layout — 375px
At 375px viewport width, navigate: Homepage, Dashboard, Scout Chat, Settings, History. Single-column layout? No horizontal scrollbar? Compact tile bars (72px min-height)? Bottom dock visible?

> **Answer**: Pass / Fail / Blocked
> **Notes**:

#### Q25: Desktop Layout — 1280px
At 1280px viewport, are triage tiles large cards with `aspect-[16/10]` and desktop-only background images? Header nav visible with glow indicator? Bottom dock hidden?

> **Answer**: Pass / Fail / Blocked
> **Notes**:

#### Q26: Offline Behavior
Toggle network off (airplane mode or DevTools offline). Does the status badge change to yellow "Reconnecting..."? Does the service worker serve cached pages? Does it recover to green "Support Available" on reconnect?

> **Answer**: Pass / Fail / Blocked
> **Notes**:

---

## 7. PWA Install (2 questions)

#### Q27: Install Banner Appears
On Chrome or Edge (Android or desktop), visit the app and navigate 2+ pages. Does a bottom-anchored install banner appear with "Install" and dismiss (X) buttons? Does "Install" trigger the native install prompt?

> **Answer**: Pass / Fail / Blocked
> **Notes**:

#### Q28: Dismiss Banner — 14-Day Cooldown
Click dismiss (X) on the install banner, then refresh. Does the banner stay hidden? Check `localStorage` for key `totalassist_pwa_dismissed` — is a timestamp stored? (Banner should reappear after 14 days.)

> **Answer**: Pass / Fail / Blocked
> **Notes**:

---

## 8. Accessibility — Screen Reader & Contrast (3 questions)

#### Q29: Screen Reader Navigation
With VoiceOver (Mac/iOS) or NVDA (Windows), navigate the Dashboard. Do headings, button labels, triage tile names, and dock tab labels announce correctly? Are decorative elements silent?

> **Answer**: Pass / Fail / Blocked
> **Notes**:

#### Q30: Modal Focus Trap + Escape Close
Open any modal (e.g. UpgradeModal, PhotoCaptureModal). Press Tab repeatedly — does focus cycle within the modal only (not to elements behind it)? Press Escape — does the modal close?

> **Answer**: Pass / Fail / Blocked
> **Notes**:

#### Q31: Color Contrast — WCAG AA
Using a contrast checker (e.g. browser DevTools accessibility panel), spot-check text on Dashboard tiles, chat messages, header nav, and form labels in **both** light and dark mode. Does all text meet WCAG AA (4.5:1 for normal text, 3:1 for large text)?

> **Answer**: Pass / Fail / Blocked
> **Notes**:

---

## 9. Visual / Theme Rendering (2 questions)

#### Q32: Light Mode — Full Walkthrough
Switch to light mode and navigate: Homepage, Dashboard, Privacy Policy, Terms, Cancellation, Scout Chat, Pricing, FAQ. Any hardcoded dark colors, invisible text, or broken styling?

> **Answer**: Pass / Fail / Blocked
> **Notes**:

#### Q33: Dark Mode — Full Walkthrough
Switch to dark mode and repeat the same pages. Any white backgrounds, invisible text, broken contrast, or unstyled components?

> **Answer**: Pass / Fail / Blocked
> **Notes**:

---

## Summary

| Field | Value |
|-------|-------|
| **Total Questions** | 33 |
| **Pass Count** | /33 |
| **Fail Count** | |
| **Blocked Count** | |
| **Critical Blockers** | |
| **General Notes** | |

| **Overall Verdict** | Production Ready / Needs Fixes / Blocked |
|---|---|
