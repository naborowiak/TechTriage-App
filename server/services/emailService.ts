import { Resend } from "resend";

// Initialize Resend with API Key
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Base URL for images and app
const IMAGE_BASE_URL = "https://tech-triage-site.replit.app";
const APP_BASE_URL = process.env.APP_URL || "https://tech-triage-site.replit.app";

// Default sender - use your verified domain
const DEFAULT_SENDER = "support@trytechtriage.com";
const EMAIL_FROM = process.env.EMAIL_FROM || `TechTriage <${DEFAULT_SENDER}>`;

// Generate the welcome email HTML
function getWelcomeEmailHtml(firstName: string): string {
  const displayName = firstName || "there";

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>Welcome to TechTriage</title>
    <style>
        :root { color-scheme: light dark; supported-color-schemes: light dark; }
        body { margin: 0; padding: 0; min-width: 100%; width: 100% !important; height: 100% !important; background-color: #f4f4f4; }
        body, table, td, div, p, a { -webkit-font-smoothing: antialiased; text-size-adjust: 100%; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; line-height: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse !important; border-spacing: 0; }
        img { border: 0; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }

        /* Mobile styles */
        @media only screen and (max-width: 599px) {
            .mobile-full { width: 100% !important; max-width: 100% !important; display: block !important; }
            .mobile-padding { padding: 30px 20px !important; }
            .hero-text { font-size: 28px !important; }
        }

        /* Dark mode styles */
        @media (prefers-color-scheme: dark) {
            body, .body-bg { background-color: #1a1a1a !important; }
            .email-container { background-color: #2d2d2d !important; }
            .light-section { background-color: #2d2d2d !important; background-image: none !important; }
            .light-text { color: #e5e5e5 !important; }
            .light-text-secondary { color: #a3a3a3 !important; }
            .testimonial-section { background-color: #262626 !important; border-color: #404040 !important; }
            .testimonial-text { color: #e5e5e5 !important; }
            .testimonial-name { color: #ffffff !important; }
        }

        /* Gmail dark mode */
        [data-ogsc] .light-section { background-color: #2d2d2d !important; background-image: none !important; }
        [data-ogsc] .light-text { color: #e5e5e5 !important; }
        [data-ogsc] .light-text-secondary { color: #a3a3a3 !important; }
        [data-ogsc] .testimonial-section { background-color: #262626 !important; }
    </style>
    </head>
<body class="body-bg" style="margin: 0; padding: 0; background-color: #f4f4f4;">

    <center style="width: 100%; background-color: #f4f4f4;" class="body-bg">

        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.15); font-family: Helvetica, Arial, sans-serif;">

            <tr>
                <td align="center" style="background-color: #1e2b45; background: radial-gradient(circle at 50% 0%, #2a3c5e 0%, #0f172a 80%); padding: 45px 20px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                            <td align="center" style="padding-bottom: 25px;">
                                <img src="${IMAGE_BASE_URL}/tech-triage-white.png" alt="TechTriage Logo" width="150" style="display: block; max-width: 150px; height: auto;">
                            </td>
                        </tr>
                        <tr>
                            <td align="center">
                                <h1 class="hero-text" style="margin: 0; color: #ffffff; font-size: 36px; font-weight: 800; letter-spacing: -1px; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">You're Covered.</h1>
                                <p style="margin: 0; color: #cbd5e1; font-size: 18px; padding-top: 12px; font-weight: 300;">Expert tech support is now in your pocket.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <tr>
                <td align="center" class="light-section" bgcolor="#ffffff" style="border-bottom: 4px solid #e66a00;">
                    <img src="${IMAGE_BASE_URL}/tech-triage-home.png" alt="TechTriage Support" width="600" style="display: block; width: 100%; max-width: 600px; height: auto;">
                </td>
            </tr>

            <tr>
                <td align="left" class="light-section" style="background-color: #ffffff; background-image: linear-gradient(#f1f5f9 1px, transparent 1px), linear-gradient(90deg, #f1f5f9 1px, transparent 1px); background-size: 25px 25px; padding: 50px 40px;">
                    <p class="light-text" style="margin: 0 0 25px; color: #334155; font-size: 18px; line-height: 1.6;">
                        Hey <strong>${displayName}</strong>, Welcome to <strong style="color: #e66a00;">TechTriage</strong>!
                    </p>
                    <p class="light-text-secondary" style="margin: 0; color: #475569; font-size: 16px; line-height: 1.8;">
                        Time to experience first hand just how easy it is to get tech help with TechTriage. The best part? No more waiting on hold or explaining the same router issue three times.
                    </p>
                </td>
            </tr>

            <tr>
                <td align="center" style="background-color: #e66a00; background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.05) 10px, rgba(0,0,0,0.05) 20px); padding: 60px 30px;">

                    <div style="display: inline-block; background-color: rgba(0,0,0,0.2); color: #ffffff; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; padding: 6px 12px; border-radius: 20px; margin-bottom: 20px;">
                        Step 1
                    </div>

                    <h2 style="margin: 0 0 35px; color: #ffffff; font-size: 28px; font-weight: 800; line-height: 1.2;">See how easy it is<br>to get help</h2>

                    <table border="0" cellpadding="0" cellspacing="0">
                        <tr>
                            <td align="center" bgcolor="#1e2b45" style="border-radius: 50px; box-shadow: 0 8px 20px rgba(30, 43, 69, 0.4);">
                                <a href="https://techtriage.app" target="_blank" style="display: block; padding: 20px 45px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 18px; border-radius: 50px; border: 2px solid #1e2b45;">Start Your First Request &rarr;</a>
                            </td>
                        </tr>
                    </table>

                    <p style="margin: 25px 0 0; color: #fff0db; font-size: 14px; font-weight: 500;">
                        Estimated time to complete: <strong>3 mins</strong>
                    </p>
                </td>
            </tr>

            <tr>
                <td class="testimonial-section" style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 40px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                            <td width="70" valign="top" style="padding-right: 20px;">
                                <img src="${IMAGE_BASE_URL}/tech-triage-logo.png" alt="Customer" width="70" style="display: block; border-radius: 50%;">
                            </td>
                            <td valign="top">
                                <p class="testimonial-text" style="margin: 0 0 15px; font-family: Georgia, serif; font-style: italic; color: #334155; font-size: 17px; line-height: 1.6;">
                                    "I knew that <strong style="color: #e66a00;">TechTriage</strong> was the right choice when I didn't have to spend an hour on hold just to reset my router."
                                </p>
                                <div>
                                    <span class="testimonial-name" style="color: #1e2b45; font-weight: bold; font-size: 15px;">Sarah Mitchell</span>
                                    <span style="color: #94a3b8; font-size: 14px;"> &mdash; Austin, TX</span>
                                </div>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <tr>
                <td align="center" style="background-color: #1e2b45; padding: 40px 20px; border-top: 5px solid #0f172a;">
                    <img src="${IMAGE_BASE_URL}/tech-triage-white.png" alt="TechTriage" width="80" style="display: block; max-width: 80px; height: auto; margin-bottom: 20px;">

                    <p style="color: #64748b; font-size: 12px; margin: 0 0 10px;">
                        &copy; 2025 TechTriage. All rights reserved.
                    </p>
                    <p style="margin: 0;">
                        <a href="#" style="color: #94a3b8; text-decoration: none; font-size: 12px; margin: 0 10px;">Privacy Policy</a>
                        <span style="color: #475569;">|</span>
                        <a href="#" style="color: #94a3b8; text-decoration: none; font-size: 12px; margin: 0 10px;">Unsubscribe</a>
                    </p>
                </td>
            </tr>

        </table>
    </center>
</body>
</html>`;
}

// Generate the verification email HTML
function getVerificationEmailHtml(firstName: string, verificationUrl: string): string {
  const displayName = firstName || "there";

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>Verify Your Email - TechTriage</title>
    <style>
        :root { color-scheme: light dark; supported-color-schemes: light dark; }
        body { margin: 0; padding: 0; min-width: 100%; width: 100% !important; height: 100% !important; background-color: #f4f4f4; }
        body, table, td, div, p, a { -webkit-font-smoothing: antialiased; text-size-adjust: 100%; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; line-height: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse !important; border-spacing: 0; }
        img { border: 0; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }

        /* Mobile styles */
        @media only screen and (max-width: 599px) {
            .mobile-full { width: 100% !important; max-width: 100% !important; display: block !important; }
            .mobile-padding { padding: 30px 20px !important; }
            .hero-text { font-size: 28px !important; }
        }

        /* Dark mode styles */
        @media (prefers-color-scheme: dark) {
            body, .body-bg { background-color: #1a1a1a !important; }
            .email-container { background-color: #2d2d2d !important; }
            .light-section { background-color: #2d2d2d !important; background-image: none !important; }
            .light-text { color: #e5e5e5 !important; }
            .light-text-secondary { color: #a3a3a3 !important; }
        }

        /* Gmail dark mode */
        [data-ogsc] .light-section { background-color: #2d2d2d !important; background-image: none !important; }
        [data-ogsc] .light-text { color: #e5e5e5 !important; }
        [data-ogsc] .light-text-secondary { color: #a3a3a3 !important; }
    </style>
    </head>
<body class="body-bg" style="margin: 0; padding: 0; background-color: #f4f4f4;">

    <center style="width: 100%; background-color: #f4f4f4;" class="body-bg">

        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.15); font-family: Helvetica, Arial, sans-serif;">

            <tr>
                <td align="center" style="background-color: #1e2b45; background: radial-gradient(circle at 50% 0%, #2a3c5e 0%, #0f172a 80%); padding: 45px 20px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                            <td align="center" style="padding-bottom: 25px;">
                                <img src="${IMAGE_BASE_URL}/tech-triage-white.png" alt="TechTriage Logo" width="150" style="display: block; max-width: 150px; height: auto;">
                            </td>
                        </tr>
                        <tr>
                            <td align="center">
                                <h1 class="hero-text" style="margin: 0; color: #ffffff; font-size: 36px; font-weight: 800; letter-spacing: -1px; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">Verify Your Email</h1>
                                <p style="margin: 0; color: #cbd5e1; font-size: 18px; padding-top: 12px; font-weight: 300;">One quick step to get started.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <tr>
                <td align="left" class="light-section" style="background-color: #ffffff; background-image: linear-gradient(#f1f5f9 1px, transparent 1px), linear-gradient(90deg, #f1f5f9 1px, transparent 1px); background-size: 25px 25px; padding: 50px 40px;">
                    <p class="light-text" style="margin: 0 0 25px; color: #334155; font-size: 18px; line-height: 1.6;">
                        Hey <strong>${displayName}</strong>,
                    </p>
                    <p class="light-text-secondary" style="margin: 0 0 25px; color: #475569; font-size: 16px; line-height: 1.8;">
                        Thanks for signing up for <strong style="color: #e66a00;">TechTriage</strong>! Please verify your email address by clicking the button below.
                    </p>
                    <p class="light-text-secondary" style="margin: 0; color: #475569; font-size: 14px; line-height: 1.8;">
                        This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
                    </p>
                </td>
            </tr>

            <tr>
                <td align="center" style="background-color: #e66a00; background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.05) 10px, rgba(0,0,0,0.05) 20px); padding: 50px 30px;">
                    <table border="0" cellpadding="0" cellspacing="0">
                        <tr>
                            <td align="center" bgcolor="#1e2b45" style="border-radius: 50px; box-shadow: 0 8px 20px rgba(30, 43, 69, 0.4);">
                                <a href="${verificationUrl}" target="_blank" style="display: block; padding: 20px 45px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 18px; border-radius: 50px; border: 2px solid #1e2b45;">Verify Email Address &rarr;</a>
                            </td>
                        </tr>
                    </table>

                    <p style="margin: 25px 0 0; color: #fff0db; font-size: 14px; font-weight: 500;">
                        Or copy and paste this link into your browser:
                    </p>
                    <p style="margin: 10px 0 0; color: #ffffff; font-size: 12px; word-break: break-all;">
                        ${verificationUrl}
                    </p>
                </td>
            </tr>

            <tr>
                <td align="center" style="background-color: #1e2b45; padding: 40px 20px; border-top: 5px solid #0f172a;">
                    <img src="${IMAGE_BASE_URL}/tech-triage-white.png" alt="TechTriage" width="80" style="display: block; max-width: 80px; height: auto; margin-bottom: 20px;">

                    <p style="color: #64748b; font-size: 12px; margin: 0 0 10px;">
                        &copy; 2025 TechTriage. All rights reserved.
                    </p>
                    <p style="margin: 0;">
                        <a href="#" style="color: #94a3b8; text-decoration: none; font-size: 12px; margin: 0 10px;">Privacy Policy</a>
                        <span style="color: #475569;">|</span>
                        <a href="#" style="color: #94a3b8; text-decoration: none; font-size: 12px; margin: 0 10px;">Contact Support</a>
                    </p>
                </td>
            </tr>

        </table>
    </center>
</body>
</html>`;
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
      subject: "Welcome to TechTriage - You're Covered!",
      html: getWelcomeEmailHtml(firstName || ""),
    });

    if (data.error) {
      console.error("[EMAIL] Resend API Error:", data.error);
      return { success: false, error: data.error.message };
    }

    console.log("[EMAIL] Welcome email sent via Resend:", data.id);
    return { success: true };
  } catch (error) {
    console.error("[EMAIL] Failed to send welcome email:", error);
    return { success: false, error: String(error) };
  }
}

// Send verification email to a new user
export async function sendVerificationEmail(
  email: string,
  token: string,
  firstName?: string
): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  console.log(`[EMAIL] Sending verification email to ${email}`);

  const verificationUrl = `${APP_BASE_URL}/verify-email?token=${token}`;

  if (!resend) {
    console.log("[EMAIL] No RESEND_API_KEY found - Simulation Mode");
    console.log(`[EMAIL] To: ${email}`);
    console.log(`[EMAIL] Verification URL: ${verificationUrl}`);
    return { success: true, simulated: true };
  }

  try {
    const data = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: "Verify Your Email - TechTriage",
      html: getVerificationEmailHtml(firstName || "", verificationUrl),
    });

    if (data.error) {
      console.error("[EMAIL] Resend API Error:", data.error);
      return { success: false, error: data.error.message };
    }

    console.log("[EMAIL] Verification email sent via Resend:", data.id);
    return { success: true };
  } catch (error) {
    console.error("[EMAIL] Failed to send verification email:", error);
    return { success: false, error: String(error) };
  }
}