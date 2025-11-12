# Vercel Deployment Guide - N8n Widget Designer Platform

**Last Updated:** 2025-11-12
**Status:** Production-Ready Deployment Instructions

---

## Overview

This guide provides step-by-step instructions for deploying the N8n Widget Designer Platform to Vercel. The platform consists of:
- **Next.js 15 Application** (platform dashboard + API routes)
- **Chat Widget** (vanilla JavaScript, pre-built and served statically)
- **PostgreSQL Database** (Neon Postgres on Vercel)

---

## Prerequisites

Before starting, ensure you have:
- ✅ GitHub account with your repository pushed
- ✅ Vercel account (free tier works for testing)
- ✅ Stripe account (for payment processing)
- ✅ SendGrid account (for email delivery)
- ✅ Domain name (optional, for custom domain)

**Repository:** https://github.com/AI-MakesSense/chat-interface-r.git

---

## Part 1: Vercel Account Setup

### Step 1.1: Create Vercel Account

1. Go to https://vercel.com/signup
2. Click "Continue with GitHub"
3. Authorize Vercel to access your GitHub account
4. Complete the signup process

### Step 1.2: Install Vercel CLI (Optional but Recommended)

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login
```

**Why install CLI?**
- Test deployments locally before pushing
- Manage environment variables easily
- View deployment logs in terminal
- Quick rollbacks if needed

---

## Part 2: Database Setup (Neon Postgres)

### Step 2.1: Create Neon Postgres Database

1. Go to Vercel Dashboard → Storage tab
2. Click "Create Database"
3. Select "Neon Postgres"
4. Choose database name: `n8n-widget-designer-db`
5. Select region: Choose closest to your users (e.g., US East, EU West)
6. Click "Create"

**Vercel will automatically:**
- Create the Neon Postgres database
- Add environment variables to your project:
  - `POSTGRES_URL`
  - `POSTGRES_PRISMA_URL`
  - `POSTGRES_URL_NON_POOLING`
  - `POSTGRES_USER`
  - `POSTGRES_HOST`
  - `POSTGRES_PASSWORD`
  - `POSTGRES_DATABASE`

### Step 2.2: Note Your Database Connection String

After creation, you'll see your connection string:
```
postgresql://username:password@host/database?sslmode=require
```

**Save this** - you'll need it for local development.

---

## Part 3: Environment Variables Setup

### Step 3.1: Required Environment Variables

You need to configure these environment variables in Vercel:

#### **Database (Auto-configured by Vercel)**
- `POSTGRES_URL` - Full connection string (auto-added)
- `DATABASE_URL` - Alias for Drizzle ORM (you need to add this)

#### **Authentication**
- `JWT_SECRET` - Secret for JWT token signing (generate a secure random string)
- `JWT_EXPIRES_IN` - Token expiration time (default: `7d`)

#### **Stripe (Payment Processing)**
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Public key for client-side

#### **SendGrid (Email Delivery)**
- `SENDGRID_API_KEY` - Your SendGrid API key
- `SENDGRID_FROM_EMAIL` - Verified sender email address

#### **Application Configuration**
- `NEXT_PUBLIC_APP_URL` - Your production URL (e.g., `https://your-app.vercel.app`)
- `NODE_ENV` - Set to `production` (auto-set by Vercel)

### Step 3.2: Generate JWT Secret

Run this command to generate a secure JWT secret:

```bash
# Generate a 64-character random string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output - this is your `JWT_SECRET`.

### Step 3.3: Get Stripe API Keys

1. Go to https://dashboard.stripe.com/
2. Navigate to **Developers → API keys**
3. Copy your **Secret key** (starts with `sk_live_` or `sk_test_`)
4. Copy your **Publishable key** (starts with `pk_live_` or `pk_test_`)

**For webhook secret (we'll set this up later in Step 5):**
- You'll get this after creating the webhook endpoint in Stripe

### Step 3.4: Get SendGrid API Key

1. Go to https://app.sendgrid.com/
2. Navigate to **Settings → API Keys**
3. Click "Create API Key"
4. Name: `n8n-widget-platform`
5. Permissions: **Full Access** (or at minimum, **Mail Send** permission)
6. Click "Create & View"
7. **Copy the API key immediately** (you won't see it again)

### Step 3.5: Verify SendGrid Sender Email

1. Go to **Settings → Sender Authentication**
2. Click "Verify a Single Sender"
3. Fill in your details (use your business email)
4. Verify your email address
5. Use this verified email as `SENDGRID_FROM_EMAIL`

---

## Part 4: Deploy to Vercel

### Step 4.1: Import Project from GitHub

1. Go to Vercel Dashboard
2. Click "Add New..." → "Project"
3. Import your GitHub repository:
   - Repository: `AI-MakesSense/chat-interface-r`
   - Branch: `master`
4. Click "Import"

### Step 4.2: Configure Build Settings

Vercel should auto-detect Next.js. Verify these settings:

**Framework Preset:** Next.js
**Root Directory:** `./` (repository root)
**Build Command:** `npm run build`
**Output Directory:** `.next` (auto-detected)
**Install Command:** `npm install`

**Important:** If your project is in a subdirectory:
- Set **Root Directory** to `n8n-widget-designer`

### Step 4.3: Add Environment Variables

In the Vercel import screen, add all environment variables from Step 3:

**Click "Environment Variables" section:**

| Name | Value | Environment |
|------|-------|-------------|
| `DATABASE_URL` | (Copy from `POSTGRES_URL`) | Production, Preview, Development |
| `JWT_SECRET` | (Your generated secret) | Production, Preview, Development |
| `JWT_EXPIRES_IN` | `7d` | Production, Preview, Development |
| `STRIPE_SECRET_KEY` | `sk_test_...` (or `sk_live_...`) | Production, Preview, Development |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_...` (or `pk_live_...`) | Production, Preview, Development |
| `STRIPE_WEBHOOK_SECRET` | (Leave blank for now) | Production |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | (Same as `STRIPE_PUBLISHABLE_KEY`) | Production, Preview, Development |
| `SENDGRID_API_KEY` | `SG.xxx...` | Production, Preview, Development |
| `SENDGRID_FROM_EMAIL` | `your-verified-email@example.com` | Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL` | `https://your-project.vercel.app` | Production |

**Notes:**
- For `NEXT_PUBLIC_APP_URL`, use your Vercel-provided URL (you'll get this after first deployment)
- For `STRIPE_WEBHOOK_SECRET`, we'll add this in Step 5 after setting up the webhook
- Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser

### Step 4.4: Deploy

1. Click **"Deploy"**
2. Wait 2-5 minutes for the build to complete
3. Vercel will show build logs in real-time

**Expected Build Output:**
```
✓ Creating an optimized production build
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization

Build completed in ~3m
```

### Step 4.5: Verify Deployment Success

After deployment completes:
1. Click "Visit" to open your deployed site
2. You should see your Next.js application running
3. Note your production URL: `https://your-project.vercel.app`

---

## Part 5: Database Migration

### Step 5.1: Run Database Migrations

You need to run Drizzle migrations to create database tables.

**Option A: Using Vercel CLI (Recommended)**

```bash
# Install dependencies
cd n8n-widget-designer
npm install

# Pull production environment variables
vercel env pull .env.production

# Run migrations against production database
npm run db:push
```

**Option B: Using Database URL Directly**

```bash
# Set DATABASE_URL environment variable
export DATABASE_URL="postgresql://username:password@host/database?sslmode=require"

# Run migrations
npm run db:push
```

### Step 5.2: Seed Database (Optional)

If you have a seed script:

```bash
npm run db:seed
```

**Warning:** Only seed in development/staging. Don't seed production with test data.

### Step 5.3: Verify Database Tables

Use a database client to verify tables were created:

**Tables that should exist:**
- `users`
- `licenses`
- `widget_configs`
- `analytics_events` (optional)

**Using Neon Console:**
1. Go to Neon Console → SQL Editor
2. Run: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`
3. Verify all tables are listed

---

## Part 6: Stripe Webhook Setup

### Step 6.1: Create Stripe Webhook

1. Go to Stripe Dashboard → **Developers → Webhooks**
2. Click "Add endpoint"
3. Endpoint URL: `https://your-project.vercel.app/api/stripe/webhook`
4. Description: `N8n Widget Platform - Production Webhook`
5. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
6. Click "Add endpoint"

### Step 6.2: Get Webhook Signing Secret

After creating the webhook:
1. Click on the webhook endpoint you just created
2. Find "Signing secret" section
3. Click "Reveal" to see the secret (starts with `whsec_`)
4. Copy the signing secret

### Step 6.3: Add Webhook Secret to Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add new variable:
   - **Name:** `STRIPE_WEBHOOK_SECRET`
   - **Value:** `whsec_...` (the signing secret you copied)
   - **Environment:** Production, Preview
3. Click "Save"

### Step 6.4: Redeploy to Apply New Environment Variable

After adding the webhook secret:
1. Go to Vercel Dashboard → Deployments
2. Click "..." on latest deployment → "Redeploy"
3. Check "Use existing build cache"
4. Click "Redeploy"

---

## Part 7: Widget Build and Deployment

### Step 7.1: Build Widget for Production

The widget should be built automatically during Vercel deployment, but verify:

```bash
# Build widget locally to test
cd widget
NODE_ENV=production npm run build

# Verify output
ls -lh ../public/widget/
# Should see: chat-widget.iife.js (~102 KB, gzipped ~49.79 KB)
```

### Step 7.2: Verify Widget is Served

1. Visit: `https://your-project.vercel.app/widget/chat-widget.iife.js`
2. You should see the obfuscated JavaScript with AI poisoning banner at the top
3. Check response headers include:
   - `Content-Type: application/javascript`
   - `Cache-Control: public, max-age=31536000, immutable`

### Step 7.3: Test Widget License Endpoint

Test the license validation endpoint:

```bash
# Replace YOUR_LICENSE_KEY with a test license key from your database
curl https://your-project.vercel.app/api/widget/YOUR_LICENSE_KEY/chat-widget.js
```

**Expected response:**
- 200 OK with JavaScript code (if license valid and domain matches)
- 403 Forbidden (if license invalid or domain mismatch)

---

## Part 8: Domain Setup (Optional)

### Step 8.1: Add Custom Domain

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Click "Add"
3. Enter your domain: `app.yourdomain.com`
4. Click "Add"

### Step 8.2: Configure DNS

Vercel will show you DNS records to add:

**For subdomain (e.g., app.yourdomain.com):**
- Type: `CNAME`
- Name: `app`
- Value: `cname.vercel-dns.com`

**For root domain (e.g., yourdomain.com):**
- Type: `A`
- Name: `@`
- Value: `76.76.21.21`

**Add these records in your domain registrar's DNS settings.**

### Step 8.3: Wait for DNS Propagation

- DNS propagation can take 5 minutes to 48 hours
- Check status in Vercel dashboard (it will show "Valid Configuration" when ready)
- Vercel will automatically provision SSL certificate

### Step 8.4: Update Environment Variables

After domain is active:
1. Go to Settings → Environment Variables
2. Update `NEXT_PUBLIC_APP_URL`:
   - Old: `https://your-project.vercel.app`
   - New: `https://app.yourdomain.com`
3. Save and redeploy

### Step 8.5: Update Stripe Webhook URL

1. Go to Stripe Dashboard → Webhooks
2. Edit your webhook endpoint
3. Update URL: `https://app.yourdomain.com/api/stripe/webhook`
4. Save changes

---

## Part 9: Post-Deployment Verification

### Step 9.1: Test Authentication Flow

1. Visit your production URL
2. Click "Sign Up"
3. Create a test account
4. Verify email is sent (check SendGrid activity)
5. Login with test account
6. Verify JWT token is set (check cookies in DevTools)

### Step 9.2: Test Widget Configurator

1. Login to dashboard
2. Open widget configurator
3. Make configuration changes
4. Verify real-time preview updates
5. Save configuration

### Step 9.3: Test Payment Flow (Test Mode)

**Ensure you're using Stripe TEST keys:**
1. Configure a widget
2. Click "Get Your Widget"
3. Select a pricing tier
4. Enter Stripe test card: `4242 4242 4242 4242`
5. Complete checkout
6. Verify:
   - Redirect to success page
   - License created in database
   - Email sent with embed code
   - Subscription visible in Stripe Dashboard

**Stripe Test Cards:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Auth required: `4000 0025 0000 3155`

### Step 9.4: Test Widget Embedding

1. After purchasing a license, copy the embed code
2. Create a test HTML file:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Widget Test</title>
</head>
<body>
  <h1>Testing N8n Chat Widget</h1>

  <script>
    window.ChatWidgetConfig = {
      branding: {
        companyName: "Test Company",
        welcomeText: "How can we help?",
        firstMessage: "Hello! Ask me anything."
      },
      style: {
        theme: "auto",
        primaryColor: "#00bfff",
        position: "bottom-right"
      },
      connection: {
        webhookUrl: "https://your-n8n-instance.com/webhook/test"
      }
    };
  </script>
  <script src="https://your-project.vercel.app/api/widget/YOUR_LICENSE_KEY/chat-widget.js"></script>
</body>
</html>
```

3. Open the file in a browser
4. Verify the widget loads and renders correctly

### Step 9.5: Monitor Deployment Logs

Check Vercel logs for any errors:
1. Go to Vercel Dashboard → Your Project → Logs
2. Filter by:
   - Time range: Last 24 hours
   - Type: Errors
3. Investigate any errors

---

## Part 10: Production Checklist

Before going live, verify all these items:

### Security Checklist
- [ ] All environment variables set correctly
- [ ] JWT secret is strong (64+ characters)
- [ ] Stripe webhook secret configured
- [ ] HTTPS enabled (automatic with Vercel)
- [ ] Source maps disabled in production (widget build)
- [ ] Database connection uses SSL (`?sslmode=require`)
- [ ] CORS configured correctly for widget serving
- [ ] Rate limiting enabled for API routes

### Functionality Checklist
- [ ] User signup/login works
- [ ] Email delivery working (SendGrid)
- [ ] Widget configurator saves changes
- [ ] Real-time preview updates
- [ ] Payment flow completes successfully
- [ ] License created after payment
- [ ] Embed code email sent
- [ ] Widget loads on external sites
- [ ] Domain validation works
- [ ] License expiration checked

### Performance Checklist
- [ ] Widget bundle size under 50 KB gzipped
- [ ] Widget load time under 100ms
- [ ] API response times under 200ms
- [ ] Database queries optimized
- [ ] CDN caching enabled for widget
- [ ] Lighthouse score > 90 (run on production URL)

### Monitoring Checklist
- [ ] Sentry error tracking configured (optional)
- [ ] Vercel analytics enabled
- [ ] Stripe webhook events logging
- [ ] Database query performance monitoring
- [ ] Email delivery tracking (SendGrid)

---

## Part 11: Switching to Production Mode

### Step 11.1: Switch Stripe to Live Mode

**When ready to accept real payments:**

1. Go to Stripe Dashboard
2. Toggle from "Test mode" to "Live mode" (top-right)
3. Get new API keys from **Developers → API keys**
4. Update Vercel environment variables:
   - `STRIPE_SECRET_KEY` → `sk_live_...`
   - `STRIPE_PUBLISHABLE_KEY` → `pk_live_...`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → `pk_live_...`
5. Create new webhook for production:
   - URL: `https://your-domain.com/api/stripe/webhook`
   - Select same events as test webhook
   - Copy new webhook secret
6. Update `STRIPE_WEBHOOK_SECRET` in Vercel
7. Redeploy

### Step 11.2: Update Pricing (If Needed)

Check `lib/stripe/pricing.ts` and update production prices:

```typescript
export const PRICING_TIERS = {
  basic: {
    price: 2900, // $29.00 in cents
    interval: 'year',
    stripePriceId: 'price_LIVE_ID_HERE', // Update with live price ID
  },
  // ... etc
};
```

### Step 11.3: Test Production Payment

1. Use a real credit card (your own)
2. Complete a test purchase
3. Verify everything works end-to-end
4. Refund the test transaction in Stripe Dashboard

---

## Part 12: Troubleshooting

### Issue: Build Fails on Vercel

**Symptoms:** Deployment fails during build

**Solutions:**
1. Check build logs in Vercel
2. Verify `package.json` has correct scripts:
   ```json
   {
     "scripts": {
       "build": "next build",
       "start": "next start"
     }
   }
   ```
3. Ensure all dependencies are in `package.json`, not just `devDependencies`
4. Try building locally: `npm run build`
5. Check for TypeScript errors: `npx tsc --noEmit`

### Issue: Database Connection Fails

**Symptoms:** `ECONNREFUSED` or `connection timeout` errors

**Solutions:**
1. Verify `DATABASE_URL` is set correctly
2. Check connection string includes `?sslmode=require`
3. Ensure Neon Postgres is running (check Neon dashboard)
4. Verify database is in same region as Vercel deployment
5. Try connection from local machine using same URL

### Issue: Stripe Webhook Not Working

**Symptoms:** Payments succeed but no license created

**Solutions:**
1. Check Stripe webhook logs: Dashboard → Developers → Webhooks → [Your webhook]
2. Verify webhook secret is correct in Vercel env vars
3. Check API route exists: `/api/stripe/webhook/route.ts`
4. Verify webhook signature validation code
5. Test locally using Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

### Issue: SendGrid Email Not Sending

**Symptoms:** No emails received after signup/purchase

**Solutions:**
1. Check SendGrid activity logs
2. Verify API key is valid and has Mail Send permission
3. Confirm sender email is verified in SendGrid
4. Check spam folder
5. Verify email template code in `/lib/email/`
6. Test SendGrid API directly:
   ```bash
   curl -X POST https://api.sendgrid.com/v3/mail/send \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"personalizations":[{"to":[{"email":"test@example.com"}]}],"from":{"email":"verified@yourdomain.com"},"subject":"Test","content":[{"type":"text/plain","value":"Hello"}]}'
   ```

### Issue: Widget Returns 403 Forbidden

**Symptoms:** Widget fails to load with 403 error

**Solutions:**
1. Verify license key is correct
2. Check domain validation logic in `/api/widget/[license]/chat-widget.js`
3. Ensure `referer` header is being sent (some browsers block this)
4. Verify license is active and not expired in database
5. Check allowed domains in license record
6. Test with domain validation disabled temporarily (for debugging)

### Issue: Environment Variables Not Updating

**Symptoms:** Changed env vars but app still uses old values

**Solutions:**
1. After changing env vars in Vercel, you MUST redeploy
2. Go to Deployments → Click "..." on latest → "Redeploy"
3. Do NOT use "Use existing build cache" when env vars changed
4. Wait for new deployment to complete (~2-5 minutes)
5. Hard refresh browser (Ctrl+Shift+R) to clear cached responses

---

## Part 13: Ongoing Maintenance

### Weekly Tasks
- [ ] Monitor error logs in Vercel
- [ ] Check Stripe webhook delivery success rate
- [ ] Review email delivery rates (SendGrid)
- [ ] Monitor database size (Neon dashboard)

### Monthly Tasks
- [ ] Review and optimize slow API endpoints
- [ ] Check and update dependencies (`npm outdated`)
- [ ] Analyze bundle size (widget)
- [ ] Review Stripe churn metrics
- [ ] Backup database (if not using automatic backups)

### Security Updates
- [ ] Update Next.js when new versions released
- [ ] Update dependencies with security vulnerabilities
- [ ] Rotate JWT secret every 6 months
- [ ] Review Stripe webhook event history for anomalies
- [ ] Monitor for unusual API traffic patterns

---

## Part 14: Rollback Procedure

If a deployment causes issues:

### Step 14.1: Instant Rollback via Vercel

1. Go to Vercel Dashboard → Deployments
2. Find the last working deployment
3. Click "..." → "Promote to Production"
4. Confirm promotion
5. Previous version is now live (takes ~30 seconds)

### Step 14.2: Rollback Database Migration

If you need to rollback a database migration:

```bash
# Connect to database
psql $DATABASE_URL

# Drop the problematic migration
DROP TABLE IF EXISTS problematic_table;

# Re-run previous migration
npm run db:push
```

**Warning:** Database rollbacks can cause data loss. Always backup before rollback.

---

## Part 15: Support and Resources

### Official Documentation
- **Vercel Docs:** https://vercel.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Neon Postgres Docs:** https://neon.tech/docs
- **Stripe Docs:** https://stripe.com/docs
- **SendGrid Docs:** https://docs.sendgrid.com

### Community Support
- **Vercel Discord:** https://vercel.com/discord
- **Next.js GitHub Discussions:** https://github.com/vercel/next.js/discussions

### Contact
- **Vercel Support:** support@vercel.com (paid plans only)
- **Stripe Support:** https://support.stripe.com/

---

## Summary

You've successfully deployed the N8n Widget Designer Platform to Vercel!

**What you accomplished:**
1. ✅ Created Vercel account and connected GitHub
2. ✅ Set up Neon Postgres database
3. ✅ Configured environment variables
4. ✅ Deployed Next.js application
5. ✅ Ran database migrations
6. ✅ Set up Stripe webhooks
7. ✅ Configured custom domain (optional)
8. ✅ Verified production deployment

**Your platform is now live at:**
- Production URL: `https://your-project.vercel.app`
- Widget endpoint: `https://your-project.vercel.app/api/widget/[license]/chat-widget.js`

**Next steps:**
- Monitor logs and errors
- Test payment flow with real transactions
- Collect user feedback
- Iterate and improve

---

**Deployment Status:** ✅ PRODUCTION READY

**Last Updated:** 2025-11-12
