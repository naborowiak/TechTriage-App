import nodemailer from "nodemailer";

// Email transporter configuration
const createEmailTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  console.log("[EMAIL] No SMTP config found - email sending will be simulated");
  return null;
};

// Generate the welcome email HTML
function getWelcomeEmailHtml(firstName: string): string {
  const displayName = firstName || "there";

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to TechTriage</title>
    <style>
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        table { border-collapse: collapse !important; }
        body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; font-family: Helvetica, Arial, sans-serif; background-color: #f4f4f4; }
        @media screen and (max-width: 600px) {
            .email-container { width: 100% !important; }
            .stack-column { display: block !important; width: 100% !important; max-width: 100% !important; }
            .mobile-padding { padding: 20px !important; }
            .hero-text { font-size: 28px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4;">

    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td align="center" style="padding: 20px 0;">

                <table border="0" cellpadding="0" cellspacing="0" width="600" class="email-container" style="background-color: #ffffff; margin: 0 auto; width: 600px;">

                    <!-- HERO SECTION WITH IMAGE -->
                    <tr>
                        <td align="center" style="background-color: #1a365d;">
                            <img src="https://techtriage.app/tech-triage-home.png" alt="TechTriage" width="600" style="display: block; width: 100%; height: auto;">
                        </td>
                    </tr>

                    <!-- HEADLINE -->
                    <tr>
                        <td align="center" style="background-color: #1a365d; padding: 30px 20px 40px 20px;">
                            <h1 class="hero-text" style="margin: 0; font-size: 32px; color: #ffffff; font-weight: bold; text-align: center;">
                                You're Covered.
                            </h1>
                            <p style="margin: 8px 0 0 0; font-size: 16px; color: #cbd5e0; text-align: center;">
                                Expert tech support is now in your pocket
                            </p>
                        </td>
                    </tr>

                    <!-- VIEW IN BROWSER -->
                    <tr>
                        <td align="right" style="padding: 15px 20px; background-color: #ffffff;">
                            <a href="https://techtriage.app" style="font-size: 12px; color: #718096; text-decoration: underline;">View in browser</a>
                        </td>
                    </tr>

                    <!-- WELCOME TEXT -->
                    <tr>
                        <td class="mobile-padding" style="padding: 10px 40px 30px 40px; background-color: #ffffff;">
                            <p style="margin: 0 0 15px 0; font-size: 16px; color: #1a202c;">
                                Hey ${displayName}, Welcome to <a href="https://techtriage.app" style="color: #1a365d; font-weight: bold; text-decoration: underline;">TechTriage</a>!
                            </p>
                            <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #4a5568;">
                                Time to experience first hand just how easy it is to get tech help with <a href="https://techtriage.app" style="color: #1a365d; text-decoration: underline;">TechTriage</a>. The best part? No more waiting on hold or explaining the same issue three times.
                            </p>
                        </td>
                    </tr>

                    <!-- STEP 1 CTA SECTION -->
                    <tr>
                        <td align="center" style="background-color: #f97316; padding: 35px 20px;">
                            <p style="margin: 0 0 5px 0; font-size: 14px; color: #ffffff; font-weight: bold; letter-spacing: 1px;">
                                Step 1:
                            </p>
                            <h2 style="margin: 0 0 20px 0; font-size: 22px; color: #ffffff; font-weight: normal;">
                                See how easy it is to get help
                            </h2>

                            <table border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" bgcolor="#1a365d" style="border-radius: 4px;">
                                        <a href="https://techtriage.app" target="_blank" style="padding: 14px 28px; border-radius: 4px; font-family: Helvetica, Arial, sans-serif; font-size: 15px; color: #ffffff; text-decoration: none; font-weight: bold; display: inline-block;">
                                            Start Your First Request
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 18px 0 0 0; font-size: 13px; color: #ffffff;">
                                Estimated time to complete: <span style="color: #1a365d; font-weight: bold;">3 mins</span>
                            </p>
                        </td>
                    </tr>

                    <!-- TESTIMONIAL SECTION -->
                    <tr>
                        <td style="padding: 0; background-color: #ffffff;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td valign="top" width="45%" class="stack-column" style="background-color: #1a365d;">
                                        <img src="https://techtriage.app/tech-triage-home.png" alt="Customer" width="270" style="display: block; width: 100%; height: auto;">
                                    </td>
                                    <td valign="middle" width="55%" class="stack-column" style="padding: 30px; background-color: #ffffff;">
                                        <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.5; color: #1a202c;">
                                            "<span style="background-color: #fef3c7;">I knew that TechTriage was the right choice</span> when I didn't have to spend an hour on hold just to reset my router."
                                        </p>
                                        <p style="margin: 0; font-size: 14px; color: #1a202c; font-weight: bold;">
                                            Sarah Mitchell
                                        </p>
                                        <p style="margin: 2px 0 0 0; font-size: 13px; color: #718096;">
                                            Homeowner <span style="color: #f97316;">&#9679;</span> Austin, TX
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- SECONDARY IMAGE -->
                    <tr>
                        <td align="center" style="background-color: #f7fafc;">
                            <img src="https://techtriage.app/tech-triage-logo.png" alt="TechTriage Logo" width="120" style="display: block; padding: 40px 0;">
                        </td>
                    </tr>

                    <!-- HAVE A QUESTION SECTION -->
                    <tr>
                        <td align="center" style="background-color: #ffffff; padding: 35px 20px;">
                            <h2 style="margin: 0 0 20px 0; font-size: 22px; color: #f97316; font-weight: bold;">
                                Have a question?
                            </h2>
                            <p style="margin: 0 0 8px 0; font-size: 15px; color: #4a5568;">
                                Book a call with a <a href="https://techtriage.app" style="color: #1a365d; text-decoration: underline; font-weight: bold;">Product Expert here</a>
                            </p>
                            <p style="margin: 0 0 8px 0; font-size: 15px; color: #4a5568;">
                                Chat with us at: <a href="https://techtriage.app" style="color: #1a365d; text-decoration: none; font-weight: bold;">techtriage.app</a>
                            </p>
                            <p style="margin: 0; font-size: 15px; color: #4a5568;">
                                <a href="mailto:support@techtriage.app" style="color: #1a365d; text-decoration: underline;">Reply to this email</a> and we'll be in touch
                            </p>
                        </td>
                    </tr>

                    <!-- SOCIAL ICONS -->
                    <tr>
                        <td align="center" style="padding: 25px 20px; background-color: #ffffff; border-top: 1px solid #e2e8f0;">
                            <table border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding: 0 8px;"><a href="#" style="color: #1a365d; font-size: 20px; text-decoration: none;">&#9679;</a></td>
                                    <td style="padding: 0 8px;"><a href="#" style="color: #1a365d; font-size: 20px; text-decoration: none;">&#9679;</a></td>
                                    <td style="padding: 0 8px;"><a href="#" style="color: #1a365d; font-size: 20px; text-decoration: none;">&#9679;</a></td>
                                    <td style="padding: 0 8px;"><a href="#" style="color: #1a365d; font-size: 20px; text-decoration: none;">&#9679;</a></td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- FOOTER -->
                    <tr>
                        <td align="center" style="padding: 20px; background-color: #ffffff;">
                            <p style="font-size: 12px; color: #718096; line-height: 1.6; margin: 0 0 15px 0;">
                                <span style="color: #1a365d; font-weight: bold;">TechTriage</span><br>
                                Expert Tech Support for Your Home<br>
                                <a href="#" style="color: #1a202c; text-decoration: underline;">Unsubscribe</a> &nbsp; <a href="#" style="color: #1a202c; text-decoration: underline;">Manage preferences</a>
                            </p>
                            <img src="https://techtriage.app/tech-triage-logo.png" alt="TechTriage" width="60" style="display: block; margin: 0 auto;">
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>

</body>
</html>`;
}

// Send welcome email to a new user
export async function sendWelcomeEmail(email: string, firstName?: string): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  console.log(`[EMAIL] Sending welcome email to ${email}`);

  const transporter = createEmailTransporter();

  if (!transporter) {
    // Simulate email sending in development
    console.log("[EMAIL] Simulated welcome email send to:", email);
    console.log("[EMAIL] Subject: Welcome to TechTriage!");
    return { success: true, simulated: true };
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"TechTriage" <support@techtriage.app>',
      to: email,
      subject: "Welcome to TechTriage - You're Covered!",
      html: getWelcomeEmailHtml(firstName || ""),
    });

    console.log("[EMAIL] Welcome email successfully sent to:", email);
    return { success: true };
  } catch (error) {
    console.error("[EMAIL] Failed to send welcome email:", error);
    return { success: false, error: String(error) };
  }
}
