# Resend Email Integration Plan

**Created:** 2025-09-27  
**Project:** Next.js SaaS Starter  
**Focus:** Wire up Resend to deliver BetterAuth transactional emails (sign-up, password changes, invitations) and Stripe lifecycle notifications.

---

## 1. Current State & Gaps

1. No transactional email provider is configured; server actions rely on BetterAuth defaults and UI feedback only.
2. Team invitations (`app/(login)/actions.ts:inviteTeamMember`) still carry a TODO for sending email links.
3. Stripe webhook handling updates database records but does not notify customers of subscription or billing events.
4. Environment typing under `lib/env` has no slots for email credentials or sender metadata.
5. No database logging of sent emails for audit trails, debugging, or delivery tracking.
6. No webhook endpoint to receive delivery events from Resend (bounces, complaints, deliveries).

---

## 2. Goals

- Establish a reusable Resend client with typed helpers and environment validation.
- Provide HTML email templates covering BetterAuth operations (welcome/onboarding, password reset & change, email change confirmation, team invitations).
- Trigger Stripe-related notifications for key events (checkout completion, subscription status changes, payment failures).
- Store comprehensive email logs in the database for audit trails, debugging, and delivery tracking.
- Implement webhook endpoint to receive and process delivery events from Resend (bounces, complaints, deliveries).
- Keep templates and delivery logic testable and isolated from business logic.
- Document how to add new transactional flows going forward.

---

## 3. Implementation Phases

### Phase A – Foundation & Configuration (0.5 day)

- Add `resend` (and `@react-email/components` if we opt for JSX templates) to dependencies.
- Extend `lib/env.ts` to validate `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and optional branding fields (`RESEND_REPLY_TO`, `APP_SUPPORT_EMAIL`).
- Create `lib/emails/resend.client.ts` that instantiates Resend and exposes a thin `sendEmail` wrapper with typed payloads, dev-mode logging, and retry-safe error handling.
- Update README/CLAUDE env docs with new variables and setup instructions.

### Phase B – Template System & Domain Helpers (1 day)

- Introduce `lib/emails/templates/` with reusable layout partials (header, footer, CTA button) and concrete templates:
  - `welcome-signup`, `password-reset`, `password-changed`, `email-change-confirmation`, `team-invitation`.
- Define matching TypeScript types in `lib/types/emails/` for each template's expected props.
- Build `lib/emails/dispatchers.ts` exposing domain-specific senders (e.g., `sendWelcomeEmail(user)`, `sendTeamInvitation(invitation)`), selecting templates and subjects.
- Add snapshot/render tests (or storybook-like previews) to verify template output at build time.

### Phase C – BetterAuth Flow Integration (1 day)

- Hook `sendWelcomeEmail` into the successful path of `signUp` server action; include invite context when present.
- After `auth.api.changePassword` success in `updatePassword`, trigger `sendPasswordChangedEmail` for audit trail.
- Extend account email change flow (`updateAccount`) to dispatch confirmation emails to both old and new addresses if required.
- Add forgotten password flow if missing (BetterAuth `authClient.forgotPassword`); ensure request and completion send the appropriate template.
- Guard against duplicate sends by centralizing logic in middleware or using idempotency keys where necessary.

### Phase D – Stripe Event Notifications (1 day)

- Expand `app/api/stripe/webhook/route.ts` to handle `checkout.session.completed`, `invoice.payment_failed`, `customer.subscription.updated/deleted`, and `customer.subscription.trial_will_end`.
- For each event, fetch the associated team/user email, then invoke `sendSubscriptionStatusEmail`, `sendPaymentFailureEmail`, etc., reusing dispatcher helpers.
- Consider webhook verification retries and log correlation IDs for easier debugging.
- Provide opt-out flags in templates or team settings for future customization.

### Phase E – Email Logging & Database Integration (1 day)

- Create dedicated `emailLogs` table with comprehensive email-specific fields: `id`, `emailId`, `recipient`, `templateType`, `subject`, `status`, `provider`, `metadata`, `sentAt`, `deliveredAt`, `failedAt`, `errorMessage`.
- Create `lib/emails/logger.ts` with functions to log sent emails and update delivery status from webhook events.
- Update `lib/emails/resend.client.ts` to automatically log all sent emails with correlation IDs.
- Build database queries in `lib/db/queries.ts` for email log retrieval and analytics.
- Add database relations and type definitions for the new email logs table.

### Phase F – Resend Webhook Integration (1 day)

- Create `app/api/webhooks/resend/route.ts` to receive and verify webhook events from Resend.
- Handle key events: `email.sent`, `email.delivered`, `email.bounced`, `email.complained`.
- Update email log status based on webhook events using correlation IDs.
- Add webhook signature verification for security.
- Implement retry logic for failed webhook processing.
- Add environment variables for webhook secret validation.

### Phase G – QA, Observability & Docs (0.5 day)

- Add integration tests or manual scripts that simulate email dispatch in non-production (e.g., using Resend test API keys) and assert success.
- Ensure logging/reporting captures failures without leaking secrets; surface errors in UI where appropriate.
- Document email flows and extension points in `docs-dev/emails.md`, including instructions for viewing previews locally.
- Document webhook setup and troubleshooting procedures.

---

## 4. Definition of Done

- ✅ Environment schema and documentation include Resend credentials and sender metadata.
- ✅ Reusable email dispatcher functions exist with strongly typed template input and render correctly.
- ✅ BetterAuth sign-up, password change, and team invitation flows send the intended emails via Resend.
- ✅ Stripe lifecycle events trigger appropriate notifications without blocking webhook processing.
- ✅ All sent emails are logged to the dedicated `emailLogs` table with comprehensive metadata and correlation IDs.
- ✅ Resend webhook endpoint processes delivery events and updates email log status accordingly.
- ✅ Database schema includes dedicated `emailLogs` table with proper relations and type definitions.
- ✅ Developers have a documented path to preview and extend email templates.
- ✅ Webhook setup and troubleshooting procedures are documented.

---

## 5. Risks & Mitigations

- **Resend rate limits or failures** – Implement retry-friendly logging and surface actionable errors; allow fallback to console logging in dev.
- **Template drift** – Centralize shared layout components and add snapshot tests to catch accidental regressions.
- **Webhook performance** – Keep email dispatch async/non-blocking (fire-and-forget with background job or queued promise) to avoid Stripe timeout.
- **Database logging overhead** – Use efficient queries and consider indexing email-related fields; implement log rotation/archiving for high-volume scenarios.
- **Webhook signature verification failures** – Implement robust verification with proper error handling and logging for security events.
- **Compliance considerations** – Confirm footer includes address/unsubscribe guidance where required and document future escalation to marketing email tooling.

---

## 6. Open Questions

- Should password reset emails mirror BetterAuth defaults or replace them entirely? (Need confirmation.)
- What brand voice/assets (logo, colors) should templates use, and do we have existing design tokens for email?
- Do we need localization support or plaintext fallbacks in this first iteration?

---

## 7. Suggested Timeline

| Phase | Duration | Owner      |
| ----- | -------- | ---------- |
| A     | 0.5 day  | Full-stack |
| B     | 1 day    | Frontend   |
| C     | 1 day    | Full-stack |
| D     | 1 day    | Backend    |
| E     | 1 day    | Full-stack |
| F     | 1 day    | Backend    |
| G     | 0.5 day  | Full-stack |

Total: **~6 days**

---

## 8. Follow-ups

- Evaluate background job/queue options if email volume increases (e.g., Upstash QStash, Vercel Cron).
- Add analytics hooks (e.g., ActivityLog entries) when critical emails are sent.
- Explore in-app notification center to mirror email events for users who opt out of emails.
- Build admin dashboard for email delivery analytics and failed message investigation.
- Implement email template A/B testing capabilities for optimization.
- Add email throttling and batching for high-volume scenarios.
- Consider email deliverability monitoring and reputation tracking.

---

## 9. Reference Links

- Resend quickstart for Next.js – https://resend.com/docs/send-with-nextjs
- Resend email API reference – https://resend.com/docs/api-reference/emails/send-email
- Resend React email templates guide – https://resend.com/docs/email-templates/react
- React Email + Resend integration docs – https://react.email/docs/integrations/resend
- Vercel deployment notes for Resend apps – https://resend.com/docs/integrations/vercel
- Resend webhook documentation – https://resend.com/docs/api-reference/webhooks
- Resend webhook event types – https://resend.com/docs/api-reference/webhooks/event-types
