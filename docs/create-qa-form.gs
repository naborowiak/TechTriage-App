/**
 * TotalAssist Manual QA Form Generator
 *
 * Run this in Google Apps Script (script.google.com) to auto-create
 * a Google Form with all 33 manual QA test questions.
 *
 * Steps:
 *   1. Go to https://script.google.com
 *   2. Create a new project
 *   3. Paste this entire file
 *   4. Click Run → createQAForm
 *   5. Authorize when prompted
 *   6. Check your Google Drive for "TotalAssist — Manual QA Checklist"
 */

function createQAForm() {
  const form = FormApp.create("TotalAssist — Manual QA Checklist");
  form.setDescription(
    "Manual QA verification for TotalAssist production readiness.\n\n" +
    "Scope: 33 items that require a real browser, device, Stripe checkout, email inbox, or camera/mic.\n\n" +
    "App URL: https://totalassist.tech\n" +
    "Stripe Test Card: 4242 4242 4242 4242 (Exp: any future, CVC: any 3 digits)\n" +
    "Stripe Failure Card: 4000 0000 0000 0341"
  );
  form.setIsQuiz(false);
  form.setCollectEmail(true);

  // --- Header fields ---
  form.addTextItem().setTitle("Tester Name").setRequired(true);
  form.addDateItem().setTitle("Test Date").setRequired(true);
  form.addTextItem().setTitle("Browser / Device (e.g. Chrome 122 / iPhone 15 Pro)").setRequired(true);

  // --- Helper to add a test question ---
  function addQuestion(title, helpText) {
    form.addMultipleChoiceItem()
      .setTitle(title)
      .setHelpText(helpText || "")
      .setChoiceValues(["Pass", "Fail", "Blocked", "Skipped"])
      .setRequired(true);
    form.addParagraphTextItem()
      .setTitle(title + " — Notes")
      .setHelpText("Details on failures, screenshots, error messages, etc.")
      .setRequired(false);
  }

  // ===========================
  // SECTION 1: OAuth Flows
  // ===========================
  form.addSectionHeaderItem()
    .setTitle("1. OAuth Flows")
    .setHelpText("Test Google OAuth signup and login flows.");

  addQuestion(
    "Q1: Google OAuth Signup — New User",
    "Click 'Continue with Google' on /signup with a Google account not linked to TotalAssist. Does the OAuth redirect work, account get created, and user land on Dashboard?"
  );

  addQuestion(
    "Q2: Google OAuth Login — Existing User",
    "Click 'Continue with Google' on /login with an already-linked Google account. Does it log you in and skip onboarding?"
  );

  // ===========================
  // SECTION 2: Email Delivery
  // ===========================
  form.addSectionHeaderItem()
    .setTitle("2. Email Delivery")
    .setHelpText("Verify emails actually arrive. If RESEND_API_KEY is not configured, check server logs for simulation output.");

  addQuestion(
    "Q3: Verification Email Arrives",
    "After signup, does the verification email arrive from support@totalassist.tech with the 6-digit OTP in the preheader?"
  );

  addQuestion(
    "Q4: Password Reset Email Arrives",
    "After submitting the forgot-password form, does the reset email arrive with a working link that expires in 1 hour?"
  );

  addQuestion(
    "Q5: Subscription Confirmation Email",
    "After subscribing (Free → Home or Pro), does a confirmation email arrive with plan name, price, billing cycle, and renewal date?"
  );

  addQuestion(
    "Q6: Cancellation Email",
    "After canceling (declining the retention offer), does a cancellation email arrive with the access-until date and reactivation instructions?"
  );

  addQuestion(
    "Q7: Session Guide Email",
    "After ending a voice/video session and clicking 'Email Report', does the session guide email arrive?"
  );

  addQuestion(
    "Q8: Specialist Escalation Email",
    "After escalating a case, does the specialist receive an email with a working token link (/specialist/:token)?"
  );

  addQuestion(
    "Q9: Specialist Response Notification",
    "After the specialist submits a response via the token link, does the user receive a notification email?"
  );

  // ===========================
  // SECTION 3: Stripe Checkout
  // ===========================
  form.addSectionHeaderItem()
    .setTitle("3. Stripe Checkout")
    .setHelpText("Test payment flows using Stripe test cards. Success: 4242 4242 4242 4242. Failure: 4000 0000 0000 0341.");

  addQuestion(
    "Q10: Subscribe to Home Plan",
    "As a free user, click 'Subscribe' on Home. Does Stripe Checkout open? Complete with test card. Does the tier update to 'home' and Voice tile unlock?"
  );

  addQuestion(
    "Q11: Upgrade Home → Pro",
    "As a Home user, upgrade to Pro via checkout. Is prorated billing applied? Does the tier change immediately? Video limit increase to 15/mo?"
  );

  addQuestion(
    "Q12: Stripe Customer Portal",
    "With an active subscription, click 'Manage Billing'. Does the Stripe Customer Portal open with invoices and payment method management?"
  );

  addQuestion(
    "Q13: Buy Single Video Credit ($3)",
    "Purchase a single video credit through checkout. Does the videoCredits balance increment by 1 in the UI?"
  );

  addQuestion(
    "Q14: Payment Failure Handling",
    "Simulate failure with card 4000 0000 0000 0341. Does subscription go 'past_due'? Warning banner in-app? Payment failed email arrive?"
  );

  // ===========================
  // SECTION 4: Camera / Mic / Media
  // ===========================
  form.addSectionHeaderItem()
    .setTitle("4. Camera / Mic / Media")
    .setHelpText("Test browser media permissions and capture. Requires a device with camera and microphone.");

  addQuestion(
    "Q15: Photo Capture — Camera Granted",
    "In Scout chat, tap the camera button. Does PhotoCaptureModal open with live preview? Take a photo — does the AI analyze it?"
  );

  addQuestion(
    "Q16: Photo Capture — Camera Denied",
    "Deny camera permission. Does it fall back to a file upload picker? Can you select and send a photo normally?"
  );

  addQuestion(
    "Q17: Voice Mode — Mic Granted + Waveform",
    "Select Voice mode (Home+ user). Does the mic dialog appear? After granting, does a waveform render while speaking? Is speech transcribed with AI response?"
  );

  addQuestion(
    "Q18: Voice Mode — Mic Denied",
    "Deny mic permission. Does an error explain mic is required? Fallback to text chat? No crash or blank screen?"
  );

  addQuestion(
    "Q19: Video Session — Live Camera + AI",
    "Start a Video session. Does the live camera feed display? Does the AI respond to both what it sees and what you say?"
  );

  // ===========================
  // SECTION 5: Live WebSocket Sessions
  // ===========================
  form.addSectionHeaderItem()
    .setTitle("5. Live WebSocket Sessions")
    .setHelpText("Test real-time WebSocket connections for video/voice. Check DevTools → Network → WS.");

  addQuestion(
    "Q20: WebSocket Connection Established",
    "Start a video session. In DevTools Network > WS, is there an active WebSocket to /live? Does it stay connected throughout?"
  );

  addQuestion(
    "Q21: Mute / Unmute Toggle",
    "During a live video session, tap Mute. Speak while muted — AI stays silent? Unmute and speak — AI responds normally?"
  );

  addQuestion(
    "Q22: End Session — Completion Modal",
    "End a video session. Does CaseCompletionModal appear with Download PDF and Email Report buttons? Do both work?"
  );

  // ===========================
  // SECTION 6: Responsive / Physical Device
  // ===========================
  form.addSectionHeaderItem()
    .setTitle("6. Responsive / Physical Device")
    .setHelpText("Test layout at different viewport widths and on real devices.");

  addQuestion(
    "Q23: Safe Area — Notched Device",
    "On a real iPhone with notch/Dynamic Island (or simulated), is all content clear of the notch and home indicator on every page and overlay?"
  );

  addQuestion(
    "Q24: Mobile Layout — 375px",
    "At 375px width: single-column layout? No horizontal scrollbar? Compact tile bars (72px)? Bottom dock visible?"
  );

  addQuestion(
    "Q25: Desktop Layout — 1280px",
    "At 1280px: large triage cards with desktop background images? Header nav with glow indicator visible? Bottom dock hidden?"
  );

  addQuestion(
    "Q26: Offline Behavior",
    "Toggle network off. Status badge changes to yellow 'Reconnecting...'? Service worker serves cached pages? Recovers to green on reconnect?"
  );

  // ===========================
  // SECTION 7: PWA Install
  // ===========================
  form.addSectionHeaderItem()
    .setTitle("7. PWA Install")
    .setHelpText("Test Progressive Web App install banner. Chrome/Edge only — banner won't appear on Firefox/Safari.");

  addQuestion(
    "Q27: Install Banner Appears",
    "On Chrome/Edge, visit the app and navigate 2+ pages. Does a bottom-anchored install banner appear? Does 'Install' trigger the native prompt?"
  );

  addQuestion(
    "Q28: Dismiss Banner — 14-Day Cooldown",
    "Dismiss the banner, refresh. Does it stay hidden? Check localStorage key 'totalassist_pwa_dismissed' for timestamp."
  );

  // ===========================
  // SECTION 8: Accessibility
  // ===========================
  form.addSectionHeaderItem()
    .setTitle("8. Accessibility")
    .setHelpText("Test screen reader behavior, focus management, and color contrast.");

  addQuestion(
    "Q29: Screen Reader Navigation",
    "With VoiceOver or NVDA, navigate the Dashboard. Do headings, buttons, tile labels, and dock tabs announce correctly? Decorative elements silent?"
  );

  addQuestion(
    "Q30: Modal Focus Trap + Escape Close",
    "Open any modal. Tab repeatedly — focus cycles within modal only? Escape closes it? overflow:hidden on body while open?"
  );

  addQuestion(
    "Q31: Color Contrast — WCAG AA",
    "Using a contrast checker, spot-check text on tiles, chat, header, forms in both light and dark mode. All text meets 4.5:1 (normal) / 3:1 (large)?"
  );

  // ===========================
  // SECTION 9: Theme Rendering
  // ===========================
  form.addSectionHeaderItem()
    .setTitle("9. Visual / Theme Rendering")
    .setHelpText("Full walkthrough in both themes to catch hardcoded colors or broken styling.");

  addQuestion(
    "Q32: Light Mode — Full Walkthrough",
    "In light mode, navigate: Homepage, Dashboard, Privacy, Terms, Cancellation, Scout Chat, Pricing, FAQ. Any hardcoded dark colors or broken styling?"
  );

  addQuestion(
    "Q33: Dark Mode — Full Walkthrough",
    "In dark mode, repeat same pages. Any white backgrounds, invisible text, broken contrast, or unstyled components?"
  );

  // ===========================
  // SUMMARY
  // ===========================
  form.addSectionHeaderItem()
    .setTitle("Summary")
    .setHelpText("Overall assessment.");

  form.addMultipleChoiceItem()
    .setTitle("Overall Verdict")
    .setChoiceValues(["Production Ready", "Needs Fixes", "Blocked"])
    .setRequired(true);

  form.addTextItem()
    .setTitle("Total Pass Count (out of 33)")
    .setRequired(true);

  form.addTextItem()
    .setTitle("Total Fail Count")
    .setRequired(false);

  form.addTextItem()
    .setTitle("Total Blocked Count")
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle("Critical Blockers (if any)")
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle("General Notes / Observations")
    .setRequired(false);

  // Log the form URL
  Logger.log("Form created: " + form.getEditUrl());
  Logger.log("Shareable link: " + form.getPublishedUrl());
}
