---
title: Environment Configuration
description: Complete guide to environment variable setup and management
---

# 🌍 Environment Configuration

Comprehensive guide to configuring environment variables for local development, staging, and production environments in the SaaS Starter application.

## Table of Contents

1. [Overview](#overview)
2. [Multi-Environment Architecture](#multi-environment-architecture)
3. [Quick Setup](#quick-setup)
4. [Environment Files](#environment-files)
5. [Environment Variables Reference](#environment-variables-reference)
6. [Type-Safe Environment Validation](#type-safe-environment-validation)
7. [Server vs Client Variables](#server-vs-client-variables)
8. [Interactive Setup Script](#interactive-setup-script)
9. [Manual Configuration](#manual-configuration)
10. [Deployment Configuration](#deployment-configuration)
11. [Troubleshooting](#troubleshooting)
12. [Best Practices](#best-practices)

## Overview

This application uses a **type-safe, multi-environment configuration system** powered by:

- **Zod Schema Validation**: Runtime validation of all environment variables
- **TypeScript Type Inference**: Full type safety across the application
- **Environment Separation**: Distinct configurations for local, development, staging, and production
- **Automatic Validation**: Environment variables are validated at application startup
- **dotenv-cli Integration**: Easy environment switching with npm scripts

### Key Benefits

✅ **Type Safety**: All environment variables are fully typed with TypeScript  
✅ **Validation**: Invalid configurations fail fast with clear error messages  
✅ **Security**: Separate server-only and client-accessible variables  
✅ **Flexibility**: Easy switching between environments  
✅ **Developer Experience**: Interactive setup script for quick onboarding

## Multi-Environment Architecture

The application supports four distinct environments:

| Environment     | File               | Purpose                            | Git Tracked        |
| --------------- | ------------------ | ---------------------------------- | ------------------ |
| **Local**       | `.env.local`       | Local development with secrets     | ❌ No (gitignored) |
| **Development** | `.env.development` | Shared dev environment, no secrets | ✅ Yes (committed) |
| **Staging**     | `.env.staging`     | Pre-production testing             | ✅ Yes (committed) |
| **Production**  | `.env.production`  | Production deployment              | ✅ Yes (committed) |

### Environment Loading Priority

Next.js loads environment variables in this order (highest to lowest priority):

1. `.env.local` (local development, gitignored)
2. `.env.[environment]` (environment-specific)
3. `.env` (default fallback)

## Quick Setup

### 🚀 Option 1: Interactive Setup (Recommended)

The fastest way to get started:

```bash
pnpm db:setup
```

This interactive script will:

- ✅ Check for Stripe CLI installation
- ✅ Set up PostgreSQL (Docker or remote)
- ✅ Generate secure secrets
- ✅ Create Stripe webhook endpoints
- ✅ Write `.env.local` with all required variables

### 📝 Option 2: Manual Setup

Copy the template and edit manually:

```bash
cp .env.local.example .env.local
# Edit .env.local with your values
```

Then fill in the required values following the [Environment Variables Reference](#environment-variables-reference).

## Environment Files

### `.env.local` (Local Development)

**Purpose**: Local development with real API keys and secrets  
**Location**: Root directory  
**Git Status**: Ignored (contains secrets)

```bash
# Core Application
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NODE_ENV=development

# Database
POSTGRES_URL=postgresql://postgres:postgres@localhost:54322/postgres

# Authentication
BETTER_AUTH_SECRET=your_32_character_secret_here
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (Resend)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_WEBHOOK_SECRET=whsec_...

# Optional: Social Authentication
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_CLIENT_ID=your_facebook_client_id
FACEBOOK_CLIENT_SECRET=your_facebook_client_secret
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret

# Optional: Email Configuration
RESEND_REPLY_TO=support@yourdomain.com
APP_SUPPORT_EMAIL=support@yourdomain.com
```

### `.env.development` (Shared Development)

**Purpose**: Shared development configuration without secrets  
**Location**: Root directory  
**Git Status**: Committed (no secrets allowed)

```bash
# Public configuration only
NEXT_PUBLIC_BASE_URL=https://dev.yourdomain.com
NEXT_PUBLIC_BETTER_AUTH_URL=https://dev.yourdomain.com

# Note: Secrets are provided via deployment platform (Vercel, etc.)
```

### `.env.staging` & `.env.production`

Similar to `.env.development` but for staging and production environments. Store secrets in your deployment platform (Vercel, Netlify, etc.).

## Environment Variables Reference

### Required Variables

#### 🔐 **Authentication**

| Variable                      | Description                    | Example                 | Required |
| ----------------------------- | ------------------------------ | ----------------------- | -------- |
| `BETTER_AUTH_SECRET`          | Secret for signing auth tokens | `openssl rand -hex 32`  | ✅ Yes   |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | Auth callback URL              | `http://localhost:3000` | ✅ Yes   |

::: tip Generating Auth Secret
Generate a secure secret with:

```bash
openssl rand -hex 32
```

:::

#### 🗄️ **Database**

| Variable       | Description                  | Example                               | Required |
| -------------- | ---------------------------- | ------------------------------------- | -------- |
| `POSTGRES_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` | ✅ Yes   |

::: details Local PostgreSQL with Docker
The setup script can create a local PostgreSQL instance:

```bash
# Created automatically by pnpm db:setup
postgresql://postgres:postgres@localhost:54322/postgres
```

:::

#### 💳 **Stripe**

| Variable                | Description            | Where to Find                                                                   | Required |
| ----------------------- | ---------------------- | ------------------------------------------------------------------------------- | -------- |
| `STRIPE_SECRET_KEY`     | Stripe API secret key  | [Dashboard → API Keys](https://dashboard.stripe.com/test/apikeys)               | ✅ Yes   |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | Created by CLI or [Dashboard → Webhooks](https://dashboard.stripe.com/webhooks) | ✅ Yes   |

::: warning Test vs Live Keys

- Development: Use `sk_test_...` (test mode)
- Production: Use `sk_live_...` (live mode)
  :::

#### 📧 **Email (Resend)**

| Variable                | Description                 | Where to Find                           | Required |
| ----------------------- | --------------------------- | --------------------------------------- | -------- |
| `RESEND_API_KEY`        | Resend API key              | [API Keys](https://resend.com/api-keys) | ✅ Yes   |
| `RESEND_FROM_EMAIL`     | Verified sender address     | [Domains](https://resend.com/domains)   | ✅ Yes   |
| `RESEND_WEBHOOK_SECRET` | Webhook verification secret | Auto-generated by setup                 | ✅ Yes   |

#### 🌐 **Application**

| Variable               | Description          | Example                     | Required |
| ---------------------- | -------------------- | --------------------------- | -------- |
| `NEXT_PUBLIC_BASE_URL` | Application base URL | `http://localhost:3000`     | ✅ Yes   |
| `NODE_ENV`             | Node environment     | `development`, `production` | ✅ Yes   |

### Optional Variables

#### 🔑 **Social Authentication**

All social providers are optional. Include only the providers you want to enable:

| Provider     | Variables                                         | Where to Get                                                              |
| ------------ | ------------------------------------------------- | ------------------------------------------------------------------------- |
| **Google**   | `GOOGLE_CLIENT_ID`<br/>`GOOGLE_CLIENT_SECRET`     | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| **Facebook** | `FACEBOOK_CLIENT_ID`<br/>`FACEBOOK_CLIENT_SECRET` | [Facebook Developers](https://developers.facebook.com/apps/)              |
| **LinkedIn** | `LINKEDIN_CLIENT_ID`<br/>`LINKEDIN_CLIENT_SECRET` | [LinkedIn Developers](https://www.linkedin.com/developers/apps)           |
| **TikTok**   | `TIKTOK_CLIENT_KEY`<br/>`TIKTOK_CLIENT_SECRET`    | [TikTok for Developers](https://developers.tiktok.com/)                   |

::: info Enabling Social Login
See [OAuth Setup Guide](./auth/OAUTH_SETUP.md) for detailed configuration instructions.
:::

#### 📬 **Email Metadata**

| Variable            | Description            | Example                  | Default                  |
| ------------------- | ---------------------- | ------------------------ | ------------------------ |
| `RESEND_REPLY_TO`   | Reply-to email address | `support@yourdomain.com` | Uses `RESEND_FROM_EMAIL` |
| `APP_SUPPORT_EMAIL` | Support contact email  | `help@yourdomain.com`    | Uses `RESEND_FROM_EMAIL` |

## Type-Safe Environment Validation

### How It Works

Environment variables are validated using **Zod schemas** at application startup:

```typescript
// lib/env.ts - Server-side validation
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  BASE_URL: z.string().url('BASE_URL must be a valid URL.'),
  POSTGRES_URL: z.string().min(1, 'PostgreSQL URL is required.'),
  // ... all server-side variables
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
```

### Benefits

✅ **Fail Fast**: Invalid configuration stops the application at startup  
✅ **Clear Errors**: Descriptive error messages for missing/invalid values  
✅ **Type Safety**: Full TypeScript autocomplete and type checking  
✅ **Runtime Safety**: Validation happens at runtime, not just compile-time

### Example Validation Errors

```bash
# Missing required variable
❌ Error: Resend API key is required.

# Invalid format
❌ Error: BASE_URL must be a valid URL.

# Invalid email
❌ Error: Invalid email address.
```

## Server vs Client Variables

### Server-Only Variables (`lib/env.ts`)

**Import**: `import { env } from '@/lib/env'`  
**Usage**: Server Components, API Routes, Server Actions  
**Security**: Never exposed to the browser

```typescript
import { env } from '@/lib/env';

// ✅ Safe: Server-side only
const apiKey = env.STRIPE_SECRET_KEY;
const dbUrl = env.POSTGRES_URL;
```

**Available Variables**:

- All secrets (API keys, database URLs, webhook secrets)
- All `NEXT_PUBLIC_*` variables (via mapping)

### Client-Accessible Variables (`lib/env-client.ts`)

**Import**: `import { envClient } from '@/lib/env-client'`  
**Usage**: Client Components, Browser JavaScript  
**Security**: Only contains public, non-sensitive data

```typescript
'use client';
import { envClient } from '@/lib/env-client';

// ✅ Safe: Public data only
const baseUrl = envClient.BASE_URL;
const authUrl = envClient.BETTER_AUTH_URL;
```

**Available Variables**:

- `BASE_URL` (from `NEXT_PUBLIC_BASE_URL`)
- `BETTER_AUTH_URL` (from `NEXT_PUBLIC_BETTER_AUTH_URL`)

::: danger Security Warning
**NEVER** import `@/lib/env` in client components. It will cause a build error due to the `server-only` package.
:::

## Interactive Setup Script

The `pnpm db:setup` command runs an interactive script that guides you through environment configuration.

### What It Does

**Step 1: Stripe CLI Check**

- Verifies Stripe CLI is installed
- Confirms authentication status
- Guides installation if missing

**Step 2: PostgreSQL Setup**

- **Option A**: Local PostgreSQL with Docker
  - Checks for Docker installation
  - Creates `docker-compose.yml`
  - Starts PostgreSQL container on port 54322
  - Connection: `postgresql://postgres:postgres@localhost:54322/postgres`
- **Option B**: Remote PostgreSQL
  - Accepts custom connection string
  - Suggests providers (Vercel Postgres, Neon, Supabase)

**Step 3: Stripe Configuration**

- Prompts for Stripe Secret Key
- Guides to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)

**Step 4: Email Configuration**

- Prompts for Resend API Key
- Prompts for verified sender email
- Guides to [Resend Dashboard](https://resend.com/api-keys)

**Step 5: Webhook Setup**

- Creates Stripe webhook endpoint automatically
- Generates webhook secret via Stripe CLI

**Step 6: Secret Generation**

- Generates `BETTER_AUTH_SECRET` (32-byte random)
- Generates `RESEND_WEBHOOK_SECRET` (random with prefix)

**Step 7: Write Configuration**

- Creates `.env.local` with all variables
- Displays success message

### Environment-Specific Setup

```bash
# Local environment (default)
pnpm db:setup

# Staging environment
pnpm db:setup:staging

# Production environment
pnpm db:setup:prod
```

::: tip First-Time Setup
For new developers, `pnpm db:setup` is the fastest way to get a working environment.
:::

## Manual Configuration

### Step-by-Step Manual Setup

1. **Copy Template**

   ```bash
   cp .env.local.example .env.local
   ```

2. **Configure Database**

   ```bash
   # Option 1: Local PostgreSQL with Docker
   docker compose up -d
   # Use: postgresql://postgres:postgres@localhost:54322/postgres

   # Option 2: Remote database (Vercel, Neon, etc.)
   # Get connection string from your provider
   ```

3. **Generate Secrets**

   ```bash
   # BetterAuth secret (32 bytes)
   openssl rand -hex 32

   # Resend webhook secret
   echo "whsec_$(openssl rand -hex 16)"
   ```

4. **Get API Keys**
   - **Stripe**: [Get Secret Key](https://dashboard.stripe.com/test/apikeys)
   - **Resend**: [Get API Key](https://resend.com/api-keys)

5. **Create Stripe Webhook** (Local Development)

   ```bash
   stripe listen --print-secret
   # Copy the whsec_... value
   ```

6. **Set Social OAuth** (Optional)
   - Configure OAuth apps in provider dashboards
   - Add client IDs and secrets to `.env.local`

7. **Verify Configuration**
   ```bash
   pnpm dev
   # Check for validation errors in console
   ```

### Required Values Checklist

- [ ] `POSTGRES_URL` - Database connection string
- [ ] `BETTER_AUTH_SECRET` - 32-character random string
- [ ] `NEXT_PUBLIC_BETTER_AUTH_URL` - Your app URL
- [ ] `STRIPE_SECRET_KEY` - Stripe API key
- [ ] `STRIPE_WEBHOOK_SECRET` - Webhook signing secret
- [ ] `RESEND_API_KEY` - Email API key
- [ ] `RESEND_FROM_EMAIL` - Verified sender email
- [ ] `RESEND_WEBHOOK_SECRET` - Webhook verification secret
- [ ] `NEXT_PUBLIC_BASE_URL` - Application base URL

## Deployment Configuration

### Vercel Deployment

1. **Set Environment Variables in Dashboard**
   - Navigate to Project Settings → Environment Variables
   - Add all required variables
   - Set environment scope (Production, Preview, Development)

2. **Production Variables**

   ```env
   # Use production API keys
   STRIPE_SECRET_KEY=sk_live_...
   RESEND_API_KEY=re_live_...

   # Production URLs
   NEXT_PUBLIC_BASE_URL=https://yourdomain.com
   NEXT_PUBLIC_BETTER_AUTH_URL=https://yourdomain.com

   # Production database
   POSTGRES_URL=postgresql://...production...
   ```

3. **Webhook Configuration**
   - Create production webhooks in Stripe Dashboard
   - Set endpoint: `https://yourdomain.com/api/stripe/webhook`
   - Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

### Other Platforms

#### Netlify

```bash
# Set via Netlify CLI
netlify env:set POSTGRES_URL "postgresql://..."
netlify env:set STRIPE_SECRET_KEY "sk_live_..."
```

#### Railway

```bash
# Set via Railway CLI
railway variables set POSTGRES_URL="postgresql://..."
railway variables set STRIPE_SECRET_KEY="sk_live_..."
```

#### Docker

```dockerfile
# Use environment variables or .env file
ENV POSTGRES_URL=postgresql://...
ENV STRIPE_SECRET_KEY=sk_live_...
```

## Troubleshooting

### Common Issues

#### ❌ "Missing POSTGRES_URL environment variable"

**Problem**: Database URL not configured  
**Solution**:

```bash
# Check .env.local exists and contains POSTGRES_URL
cat .env.local | grep POSTGRES_URL

# Run setup script
pnpm db:setup
```

#### ❌ "BASE_URL must be a valid URL"

**Problem**: Invalid URL format  
**Solution**:

```bash
# Must include protocol (http:// or https://)
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # ✅ Valid
NEXT_PUBLIC_BASE_URL=localhost:3000         # ❌ Invalid
```

#### ❌ "Stripe CLI is not installed"

**Problem**: Missing Stripe CLI  
**Solution**:

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows
scoop install stripe

# Linux
wget https://github.com/stripe/stripe-cli/releases/download/...

# Authenticate
stripe login
```

#### ❌ "Failed to create Stripe webhook"

**Problem**: Stripe CLI not authenticated or permission issues  
**Solution**:

```bash
# Re-authenticate
stripe login

# On Windows, run as administrator
# On macOS/Linux, check terminal permissions
```

#### ❌ "Invalid email address"

**Problem**: Email format validation failed  
**Solution**:

```bash
# Must be valid email format
RESEND_FROM_EMAIL=noreply@example.com  # ✅ Valid
RESEND_FROM_EMAIL=invalid-email        # ❌ Invalid
```

#### ❌ Server-only import in client component

**Problem**: Importing `@/lib/env` in client component  
**Solution**:

```typescript
// ❌ Don't do this in 'use client' components
import { env } from '@/lib/env';

// ✅ Use client env instead
import { envClient } from '@/lib/env-client';
```

### Validation Debugging

To see detailed validation errors:

```bash
# Run with verbose logging
NODE_ENV=development pnpm dev

# Check environment variables are loaded
node -e "console.log(process.env.POSTGRES_URL)"
```

### Environment-Specific Issues

```bash
# Verify correct environment file is loaded
pnpm dev              # Uses .env.local (if exists)
pnpm dev:staging      # Uses .env.staging
pnpm dev:prod         # Uses .env.production

# Check which env file is active
ls -la .env*
```

## Best Practices

### ✅ Security

- **Never commit `.env.local`** - Contains secrets
- **Use environment-specific files** - Separate dev/staging/prod
- **Rotate secrets regularly** - Update API keys periodically
- **Use strong secrets** - Minimum 32 characters for auth secrets
- **Limit variable access** - Use server-only for secrets

### ✅ Development

- **Use the setup script** - Fastest way to get started
- **Validate early** - Run app to check for errors
- **Document custom variables** - Update this guide when adding new vars
- **Use TypeScript types** - Leverage `Env` and `EnvClient` types
- **Test locally first** - Verify config before deploying

### ✅ Deployment

- **Use platform secrets** - Store in Vercel/Netlify/Railway
- **Don't use .env files in production** - Use platform environment variables
- **Monitor webhook health** - Check Stripe/Resend dashboards
- **Use production keys** - Never use test keys in production
- **Set up alerts** - Monitor for failed webhooks/emails

### ✅ Team Collaboration

- **Share `.env.example`** - Keep it updated with all variables
- **Document provider setup** - Link to OAuth setup guides
- **Use consistent naming** - Follow existing patterns
- **Version environment changes** - Update docs when adding vars

## Related Documentation

- **[OAuth Setup Guide](./auth/OAUTH_SETUP.md)** - Configure social authentication providers
- **[Stripe Integration](./stripe/stripe-integration.md)** - Set up payment processing
- **[Email Configuration](./emails.md)** - Configure Resend and email templates
- **[Database Setup](./README.md#database-setup)** - PostgreSQL and Drizzle ORM
- **[Deployment Guide](../README.md#production-deployment)** - Deploy to production

## External Resources

- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Zod Documentation](https://zod.dev/)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Resend Documentation](https://resend.com/docs)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)

---

**Last Updated**: September 30, 2025  
**Version**: 1.0  
**Status**: ✅ Complete
