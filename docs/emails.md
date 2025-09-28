# Resend Transactional Email Integration

## Overview

The SaaS starter now delivers transactional email through Resend with React Email templates and persists every send to Postgres for auditing. This document explains how the integration is wired, what data it expects, and how to extend it safely.

## Setup Checklist

### Environment variables

Add the following secrets to `.env.local`, Vercel, and any other deployment target. Validation lives in `lib/env.ts` so missing values will crash the app at boot time.

```env
RESEND_API_KEY=pk_live_or_test
RESEND_FROM_EMAIL=verified-sender@example.com
RESEND_WEBHOOK_SECRET=whsec_...
# Optional fallbacks used when a dispatcher does not pass an explicit support email
RESEND_REPLY_TO=support@example.com
APP_SUPPORT_EMAIL=support@example.com
```

### Database migration

Run the Drizzle migration to create the `email_logs` table and supporting enum:

```bash
pnpm db:migrate
```

The schema is defined in `lib/db/schames/email-logs.table.ts` and includes delivery status tracking (`sent | delivered | bounced | complained | failed`) plus provider metadata.

### Dependencies and tooling

`package.json` already includes the required libraries:

- `resend` – API client
- `@react-email/components` & `@react-email/render` – JSX templates and renderer
- `svix` – webhook signature verification for Resend
- Tooling scripts: `pnpm test:emails` (Vitest snapshot-ish checks) and `pnpm preview:emails` (generates `email-preview.html`).

## Architecture

### Resend client

`lib/emails/resend.client.ts` wraps the Resend SDK:

- Applies project defaults (`RESEND_FROM_EMAIL`, reply-to fallbacks, tags) and enforces at least one recipient.
- Emits verbose logs outside production and normalises recipient shapes (`string` or `{ name, email }`).
- Throws `ResendEmailError` with the original cause for consistent upstream handling.
- Automatically stores every send by calling `logSentEmail`, which adds an entry to `email_logs` with the Resend message id and template tag.

### Dispatchers & idempotency guard

`lib/emails/dispatchers.ts` provides domain helpers (`sendWelcomeEmail`, `sendPasswordResetEmail`, etc.) that:

- Render the correct template, choose a subject, and set the `template` tag.
- Apply a 5‑minute in-memory cache to avoid duplicate sends for the same recipient/template combination during a single server lifetime.
- Ensure a `supportEmail` value is present (falling back to `APP_SUPPORT_EMAIL` → `RESEND_REPLY_TO`).

Because the cache is in-process only, production deployments that scale horizontally should rely on external idempotency (e.g., queue dedupe) if duplicate suppression must span instances.

### Template system

`lib/emails/templates/` contains React components styled with the shared design tokens (`@/lib/design-system`). Each template exports an async render helper that returns both HTML and plaintext via `renderEmail`. The catalogue currently includes:

- `welcome-signup`
- `password-reset`
- `password-changed`
- `email-change-confirmation`
- `team-invitation`
- `subscription-created`
- `payment-failed`

Preview helpers live in `lib/emails/preview.ts`, and `scripts/preview-emails.ts` writes a browsable preview file.

### Logging layer

`lib/emails/logger.ts` and `lib/db/queries` encapsulate inserts and status updates into the `email_logs` table. Primary fields:

| Column                                 | Purpose                                                       |
| -------------------------------------- | ------------------------------------------------------------- |
| `email_id`                             | Provider message id for correlation with webhooks             |
| `template_type`                        | Optional free-form tag, usually the dispatcher template name  |
| `status`                               | Enum (`sent`, `delivered`, `bounced`, `complained`, `failed`) |
| `metadata`                             | JSON payload for future enrichment                            |
| `sent_at`, `delivered_at`, `failed_at` | Timestamps for lifecycle tracking                             |

Use `getEmailLogByEmailId(emailId)` for investigations or dashboards.

### Webhooks

- **Resend delivery updates** – `app/api/webhooks/resend/route.ts`
  - Verifies the Svix signature with `RESEND_WEBHOOK_SECRET`.
  - Parses payloads with `resendWebhookEventSchema` and updates the stored status via `updateEmailLogStatus`.
  - Currently handles `email.sent`, `email.delivered`, `email.bounced`, and `email.complained`. Extend the switch when adding new statuses.
- **Stripe lifecycle events** – `app/api/stripe/webhook/route.ts`
  - On `checkout.session.completed`, sends `sendSubscriptionCreatedEmail` to the team owner and logs `SUBSCRIPTION_CREATED`.
  - On `invoice.payment_failed`, sends `sendPaymentFailedEmail` and logs `PAYMENT_FAILED`.
  - Other subscription events still update billing state/activity logs; wire new emails through the dispatchers when ready.

## Current application flows

### Authentication & account management

File: `app/(login)/actions.ts`

- **Password change** (`updatePassword`): dispatches `sendPasswordChangedEmail` with timestamp metadata after BetterAuth confirms the change.
- **Email change** (`updateAccount`): emits two `sendEmailChangeConfirmationEmail` messages — one to the new address (approval link) and one to the old address (notification).
- **Forgot password** (`forgotPassword`): generates a temporary token and calls `sendPasswordResetEmail`; failures surface to the UI without blocking other work.
- **Welcome email**: `sendWelcomeEmail` is available but not yet invoked from `signUp`. Call it after the team/member records are created to complete the onboarding flow.
- **Team invitations**: `sendTeamInvitationEmail` helper exists; `inviteTeamMember` still has a TODO to hook it up once invitation URLs are final.

### Billing

Triggered inside `app/api/stripe/webhook/route.ts` after the payload is verified:

- `checkout.session.completed` → `sendSubscriptionCreatedEmail({ planName, amount, dashboardUrl })`
- `invoice.payment_failed` → `sendPaymentFailedEmail({ amountDue, paymentDetailsUrl })`

Both look up the owning user via `getTeamOwner(team.id)` and inherit support contact defaults.

## Template quick reference

| Template                                 | Dispatcher                         | Props (type)                                                                                  | Typical trigger                      |
| ---------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------ |
| `welcome-signup.template.tsx`            | `sendWelcomeEmail`                 | `WelcomeSignupEmailProps` (`recipientName?`, `dashboardUrl`, `teamName?`)                     | Post sign-up (manual wiring pending) |
| `password-reset.template.tsx`            | `sendPasswordResetEmail`           | `PasswordResetEmailProps` (`resetUrl`, `expiresInMinutes`, `recipientName?`)                  | `forgotPassword` action              |
| `password-changed.template.tsx`          | `sendPasswordChangedEmail`         | `PasswordChangedEmailProps` (`changedAt`, `ipAddress?`, `recipientName?`)                     | `updatePassword` action              |
| `email-change-confirmation.template.tsx` | `sendEmailChangeConfirmationEmail` | `EmailChangeConfirmationEmailProps` (`confirmationUrl`, `newEmail`, `oldEmail?`)              | `updateAccount` email change         |
| `team-invitation.template.tsx`           | `sendTeamInvitationEmail`          | `TeamInvitationEmailProps` (`inviteUrl`, `inviterName`, `teamName`, `role`, `recipientName?`) | Invitation flow (pending wiring)     |
| `subscription-created.template.tsx`      | `sendSubscriptionCreatedEmail`     | `SubscriptionCreatedEmailProps` (`planName`, `amount`, `dashboardUrl`, `recipientName?`)      | Stripe `checkout.session.completed`  |
| `payment-failed.template.tsx`            | `sendPaymentFailedEmail`           | `PaymentFailedEmailProps` (`amountDue`, `paymentDetailsUrl`, `recipientName?`)                | Stripe `invoice.payment_failed`      |

All templates accept an optional `supportEmail`; the dispatcher will inject a default if omitted.

## Testing & previews

- `pnpm test:emails` runs `tests/emails/templates.test.ts`, which renders each template and asserts for key copy/layout markers.
- `pnpm preview:emails` produces `email-preview.html` in the project root; open it in a browser to inspect the rendered HTML.
- When editing templates, keep the preview data in `lib/emails/preview.ts` in sync so designers can see realistic examples.

## Extending the system

1. **Create props** describing your data shape under `lib/types/emails/templates/` and export them via `lib/types/emails/index.ts`.
2. **Build the React template** under `lib/emails/templates/` using the shared layout/components.
3. **Expose a render helper** that calls `renderEmail` and returns `{ html, text }`.
4. **Add a dispatcher** in `lib/emails/dispatchers.ts` that renders the template, sets a subject, defines a unique cache key, and calls `sendEmail` with an appropriate tag.
5. **Update tests** in `tests/emails/templates.test.ts` with realistic props to guard against regressions.
6. **Hook the dispatcher** into the relevant business logic (server action, webhook handler, or background job).
7. **Document** the new flow here so future engineers know where it lives.

## Operational notes & troubleshooting

- Missing or invalid Resend credentials will throw during `env` parsing; verify environment secrets before deploying.
- If Resend returns an error, `sendEmail` logs the response and throws `ResendEmailError`. Catch at the call site if you need to degrade gracefully.
- Delivery status mismatches usually mean the Resend webhook is not configured or the signature headers are missing. Confirm the endpoint URL and `RESEND_WEBHOOK_SECRET` in the Resend dashboard.
- Duplicate emails: check whether multiple instances handled the same trigger. Consider persisting idempotency keys in the database or queue if this becomes an issue.
- Email logs can be inspected via `email_logs` directly (`select * from email_logs order by sent_at desc`). Add indexes if volume grows.

## Open follow-ups

- Wire `sendWelcomeEmail` into the post sign-up flow once invite acceptance UI is finalised.
- Connect `sendTeamInvitationEmail` to the invitation action after we generate invite URLs with tokens.
- Extend Stripe webhook handling to notify users on subscription updates/cancellations.
- Expand webhook processing to record bounce metadata (`metadata` column) for deliverability triage.
