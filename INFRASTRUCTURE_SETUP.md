# Infrastructure Setup Checklist for TotalAssist

This guide walks you through setting up all external services for your new domain.

---

## Prerequisites
- [ ] Your domain name (e.g., `totalassist.tech`)
- [ ] Access to your domain registrar's DNS settings
- [ ] Credit card for service accounts

---

## 1. Domain & DNS Setup

### A. Point Domain to Replit
1. Go to your domain registrar (Namecheap, GoDaddy, Cloudflare, etc.)
2. Add/Update DNS records:
   ```
   Type: A
   Name: @ (or blank)
   Value: [Get from Replit deployment settings]
   TTL: Auto or 3600

   Type: CNAME
   Name: www
   Value: [Your Replit app URL]
   TTL: Auto or 3600
   ```

3. In Replit:
   - Go to your project → Deployments
   - Click "Add Custom Domain"
   - Enter your domain and follow verification steps

---

## 2. Supabase (Database & Auth)

### A. Create Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Choose region closest to your users
4. Save the generated database password securely

### B. Get Connection Strings
1. Go to Project Settings → Database
2. Copy the connection strings:
   - **URI**: `postgres://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres`
   - **Pooler URI** (for serverless): Use this one for Replit

### C. Environment Variables
Add to Replit Secrets:
```
DATABASE_URL=postgres://postgres.[PROJECT]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

### D. Run Database Migrations
```bash
npm run db:push
```

---

## 3. Google OAuth

### A. Create Google Cloud Project
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create new project (e.g., "TotalAssist Production")
3. Enable APIs:
   - Go to "APIs & Services" → "Library"
   - Search and enable "Google+ API" or "Google Identity"

### B. Configure OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type
3. Fill in:
   - App name: `TotalAssist`
   - User support email: your email
   - App logo: upload your logo
   - App domain: `https://totalassist.tech`
   - Authorized domains: `totalassist.tech`
   - Developer contact: your email
4. Scopes: Add `email`, `profile`, `openid`
5. Test users: Add your email for testing

### C. Create OAuth Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: "Web application"
4. Name: "TotalAssist Web"
5. Authorized JavaScript origins:
   ```
   https://totalassist.tech
   https://www.totalassist.tech
   ```
6. Authorized redirect URIs:
   ```
   https://totalassist.tech/api/auth/callback/google
   https://www.totalassist.tech/api/auth/callback/google
   ```
7. Copy Client ID and Client Secret

### D. Environment Variables
Add to Replit Secrets:
```
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

---

## 4. Resend (Email Service)

### A. Create Account
1. Go to [resend.com](https://resend.com)
2. Sign up and verify your email

### B. Verify Domain
1. Go to Domains → Add Domain
2. Enter your domain: `totalassist.tech`
3. Add the DNS records Resend provides:
   ```
   Type: TXT
   Name: [provided by Resend]
   Value: [provided by Resend]

   Type: MX (optional, for receiving)
   Name: [provided by Resend]
   Value: [provided by Resend]

   Type: TXT (DKIM)
   Name: [provided by Resend]
   Value: [provided by Resend]
   ```
4. Wait for verification (can take up to 48 hours, usually faster)

### C. Create API Key
1. Go to API Keys → Create API Key
2. Name: "TotalAssist Production"
3. Permission: "Full access" or "Sending access"
4. Copy the API key

### D. Environment Variables
Add to Replit Secrets:
```
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=support@totalassist.tech
```

---

## 5. Stripe (Payments)

### A. Create Account
1. Go to [stripe.com](https://stripe.com)
2. Sign up and verify your business

### B. Get API Keys
1. Go to Developers → API keys
2. Copy:
   - Publishable key: `pk_live_...`
   - Secret key: `sk_live_...`

   (Use `pk_test_` and `sk_test_` keys for development)

### C. Create Products & Prices
1. Go to Products → Add Product

**Scout Home:**
- Name: "Scout Home"
- Description: "The Daily Driver - Unlimited Chat, Photos, Voice + 1 Video/week"
- Pricing:
  - Monthly: $9.99/month (recurring)
  - Annual: $7.99/month billed annually ($95.88/year)

**Scout Pro:**
- Name: "Scout Pro"
- Description: "The Power User - Everything unlimited + 15 Video/month + Premium AI"
- Pricing:
  - Monthly: $19.99/month (recurring)
  - Annual: $15.99/month billed annually ($191.88/year)

**Video Credit - Single:**
- Name: "Video Diagnostic Credit"
- Description: "1 Video Diagnostic Credit"
- Pricing: $5.00 (one-time)

**Video Credit - Pack:**
- Name: "Video Diagnostic Credit Pack"
- Description: "3 Video Diagnostic Credits"
- Pricing: $12.00 (one-time)

2. Copy the Price IDs for each (format: `price_xxxxx`)

### D. Configure Webhooks
1. Go to Developers → Webhooks
2. Add endpoint:
   - URL: `https://totalassist.tech/api/stripe/webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.paid`
     - `invoice.payment_failed`
3. Copy the Webhook signing secret

### E. Environment Variables
Add to Replit Secrets:
```
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Price IDs
STRIPE_PRICE_HOME_MONTHLY=price_xxxxx
STRIPE_PRICE_HOME_ANNUAL=price_xxxxx
STRIPE_PRICE_PRO_MONTHLY=price_xxxxx
STRIPE_PRICE_PRO_ANNUAL=price_xxxxx
STRIPE_PRICE_VIDEO_SINGLE=price_xxxxx
STRIPE_PRICE_VIDEO_PACK=price_xxxxx
```

### F. Customer Portal (Optional)
1. Go to Settings → Billing → Customer Portal
2. Enable features you want customers to manage
3. Set cancellation policy
4. Save configuration

---

## 6. Session Secret

Generate a secure session secret:
```bash
openssl rand -base64 32
```

Add to Replit Secrets:
```
SESSION_SECRET=your-generated-secret
```

---

## 7. Final Environment Variables Checklist

Verify all these are set in Replit Secrets:

```
# Database
DATABASE_URL=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Email (Resend)
RESEND_API_KEY=
EMAIL_FROM=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_HOME_MONTHLY=
STRIPE_PRICE_HOME_ANNUAL=
STRIPE_PRICE_PRO_MONTHLY=
STRIPE_PRICE_PRO_ANNUAL=

# Session
SESSION_SECRET=

# App Config
APP_URL=https://totalassist.tech
NODE_ENV=production
```

---

## 8. Post-Setup Verification

### Test Checklist
- [ ] Domain loads correctly (https://totalassist.tech)
- [ ] SSL certificate is valid (green lock)
- [ ] Google OAuth login works
- [ ] Password reset emails are sent and received
- [ ] Stripe checkout redirects work
- [ ] Webhooks are received (check Stripe dashboard)
- [ ] Database connections work (users can sign up)

### Common Issues

**OAuth Error: "redirect_uri_mismatch"**
- Verify redirect URIs in Google Console match exactly (including https)

**Emails not sending**
- Check Resend domain verification status
- Verify DNS records propagated (use dnschecker.org)

**Stripe webhooks failing**
- Verify webhook URL is correct
- Check webhook signing secret matches
- View webhook logs in Stripe dashboard

**Database connection errors**
- Use the "Pooler" connection string for serverless
- Verify password has no special characters that need escaping

---

## 9. Going Live Checklist

Before announcing:
- [ ] All environment variables set
- [ ] Domain DNS propagated
- [ ] SSL certificate active
- [ ] OAuth working
- [ ] Emails sending
- [ ] Stripe in live mode (not test)
- [ ] Webhook endpoint verified
- [ ] Legal pages updated with correct company info
- [ ] Privacy policy reflects actual data practices
- [ ] Test complete user flow (signup → payment → usage)
