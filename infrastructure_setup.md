# Infrastructure Setup Checklist for TotalAssist

**Target Domain:** totalassist.tech

**AI Persona:** Scout AI

This revised infrastructure checklist is reorganized to be strictly sequential, ensuring you have the professional communication hub (Zoho) and branding ready before you touch the technical backend.

---

## 1. Professional Communications (Zoho Mail)

Before setting up any other service, you must create a "home" for your business communications. This provides the email addresses you will use to register everything else.

- **Create Zoho Account:** Sign up for the "Forever Free" plan at Zoho Mail.
- **Verify Domain:** Add the required TXT/CNAME records at your registrar to verify totalassist.tech.
- **Configure MX Records:** Add Zoho's MX records to your DNS settings to receive mail.
- **Create Primary Business Email:** Set up neal@totalassist.tech.
- **Create Support Alias:** Create support@totalassist.tech. This is the address that will be visible to your customers for help and on the Google OAuth consent screen.
- **Authentication (SPF & DKIM):** Add these TXT records to your DNS. This ensures emails sent from your Zoho inbox (manual replies to users) don't go to spam.

---

## 2. Service Account Registration Strategy

Use your new neal@totalassist.tech email to sign up for all subsequent accounts. This keeps your business data separate from your personal life in Affton.

- **Primary Gmail (Management Only):** Since you are using a free Google account for OAuth, continue using your personal Gmail, but name the Project specifically for the brand.

---

## 3. Google Cloud (Auth & AI Engine)

- **Create Google Cloud Project:**
  - Name: `TotalAssist-Prod`
  - User Support Email: Use your Zoho address: support@totalassist.tech.

- **Configure OAuth Consent Screen:**
  - App Name: TotalAssist.
  - Developer Contact: neal@totalassist.tech.
  - Authorized Domain: totalassist.tech.

- **Create OAuth Credentials:**
  - Application type: Web application.
  - Authorized Redirect URI: `https://totalassist.tech/api/auth/callback/google`

- **Copy to Replit Secrets:** `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

---

## 4. Supabase (Database)

- **Create Supabase Project:**
  - Name: `TotalAssist-DB`.
  - Region: Choose the region closest to your users (e.g., US-East or US-Central).
  - Database Password: Generate a secure password and store it.

- **Copy Connection String:** Grab the Pooler URI (specifically for serverless environments like Replit).

- **Copy to Replit Secrets:** `DATABASE_URL`.

---

## 5. Resend (Transactional Email)

This is the service Scout AI uses to send automated messages.

- **Verify Domain:** In Resend, add totalassist.tech.
- **DNS Records:** Add the provided SPF and DKIM records to your registrar.
- **Create API Key:**
  - Name: `TotalAssist-Production-Key`.
- **Set Sender Identity:** Configure the "From" address in your code as scout@totalassist.tech or support@totalassist.tech.
- **Copy to Replit Secrets:** `RESEND_API_KEY`.

---

## 6. Stripe (Payments & Billing)

- **Create Stripe Account:** Link this to your Zoho business email.
- **Public Branding:** Set the "Statement Descriptor" to `TOTALASSIST.TECH`.
- **Set Support Info:** Link the support email to support@totalassist.tech.
- **Get Keys:** Copy the Publishable Key and Secret Key.
- **Configure Webhook:** Point it to `https://totalassist.tech/api/stripe/webhook`.
- **Copy to Replit Secrets:** `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, and `STRIPE_WEBHOOK_SECRET`.

---

## 7. Replit (Hosting & Secrets)

- **Point Domain:** Go to Deployments → Add Custom Domain (totalassist.tech).
- **DNS Verification:** Add the final A and CNAME records provided by Replit.
- **Generate Session Secret:** Run `openssl rand -base64 32` in the Replit console.
- **Final Secrets Audit:** Verify all gathered keys from steps 3–6 are populated in the Secrets tool.

---

## 8. Launch Verification

- **Auth Test:** Log in via Google to ensure the TotalAssist-Prod project works.
- **Email Test:** Trigger a notification to see if Resend delivers it.
- **Support Test:** Reply to a test email and verify it lands in your Zoho inbox.
- **DB Test:** Run `npm run db:push` to ensure your Supabase tables are active.
