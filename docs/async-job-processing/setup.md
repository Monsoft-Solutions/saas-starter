---
title: Setup Guide - Async Job Processing with QStash
description: Complete setup instructions for local development and production deployment of the QStash job processing system
---

# Setup Guide

Complete setup instructions for local development and production deployment of the QStash job processing system.

## Local Development Setup

The local development setup is streamlined with automatic QStash server initialization.

### Step 1: Start Development Server

```bash
pnpm dev
```

This command automatically starts:

- Next.js development server (Turbopack)
- Stripe webhook listener
- **QStash local server** (`npx qstash dev`)

### Step 2: Copy QStash Environment Variables

**CRITICAL**: When the QStash CLI starts, it outputs environment variables that must be copied to your `.env.local` file:

```bash
# QStash CLI output (example):
QStash is now listening on http://localhost:8080

Use these environment variables:
QSTASH_URL=http://localhost:8080
QSTASH_TOKEN=local_test_token_abc123
QSTASH_CURRENT_SIGNING_KEY=local_signing_key_xyz789
QSTASH_NEXT_SIGNING_KEY=local_next_key_def456
```

**Copy these values to your `.env.local` file:**

```bash
# QStash Configuration (Local Development)
QSTASH_URL=http://localhost:8080
QSTASH_TOKEN=local_test_token_abc123
QSTASH_CURRENT_SIGNING_KEY=local_signing_key_xyz789
QSTASH_NEXT_SIGNING_KEY=local_next_key_def456
```

::: warning IMPORTANT
The local QStash server generates new keys each time it starts. You must update `.env.local` with the new values after every restart of the development server.
:::

### Step 3: Verify Setup

Test that jobs are working:

```typescript
import { jobDispatcher } from '@/lib/jobs/job-dispatcher.service';
import { JOB_TYPES } from '@/lib/types/jobs';

// Enqueue a test email job
await jobDispatcher.enqueue(
  JOB_TYPES.SEND_EMAIL,
  {
    template: 'welcome',
    to: 'test@example.com',
    data: { recipientName: 'Test User' },
  },
  { userId: 1 }
);
```

Check the logs to see job processing:

```
[jobs] Enqueueing job
[jobs] Job enqueued successfully
[jobs] Processing job
[jobs] Job processed successfully
```

## Production Setup

For production deployment, use Upstash's cloud-hosted QStash service.

### Step 1: Create Upstash Account

1. Sign up at [https://console.upstash.com](https://console.upstash.com)
2. Navigate to the QStash section
3. Create a new QStash instance

### Step 2: Get Credentials

From the QStash dashboard, copy:

- QStash URL (usually `https://qstash.upstash.io`)
- QStash Token
- Current Signing Key
- Next Signing Key

### Step 3: Configure Environment Variables

Add to your production environment (`.env.production` or hosting platform):

```bash
# QStash Configuration (Production)
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=your_production_token
QSTASH_CURRENT_SIGNING_KEY=your_current_signing_key
QSTASH_NEXT_SIGNING_KEY=your_next_signing_key
```

::: tip
Never commit actual production credentials to version control. Use your hosting platform's environment variable management (Vercel, AWS, etc.).
:::

### Step 4: Run Database Migrations

Ensure the `job_executions` table exists:

```bash
pnpm db:migrate:prod
```

### Step 5: Test Production Setup

1. Deploy your application
2. Enqueue a test job from your application
3. Verify job processing in QStash dashboard
4. Check application logs for job execution

## Environment Variables Reference

### Required Variables

```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=https://yourapp.com

# Database
POSTGRES_URL=your_production_db_url

# QStash (from Upstash Console)
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=your_production_token
QSTASH_CURRENT_SIGNING_KEY=your_current_key
QSTASH_NEXT_SIGNING_KEY=your_next_key
```

### Optional Variables

```bash
# Email (Resend)
RESEND_API_KEY=your_api_key
RESEND_FROM_EMAIL=your_verified_email

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Troubleshooting Setup Issues

### QStash CLI Not Starting

If the QStash CLI doesn't start automatically:

```bash
# Start manually in a separate terminal
npx qstash dev
```

### Environment Variables Not Working

1. Ensure `.env.local` is in the project root
2. Restart the development server after updating variables
3. Check that variables are not prefixed with `NEXT_PUBLIC_` unless needed

### Database Connection Issues

```bash
# Test database connection
pnpm db:studio
```

### QStash Server Connection Issues

```bash
# Test QStash connectivity
curl http://localhost:8080
```

## Next Steps

- **[Core Concepts](../core-concepts)** - Learn about job types, schemas, and lifecycle
- **[Usage Guide](../usage)** - Start using jobs in your application
- **[Creating Jobs](../creating-jobs)** - Add new job types to the system
