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
      <td align="center" bgcolor="${BRAND.electricIndigo}" style="background-color: ${BRAND.electricIndigo}; background: linear-gradient(135deg, ${BRAND.scoutPurple} 0%, ${BRAND.electricIndigo} 50%, ${BRAND.midnight} 100%); padding: 50px 30px;">
      <!--<![endif]-->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center" style="padding-bottom: 25px;">
              <img src="${IMAGE_BASE_URL}/total_assist_logo-new.png" alt="TotalAssist" width="160" style="display: block; max-width: 160px; height: auto;">
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
        <img src="${IMAGE_BASE_URL}/total_assist_logo-new.png" alt="TotalAssist" width="100" style="display: block; max-width: 100px; height: auto; margin-bottom: 20px; opacity: 0.9;">

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
        <td align="center" bgcolor="${BRAND.electricIndigo}" style="border-radius: 12px; background-color: ${BRAND.electricIndigo}; background: linear-gradient(135deg, ${BRAND.scoutPurple} 0%, ${BRAND.electricIndigo} 100%); box-shadow: 0 10px 30px rgba(168, 85, 247, 0.35);">
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
                            <td width="50%" valign="top" style="padding-right: 10px; padding-bottom: 20px;">
                                <table border="0" cellpadding="0" cellspacing="0" width="100%" class="card-bg" style="background: #ffffff; border-radius: 12px; border: 1px solid ${BRAND.lightMuted};">
                                    <tr>
                                        <td style="padding: 20px;">
                                            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, ${BRAND.scoutPurple}, ${BRAND.electricIndigo}); border-radius: 10px; margin-bottom: 12px; text-align: center; line-height: 40px; font-size: 18px;">💬</div>
                                            <p style="margin: 0 0 5px; color: ${BRAND.midnight}; font-size: 14px; font-weight: 600;">Support Chat</p>
                                            <p style="margin: 0; color: ${BRAND.slateLight}; font-size: 13px; line-height: 1.5;">Get instant answers to tech questions</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                            <td width="50%" valign="top" style="padding-left: 10px; padding-bottom: 20px;">
                                <table border="0" cellpadding="0" cellspacing="0" width="100%" class="card-bg" style="background: #ffffff; border-radius: 12px; border: 1px solid ${BRAND.lightMuted};">
                                    <tr>
                                        <td style="padding: 20px;">
                                            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, ${BRAND.electricIndigo}, ${BRAND.electricCyan}); border-radius: 10px; margin-bottom: 12px; text-align: center; line-height: 40px; font-size: 18px;">📸</div>
                                            <p style="margin: 0 0 5px; color: ${BRAND.midnight}; font-size: 14px; font-weight: 600;">Photo Analysis</p>
                                            <p style="margin: 0; color: ${BRAND.slateLight}; font-size: 13px; line-height: 1.5;">Snap a photo, get a diagnosis</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td width="50%" valign="top" style="padding-right: 10px;">
                                <table border="0" cellpadding="0" cellspacing="0" width="100%" class="card-bg" style="background: #ffffff; border-radius: 12px; border: 1px solid ${BRAND.lightMuted};">
                                    <tr>
                                        <td style="padding: 20px;">
                                            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, ${BRAND.scoutPurple}, ${BRAND.electricCyan}); border-radius: 10px; margin-bottom: 12px; text-align: center; line-height: 40px; font-size: 18px;">📚</div>
                                            <p style="margin: 0 0 5px; color: ${BRAND.midnight}; font-size: 14px; font-weight: 600;">Session History</p>
                                            <p style="margin: 0; color: ${BRAND.slateLight}; font-size: 13px; line-height: 1.5;">All solutions saved for you</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                            <td width="50%" valign="top" style="padding-left: 10px;">
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <!-- CTA Section -->
            <tr>
                <td align="center" style="background: linear-gradient(135deg, ${BRAND.midnight} 0%, ${BRAND.midnightLight} 100%); padding: 50px 30px;">
                    <div style="display: inline-block; background: linear-gradient(135deg, ${BRAND.scoutPurple}, ${BRAND.electricIndigo}); color: #ffffff; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; padding: 6px 14px; border-radius: 20px; margin-bottom: 20px;">
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

            <!-- Testimonial -->
            <tr>
                <td class="light-section content-padding" style="background-color: #ffffff; padding: 40px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" class="card-bg" style="background: linear-gradient(135deg, ${BRAND.scoutPurple}08, ${BRAND.electricIndigo}08); border-radius: 16px; border: 1px solid ${BRAND.scoutPurple}20;">
                        <tr>
                            <td style="padding: 30px;">
                                <p class="light-text" style="margin: 0 0 20px; font-family: Georgia, serif; font-style: italic; color: ${BRAND.slate}; font-size: 17px; line-height: 1.7;">
                                    "I was skeptical at first, but <strong style="color: ${BRAND.scoutPurple};">TotalAssist</strong> actually understood my router problem and fixed it in under 5 minutes. Incredible."
                                </p>
                                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td valign="middle" width="56" style="padding-right: 12px;">
                                            <div style="width: 44px; height: 44px; background: linear-gradient(135deg, ${BRAND.scoutPurple}, ${BRAND.electricIndigo}); border-radius: 50%; text-align: center; line-height: 44px; color: white; font-weight: 600;">JM</div>
                                        </td>
                                        <td valign="middle">
                                            <span class="light-text" style="color: ${BRAND.midnight}; font-weight: 600; font-size: 14px; display: block;">James Morrison</span>
                                            <span class="light-text-secondary" style="color: ${BRAND.slateLight}; font-size: 13px;">Denver, CO</span>
                                        </td>
                                    </tr>
                                </table>
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
                        <td align="center" valign="middle" width="70" height="70" style="width: 70px; height: 70px; background: linear-gradient(135deg, ${BRAND.scoutPurple}, ${BRAND.electricIndigo}); border-radius: 50%; font-size: 32px; box-shadow: 0 15px 35px rgba(168, 85, 247, 0.4);">
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
                    <div style="display: inline-block; background: linear-gradient(135deg, ${BRAND.scoutPurple}, ${BRAND.electricIndigo}); color: #ffffff; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; padding: 6px 14px; border-radius: 20px; margin-bottom: 20px;">
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
    <div style="background: linear-gradient(135deg, ${BRAND.scoutPurple}, ${BRAND.electricIndigo}); padding: 30px; text-align: center;">
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
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>Your TotalAssist Session Guide</title>
    <style>${getEmailStyles()}</style>
</head>
<body class="body-bg" style="margin: 0; padding: 0; background-color: ${BRAND.light};">

    ${getPreheaderHtml(`Your personalized guide from ${formattedDate} is attached. Includes step-by-step instructions and troubleshooting tips.`)}

    <center style="width: 100%; background-color: ${BRAND.light}; padding: 40px 0;" class="body-bg">
        <!--[if mso]>
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center">
        <tr><td>
        <![endif]-->

        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

            ${getHeaderHtml("Your Session Guide", formattedDate)}

            <!-- Content Section -->
            <tr>
                <td align="left" class="light-section content-padding" style="background-color: #ffffff; padding: 45px 40px;">
                    <p class="light-text" style="margin: 0 0 20px; color: ${BRAND.slate}; font-size: 18px; line-height: 1.6;">
                        Hey <strong style="color: ${BRAND.midnight};">${displayName}</strong>,
                    </p>
                    <p class="light-text-secondary" style="margin: 0 0 25px; color: ${BRAND.slateLight}; font-size: 16px; line-height: 1.75;">
                        Thank you for using <strong style="color: ${BRAND.scoutPurple};">TotalAssist</strong>! We've put together a personalized guide based on your recent support session.
                    </p>
                </td>
            </tr>

            <!-- Summary Card -->
            <tr>
                <td class="light-section content-padding" style="background-color: ${BRAND.light}; padding: 0 40px 35px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" class="card-bg" style="background: linear-gradient(135deg, ${BRAND.scoutPurple}08, ${BRAND.electricIndigo}08); border-radius: 16px; border: 1px solid ${BRAND.scoutPurple}20;">
                        <tr>
                            <td style="padding: 25px;">
                                <p style="margin: 0 0 10px; color: ${BRAND.scoutPurple}; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Session Summary</p>
                                <p class="light-text" style="margin: 0; color: ${BRAND.midnight}; font-size: 16px; font-weight: 600; line-height: 1.6;">
                                    ${summary || "Session completed successfully"}
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <!-- PDF Contents -->
            <tr>
                <td align="left" class="light-section content-padding" style="background-color: #ffffff; padding: 35px 40px;">
                    <p class="light-text-secondary" style="margin: 0 0 20px; color: ${BRAND.slateLight}; font-size: 16px; line-height: 1.75;">
                        Your complete how-to guide is attached as a PDF. It includes:
                    </p>

                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                            <td width="30" valign="top" style="padding-right: 12px; padding-bottom: 15px;">
                                <span style="color: ${BRAND.scoutPurple}; font-size: 16px;">✓</span>
                            </td>
                            <td valign="top" style="padding-bottom: 15px;">
                                <p class="light-text-secondary" style="margin: 0; color: ${BRAND.slateLight}; font-size: 15px; line-height: 1.5;">Step-by-step instructions we discussed</p>
                            </td>
                        </tr>
                        <tr>
                            <td width="30" valign="top" style="padding-right: 12px; padding-bottom: 15px;">
                                <span style="color: ${BRAND.scoutPurple}; font-size: 16px;">✓</span>
                            </td>
                            <td valign="top" style="padding-bottom: 15px;">
                                <p class="light-text-secondary" style="margin: 0; color: ${BRAND.slateLight}; font-size: 15px; line-height: 1.5;">Full conversation transcript</p>
                            </td>
                        </tr>
                        <tr>
                            <td width="30" valign="top" style="padding-right: 12px;">
                                <span style="color: ${BRAND.scoutPurple}; font-size: 16px;">✓</span>
                            </td>
                            <td valign="top">
                                <p class="light-text-secondary" style="margin: 0; color: ${BRAND.slateLight}; font-size: 15px; line-height: 1.5;">Key troubleshooting tips and next steps</p>
                            </td>
                        </tr>
                    </table>

                    <p class="light-text-secondary" style="margin: 20px 0 0; color: ${BRAND.slateLight}; font-size: 15px; line-height: 1.75;">
                        Save this guide for future reference - it's tailored specifically to your situation!
                    </p>
                </td>
            </tr>

            <!-- CTA Section -->
            <tr>
                <td align="center" style="background: linear-gradient(135deg, ${BRAND.midnight} 0%, ${BRAND.midnightLight} 100%); padding: 50px 30px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 20px;">
                      <tr>
                        <td align="center" valign="middle" width="60" height="60" style="width: 60px; height: 60px; background: linear-gradient(135deg, ${BRAND.scoutPurple}, ${BRAND.electricIndigo}); border-radius: 50%; font-size: 28px; box-shadow: 0 15px 35px rgba(168, 85, 247, 0.4);">
                          📎
                        </td>
                      </tr>
                    </table>

                    <h2 style="margin: 0 0 10px; color: #ffffff; font-size: 22px; font-weight: 700;">Check Your Attachment</h2>

                    <p style="margin: 0 0 30px; color: #94a3b8; font-size: 15px; line-height: 1.6;">
                        Your personalized guide is attached to this email as a PDF.
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
