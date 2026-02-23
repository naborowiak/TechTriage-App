import { Resend } from "resend";

// Initialize Resend with API Key
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Base URL for images and app
const IMAGE_BASE_URL = "https://totalassist.tech";
const APP_BASE_URL = process.env.APP_URL || "https://totalassist.tech";

// Default sender - use your verified domain
const DEFAULT_SENDER = "support@totalassist.tech";
const EMAIL_FROM = process.env.EMAIL_FROM || `TotalAssist <${DEFAULT_SENDER}>`;

// Timezone for email date/time formatting (US Central)
const EMAIL_TIMEZONE = "America/Chicago";

// Resend's default test sender (works without domain verification)
const RESEND_TEST_SENDER = "onboarding@resend.dev";

// ============================================
// TotalAssist Brand Colors
// ============================================
const BRAND = {
  scoutPurple: "#A855F7",
  electricIndigo: "#6366F1",
  electricCyan: "#06B6D4",
  midnight: "#0f172a",
  midnightLight: "#1e293b",
  slate: "#334155",
  slateLight: "#64748b",
  light: "#f8fafc",
  lightMuted: "#e2e8f0",
  white: "#ffffff",
};

// ============================================
// Email Template Components
// ============================================

function getEmailStyles(): string {
  return `
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }
    table { border-collapse: collapse !important; border-spacing: 0; }
    td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; display: block; }
    a { text-decoration: none; }

    /* Better typography baseline - fixes cramped text */
    body, td, p, a, li { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; line-height: 1.4; }
    p { margin: 0; }

    /* Mobile styles */
    @media only screen and (max-width: 599px) {
      .mobile-full { width: 100% !important; max-width: 100% !important; display: block !important; }
      .mobile-padding { padding: 30px 20px !important; }
      .mobile-center { text-align: center !important; }
      .hero-text { font-size: 30px !important; line-height: 1.15 !important; }
      .content-padding { padding: 30px 24px !important; }
      .button-full { display: block !important; width: 100% !important; text-align: center !important; }
    }

    /* Dark mode styles */
    @media (prefers-color-scheme: dark) {
      body, .body-bg { background-color: ${BRAND.midnight} !important; }
      .email-container { background-color: ${BRAND.midnightLight} !important; }
      .light-section { background-color: ${BRAND.midnightLight} !important; }
      .light-text { color: #e2e8f0 !important; }
      .light-text-secondary { color: #94a3b8 !important; }
      .card-bg { background-color: #334155 !important; border-color: #475569 !important; }
    }

    /* Gmail dark mode */
    [data-ogsc] .light-section { background-color: ${BRAND.midnightLight} !important; }
    [data-ogsc] .light-text { color: #e2e8f0 !important; }
    [data-ogsc] .light-text-secondary { color: #94a3b8 !important; }
    [data-ogsc] .card-bg { background-color: #334155 !important; }
  `;
}

// Preheader helper - improves inbox preview text
function getPreheaderHtml(text: string): string {
  const safe = (text || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${safe}
    </div>
    <div style="display:none;max-height:0;overflow:hidden;">
      ${"&nbsp;".repeat(200)}
    </div>
  `;
}

function getHeaderHtml(title: string, subtitle: string): string {
  return `
    <tr>
      <!--[if mso]>
      <td align="center" bgcolor="${BRAND.electricIndigo}" style="padding: 50px 30px;">
      <![endif]-->
      <!--[if !mso]><!-->
      <td align="center" bgcolor="${BRAND.electricIndigo}" style="background-color: ${BRAND.electricIndigo}; background: linear-gradient(135deg, ${BRAND.electricIndigo} 0%, ${BRAND.electricCyan} 50%, ${BRAND.midnight} 100%); padding: 50px 30px;">
      <!--<![endif]-->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center" style="padding-bottom: 25px;">
              <img src="${IMAGE_BASE_URL}/total_assist-new-white.png" alt="TotalAssist" width="160" style="display: block; max-width: 160px; height: auto;">
            </td>
          </tr>
          <tr>
            <td align="center">
              <h1 class="hero-text" style="margin: 0; color: #ffffff; font-size: 36px; font-weight: 700; letter-spacing: -0.5px;">${title}</h1>
              <p style="margin: 15px 0 0; color: rgba(255,255,255,0.95); font-size: 17px; font-weight: 500;">${subtitle}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

function getFooterHtml(): string {
  return `
    <tr>
      <td align="center" style="background-color: ${BRAND.midnight}; padding: 40px 30px; border-top: 1px solid #334155;">
        <img src="${IMAGE_BASE_URL}/total_assist-new.png" alt="TotalAssist" width="100" style="display: block; max-width: 100px; height: auto; margin-bottom: 20px; opacity: 0.9;">

        <p style="margin: 0 0 8px; color: #64748b; font-size: 13px;">
          Powered by TotalAssist
        </p>

        <p style="color: #475569; font-size: 12px; margin: 0 0 15px;">
          &copy; ${new Date().getFullYear()} Smart Tek Labs. All rights reserved.
        </p>

        <p style="margin: 0;">
          <a href="${APP_BASE_URL}/privacy" style="color: ${BRAND.electricIndigo}; text-decoration: none; font-size: 12px; margin: 0 12px;">Privacy Policy</a>
          <span style="color: #475569;">|</span>
          <a href="${APP_BASE_URL}/terms" style="color: ${BRAND.electricIndigo}; text-decoration: none; font-size: 12px; margin: 0 12px;">Terms of Service</a>
        </p>
      </td>
    </tr>
  `;
}

function getPrimaryButtonHtml(text: string, url: string): string {
  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
      <tr>
        <!--[if mso]>
        <td align="center" bgcolor="${BRAND.electricIndigo}" style="border-radius: 12px; mso-padding-alt: 18px 40px;">
          <a href="${url}" target="_blank" style="display: inline-block; padding: 18px 40px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">${text} &rarr;</a>
        </td>
        <![endif]-->
        <!--[if !mso]><!-->
        <td align="center" bgcolor="${BRAND.electricIndigo}" style="border-radius: 12px; background-color: ${BRAND.electricIndigo}; background: linear-gradient(135deg, ${BRAND.electricIndigo} 0%, ${BRAND.electricCyan} 100%); box-shadow: 0 10px 30px rgba(99, 102, 241, 0.35);">
          <a href="${url}" target="_blank" class="button-full" style="display: inline-block; padding: 18px 40px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; letter-spacing: 0.3px;">${text} &rarr;</a>
        </td>
        <!--<![endif]-->
      </tr>
    </table>
  `;
}

// ============================================
// Plain Text Email Generators
// ============================================

function getWelcomeEmailText(firstName: string): string {
  const displayName = firstName || "there";
  return `Welcome to TotalAssist!

Hey ${displayName},

Welcome to TotalAssist! You now have access to expert tech support that actually understands your problems.

No more waiting on hold, no more explaining the same issue three times, no more frustration. Just smart, fast help whenever you need it.

What you can do:
- Support Chat: Get instant answers to tech questions
- Photo Analysis: Snap a photo, get a diagnosis
- Session History: All solutions saved for you

Ready to solve your first tech problem?
Open TotalAssist and describe what's going on.

Launch TotalAssist: ${APP_BASE_URL}/dashboard

---
Powered by TotalAssist
(c) ${new Date().getFullYear()} Smart Tek Labs. All rights reserved.
Privacy Policy: ${APP_BASE_URL}/privacy
Terms of Service: ${APP_BASE_URL}/terms`;
}

function getVerificationEmailText(firstName: string, code: string): string {
  const displayName = firstName || "there";
  return `Your TotalAssist Verification Code

Hey ${displayName},

Thanks for signing up for TotalAssist! Your verification code is:

${code}

Enter this code in the app to activate your account and start getting expert tech support.

This code will expire in 30 minutes. If you didn't create an account, you can safely ignore this email.

Security Notice:
We'll never ask for your password via email. If you didn't request this verification, please ignore this message.

---
Powered by TotalAssist
(c) ${new Date().getFullYear()} Smart Tek Labs. All rights reserved.
Privacy Policy: ${APP_BASE_URL}/privacy
Terms of Service: ${APP_BASE_URL}/terms`;
}

function getPasswordResetEmailText(displayName: string, resetUrl: string): string {
  return `Reset Your Password - TotalAssist

Hi ${displayName},

We received a request to reset your password for your TotalAssist account. This link will expire in 1 hour for security reasons.

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

Reset Your Password: ${resetUrl}

Password Tips:
- Use at least 8 characters with a mix of letters, numbers, and symbols
- Avoid using the same password across multiple sites
- Consider using a password manager for better security

---
Powered by TotalAssist
(c) ${new Date().getFullYear()} Smart Tek Labs. All rights reserved.
Privacy Policy: ${APP_BASE_URL}/privacy
Terms of Service: ${APP_BASE_URL}/terms`;
}

function getTrialEndingEmailText(firstName: string, daysRemaining: number, trialEndDate: Date): string {
  const displayName = firstName || "there";
  const formattedDate = trialEndDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: EMAIL_TIMEZONE,
  });
  const urgencyText = daysRemaining === 1
    ? 'Your trial ends tomorrow!'
    : `Your trial ends in ${daysRemaining} days`;

  return `${urgencyText} - TotalAssist

Hey ${displayName},

Your free trial of TotalAssist is coming to an end. Trial expires on ${formattedDate}.

To continue enjoying unlimited tech support, upgrade your plan before the trial expires.

What you'll lose without a subscription:
- Unlimited support chat sessions
- Photo analysis for instant diagnostics
- Your saved session history

As a thank you for trying TotalAssist, your first billing cycle will be discounted when you subscribe today!

Upgrade Now: ${APP_BASE_URL}/pricing

Plans start at just $9.99/month.

---
Powered by TotalAssist
(c) ${new Date().getFullYear()} Smart Tek Labs. All rights reserved.
Privacy Policy: ${APP_BASE_URL}/privacy
Terms of Service: ${APP_BASE_URL}/terms`;
}

function getSessionGuideEmailText(userName: string, summary: string, sessionDate: Date): string {
  const displayName = userName || "there";
  const formattedDate = sessionDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: EMAIL_TIMEZONE,
  });

  return `Your TotalAssist Session Guide - ${formattedDate}

Hey ${displayName},

Thank you for using TotalAssist! We've put together a personalized guide based on your recent support session.

Session Summary:
${summary || "Session completed successfully"}

Your complete how-to guide is attached as a PDF. It includes:
- Step-by-step instructions we discussed
- Full conversation transcript
- Key troubleshooting tips and next steps

Save this guide for future reference - it's tailored specifically to your situation!

Need More Help? ${APP_BASE_URL}/dashboard

---
Powered by TotalAssist
(c) ${new Date().getFullYear()} Smart Tek Labs. All rights reserved.
Privacy Policy: ${APP_BASE_URL}/privacy
Terms of Service: ${APP_BASE_URL}/terms`;
}

// ============================================
// Welcome Email Template
// ============================================

function getWelcomeEmailHtml(firstName: string): string {
  const displayName = firstName || "there";

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>Welcome to TotalAssist</title>
    <style>${getEmailStyles()}</style>
</head>
<body class="body-bg" style="margin: 0; padding: 0; background-color: ${BRAND.light};">

    ${getPreheaderHtml(`Welcome ${displayName}! Your tech support is ready. Get instant help with chat and photo analysis.`)}

    <center style="width: 100%; background-color: ${BRAND.light}; padding: 40px 0;" class="body-bg">
        <!--[if mso]>
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center">
        <tr><td>
        <![endif]-->

        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

            ${getHeaderHtml("Welcome to TotalAssist", "Your tech support is ready.")}

            <!-- Hero Image Section -->
            <tr>
              <td align="center" class="light-section" bgcolor="#ffffff" style="border-bottom: 3px solid ${BRAND.electricIndigo};">
                <img src="${IMAGE_BASE_URL}/homepage-hero.jpg" alt="TotalAssist Home Support" width="600" style="display: block; width: 100%; max-width: 600px; height: auto;">
              </td>
            </tr>

            <!-- Welcome Content -->
            <tr>
                <td align="left" class="light-section content-padding" style="background-color: #ffffff; padding: 45px 40px;">
                    <p class="light-text" style="margin: 0 0 20px; color: ${BRAND.slate}; font-size: 18px; line-height: 1.6;">
                        Hey <strong style="color: ${BRAND.midnight};">${displayName}</strong>,
                    </p>
                    <p class="light-text-secondary" style="margin: 0 0 25px; color: ${BRAND.slateLight}; font-size: 16px; line-height: 1.75;">
                        Welcome to <strong style="color: ${BRAND.scoutPurple};">TotalAssist</strong>! You now have access to expert tech support that actually understands your problems.
                    </p>
                    <p class="light-text-secondary" style="margin: 0; color: ${BRAND.slateLight}; font-size: 16px; line-height: 1.75;">
                        No more waiting on hold, no more explaining the same issue three times, no more frustration. Just smart, fast help whenever you need it.
                    </p>
                </td>
            </tr>

            <!-- Features Grid -->
            <tr>
                <td class="light-section content-padding" style="background-color: ${BRAND.light}; padding: 35px 40px;">
                    <p style="margin: 0 0 25px; color: ${BRAND.slate}; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">What you can do</p>

                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                            <td style="padding-bottom: 20px;">
                                <a href="${APP_BASE_URL}/services/chat" style="text-decoration: none; display: block;">
                                <table border="0" cellpadding="0" cellspacing="0" width="100%" class="card-bg" style="background: #ffffff; border-radius: 12px; border: 1px solid ${BRAND.lightMuted}; overflow: hidden;">
                                    <tr>
                                        <td style="padding: 0;">
                                            <img src="${IMAGE_BASE_URL}/chat-support.png" alt="Support Chat" style="width: 100%; max-width: 100%; height: auto; display: block; border-radius: 12px 12px 0 0;" />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 14px 16px;">
                                            <p style="margin: 0 0 4px; color: ${BRAND.midnight}; font-size: 14px; font-weight: 600;">Support Chat</p>
                                            <p style="margin: 0; color: ${BRAND.slateLight}; font-size: 13px; line-height: 1.5;">Get instant answers to tech questions</p>
                                        </td>
                                    </tr>
                                </table>
                                </a>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding-bottom: 20px;">
                                <a href="${APP_BASE_URL}/services/photo" style="text-decoration: none; display: block;">
                                <table border="0" cellpadding="0" cellspacing="0" width="100%" class="card-bg" style="background: #ffffff; border-radius: 12px; border: 1px solid ${BRAND.lightMuted}; overflow: hidden;">
                                    <tr>
                                        <td style="padding: 0;">
                                            <img src="${IMAGE_BASE_URL}/photo-analysis.png" alt="Photo Analysis" style="width: 100%; max-width: 100%; height: auto; display: block; border-radius: 12px 12px 0 0;" />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 14px 16px;">
                                            <p style="margin: 0 0 4px; color: ${BRAND.midnight}; font-size: 14px; font-weight: 600;">Photo Analysis</p>
                                            <p style="margin: 0; color: ${BRAND.slateLight}; font-size: 13px; line-height: 1.5;">Snap a photo, get a diagnosis</p>
                                        </td>
                                    </tr>
                                </table>
                                </a>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <a href="${APP_BASE_URL}/dashboard" style="text-decoration: none; display: block;">
                                <table border="0" cellpadding="0" cellspacing="0" width="100%" class="card-bg" style="background: #ffffff; border-radius: 12px; border: 1px solid ${BRAND.lightMuted}; overflow: hidden;">
                                    <tr>
                                        <td style="padding: 0;">
                                            <img src="${IMAGE_BASE_URL}/session-history.png" alt="Session History" style="width: 100%; max-width: 100%; height: auto; display: block; border-radius: 12px 12px 0 0;" />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 14px 16px;">
                                            <p style="margin: 0 0 4px; color: ${BRAND.midnight}; font-size: 14px; font-weight: 600;">Session History</p>
                                            <p style="margin: 0; color: ${BRAND.slateLight}; font-size: 13px; line-height: 1.5;">All solutions saved for you</p>
                                        </td>
                                    </tr>
                                </table>
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <!-- CTA Section -->
            <tr>
                <td align="center" style="background: linear-gradient(135deg, ${BRAND.midnight} 0%, ${BRAND.midnightLight} 100%); padding: 50px 30px;">
                    <div style="display: inline-block; background: linear-gradient(135deg, ${BRAND.electricIndigo}, ${BRAND.electricCyan}); color: #ffffff; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; padding: 6px 14px; border-radius: 20px; margin-bottom: 20px;">
                        Get Started
                    </div>

                    <h2 style="margin: 0 0 15px; color: #ffffff; font-size: 26px; font-weight: 700; line-height: 1.3;">Ready to solve your first<br>tech problem?</h2>

                    <p style="margin: 0 0 30px; color: #94a3b8; font-size: 15px; line-height: 1.6;">
                        Open TotalAssist and describe what's going on.
                    </p>

                    ${getPrimaryButtonHtml("Launch TotalAssist", APP_BASE_URL + "/dashboard")}

                    <p style="margin: 25px 0 0; color: #64748b; font-size: 13px;">
                        Takes less than 30 seconds to get help
                    </p>
                </td>
            </tr>

            <!-- Value Proposition -->
            <tr>
                <td class="light-section content-padding" style="background-color: #ffffff; padding: 40px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" class="card-bg" style="background: linear-gradient(135deg, ${BRAND.electricIndigo}08, ${BRAND.electricCyan}08); border-radius: 16px; border: 1px solid ${BRAND.electricIndigo}20;">
                        <tr>
                            <td align="center" style="padding: 35px 30px;">
                                <div style="width: 56px; height: 56px; background: linear-gradient(135deg, ${BRAND.electricIndigo}, ${BRAND.electricCyan}); border-radius: 50%; text-align: center; line-height: 56px; margin: 0 auto 20px; font-size: 26px;">🏠</div>
                                <p class="light-text" style="margin: 0 0 12px; color: ${BRAND.midnight}; font-size: 22px; font-weight: 700; letter-spacing: -0.3px;">Your Home Tech, Handled.</p>
                                <p class="light-text-secondary" style="margin: 0; color: ${BRAND.slateLight}; font-size: 15px; line-height: 1.7; max-width: 400px;">
                                    From Wi-Fi trouble to smart home setup, TotalAssist gives you expert-level answers in minutes &mdash; no technician visit required.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            ${getFooterHtml()}

        </table>

        <!--[if mso]>
        </td></tr>
        </table>
        <![endif]-->
    </center>
</body>
</html>`;
}

// ============================================
// Verification Email Template
// ============================================

function getVerificationEmailHtml(firstName: string, code: string): string {
  const displayName = firstName || "there";

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>Your TotalAssist Verification Code</title>
    <style>${getEmailStyles()}</style>
</head>
<body class="body-bg" style="margin: 0; padding: 0; background-color: ${BRAND.light};">

    ${getPreheaderHtml(`Hi ${displayName}! Your TotalAssist verification code is ${code}. It expires in 30 minutes.`)}

    <center style="width: 100%; background-color: ${BRAND.light}; padding: 40px 0;" class="body-bg">
        <!--[if mso]>
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center">
        <tr><td>
        <![endif]-->

        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

            ${getHeaderHtml("Verify Your Email", "One quick step to get started.")}

            <!-- Content Section -->
            <tr>
                <td align="left" class="light-section content-padding" style="background-color: #ffffff; padding: 45px 40px;">
                    <p class="light-text" style="margin: 0 0 20px; color: ${BRAND.slate}; font-size: 18px; line-height: 1.6;">
                        Hey <strong style="color: ${BRAND.midnight};">${displayName}</strong>,
                    </p>
                    <p class="light-text-secondary" style="margin: 0 0 25px; color: ${BRAND.slateLight}; font-size: 16px; line-height: 1.75;">
                        Thanks for signing up for <strong style="color: ${BRAND.scoutPurple};">TotalAssist</strong>! Enter the code below in the app to verify your email and activate your account.
                    </p>
                    <p class="light-text-secondary" style="margin: 0; color: ${BRAND.slateLight}; font-size: 14px; line-height: 1.6;">
                        This code will expire in <strong style="color: ${BRAND.midnight};">30 minutes</strong>. If you didn't create an account, you can safely ignore this email.
                    </p>
                </td>
            </tr>

            <!-- Code Display Section -->
            <tr>
                <td align="center" style="background-color: ${BRAND.light}; padding: 10px 40px 40px;">
                    <p style="margin: 0 0 16px; color: ${BRAND.slate}; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
                        Your verification code
                    </p>

                    <!-- Single copyable code block -->
                    <div style="background-color: ${BRAND.midnight}; border-radius: 12px; padding: 20px 32px; display: inline-block;">
                        <span style="font-size: 36px; font-weight: 700; color: #ffffff; font-family: 'Courier New', Courier, monospace; letter-spacing: 12px; user-select: all; -webkit-user-select: all; -moz-user-select: all;">${code}</span>
                    </div>

                    <p style="margin: 16px 0 0; color: ${BRAND.slateLight}; font-size: 13px; line-height: 1.6;">
                        Double-click the code to select it, then copy and paste in the app.
                    </p>
                </td>
            </tr>

            <!-- Security Notice -->
            <tr>
                <td class="light-section content-padding" style="background-color: ${BRAND.light}; padding: 30px 40px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                            <td width="50" valign="top">
                                <div style="width: 40px; height: 40px; background: ${BRAND.electricCyan}15; border-radius: 10px; text-align: center; line-height: 40px; font-size: 18px;">🔒</div>
                            </td>
                            <td valign="top">
                                <p class="light-text" style="margin: 0 0 5px; color: ${BRAND.midnight}; font-size: 14px; font-weight: 600;">Security Notice</p>
                                <p class="light-text-secondary" style="margin: 0; color: ${BRAND.slateLight}; font-size: 13px; line-height: 1.5;">
                                    We'll never ask for your password via email. If you didn't request this verification, please ignore this message.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            ${getFooterHtml()}

        </table>

        <!--[if mso]>
        </td></tr>
        </table>
        <![endif]-->
    </center>
</body>
</html>`;
}

// ============================================
// Password Reset Email Template
// ============================================

function getPasswordResetEmailHtml(displayName: string, resetUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>Reset Your Password - TotalAssist</title>
    <style>${getEmailStyles()}</style>
</head>
<body class="body-bg" style="margin: 0; padding: 0; background-color: ${BRAND.light};">

    ${getPreheaderHtml(`Hi ${displayName}, click to reset your TotalAssist password. This link expires in 1 hour. Ignore if you didn't request this.`)}

    <center style="width: 100%; background-color: ${BRAND.light}; padding: 40px 0;" class="body-bg">
        <!--[if mso]>
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center">
        <tr><td>
        <![endif]-->

        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

            ${getHeaderHtml("Reset Your Password", "We received a request to reset your password.")}

            <!-- Content Section -->
            <tr>
                <td align="left" class="light-section content-padding" style="background-color: #ffffff; padding: 45px 40px;">
                    <p class="light-text" style="margin: 0 0 20px; color: ${BRAND.slate}; font-size: 18px; line-height: 1.6;">
                        Hi <strong style="color: ${BRAND.midnight};">${displayName}</strong>,
                    </p>
                    <p class="light-text-secondary" style="margin: 0 0 25px; color: ${BRAND.slateLight}; font-size: 16px; line-height: 1.75;">
                        Click the button below to reset your password for your <strong style="color: ${BRAND.scoutPurple};">TotalAssist</strong> account. This link will expire in <strong style="color: ${BRAND.midnight};">1 hour</strong> for security reasons.
                    </p>
                    <p class="light-text-secondary" style="margin: 0; color: ${BRAND.slateLight}; font-size: 14px; line-height: 1.6;">
                        If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                    </p>
                </td>
            </tr>

            <!-- CTA Section -->
            <tr>
                <td align="center" style="background: linear-gradient(135deg, ${BRAND.midnight} 0%, ${BRAND.midnightLight} 100%); padding: 50px 30px;">

                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 25px;">
                      <tr>
                        <td align="center" valign="middle" width="70" height="70" style="width: 70px; height: 70px; background: linear-gradient(135deg, ${BRAND.electricIndigo}, ${BRAND.electricCyan}); border-radius: 50%; font-size: 32px; box-shadow: 0 15px 35px rgba(99, 102, 241, 0.4);">
                          🔑
                        </td>
                      </tr>
                    </table>

                    ${getPrimaryButtonHtml("Reset Password", resetUrl)}

                    <p style="margin: 30px 0 0; color: #64748b; font-size: 13px; line-height: 1.6;">
                        Or copy and paste this link into your browser:
                    </p>
                    <p style="margin: 10px 0 0; color: ${BRAND.electricIndigo}; font-size: 12px; word-break: break-all; max-width: 400px;">
                        ${resetUrl}
                    </p>
                </td>
            </tr>

            <!-- Security Tips -->
            <tr>
                <td class="light-section content-padding" style="background-color: ${BRAND.light}; padding: 35px 40px;">
                    <p style="margin: 0 0 20px; color: ${BRAND.slate}; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Password Tips</p>

                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                            <td width="30" valign="top" style="padding-right: 12px; padding-bottom: 15px;">
                                <span style="color: ${BRAND.scoutPurple}; font-size: 16px;">✓</span>
                            </td>
                            <td valign="top" style="padding-bottom: 15px;">
                                <p class="light-text-secondary" style="margin: 0; color: ${BRAND.slateLight}; font-size: 14px; line-height: 1.5;">Use at least 8 characters with a mix of letters, numbers, and symbols</p>
                            </td>
                        </tr>
                        <tr>
                            <td width="30" valign="top" style="padding-right: 12px; padding-bottom: 15px;">
                                <span style="color: ${BRAND.scoutPurple}; font-size: 16px;">✓</span>
                            </td>
                            <td valign="top" style="padding-bottom: 15px;">
                                <p class="light-text-secondary" style="margin: 0; color: ${BRAND.slateLight}; font-size: 14px; line-height: 1.5;">Avoid using the same password across multiple sites</p>
                            </td>
                        </tr>
                        <tr>
                            <td width="30" valign="top" style="padding-right: 12px;">
                                <span style="color: ${BRAND.scoutPurple}; font-size: 16px;">✓</span>
                            </td>
                            <td valign="top">
                                <p class="light-text-secondary" style="margin: 0; color: ${BRAND.slateLight}; font-size: 14px; line-height: 1.5;">Consider using a password manager for better security</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            ${getFooterHtml()}

        </table>

        <!--[if mso]>
        </td></tr>
        </table>
        <![endif]-->
    </center>
</body>
</html>`;
}

// ============================================
// Trial Ending Email Template
// ============================================

function getTrialEndingEmailHtml(firstName: string, daysRemaining: number, trialEndDate: Date): string {
  const displayName = firstName || "there";
  const formattedDate = trialEndDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: EMAIL_TIMEZONE,
  });

  const urgencyColor = daysRemaining === 1 ? '#ef4444' : BRAND.electricCyan;
  const urgencyBg = daysRemaining === 1 ? '#fef2f2' : `${BRAND.electricCyan}15`;
  const urgencyText = daysRemaining === 1
    ? 'Your trial ends tomorrow!'
    : `Your trial ends in ${daysRemaining} days`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>Your TotalAssist Trial is Ending Soon</title>
    <style>${getEmailStyles()}</style>
</head>
<body class="body-bg" style="margin: 0; padding: 0; background-color: ${BRAND.light};">

    ${getPreheaderHtml(`${urgencyText} - Upgrade now to keep unlimited tech support. Plans start at $9.99/month.`)}

    <center style="width: 100%; background-color: ${BRAND.light}; padding: 40px 0;" class="body-bg">
        <!--[if mso]>
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center">
        <tr><td>
        <![endif]-->

        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

            ${getHeaderHtml("Your Trial is Ending Soon", "Don't lose access to TotalAssist")}

            <!-- Urgency Banner -->
            <tr>
              <td align="center" style="background-color: ${urgencyBg}; padding: 20px 30px;">
                <table border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-right: 12px;" valign="middle">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" valign="middle" width="44" height="44" style="width: 44px; height: 44px; background: ${urgencyColor}; border-radius: 50%; font-size: 20px;">⏰</td>
                        </tr>
                      </table>
                    </td>
                    <td>
                      <p style="margin: 0; color: ${urgencyColor}; font-size: 18px; font-weight: 700;">${urgencyText}</p>
                      <p style="margin: 4px 0 0; color: ${BRAND.slate}; font-size: 14px;">Trial expires on ${formattedDate}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Hero Image -->
            <tr>
                <td style="padding: 0; line-height: 0;">
                    <img src="${IMAGE_BASE_URL}/family-time.png" alt="Family enjoying their home" width="600" style="display: block; width: 100%; max-width: 600px; height: auto; border-bottom: 3px solid ${BRAND.electricIndigo};">
                </td>
            </tr>

            <!-- Content Section -->
            <tr>
                <td align="left" class="light-section content-padding" style="background-color: #ffffff; padding: 45px 40px;">
                    <p class="light-text" style="margin: 0 0 20px; color: ${BRAND.slate}; font-size: 18px; line-height: 1.6;">
                        Hey <strong style="color: ${BRAND.midnight};">${displayName}</strong>,
                    </p>
                    <p class="light-text-secondary" style="margin: 0 0 25px; color: ${BRAND.slateLight}; font-size: 16px; line-height: 1.75;">
                        Your free trial of <strong style="color: ${BRAND.scoutPurple};">TotalAssist</strong> is coming to an end. To continue enjoying unlimited tech support, upgrade your plan before the trial expires.
                    </p>
                    <p class="light-text-secondary" style="margin: 0; color: ${BRAND.slateLight}; font-size: 16px; line-height: 1.75;">
                        As a thank you for trying TotalAssist, your first billing cycle will be discounted when you subscribe today!
                    </p>
                </td>
            </tr>

            <!-- What You'll Lose Section -->
            <tr>
                <td class="light-section content-padding" style="background-color: ${BRAND.light}; padding: 35px 40px;">
                    <p style="margin: 0 0 20px; color: ${BRAND.slate}; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">What you'll lose without a subscription</p>

                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                            <td width="30" valign="top" style="padding-right: 12px; padding-bottom: 12px;">
                                <span style="color: #ef4444; font-size: 16px;">✗</span>
                            </td>
                            <td valign="top" style="padding-bottom: 12px;">
                                <p class="light-text-secondary" style="margin: 0; color: ${BRAND.slateLight}; font-size: 14px; line-height: 1.5;">Unlimited support chat sessions</p>
                            </td>
                        </tr>
                        <tr>
                            <td width="30" valign="top" style="padding-right: 12px; padding-bottom: 12px;">
                                <span style="color: #ef4444; font-size: 16px;">✗</span>
                            </td>
                            <td valign="top" style="padding-bottom: 12px;">
                                <p class="light-text-secondary" style="margin: 0; color: ${BRAND.slateLight}; font-size: 14px; line-height: 1.5;">Photo analysis for instant diagnostics</p>
                            </td>
                        </tr>
                        <tr>
                            <td width="30" valign="top" style="padding-right: 12px;">
                                <span style="color: #ef4444; font-size: 16px;">✗</span>
                            </td>
                            <td valign="top">
                                <p class="light-text-secondary" style="margin: 0; color: ${BRAND.slateLight}; font-size: 14px; line-height: 1.5;">Your saved session history</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <!-- CTA Section -->
            <tr>
                <td align="center" style="background: linear-gradient(135deg, ${BRAND.midnight} 0%, ${BRAND.midnightLight} 100%); padding: 50px 30px;">
                    <div style="display: inline-block; background: linear-gradient(135deg, ${BRAND.electricIndigo}, ${BRAND.electricCyan}); color: #ffffff; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; padding: 6px 14px; border-radius: 20px; margin-bottom: 20px;">
                        Limited Time Offer
                    </div>

                    <h2 style="margin: 0 0 15px; color: #ffffff; font-size: 26px; font-weight: 700; line-height: 1.3;">Keep your access to<br>TotalAssist</h2>

                    <p style="margin: 0 0 30px; color: #94a3b8; font-size: 15px; line-height: 1.6;">
                        Subscribe now and lock in your trial benefits.
                    </p>

                    ${getPrimaryButtonHtml("Upgrade Now", APP_BASE_URL + "/pricing")}

                    <p style="margin: 25px 0 0; color: #64748b; font-size: 13px;">
                        Plans start at just $9.99/month
                    </p>
                </td>
            </tr>

            ${getFooterHtml()}

        </table>

        <!--[if mso]>
        </td></tr>
        </table>
        <![endif]-->
    </center>
</body>
</html>`;
}

// Send trial ending notification email
export async function sendTrialEndingEmail(
  email: string,
  firstName: string | undefined,
  daysRemaining: number,
  trialEndDate: Date
): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  console.log(`[EMAIL] Sending trial ending email to ${email} (${daysRemaining} days remaining)`);

  if (!resend) {
    console.log("[EMAIL] No RESEND_API_KEY found - Simulation Mode");
    console.log(`[EMAIL] To: ${email}`);
    console.log(`[EMAIL] Days remaining: ${daysRemaining}`);
    console.log(`[EMAIL] Trial ends: ${trialEndDate.toISOString()}`);
    return { success: true, simulated: true };
  }

  try {
    const subject = daysRemaining === 1
      ? "Your TotalAssist trial ends tomorrow!"
      : `Your TotalAssist trial ends in ${daysRemaining} days`;

    const data = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject,
      html: getTrialEndingEmailHtml(firstName || "", daysRemaining, trialEndDate),
      text: getTrialEndingEmailText(firstName || "", daysRemaining, trialEndDate),
    });

    if (data.error) {
      console.error("[EMAIL] Resend API Error:", data.error);
      return { success: false, error: data.error.message };
    }

    console.log("[EMAIL] Trial ending email sent via Resend:", data.data?.id);
    return { success: true };
  } catch (error) {
    console.error("[EMAIL] Failed to send trial ending email:", error);
    return { success: false, error: String(error) };
  }
}

// ============================================
// Email Sending Functions
// ============================================

// Test function to verify API key works (uses Resend's default sender)
export async function sendTestEmailWithResendDomain(
  toEmail: string
): Promise<{ success: boolean; error?: string; note?: string }> {
  if (!resend) {
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    const data = await resend.emails.send({
      from: RESEND_TEST_SENDER,
      to: toEmail,
      subject: "Test Email - TotalAssist API Key Verification",
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: ${BRAND.light};">
  <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, ${BRAND.electricIndigo}, ${BRAND.electricCyan}); padding: 30px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 24px;">API Key Verified!</h1>
    </div>
    <div style="padding: 30px;">
      <p style="margin: 0 0 15px; color: ${BRAND.slate}; font-size: 16px; line-height: 1.6;">
        Your Resend API key is working correctly.
      </p>
      <p style="margin: 0; color: ${BRAND.slateLight}; font-size: 14px; line-height: 1.6;">
        To send emails from your custom domain, make sure <strong>totalassist.tech</strong> is fully verified in your Resend dashboard.
      </p>
    </div>
  </div>
</body>
</html>`,
    });

    if (data.error) {
      return { success: false, error: data.error.message };
    }

    return {
      success: true,
      note: "Email sent using Resend's test domain. Your API key is valid. Now verify your custom domain (totalassist.tech) is fully verified in Resend dashboard.",
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// Send welcome email to a new user
export async function sendWelcomeEmail(
  email: string,
  firstName?: string
): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  console.log(`[EMAIL] Sending welcome email to ${email}`);

  if (!resend) {
    console.log("[EMAIL] No RESEND_API_KEY found - Simulation Mode");
    console.log("[EMAIL] Simulated welcome email send to:", email);
    return { success: true, simulated: true };
  }

  try {
    const data = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: "Welcome to TotalAssist - Your Tech Support is Ready!",
      html: getWelcomeEmailHtml(firstName || ""),
      text: getWelcomeEmailText(firstName || ""),
    });

    if (data.error) {
      console.error("[EMAIL] Resend API Error:", data.error);
      return { success: false, error: data.error.message };
    }

    console.log("[EMAIL] Welcome email sent via Resend:", data.data?.id);
    return { success: true };
  } catch (error) {
    console.error("[EMAIL] Failed to send welcome email:", error);
    return { success: false, error: String(error) };
  }
}

// Send verification email to a new user
export async function sendVerificationEmail(
  email: string,
  code: string,
  firstName?: string
): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  console.log(`[EMAIL] Sending verification code email to ${email}`);

  if (!resend) {
    console.log("[EMAIL] No RESEND_API_KEY found - Simulation Mode");
    console.log(`[EMAIL] To: ${email}`);
    console.log(`[EMAIL] Verification code: ${code}`);
    return { success: true, simulated: true };
  }

  try {
    const data = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: "Your TotalAssist Verification Code",
      html: getVerificationEmailHtml(firstName || "", code),
      text: getVerificationEmailText(firstName || "", code),
    });

    if (data.error) {
      console.error("[EMAIL] Resend API Error:", data.error);
      return { success: false, error: data.error.message };
    }

    console.log("[EMAIL] Verification code email sent via Resend:", data.data?.id);
    return { success: true };
  } catch (error) {
    console.error("[EMAIL] Failed to send verification email:", error);
    return { success: false, error: String(error) };
  }
}

// Send password reset email
export async function sendPasswordResetEmail(
  email: string,
  token: string,
  firstName?: string
): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  console.log(`[EMAIL] Sending password reset email to ${email}`);

  const resetUrl = `${APP_BASE_URL}/reset-password?token=${token}`;
  const displayName = firstName || "there";

  if (!resend) {
    console.log("[EMAIL] No RESEND_API_KEY found - Simulation Mode");
    console.log(`[EMAIL] To: ${email}`);
    console.log(`[EMAIL] Password Reset URL: ${resetUrl}`);
    return { success: true, simulated: true };
  }

  try {
    const data = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: "Reset Your Password - TotalAssist",
      html: getPasswordResetEmailHtml(displayName, resetUrl),
      text: getPasswordResetEmailText(displayName, resetUrl),
    });

    if (data.error) {
      console.error("[EMAIL] Resend API Error:", data.error);
      return { success: false, error: data.error.message };
    }

    console.log("[EMAIL] Password reset email sent via Resend:", data.data?.id);
    return { success: true };
  } catch (error) {
    console.error("[EMAIL] Failed to send password reset email:", error);
    return { success: false, error: String(error) };
  }
}

// ============================================
// Session Guide Email Template
// ============================================

function getSessionGuideEmailHtml(userName: string, summary: string, sessionDate: Date): string {
  const displayName = userName || "there";
  const formattedDate = sessionDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: EMAIL_TIMEZONE,
  });
  const formattedTime = sessionDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: EMAIL_TIMEZONE,
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>Your TotalAssist Diagnostic Report</title>
    <style>${getEmailStyles()}</style>
</head>
<body class="body-bg" style="margin: 0; padding: 0; background-color: ${BRAND.light};">

    ${getPreheaderHtml(`Your diagnostic report from ${formattedDate} is attached. Includes step-by-step instructions and troubleshooting tips.`)}

    <center style="width: 100%; background-color: ${BRAND.light}; padding: 40px 0;" class="body-bg">
        <!--[if mso]>
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center">
        <tr><td>
        <![endif]-->

        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

            <!-- Header - matches PDF gradient -->
            <tr>
              <!--[if mso]>
              <td align="left" bgcolor="${BRAND.electricIndigo}" style="padding: 35px 30px;">
              <![endif]-->
              <!--[if !mso]><!-->
              <td align="left" bgcolor="${BRAND.electricIndigo}" style="background-color: ${BRAND.electricIndigo}; background: linear-gradient(180deg, ${BRAND.electricIndigo} 0%, ${BRAND.electricCyan} 100%); padding: 35px 30px;">
              <!--<![endif]-->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td>
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                        <tr>
                          <td valign="middle" style="padding-right: 10px;">
                            <div style="width: 36px; height: 36px; background-color: rgba(255,255,255,0.2); border-radius: 50%; text-align: center; line-height: 36px;">
                              <img src="${IMAGE_BASE_URL}/total_assist-new-white.png" alt="TA" width="28" style="display: inline-block; vertical-align: middle; max-width: 28px; height: auto;">
                            </div>
                          </td>
                          <td valign="middle">
                            <span style="color: #ffffff; font-size: 16px; font-weight: 700; letter-spacing: -0.3px;">TotalAssist</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top: 18px;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Diagnostic Report</h1>
                      <p style="margin: 6px 0 0; color: rgba(200,210,255,0.9); font-size: 14px; font-weight: 400;">Fast, friendly tech support</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Greeting -->
            <tr>
                <td align="left" class="light-section content-padding" style="background-color: #ffffff; padding: 35px 40px 20px;">
                    <p class="light-text" style="margin: 0 0 15px; color: ${BRAND.slate}; font-size: 17px; line-height: 1.6;">
                        Hey <strong style="color: ${BRAND.midnight};">${displayName}</strong>,
                    </p>
                    <p class="light-text-secondary" style="margin: 0; color: ${BRAND.slateLight}; font-size: 15px; line-height: 1.7;">
                        Thank you for using <strong style="color: ${BRAND.electricIndigo};">TotalAssist</strong>! Your diagnostic report is attached to this email as a PDF.
                    </p>
                </td>
            </tr>

            <!-- Report Summary - table style matching the PDF -->
            <tr>
                <td class="light-section content-padding" style="background-color: #ffffff; padding: 10px 40px 30px;">
                    <!-- Section header -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F3F4F6; border-radius: 8px 8px 0 0;">
                        <tr>
                            <td style="padding: 10px 16px;">
                                <p style="margin: 0; color: #374151; font-size: 13px; font-weight: 700;">Report Summary</p>
                            </td>
                        </tr>
                    </table>
                    <!-- Summary rows -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 8px 8px;">
                        <tr>
                            <td width="130" style="padding: 10px 16px; color: #6B7280; font-size: 13px; border-bottom: 1px solid #F3F4F6;">Client Name:</td>
                            <td style="padding: 10px 16px; color: #111827; font-size: 13px; font-weight: 500; border-bottom: 1px solid #F3F4F6;">${displayName}</td>
                        </tr>
                        <tr>
                            <td width="130" style="padding: 10px 16px; color: #6B7280; font-size: 13px; border-bottom: 1px solid #F3F4F6;">Date:</td>
                            <td style="padding: 10px 16px; color: #111827; font-size: 13px; font-weight: 500; border-bottom: 1px solid #F3F4F6;">${formattedDate}</td>
                        </tr>
                        <tr>
                            <td width="130" style="padding: 10px 16px; color: #6B7280; font-size: 13px;">Time:</td>
                            <td style="padding: 10px 16px; color: #111827; font-size: 13px; font-weight: 500;">${formattedTime}</td>
                        </tr>
                    </table>
                </td>
            </tr>

            <!-- Resolution Summary Card -->
            <tr>
                <td class="light-section content-padding" style="background-color: #ffffff; padding: 0 40px 30px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F3F4F6; border-radius: 8px 8px 0 0;">
                        <tr>
                            <td style="padding: 10px 16px;">
                                <p style="margin: 0; color: #374151; font-size: 13px; font-weight: 700;">Resolution Summary</p>
                            </td>
                        </tr>
                    </table>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 8px 8px;">
                        <tr>
                            <td style="padding: 14px 16px;">
                                <p class="light-text" style="margin: 0; color: ${BRAND.slate}; font-size: 14px; font-weight: 400; line-height: 1.6;">
                                    <strong style="color: ${BRAND.midnight};">Problem:</strong> ${summary || "Session completed successfully"}
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 0 16px 14px;">
                                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td style="background-color: #DCFCE7; border-radius: 12px; padding: 4px 12px;">
                                            <span style="color: #22C55E; font-size: 12px; font-weight: 600;">&#10003; Session Complete</span>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <!-- PDF Contents Checklist -->
            <tr>
                <td align="left" class="light-section content-padding" style="background-color: ${BRAND.light}; padding: 30px 40px;">
                    <p style="margin: 0 0 18px; color: ${BRAND.slate}; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Your attached report includes</p>

                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                            <td width="28" valign="top" style="padding-right: 10px; padding-bottom: 12px;">
                                <span style="color: ${BRAND.electricIndigo}; font-size: 15px;">&#10003;</span>
                            </td>
                            <td valign="top" style="padding-bottom: 12px;">
                                <p class="light-text-secondary" style="margin: 0; color: ${BRAND.slateLight}; font-size: 14px; line-height: 1.5;">Step-by-step instructions discussed</p>
                            </td>
                        </tr>
                        <tr>
                            <td width="28" valign="top" style="padding-right: 10px; padding-bottom: 12px;">
                                <span style="color: ${BRAND.electricIndigo}; font-size: 15px;">&#10003;</span>
                            </td>
                            <td valign="top" style="padding-bottom: 12px;">
                                <p class="light-text-secondary" style="margin: 0; color: ${BRAND.slateLight}; font-size: 14px; line-height: 1.5;">Full conversation transcript</p>
                            </td>
                        </tr>
                        <tr>
                            <td width="28" valign="top" style="padding-right: 10px;">
                                <span style="color: ${BRAND.electricIndigo}; font-size: 15px;">&#10003;</span>
                            </td>
                            <td valign="top">
                                <p class="light-text-secondary" style="margin: 0; color: ${BRAND.slateLight}; font-size: 14px; line-height: 1.5;">Details &amp; recommendations</p>
                            </td>
                        </tr>
                    </table>

                    <p class="light-text-secondary" style="margin: 18px 0 0; color: ${BRAND.slateLight}; font-size: 14px; line-height: 1.7;">
                        Save this report for future reference &mdash; it's tailored specifically to your situation.
                    </p>
                </td>
            </tr>

            <!-- CTA Section -->
            <tr>
                <td align="center" style="background: linear-gradient(135deg, ${BRAND.midnight} 0%, ${BRAND.midnightLight} 100%); padding: 45px 30px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 18px;">
                      <tr>
                        <td align="center" valign="middle" width="56" height="56" style="width: 56px; height: 56px; background: linear-gradient(135deg, ${BRAND.electricIndigo}, ${BRAND.electricCyan}); border-radius: 50%; font-size: 24px; box-shadow: 0 12px 30px rgba(99, 102, 241, 0.4);">
                          📎
                        </td>
                      </tr>
                    </table>

                    <h2 style="margin: 0 0 8px; color: #ffffff; font-size: 20px; font-weight: 700;">Check Your Attachment</h2>

                    <p style="margin: 0 0 25px; color: #94a3b8; font-size: 14px; line-height: 1.6;">
                        Your full diagnostic report is attached as a PDF.
                    </p>

                    ${getPrimaryButtonHtml("Need More Help?", APP_BASE_URL + "/dashboard")}
                </td>
            </tr>

            ${getFooterHtml()}

        </table>

        <!--[if mso]>
        </td></tr>
        </table>
        <![endif]-->
    </center>
</body>
</html>`;
}

// Send specialist response notification to user
export async function sendSpecialistResponseEmail(
  email: string,
  firstName: string,
  caseTitle: string,
  caseId: string
): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  console.log(`[EMAIL] Sending specialist response notification to ${email}`);

  const displayName = firstName || "there";

  if (!resend) {
    console.log("[EMAIL] No RESEND_API_KEY found - Simulation Mode");
    console.log(`[EMAIL] To: ${email}, Case: ${caseTitle}`);
    return { success: true, simulated: true };
  }

  try {
    const data = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: `Specialist Response Ready - ${caseTitle}`,
      html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <title>Specialist Response Ready</title>
    <style>${getEmailStyles()}</style>
</head>
<body class="body-bg" style="margin: 0; padding: 0; background-color: ${BRAND.light};">
    ${getPreheaderHtml(`A specialist has reviewed your case "${caseTitle}" and provided their assessment.`)}
    <center style="width: 100%; background-color: ${BRAND.light}; padding: 40px 0;" class="body-bg">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            ${getHeaderHtml("Specialist Response", "A specialist has reviewed your case.")}
            <tr>
                <td align="left" class="light-section content-padding" style="background-color: #ffffff; padding: 45px 40px;">
                    <p class="light-text" style="margin: 0 0 20px; color: ${BRAND.slate}; font-size: 18px; line-height: 1.6;">
                        Hey <strong style="color: ${BRAND.midnight};">${displayName}</strong>,
                    </p>
                    <p class="light-text-secondary" style="margin: 0 0 25px; color: ${BRAND.slateLight}; font-size: 16px; line-height: 1.75;">
                        Great news! A specialist has reviewed your case <strong style="color: ${BRAND.scoutPurple};">"${caseTitle}"</strong> and submitted their professional assessment.
                    </p>
                    <p class="light-text-secondary" style="margin: 0; color: ${BRAND.slateLight}; font-size: 16px; line-height: 1.75;">
                        Log in to your dashboard to view the specialist's response and recommended next steps.
                    </p>
                </td>
            </tr>
            <tr>
                <td align="center" style="background: linear-gradient(135deg, ${BRAND.midnight} 0%, ${BRAND.midnightLight} 100%); padding: 50px 30px;">
                    ${getPrimaryButtonHtml("View Response", APP_BASE_URL + "/dashboard")}
                </td>
            </tr>
            ${getFooterHtml()}
        </table>
    </center>
</body>
</html>`,
      text: `Hey ${displayName},\n\nA specialist has reviewed your case "${caseTitle}" and submitted their professional assessment.\n\nLog in to view: ${APP_BASE_URL}/dashboard\n\n---\nPowered by TotalAssist\n(c) ${new Date().getFullYear()} Smart Tek Labs.`,
    });

    if (data.error) {
      console.error("[EMAIL] Resend API Error:", data.error);
      return { success: false, error: data.error.message };
    }

    console.log("[EMAIL] Specialist response email sent:", data.data?.id);
    return { success: true };
  } catch (error) {
    console.error("[EMAIL] Failed to send specialist response email:", error);
    return { success: false, error: String(error) };
  }
}

// Send escalation notification to specialist
export async function sendEscalationEmail(
  specialistEmail: string,
  caseTitle: string,
  specialistUrl: string,
  pdfBase64?: string
): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  console.log(`[EMAIL] Sending escalation email to specialist at ${specialistEmail}`);

  if (!resend) {
    console.log("[EMAIL] No RESEND_API_KEY found - Simulation Mode");
    console.log(`[EMAIL] To: ${specialistEmail}, Case: ${caseTitle}`);
    console.log(`[EMAIL] Specialist URL: ${specialistUrl}`);
    return { success: true, simulated: true };
  }

  try {
    const attachments = pdfBase64 ? [
      {
        filename: `TotalAssist_Escalation_${new Date().toISOString().split("T")[0]}.pdf`,
        content: Buffer.from(pdfBase64, "base64"),
      },
    ] : undefined;

    const data = await resend.emails.send({
      from: EMAIL_FROM,
      to: specialistEmail,
      subject: `New Escalation: ${caseTitle}`,
      html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Escalation</title>
    <style>${getEmailStyles()}</style>
</head>
<body class="body-bg" style="margin: 0; padding: 0; background-color: ${BRAND.light};">
    ${getPreheaderHtml(`A new case has been escalated: ${caseTitle}. Review and respond.`)}
    <center style="width: 100%; background-color: ${BRAND.light}; padding: 40px 0;" class="body-bg">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            ${getHeaderHtml("New Escalation", "A case needs your expertise.")}
            <tr>
                <td align="left" class="light-section content-padding" style="background-color: #ffffff; padding: 45px 40px;">
                    <p class="light-text" style="margin: 0 0 20px; color: ${BRAND.slate}; font-size: 18px; line-height: 1.6;">
                        A customer case has been escalated and requires specialist review:
                    </p>
                    <p class="light-text" style="margin: 0 0 25px; color: ${BRAND.midnight}; font-size: 20px; font-weight: 700;">
                        "${caseTitle}"
                    </p>
                    <p class="light-text-secondary" style="margin: 0; color: ${BRAND.slateLight}; font-size: 16px; line-height: 1.75;">
                        Click the button below to review the full case details, chat history, and preliminary analysis. You can then submit your professional assessment.
                    </p>
                </td>
            </tr>
            <tr>
                <td align="center" style="background: linear-gradient(135deg, ${BRAND.midnight} 0%, ${BRAND.midnightLight} 100%); padding: 50px 30px;">
                    ${getPrimaryButtonHtml("Review Case", specialistUrl)}
                </td>
            </tr>
            ${getFooterHtml()}
        </table>
    </center>
</body>
</html>`,
      text: `New Escalation: ${caseTitle}\n\nA customer case has been escalated and requires specialist review.\n\nReview the case: ${specialistUrl}\n\n---\nPowered by TotalAssist\n(c) ${new Date().getFullYear()} Smart Tek Labs.`,
      attachments,
    });

    if (data.error) {
      console.error("[EMAIL] Resend API Error:", data.error);
      return { success: false, error: data.error.message };
    }

    console.log("[EMAIL] Escalation email sent:", data.data?.id);
    return { success: true };
  } catch (error) {
    console.error("[EMAIL] Failed to send escalation email:", error);
    return { success: false, error: String(error) };
  }
}

// Send session guide email with PDF attachment
export async function sendSessionGuideEmail(
  email: string,
  userName: string,
  summary: string,
  pdfBase64: string,
  sessionDate: Date
): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  console.log(`[EMAIL] Sending session guide to ${email}`);

  const formattedDateForFilename = sessionDate.toISOString().split("T")[0];

  if (!resend) {
    console.log("[EMAIL] No RESEND_API_KEY found - Simulation Mode");
    console.log("[EMAIL] Simulated session guide send to:", email);
    console.log("[EMAIL] PDF attachment size:", pdfBase64.length, "bytes");
    return { success: true, simulated: true };
  }

  try {
    // Convert base64 to Buffer for attachment
    const pdfBuffer = Buffer.from(pdfBase64, "base64");

    const dateStr = sessionDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: EMAIL_TIMEZONE,
    });

    const data = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: `Your TotalAssist Session Guide - ${dateStr}`,
      html: getSessionGuideEmailHtml(userName, summary, sessionDate),
      text: getSessionGuideEmailText(userName, summary, sessionDate),
      attachments: [
        {
          filename: `TotalAssist_Guide_${formattedDateForFilename}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (data.error) {
      console.error("[EMAIL] Resend API Error:", data.error);
      return { success: false, error: data.error.message };
    }

    console.log("[EMAIL] Session guide email sent via Resend:", data.data?.id);
    return { success: true };
  } catch (error) {
    console.error("[EMAIL] Failed to send session guide email:", error);
    return { success: false, error: String(error) };
  }
}

// ============================================
// Subscription Lifecycle Emails
// ============================================

function getPlanFeatures(planName: string): string[] {
  const lower = planName.toLowerCase();
  if (lower === 'pro') {
    return [
      'Unlimited AI chat support',
      'Unlimited photo analysis',
      '15 video sessions/month included',
      'Multi-home support (up to 5)',
      'Priority support',
    ];
  }
  if (lower === 'home') {
    return [
      'Unlimited AI chat support',
      'Unlimited photo analysis',
      '1 video session/week included',
      'Buy extra video credits anytime',
    ];
  }
  return ['5 chat sessions/month', '1 photo analysis/month'];
}

// --- 1. Subscription Confirmation ---

function getSubscriptionConfirmationText(firstName: string, planName: string): string {
  const displayName = firstName || "there";
  const features = getPlanFeatures(planName);
  return `Welcome to TotalAssist ${planName} — You're all set!

Hey ${displayName},

Welcome to TotalAssist ${planName}! Your subscription is now active and you have full access to all your plan features.

What's included in your ${planName} plan:
${features.map(f => `- ${f}`).join('\n')}

Go to your dashboard to get started: ${APP_BASE_URL}/dashboard

---
Powered by TotalAssist
(c) ${new Date().getFullYear()} Smart Tek Labs. All rights reserved.
Privacy Policy: ${APP_BASE_URL}/privacy
Terms of Service: ${APP_BASE_URL}/terms`;
}

function getSubscriptionConfirmationHtml(firstName: string, planName: string): string {
  const displayName = firstName || "there";
  const features = getPlanFeatures(planName);

  const featuresHtml = features.map(f => `
    <tr>
      <td width="30" valign="top" style="padding-right: 12px; padding-bottom: 12px;">
        <span style="color: ${BRAND.electricCyan}; font-size: 16px;">&#10003;</span>
      </td>
      <td valign="top" style="padding-bottom: 12px;">
        <p class="light-text-secondary" style="margin: 0; color: ${BRAND.slateLight}; font-size: 14px; line-height: 1.5;">${f}</p>
      </td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>Welcome to TotalAssist ${planName}</title>
    <style>${getEmailStyles()}</style>
</head>
<body class="body-bg" style="margin: 0; padding: 0; background-color: ${BRAND.light};">

    ${getPreheaderHtml(`Welcome ${displayName}! Your TotalAssist ${planName} plan is now active.`)}

    <center style="width: 100%; background-color: ${BRAND.light}; padding: 40px 0;" class="body-bg">
        <!--[if mso]>
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center">
        <tr><td>
        <![endif]-->

        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

            ${getHeaderHtml("You're In!", `Your ${planName} plan is active`)}

            <tr>
                <td align="left" class="light-section content-padding" style="background-color: #ffffff; padding: 45px 40px;">
                    <p class="light-text" style="margin: 0 0 20px; color: ${BRAND.slate}; font-size: 18px; line-height: 1.6;">
                        Hey <strong style="color: ${BRAND.midnight};">${displayName}</strong>,
                    </p>
                    <p class="light-text-secondary" style="margin: 0; color: ${BRAND.slateLight}; font-size: 16px; line-height: 1.75;">
                        Welcome to <strong style="color: ${BRAND.scoutPurple};">TotalAssist ${planName}</strong>! Your subscription is now active and you have full access to all your plan features.
                    </p>
                </td>
            </tr>

            <tr>
                <td class="light-section content-padding" style="background-color: ${BRAND.light}; padding: 35px 40px;">
                    <p style="margin: 0 0 20px; color: ${BRAND.slate}; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">What's included</p>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        ${featuresHtml}
                    </table>
                </td>
            </tr>

            <tr>
                <td align="center" style="background: linear-gradient(135deg, ${BRAND.midnight} 0%, ${BRAND.midnightLight} 100%); padding: 50px 30px;">
                    <h2 style="margin: 0 0 15px; color: #ffffff; font-size: 26px; font-weight: 700; line-height: 1.3;">Ready to get started?</h2>
                    <p style="margin: 0 0 30px; color: #94a3b8; font-size: 15px; line-height: 1.6;">
                        Head to your dashboard and describe what's going on.
                    </p>
                    ${getPrimaryButtonHtml("Go to Dashboard", APP_BASE_URL + "/dashboard")}
                </td>
            </tr>

            ${getFooterHtml()}

        </table>

        <!--[if mso]>
        </td></tr>
        </table>
        <![endif]-->
    </center>
</body>
</html>`;
}

export async function sendSubscriptionConfirmationEmail(
  email: string,
  firstName: string | undefined,
  planName: string
): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  console.log(`[EMAIL] Sending subscription confirmation email to ${email} (${planName})`);

  if (!resend) {
    console.log("[EMAIL] No RESEND_API_KEY found - Simulation Mode");
    console.log(`[EMAIL] To: ${email}, Plan: ${planName}`);
    return { success: true, simulated: true };
  }

  try {
    const data = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: `Welcome to TotalAssist ${planName} — You're all set!`,
      html: getSubscriptionConfirmationHtml(firstName || "", planName),
      text: getSubscriptionConfirmationText(firstName || "", planName),
    });

    if (data.error) {
      console.error("[EMAIL] Resend API Error:", data.error);
      return { success: false, error: data.error.message };
    }

    console.log("[EMAIL] Subscription confirmation email sent:", data.data?.id);
    return { success: true };
  } catch (error) {
    console.error("[EMAIL] Failed to send subscription confirmation email:", error);
    return { success: false, error: String(error) };
  }
}

// --- 2. Plan Upgrade ---

function getPlanUpgradeText(firstName: string, newPlan: string): string {
  const displayName = firstName || "there";
  const features = getPlanFeatures(newPlan);
  return `You've upgraded to TotalAssist ${newPlan}!

Hey ${displayName},

Congratulations! Your plan has been upgraded to ${newPlan}. You now have access to even more features.

Your ${newPlan} plan includes:
${features.map(f => `- ${f}`).join('\n')}

Your billing has been prorated — you'll only pay the difference for the remainder of your current billing period.

Explore your new features: ${APP_BASE_URL}/dashboard

---
Powered by TotalAssist
(c) ${new Date().getFullYear()} Smart Tek Labs. All rights reserved.
Privacy Policy: ${APP_BASE_URL}/privacy
Terms of Service: ${APP_BASE_URL}/terms`;
}

function getPlanUpgradeHtml(firstName: string, newPlan: string): string {
  const displayName = firstName || "there";
  const features = getPlanFeatures(newPlan);

  const featuresHtml = features.map(f => `
    <tr>
      <td width="30" valign="top" style="padding-right: 12px; padding-bottom: 12px;">
        <span style="color: ${BRAND.electricCyan}; font-size: 16px;">&#10003;</span>
      </td>
      <td valign="top" style="padding-bottom: 12px;">
        <p class="light-text-secondary" style="margin: 0; color: ${BRAND.slateLight}; font-size: 14px; line-height: 1.5;">${f}</p>
      </td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>Plan Upgraded to ${newPlan}</title>
    <style>${getEmailStyles()}</style>
</head>
<body class="body-bg" style="margin: 0; padding: 0; background-color: ${BRAND.light};">

    ${getPreheaderHtml(`Congrats ${displayName}! You've upgraded to TotalAssist ${newPlan}.`)}

    <center style="width: 100%; background-color: ${BRAND.light}; padding: 40px 0;" class="body-bg">
        <!--[if mso]>
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center">
        <tr><td>
        <![endif]-->

        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

            ${getHeaderHtml("Plan Upgraded!", `You're now on ${newPlan}`)}

            <tr>
                <td align="left" class="light-section content-padding" style="background-color: #ffffff; padding: 45px 40px;">
                    <p class="light-text" style="margin: 0 0 20px; color: ${BRAND.slate}; font-size: 18px; line-height: 1.6;">
                        Hey <strong style="color: ${BRAND.midnight};">${displayName}</strong>,
                    </p>
                    <p class="light-text-secondary" style="margin: 0 0 25px; color: ${BRAND.slateLight}; font-size: 16px; line-height: 1.75;">
                        Congratulations! Your plan has been upgraded to <strong style="color: ${BRAND.scoutPurple};">${newPlan}</strong>. You now have access to even more features.
                    </p>
                    <p class="light-text-secondary" style="margin: 0; color: ${BRAND.slateLight}; font-size: 14px; line-height: 1.6;">
                        Your billing has been prorated &mdash; you'll only pay the difference for the remainder of your current billing period.
                    </p>
                </td>
            </tr>

            <tr>
                <td class="light-section content-padding" style="background-color: ${BRAND.light}; padding: 35px 40px;">
                    <p style="margin: 0 0 20px; color: ${BRAND.slate}; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Your new features</p>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        ${featuresHtml}
                    </table>
                </td>
            </tr>

            <tr>
                <td align="center" style="background: linear-gradient(135deg, ${BRAND.midnight} 0%, ${BRAND.midnightLight} 100%); padding: 50px 30px;">
                    <h2 style="margin: 0 0 15px; color: #ffffff; font-size: 26px; font-weight: 700; line-height: 1.3;">Explore your new features</h2>
                    <p style="margin: 0 0 30px; color: #94a3b8; font-size: 15px; line-height: 1.6;">
                        Your upgraded plan is ready to use right now.
                    </p>
                    ${getPrimaryButtonHtml("Explore Your New Features", APP_BASE_URL + "/dashboard")}
                </td>
            </tr>

            ${getFooterHtml()}

        </table>

        <!--[if mso]>
        </td></tr>
        </table>
        <![endif]-->
    </center>
</body>
</html>`;
}

export async function sendPlanUpgradeEmail(
  email: string,
  firstName: string | undefined,
  newPlan: string
): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  console.log(`[EMAIL] Sending plan upgrade email to ${email} (${newPlan})`);

  if (!resend) {
    console.log("[EMAIL] No RESEND_API_KEY found - Simulation Mode");
    console.log(`[EMAIL] To: ${email}, New Plan: ${newPlan}`);
    return { success: true, simulated: true };
  }

  try {
    const data = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: `You've upgraded to TotalAssist ${newPlan}!`,
      html: getPlanUpgradeHtml(firstName || "", newPlan),
      text: getPlanUpgradeText(firstName || "", newPlan),
    });

    if (data.error) {
      console.error("[EMAIL] Resend API Error:", data.error);
      return { success: false, error: data.error.message };
    }

    console.log("[EMAIL] Plan upgrade email sent:", data.data?.id);
    return { success: true };
  } catch (error) {
    console.error("[EMAIL] Failed to send plan upgrade email:", error);
    return { success: false, error: String(error) };
  }
}

// --- 3. Plan Downgrade ---

function getPlanDowngradeText(firstName: string, newPlan: string): string {
  const displayName = firstName || "there";
  const features = getPlanFeatures(newPlan);
  return `Your TotalAssist plan has been updated

Hey ${displayName},

Your plan has been changed to ${newPlan}. You still have access to great features.

Your ${newPlan} plan includes:
${features.map(f => `- ${f}`).join('\n')}

Any prorated credit will be applied to your next invoice.

Go to Dashboard: ${APP_BASE_URL}/dashboard

---
Powered by TotalAssist
(c) ${new Date().getFullYear()} Smart Tek Labs. All rights reserved.
Privacy Policy: ${APP_BASE_URL}/privacy
Terms of Service: ${APP_BASE_URL}/terms`;
}

function getPlanDowngradeHtml(firstName: string, newPlan: string): string {
  const displayName = firstName || "there";
  const features = getPlanFeatures(newPlan);

  const featuresHtml = features.map(f => `
    <tr>
      <td width="30" valign="top" style="padding-right: 12px; padding-bottom: 12px;">
        <span style="color: ${BRAND.electricCyan}; font-size: 16px;">&#10003;</span>
      </td>
      <td valign="top" style="padding-bottom: 12px;">
        <p class="light-text-secondary" style="margin: 0; color: ${BRAND.slateLight}; font-size: 14px; line-height: 1.5;">${f}</p>
      </td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>Your TotalAssist Plan Has Been Updated</title>
    <style>${getEmailStyles()}</style>
</head>
<body class="body-bg" style="margin: 0; padding: 0; background-color: ${BRAND.light};">

    ${getPreheaderHtml(`Hey ${displayName}, your TotalAssist plan has been changed to ${newPlan}.`)}

    <center style="width: 100%; background-color: ${BRAND.light}; padding: 40px 0;" class="body-bg">
        <!--[if mso]>
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center">
        <tr><td>
        <![endif]-->

        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

            ${getHeaderHtml("Plan Updated", "Your plan has been changed")}

            <tr>
                <td align="left" class="light-section content-padding" style="background-color: #ffffff; padding: 45px 40px;">
                    <p class="light-text" style="margin: 0 0 20px; color: ${BRAND.slate}; font-size: 18px; line-height: 1.6;">
                        Hey <strong style="color: ${BRAND.midnight};">${displayName}</strong>,
                    </p>
                    <p class="light-text-secondary" style="margin: 0 0 25px; color: ${BRAND.slateLight}; font-size: 16px; line-height: 1.75;">
                        Your plan has been changed to <strong style="color: ${BRAND.scoutPurple};">${newPlan}</strong>. You still have access to great features.
                    </p>
                    <p class="light-text-secondary" style="margin: 0; color: ${BRAND.slateLight}; font-size: 14px; line-height: 1.6;">
                        Any prorated credit will be applied to your next invoice.
                    </p>
                </td>
            </tr>

            <tr>
                <td class="light-section content-padding" style="background-color: ${BRAND.light}; padding: 35px 40px;">
                    <p style="margin: 0 0 20px; color: ${BRAND.slate}; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Features still available</p>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        ${featuresHtml}
                    </table>
                </td>
            </tr>

            <tr>
                <td align="center" style="background: linear-gradient(135deg, ${BRAND.midnight} 0%, ${BRAND.midnightLight} 100%); padding: 50px 30px;">
                    ${getPrimaryButtonHtml("Go to Dashboard", APP_BASE_URL + "/dashboard")}
                </td>
            </tr>

            ${getFooterHtml()}

        </table>

        <!--[if mso]>
        </td></tr>
        </table>
        <![endif]-->
    </center>
</body>
</html>`;
}

export async function sendPlanDowngradeEmail(
  email: string,
  firstName: string | undefined,
  newPlan: string
): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  console.log(`[EMAIL] Sending plan downgrade email to ${email} (${newPlan})`);

  if (!resend) {
    console.log("[EMAIL] No RESEND_API_KEY found - Simulation Mode");
    console.log(`[EMAIL] To: ${email}, New Plan: ${newPlan}`);
    return { success: true, simulated: true };
  }

  try {
    const data = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: "Your TotalAssist plan has been updated",
      html: getPlanDowngradeHtml(firstName || "", newPlan),
      text: getPlanDowngradeText(firstName || "", newPlan),
    });

    if (data.error) {
      console.error("[EMAIL] Resend API Error:", data.error);
      return { success: false, error: data.error.message };
    }

    console.log("[EMAIL] Plan downgrade email sent:", data.data?.id);
    return { success: true };
  } catch (error) {
    console.error("[EMAIL] Failed to send plan downgrade email:", error);
    return { success: false, error: String(error) };
  }
}

// --- 4. Cancellation Scheduled ---

function getCancellationScheduledText(firstName: string, planName: string, periodEndDate: Date): string {
  const displayName = firstName || "there";
  const formattedDate = periodEndDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: EMAIL_TIMEZONE,
  });
  return `Your TotalAssist cancellation is confirmed

Hey ${displayName},

We're sorry to see you go. Your TotalAssist ${planName} plan has been set to cancel.

You'll still have full access to all your ${planName} features until ${formattedDate}.

Changed your mind? You can reactivate your subscription anytime before ${formattedDate} and keep all your features.

Reactivate Subscription: ${APP_BASE_URL}/dashboard

---
Powered by TotalAssist
(c) ${new Date().getFullYear()} Smart Tek Labs. All rights reserved.
Privacy Policy: ${APP_BASE_URL}/privacy
Terms of Service: ${APP_BASE_URL}/terms`;
}

function getCancellationScheduledHtml(firstName: string, planName: string, periodEndDate: Date): string {
  const displayName = firstName || "there";
  const formattedDate = periodEndDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: EMAIL_TIMEZONE,
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>Your TotalAssist Cancellation</title>
    <style>${getEmailStyles()}</style>
</head>
<body class="body-bg" style="margin: 0; padding: 0; background-color: ${BRAND.light};">

    ${getPreheaderHtml(`Your TotalAssist ${planName} cancellation is confirmed. You have access until ${formattedDate}.`)}

    <center style="width: 100%; background-color: ${BRAND.light}; padding: 40px 0;" class="body-bg">
        <!--[if mso]>
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center">
        <tr><td>
        <![endif]-->

        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

            ${getHeaderHtml("We're Sorry to See You Go", "Your cancellation is confirmed")}

            <!-- Access Until Banner -->
            <tr>
              <td align="center" style="background-color: ${BRAND.electricCyan}15; padding: 20px 30px;">
                <table border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-right: 12px;" valign="middle">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" valign="middle" width="44" height="44" style="width: 44px; height: 44px; background: ${BRAND.electricCyan}; border-radius: 50%; font-size: 20px;">&#128197;</td>
                        </tr>
                      </table>
                    </td>
                    <td>
                      <p style="margin: 0; color: ${BRAND.electricCyan}; font-size: 16px; font-weight: 700;">Access until ${formattedDate}</p>
                      <p style="margin: 4px 0 0; color: ${BRAND.slate}; font-size: 14px;">Your ${planName} features remain active</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
                <td align="left" class="light-section content-padding" style="background-color: #ffffff; padding: 45px 40px;">
                    <p class="light-text" style="margin: 0 0 20px; color: ${BRAND.slate}; font-size: 18px; line-height: 1.6;">
                        Hey <strong style="color: ${BRAND.midnight};">${displayName}</strong>,
                    </p>
                    <p class="light-text-secondary" style="margin: 0; color: ${BRAND.slateLight}; font-size: 16px; line-height: 1.75;">
                        Your TotalAssist <strong style="color: ${BRAND.scoutPurple};">${planName}</strong> plan has been set to cancel. You'll still have full access to all your features until <strong style="color: ${BRAND.midnight};">${formattedDate}</strong>.
                    </p>
                </td>
            </tr>

            <tr>
                <td class="light-section content-padding" style="background-color: ${BRAND.light}; padding: 35px 40px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" class="card-bg" style="background: #ffffff; border-radius: 12px; border: 1px solid ${BRAND.lightMuted};">
                        <tr>
                            <td style="padding: 25px;">
                                <p style="margin: 0 0 10px; color: ${BRAND.midnight}; font-size: 16px; font-weight: 600;">Changed your mind?</p>
                                <p class="light-text-secondary" style="margin: 0; color: ${BRAND.slateLight}; font-size: 14px; line-height: 1.6;">
                                    You can reactivate your subscription anytime before ${formattedDate} and keep all your features. No need to re-enter payment details.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <tr>
                <td align="center" style="background: linear-gradient(135deg, ${BRAND.midnight} 0%, ${BRAND.midnightLight} 100%); padding: 50px 30px;">
                    <h2 style="margin: 0 0 15px; color: #ffffff; font-size: 26px; font-weight: 700; line-height: 1.3;">Want to stay?</h2>
                    <p style="margin: 0 0 30px; color: #94a3b8; font-size: 15px; line-height: 1.6;">
                        Reactivate with one click and pick up right where you left off.
                    </p>
                    ${getPrimaryButtonHtml("Reactivate Subscription", APP_BASE_URL + "/dashboard")}
                </td>
            </tr>

            ${getFooterHtml()}

        </table>

        <!--[if mso]>
        </td></tr>
        </table>
        <![endif]-->
    </center>
</body>
</html>`;
}

export async function sendCancellationScheduledEmail(
  email: string,
  firstName: string | undefined,
  planName: string,
  periodEndDate: Date
): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  console.log(`[EMAIL] Sending cancellation scheduled email to ${email} (${planName})`);

  if (!resend) {
    console.log("[EMAIL] No RESEND_API_KEY found - Simulation Mode");
    console.log(`[EMAIL] To: ${email}, Plan: ${planName}, Ends: ${periodEndDate.toISOString()}`);
    return { success: true, simulated: true };
  }

  try {
    const data = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: "Your TotalAssist cancellation is confirmed",
      html: getCancellationScheduledHtml(firstName || "", planName, periodEndDate),
      text: getCancellationScheduledText(firstName || "", planName, periodEndDate),
    });

    if (data.error) {
      console.error("[EMAIL] Resend API Error:", data.error);
      return { success: false, error: data.error.message };
    }

    console.log("[EMAIL] Cancellation scheduled email sent:", data.data?.id);
    return { success: true };
  } catch (error) {
    console.error("[EMAIL] Failed to send cancellation scheduled email:", error);
    return { success: false, error: String(error) };
  }
}

// --- 5. Subscription Ended (Win-back) ---

function getSubscriptionEndedText(firstName: string, planName: string): string {
  const displayName = firstName || "there";
  const features = getPlanFeatures(planName);
  return `Your TotalAssist ${planName} membership has ended

Hey ${displayName},

Your TotalAssist ${planName} membership has ended. We hope you enjoyed using our service.

What you're missing:
${features.map(f => `- ${f}`).join('\n')}

We'd love to have you back! You can resubscribe anytime.

View Plans: ${APP_BASE_URL}/pricing

Plans start at $9.99/month.

---
Powered by TotalAssist
(c) ${new Date().getFullYear()} Smart Tek Labs. All rights reserved.
Privacy Policy: ${APP_BASE_URL}/privacy
Terms of Service: ${APP_BASE_URL}/terms`;
}

function getSubscriptionEndedHtml(firstName: string, planName: string): string {
  const displayName = firstName || "there";
  const features = getPlanFeatures(planName);

  const featuresHtml = features.map(f => `
    <tr>
      <td width="30" valign="top" style="padding-right: 12px; padding-bottom: 12px;">
        <span style="color: #ef4444; font-size: 16px;">&#10007;</span>
      </td>
      <td valign="top" style="padding-bottom: 12px;">
        <p class="light-text-secondary" style="margin: 0; color: ${BRAND.slateLight}; font-size: 14px; line-height: 1.5;">${f}</p>
      </td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>Your TotalAssist Membership Has Ended</title>
    <style>${getEmailStyles()}</style>
</head>
<body class="body-bg" style="margin: 0; padding: 0; background-color: ${BRAND.light};">

    ${getPreheaderHtml(`Your TotalAssist ${planName} membership has ended. We'd love to have you back!`)}

    <center style="width: 100%; background-color: ${BRAND.light}; padding: 40px 0;" class="body-bg">
        <!--[if mso]>
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center">
        <tr><td>
        <![endif]-->

        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

            ${getHeaderHtml("Membership Ended", `Your ${planName} plan has expired`)}

            <tr>
                <td align="left" class="light-section content-padding" style="background-color: #ffffff; padding: 45px 40px;">
                    <p class="light-text" style="margin: 0 0 20px; color: ${BRAND.slate}; font-size: 18px; line-height: 1.6;">
                        Hey <strong style="color: ${BRAND.midnight};">${displayName}</strong>,
                    </p>
                    <p class="light-text-secondary" style="margin: 0; color: ${BRAND.slateLight}; font-size: 16px; line-height: 1.75;">
                        Your TotalAssist <strong style="color: ${BRAND.scoutPurple};">${planName}</strong> membership has ended. We hope you enjoyed using our service.
                    </p>
                </td>
            </tr>

            <tr>
                <td class="light-section content-padding" style="background-color: ${BRAND.light}; padding: 35px 40px;">
                    <p style="margin: 0 0 20px; color: ${BRAND.slate}; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">What you're missing</p>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        ${featuresHtml}
                    </table>
                </td>
            </tr>

            <tr>
                <td align="center" style="background: linear-gradient(135deg, ${BRAND.midnight} 0%, ${BRAND.midnightLight} 100%); padding: 50px 30px;">
                    <div style="display: inline-block; background: linear-gradient(135deg, ${BRAND.electricIndigo}, ${BRAND.electricCyan}); color: #ffffff; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; padding: 6px 14px; border-radius: 20px; margin-bottom: 20px;">
                        Come Back
                    </div>

                    <h2 style="margin: 0 0 15px; color: #ffffff; font-size: 26px; font-weight: 700; line-height: 1.3;">We'd love to have you back</h2>

                    <p style="margin: 0 0 30px; color: #94a3b8; font-size: 15px; line-height: 1.6;">
                        Resubscribe anytime and get instant access to all your features.
                    </p>

                    ${getPrimaryButtonHtml("View Plans", APP_BASE_URL + "/pricing")}

                    <p style="margin: 25px 0 0; color: #64748b; font-size: 13px;">
                        Plans start at $9.99/month
                    </p>
                </td>
            </tr>

            ${getFooterHtml()}

        </table>

        <!--[if mso]>
        </td></tr>
        </table>
        <![endif]-->
    </center>
</body>
</html>`;
}

export async function sendSubscriptionEndedEmail(
  email: string,
  firstName: string | undefined,
  planName: string
): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  console.log(`[EMAIL] Sending subscription ended email to ${email} (${planName})`);

  if (!resend) {
    console.log("[EMAIL] No RESEND_API_KEY found - Simulation Mode");
    console.log(`[EMAIL] To: ${email}, Former Plan: ${planName}`);
    return { success: true, simulated: true };
  }

  try {
    const data = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: `Your TotalAssist ${planName} membership has ended`,
      html: getSubscriptionEndedHtml(firstName || "", planName),
      text: getSubscriptionEndedText(firstName || "", planName),
    });

    if (data.error) {
      console.error("[EMAIL] Resend API Error:", data.error);
      return { success: false, error: data.error.message };
    }

    console.log("[EMAIL] Subscription ended email sent:", data.data?.id);
    return { success: true };
  } catch (error) {
    console.error("[EMAIL] Failed to send subscription ended email:", error);
    return { success: false, error: String(error) };
  }
}

// --- 6. Reactivation ---

function getReactivationText(firstName: string, planName: string): string {
  const displayName = firstName || "there";
  const features = getPlanFeatures(planName);
  return `Welcome back to TotalAssist ${planName}!

Hey ${displayName},

Great news! Your TotalAssist ${planName} plan is active again. All your features have been restored.

Your ${planName} plan includes:
${features.map(f => `- ${f}`).join('\n')}

Your subscription will continue normally from your next billing date.

Go to Dashboard: ${APP_BASE_URL}/dashboard

---
Powered by TotalAssist
(c) ${new Date().getFullYear()} Smart Tek Labs. All rights reserved.
Privacy Policy: ${APP_BASE_URL}/privacy
Terms of Service: ${APP_BASE_URL}/terms`;
}

function getReactivationHtml(firstName: string, planName: string): string {
  const displayName = firstName || "there";
  const features = getPlanFeatures(planName);

  const featuresHtml = features.map(f => `
    <tr>
      <td width="30" valign="top" style="padding-right: 12px; padding-bottom: 12px;">
        <span style="color: ${BRAND.electricCyan}; font-size: 16px;">&#10003;</span>
      </td>
      <td valign="top" style="padding-bottom: 12px;">
        <p class="light-text-secondary" style="margin: 0; color: ${BRAND.slateLight}; font-size: 14px; line-height: 1.5;">${f}</p>
      </td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>Welcome Back to TotalAssist</title>
    <style>${getEmailStyles()}</style>
</head>
<body class="body-bg" style="margin: 0; padding: 0; background-color: ${BRAND.light};">

    ${getPreheaderHtml(`Welcome back ${displayName}! Your TotalAssist ${planName} plan is active again.`)}

    <center style="width: 100%; background-color: ${BRAND.light}; padding: 40px 0;" class="body-bg">
        <!--[if mso]>
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center">
        <tr><td>
        <![endif]-->

        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

            ${getHeaderHtml("Welcome Back!", `Your ${planName} plan is active again`)}

            <tr>
                <td align="left" class="light-section content-padding" style="background-color: #ffffff; padding: 45px 40px;">
                    <p class="light-text" style="margin: 0 0 20px; color: ${BRAND.slate}; font-size: 18px; line-height: 1.6;">
                        Hey <strong style="color: ${BRAND.midnight};">${displayName}</strong>,
                    </p>
                    <p class="light-text-secondary" style="margin: 0 0 25px; color: ${BRAND.slateLight}; font-size: 16px; line-height: 1.75;">
                        Great news! Your TotalAssist <strong style="color: ${BRAND.scoutPurple};">${planName}</strong> plan is active again. All your features have been restored.
                    </p>
                    <p class="light-text-secondary" style="margin: 0; color: ${BRAND.slateLight}; font-size: 14px; line-height: 1.6;">
                        Your subscription will continue normally from your next billing date.
                    </p>
                </td>
            </tr>

            <tr>
                <td class="light-section content-padding" style="background-color: ${BRAND.light}; padding: 35px 40px;">
                    <p style="margin: 0 0 20px; color: ${BRAND.slate}; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Features restored</p>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        ${featuresHtml}
                    </table>
                </td>
            </tr>

            <tr>
                <td align="center" style="background: linear-gradient(135deg, ${BRAND.midnight} 0%, ${BRAND.midnightLight} 100%); padding: 50px 30px;">
                    <h2 style="margin: 0 0 15px; color: #ffffff; font-size: 26px; font-weight: 700; line-height: 1.3;">Pick up where you left off</h2>
                    <p style="margin: 0 0 30px; color: #94a3b8; font-size: 15px; line-height: 1.6;">
                        Your dashboard and session history are waiting for you.
                    </p>
                    ${getPrimaryButtonHtml("Go to Dashboard", APP_BASE_URL + "/dashboard")}
                </td>
            </tr>

            ${getFooterHtml()}

        </table>

        <!--[if mso]>
        </td></tr>
        </table>
        <![endif]-->
    </center>
</body>
</html>`;
}

export async function sendReactivationEmail(
  email: string,
  firstName: string | undefined,
  planName: string
): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  console.log(`[EMAIL] Sending reactivation email to ${email} (${planName})`);

  if (!resend) {
    console.log("[EMAIL] No RESEND_API_KEY found - Simulation Mode");
    console.log(`[EMAIL] To: ${email}, Plan: ${planName}`);
    return { success: true, simulated: true };
  }

  try {
    const data = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: `Welcome back to TotalAssist ${planName}!`,
      html: getReactivationHtml(firstName || "", planName),
      text: getReactivationText(firstName || "", planName),
    });

    if (data.error) {
      console.error("[EMAIL] Resend API Error:", data.error);
      return { success: false, error: data.error.message };
    }

    console.log("[EMAIL] Reactivation email sent:", data.data?.id);
    return { success: true };
  } catch (error) {
    console.error("[EMAIL] Failed to send reactivation email:", error);
    return { success: false, error: String(error) };
  }
}

// --- 7. Payment Failed (Dunning) ---

function getPaymentFailedText(firstName: string, planName: string): string {
  const displayName = firstName || "there";
  return `Action needed: Payment failed for your TotalAssist subscription

Hey ${displayName},

We were unable to process your payment for your TotalAssist ${planName} plan.

What happens next:
- We'll automatically retry the payment in a few days
- Your access continues while we retry
- If the payment continues to fail, your subscription may be canceled

Please update your payment method to avoid any interruption to your service.

Update Payment Method: ${APP_BASE_URL}/dashboard

---
Powered by TotalAssist
(c) ${new Date().getFullYear()} Smart Tek Labs. All rights reserved.
Privacy Policy: ${APP_BASE_URL}/privacy
Terms of Service: ${APP_BASE_URL}/terms`;
}

function getPaymentFailedHtml(firstName: string, planName: string): string {
  const displayName = firstName || "there";

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>Payment Issue - TotalAssist</title>
    <style>${getEmailStyles()}</style>
</head>
<body class="body-bg" style="margin: 0; padding: 0; background-color: ${BRAND.light};">

    ${getPreheaderHtml(`Payment failed for your TotalAssist ${planName} plan. Please update your payment method.`)}

    <center style="width: 100%; background-color: ${BRAND.light}; padding: 40px 0;" class="body-bg">
        <!--[if mso]>
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center">
        <tr><td>
        <![endif]-->

        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

            ${getHeaderHtml("Payment Issue", "Action needed for your subscription")}

            <!-- Red Warning Banner -->
            <tr>
              <td align="center" style="background-color: #fef2f2; padding: 20px 30px; border-bottom: 2px solid #fecaca;">
                <table border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-right: 12px;" valign="middle">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" valign="middle" width="44" height="44" style="width: 44px; height: 44px; background: #ef4444; border-radius: 50%; font-size: 20px; color: #ffffff;">!</td>
                        </tr>
                      </table>
                    </td>
                    <td>
                      <p style="margin: 0; color: #ef4444; font-size: 16px; font-weight: 700;">Your payment could not be processed</p>
                      <p style="margin: 4px 0 0; color: ${BRAND.slate}; font-size: 14px;">Please update your payment method</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
                <td align="left" class="light-section content-padding" style="background-color: #ffffff; padding: 45px 40px;">
                    <p class="light-text" style="margin: 0 0 20px; color: ${BRAND.slate}; font-size: 18px; line-height: 1.6;">
                        Hey <strong style="color: ${BRAND.midnight};">${displayName}</strong>,
                    </p>
                    <p class="light-text-secondary" style="margin: 0; color: ${BRAND.slateLight}; font-size: 16px; line-height: 1.75;">
                        We were unable to process your payment for your TotalAssist <strong style="color: ${BRAND.scoutPurple};">${planName}</strong> plan.
                    </p>
                </td>
            </tr>

            <tr>
                <td class="light-section content-padding" style="background-color: ${BRAND.light}; padding: 35px 40px;">
                    <p style="margin: 0 0 20px; color: ${BRAND.slate}; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">What happens next</p>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                            <td width="30" valign="top" style="padding-right: 12px; padding-bottom: 12px;">
                                <span style="color: ${BRAND.electricIndigo}; font-size: 16px;">1.</span>
                            </td>
                            <td valign="top" style="padding-bottom: 12px;">
                                <p class="light-text-secondary" style="margin: 0; color: ${BRAND.slateLight}; font-size: 14px; line-height: 1.5;">We'll automatically retry the payment in a few days</p>
                            </td>
                        </tr>
                        <tr>
                            <td width="30" valign="top" style="padding-right: 12px; padding-bottom: 12px;">
                                <span style="color: ${BRAND.electricIndigo}; font-size: 16px;">2.</span>
                            </td>
                            <td valign="top" style="padding-bottom: 12px;">
                                <p class="light-text-secondary" style="margin: 0; color: ${BRAND.slateLight}; font-size: 14px; line-height: 1.5;">Your access continues while we retry</p>
                            </td>
                        </tr>
                        <tr>
                            <td width="30" valign="top" style="padding-right: 12px;">
                                <span style="color: ${BRAND.electricIndigo}; font-size: 16px;">3.</span>
                            </td>
                            <td valign="top">
                                <p class="light-text-secondary" style="margin: 0; color: ${BRAND.slateLight}; font-size: 14px; line-height: 1.5;">If the payment continues to fail, your subscription may be canceled</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <tr>
                <td align="center" style="background: linear-gradient(135deg, ${BRAND.midnight} 0%, ${BRAND.midnightLight} 100%); padding: 50px 30px;">
                    <h2 style="margin: 0 0 15px; color: #ffffff; font-size: 26px; font-weight: 700; line-height: 1.3;">Keep your access</h2>
                    <p style="margin: 0 0 30px; color: #94a3b8; font-size: 15px; line-height: 1.6;">
                        Update your payment method to avoid any interruption.
                    </p>
                    ${getPrimaryButtonHtml("Update Payment Method", APP_BASE_URL + "/dashboard")}
                </td>
            </tr>

            ${getFooterHtml()}

        </table>

        <!--[if mso]>
        </td></tr>
        </table>
        <![endif]-->
    </center>
</body>
</html>`;
}

export async function sendPaymentFailedEmail(
  email: string,
  firstName: string | undefined,
  planName: string
): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  console.log(`[EMAIL] Sending payment failed email to ${email} (${planName})`);

  if (!resend) {
    console.log("[EMAIL] No RESEND_API_KEY found - Simulation Mode");
    console.log(`[EMAIL] To: ${email}, Plan: ${planName}`);
    return { success: true, simulated: true };
  }

  try {
    const data = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: "Action needed: Payment failed for your TotalAssist subscription",
      html: getPaymentFailedHtml(firstName || "", planName),
      text: getPaymentFailedText(firstName || "", planName),
    });

    if (data.error) {
      console.error("[EMAIL] Resend API Error:", data.error);
      return { success: false, error: data.error.message };
    }

    console.log("[EMAIL] Payment failed email sent:", data.data?.id);
    return { success: true };
  } catch (error) {
    console.error("[EMAIL] Failed to send payment failed email:", error);
    return { success: false, error: String(error) };
  }
}

// ============================================
// Case Reply Notification Email
// ============================================

export async function sendCaseReplyNotificationEmail(
  email: string,
  data: {
    customerFirstName: string | null;
    agentName: string;
    messagePreview: string;
    caseId: string;
    caseTitle: string;
  }
): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  console.log(`[EMAIL] Sending case reply notification to ${email} for case ${data.caseId}`);

  const displayName = data.customerFirstName || "there";
  const truncatedPreview = data.messagePreview.length > 500
    ? data.messagePreview.substring(0, 500) + "..."
    : data.messagePreview;
  const caseUrl = `${APP_BASE_URL}/dashboard?caseId=${data.caseId}`;

  if (!resend) {
    console.log("[EMAIL] No RESEND_API_KEY found - Simulation Mode");
    console.log(`[EMAIL] To: ${email}, Case: ${data.caseTitle}, Agent: ${data.agentName}`);
    return { success: true, simulated: true };
  }

  try {
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: `New message on your case: ${data.caseTitle}`,
      html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <title>New Message on Your Case</title>
    <style>${getEmailStyles()}</style>
</head>
<body class="body-bg" style="margin: 0; padding: 0; background-color: ${BRAND.light};">
    ${getPreheaderHtml(`${data.agentName} has replied to your support case "${data.caseTitle}".`)}
    <center style="width: 100%; background-color: ${BRAND.light}; padding: 40px 0;" class="body-bg">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            ${getHeaderHtml("New Message", "There's a reply on your support case.")}
            <tr>
                <td align="left" class="light-section content-padding" style="background-color: #ffffff; padding: 45px 40px;">
                    <p class="light-text" style="margin: 0 0 20px; color: ${BRAND.slate}; font-size: 18px; line-height: 1.6;">
                        Hi <strong style="color: ${BRAND.midnight};">${displayName}</strong>,
                    </p>
                    <p class="light-text-secondary" style="margin: 0 0 25px; color: ${BRAND.slateLight}; font-size: 16px; line-height: 1.75;">
                        <strong style="color: ${BRAND.midnight};">${data.agentName}</strong> has replied to your support case:
                    </p>
                    <!-- Quoted message preview block -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 25px;">
                        <tr>
                            <td class="card-bg" style="background-color: ${BRAND.light}; border-left: 4px solid ${BRAND.electricIndigo}; border-radius: 0 8px 8px 0; padding: 20px 24px;">
                                <p class="light-text-secondary" style="margin: 0; color: ${BRAND.slateLight}; font-size: 15px; line-height: 1.7; font-style: italic;">
                                    "${truncatedPreview}"
                                </p>
                            </td>
                        </tr>
                    </table>
                    <p class="light-text-secondary" style="margin: 0; color: ${BRAND.slateLight}; font-size: 16px; line-height: 1.75;">
                        View the full conversation and continue the discussion in your dashboard.
                    </p>
                </td>
            </tr>
            <tr>
                <td align="center" style="background: linear-gradient(135deg, ${BRAND.midnight} 0%, ${BRAND.midnightLight} 100%); padding: 50px 30px;">
                    ${getPrimaryButtonHtml("View Case", caseUrl)}
                </td>
            </tr>
            <tr>
                <td align="center" class="light-section" style="background-color: #ffffff; padding: 20px 40px;">
                    <p class="light-text-secondary" style="margin: 0; color: ${BRAND.slateLight}; font-size: 13px; line-height: 1.5;">
                        You're receiving this because there was activity on your TotalAssist support case.
                    </p>
                </td>
            </tr>
            ${getFooterHtml()}
        </table>
    </center>
</body>
</html>`,
      text: `Hi ${displayName},\n\n${data.agentName} has replied to your support case "${data.caseTitle}":\n\n"${truncatedPreview}"\n\nView the full conversation: ${caseUrl}\n\n---\nYou're receiving this because there was activity on your TotalAssist support case.\n\nPowered by TotalAssist\n(c) ${new Date().getFullYear()} Smart Tek Labs. All rights reserved.\nPrivacy Policy: ${APP_BASE_URL}/privacy\nTerms of Service: ${APP_BASE_URL}/terms`,
    });

    if (result.error) {
      console.error("[EMAIL] Resend API Error:", result.error);
      return { success: false, error: result.error.message };
    }

    console.log("[EMAIL] Case reply notification email sent:", result.data?.id);
    return { success: true };
  } catch (error) {
    console.error("[EMAIL] Failed to send case reply notification email:", error);
    return { success: false, error: String(error) };
  }
}
