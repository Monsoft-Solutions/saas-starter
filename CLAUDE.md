# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development (Multi-Environment Support)
pnpm dev                 # Start dev server (Next.js loads .env.local → .env.development → .env automatically)
pnpm dev:local          # Start dev server for local development (same as pnpm dev, no external services)
pnpm dev:staging        # Run dev server with staging environment (.env.staging)
pnpm dev:prod           # Run dev server with production environment (.env.production)
pnpm build              # Build for production (Next.js loads env files automatically)
pnpm build:staging      # Build with staging environment (.env.staging)
pnpm build:prod         # Build with production environment (.env.production)
pnpm start              # Start production server (uses built-in env vars)
pnpm start:staging      # Start with staging environment (.env.staging)
pnpm start:prod         # Start with production environment (.env.production)

# Database (Multi-Environment Support)
pnpm db:setup           # Create .env file (interactive setup for local)
pnpm db:setup:staging   # Setup staging database
pnpm db:setup:prod      # Setup production database
pnpm db:migrate         # Run database migrations (local)
pnpm db:migrate:staging # Run migrations on staging
pnpm db:migrate:prod    # Run migrations on production
pnpm db:seed            # Seed database with test user (test@test.com / admin123)
pnpm db:seed:staging    # Seed staging database
pnpm db:seed:prod       # Seed production database
pnpm db:generate        # Generate Drizzle migrations
pnpm db:studio          # Open Drizzle Studio (local)
pnpm db:studio:staging  # Open Drizzle Studio for staging
pnpm db:studio:prod     # Open Drizzle Studio for production

# Stripe (for local testing)
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Environment Configuration

The application supports multiple environments. See [Environment Configuration Guide](./docs/environment-configuration.md) for details.

### Environment Files

- `.env.local` - Local development (gitignored, use for secrets)
- `.env.development` - Shared development environment (committed, no secrets)
- `.env.staging` - Staging environment (committed, no secrets)
- `.env.production` - Production environment (committed, no secrets)
- `.env.example` - Template file (committed)
- `.env.local.example` - Local template (committed)

### Environment Loading Priority

**Next.js automatically loads environment files in this order (highest to lowest priority):**

1. `.env.local` (local development, gitignored) - **Highest priority**
2. `.env.[environment]` (e.g., `.env.development`, `.env.staging`, `.env.production`)
3. `.env` (fallback for shared defaults)

**Important Notes:**

- The base `pnpm dev` and `pnpm build` commands rely on Next.js's automatic env loading
- No `.env` file is required - Next.js will work with `.env.local` or environment-specific files
- For staging/production, use `dotenv-cli` to explicitly load environment-specific files
- CI/CD environments should inject variables directly (Vercel, Railway, etc.)

### Quick Setup

```bash
# First time setup - copy local template
cp .env.local.example .env.local

# Edit .env.local with your credentials
# Then run
pnpm dev
```

## Architecture Overview

### Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: BetterAuth with social providers (Google, Facebook, LinkedIn, TikTok)
- **Payments**: Stripe integration with webhooks
- **UI**: shadcn/ui components with Tailwind CSS

### Core Structure

**Authentication Flow:**

- Global middleware (`middleware.ts`) protects `/app` routes using BetterAuth sessions
- BetterAuth handles session management automatically
- Local middleware functions (`lib/auth/middleware.ts`) provide validation helpers for Server Actions

**Database Schema (`lib/db/schema.ts`):**

- `user` - BetterAuth user accounts with social auth support
- `session` - BetterAuth session management
- `account` - Social provider account linking
- `organization` - Organization entities with Stripe subscription data
- `member` - Many-to-many relationship between users and organizations
- `activityLogs` - Audit trail for user actions
- `invitation` - Pending organization invitations

**Route Organization:**

- `app/(login)/` - Unauthenticated routes (sign-in, sign-up)
- `app/(app)/` - Protected app routes
- `app/api/` - API routes for webhooks and integrations

### Key Patterns

**Server Actions:**

- Use `validatedAction()` for form validation with Zod schemas
- Use `validatedActionWithUser()` when user context is required
- Use `withOrganization()` wrapper for organization-scoped operations
- Use `createTypedAction()` for type-safe actions with output validation
- Use `createTypedActionWithUser()` for authenticated typed actions

**Validation:**

- **Input Validation**: Use `validateRequest()`, `validateQueryParams()`, `validateRouteParams()`, or `validateFormData()` from `lib/validation/request-validator.util.ts`
- **Output Validation**: Use `validatedOk()` or `validatedCreated()` from `lib/validation/validated-response.util.ts` for API responses
- **Sanitization**: Use sanitization utilities (`sanitizedEmail`, `sanitizedString`, etc.) from `lib/validation/sanitization.util.ts`
- **Error Codes**: Use standardized error codes from `lib/validation/error-codes.enum.ts`
- **Schema Organization**: Follow naming convention `*-request.schema.ts`, `*-response.schema.ts`, `*-action.schema.ts` in `lib/types/[domain]/`
- **Strict Schemas**: Use `.strict()` on response schemas to prevent data leakage
- See [Validation Guide](./docs/validation/validation-guide.md) for complete documentation

**Database Queries:**

- Centralized in `lib/db/queries.ts`
- Use Drizzle ORM with proper type inference
- Activity logging via `logActivity()` function

**Stripe Integration:**

- Webhook handling in `app/api/stripe/webhook/route.ts`
- Customer Portal and Checkout flows in `lib/payments/`
- Subscription status synced to `organization` table

## Environment Setup

Required environment variables:

- `POSTGRES_URL` - Database connection string
- `BETTER_AUTH_SECRET` - BetterAuth signing secret (generate with `openssl rand -hex 32`)
- `BETTER_AUTH_URL` - Application base URL for BetterAuth
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `BASE_URL` - Application base URL
- `RESEND_API_KEY` - Resend API key with sending access
- `RESEND_FROM_EMAIL` - Verified sender address for transactional emails

Optional social authentication variables:

- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` - Google OAuth
- `FACEBOOK_CLIENT_ID` & `FACEBOOK_CLIENT_SECRET` - Facebook OAuth
- `LINKEDIN_CLIENT_ID` & `LINKEDIN_CLIENT_SECRET` - LinkedIn OAuth
- `TIKTOK_CLIENT_KEY` & `TIKTOK_CLIENT_SECRET` - TikTok OAuth

Optional email metadata:

- `RESEND_REPLY_TO` - Override reply-to address if it differs from the sender
- `APP_SUPPORT_EMAIL` - Fallback support contact exposed in templates

## Testing

Default test user after running `pnpm db:seed`:

- Email: `test@test.com`
- Password: `admin123`

Use Stripe test card: `4242 4242 4242 4242` with any future expiry and CVC.

## Development Standards & Best Practices

### Code Organization & Structure

**Type Definitions:**

- All type definitions must live in `/lib/types/[folder]/`
- Group types by domain/feature (e.g., `/lib/types/auth/`, `/lib/types/payments/`)
- One type per file for maintainability
- Use `type` instead of `interface` whenever possible
- Never use `any` type - always provide proper typing

**UI Components:**

- Use shadcn/ui components - check shadcn docs for installation
- **IMPORTANT**: Use Tailwind CSS v4 utilities and design tokens from `app/globals.css`
- Use `cn()` utility for class merging: `import { cn } from '@/lib/utils'`
- Design tokens are available as Tailwind utilities (e.g., `bg-primary`, `text-muted-foreground`, `rounded-lg`)
- All color, spacing, and radius tokens are defined in `app/globals.css` using the `@theme` directive
- Use semantic color classes: `bg-card`, `bg-muted`, `bg-accent` instead of raw colors
- Apply consistent spacing with Tailwind utilities: `p-6` (card padding), `gap-6` (section gap)
- Use Tailwind radius utilities: `rounded-md` (6px default), `rounded-lg` (8px cards), `rounded-full` (circular)
- For custom patterns, use the custom utilities defined in `app/globals.css`: `page-container`, `stack-md`, `grid-dashboard`, `grid-cards`
- Never define custom colors, typography sizes, spacing, or radius - extend the theme in `app/globals.css` using `@theme`
- Avoid custom styles in components unless absolutely necessary

**Schema & Database:**

- One database schema per file in `/lib/db/schemas/`
- Use Zod for all object validation and schema definitions
- Maintain proper type inference throughout the stack

**Validation Schemas:**

- Organize validation schemas by domain in `/lib/types/[domain]/`
- Use naming convention: `*-request.schema.ts` (API/form inputs), `*-response.schema.ts` (API outputs), `*-action.schema.ts` (server action states)
- One schema per file for maintainability
- Export both schema and inferred type: `export const schema = z.object({ ... }); export type Type = z.infer<typeof schema>;`
- Use `.strict()` on response schemas to prevent accidental data exposure
- See [Schema Organization Guide](./docs/validation/schema-organization.md) for complete patterns

### Development Principles

**Code Quality:**

- Prefer functions over classes
- Apply DRY (Don't Repeat Yourself) principles consistently
- Decouple logic as much as possible - one responsibility per file
- No multiple type declarations in the same file

**Development Process:**

1. **Analyze** - Deeply understand requirements and existing code
2. **Architect** - Design the best possible solution
3. **Plan** - Create detailed TODO list using TodoWrite tool
4. **Implement** - Execute the planned solution

**Validation & Safety:**

- Use Zod schemas for all data validation (inputs AND outputs)
- Type everything explicitly - no implicit any types
- Validate inputs at boundaries (API routes, form submissions, query params, route params)
- Validate outputs at boundaries (API responses) to prevent data leakage
- Use sanitization utilities for user input (`sanitizedEmail`, `sanitizedString`, etc.)
- Use standardized error codes from `ErrorCode` enum
- Apply `.strict()` to response schemas to reject extra fields
- Provide clear, user-friendly error messages in schemas
- See [Validation Guide](./docs/validation/validation-guide.md) for implementation patterns

## Naming Conventions

### File Naming Conventions

Follow the pattern: `<file-name>.<file-type>.ts`

**Database & Schema:**

- `*.table.ts` - Drizzle table definitions
- `*.schema.ts` - Zod validation schemas (see specific patterns below)
- `*-request.schema.ts` - Request/input validation schemas
- `*-response.schema.ts` - Response/output validation schemas
- `*-action.schema.ts` - Server action state schemas
- `*.query.ts` - Database query functions
- `*.migration.ts` - Database migrations

**Type Definitions:**

- `*.type.ts` - Type definitions and interfaces
- `*.enum.ts` - Enum definitions
- `*.constant.ts` - Constant values

**Business Logic:**

- `*.service.ts` - Business logic and services
- `*.repository.ts` - Data access layer
- `*.handler.ts` - Event/request handlers
- `*.middleware.ts` - Middleware functions
- `*.action.ts` - Server actions
- `*.util.ts` - Utility functions
- `*.helper.ts` - Helper functions

**Configuration:**

- `*.config.ts` - Configuration files
- `*.client.ts` - Client configurations (API, auth, etc.)

**UI & Components:**

- `*.component.tsx` - React components
- `*.hook.ts` - Custom React hooks
- `*.context.tsx` - React context providers
- `*.provider.tsx` - Provider components

**Testing:**

- `*.test.ts` - Unit tests
- `*.spec.ts` - Specification tests
- `*.mock.ts` - Mock data/functions

### TypeScript Code Naming Conventions

**Variables & Functions:**

- `camelCase` - Variables, functions, methods, properties
- Examples: `userName`, `getUserData()`, `calculateTotalPrice()`

**Classes, Interfaces & Types:**

- `PascalCase` - Classes, interfaces, types, enums
- Examples: `UserProfile`, `DatabaseConnection`, `ApiResponse`, `UserRole`

**Constants:**

- `SCREAMING_SNAKE_CASE` - Constants and environment variables
- Examples: `MAX_RETRY_ATTEMPTS`, `API_BASE_URL`, `DATABASE_URL`

**Files & Directories:**

- `kebab-case` - File names and directory names
- Combined with file type: `user-profile.component.tsx`

**Database:**

- `snake_case` - Database table and column names
- Examples: `user_profiles`, `created_at`, `stripe_customer_id`

**Boolean Variables:**

- Use descriptive prefixes: `is`, `has`, `can`, `should`, `will`
- Examples: `isAuthenticated`, `hasPermission`, `canEdit`

**Event Handlers:**

- Use `handle` or `on` prefix
- Examples: `handleSubmit`, `onUserClick`, `handleFormValidation`

### Additional Naming Rules

**Avoid:**

- Hungarian notation (e.g., `strUserName`)
- Type information in variable names (TypeScript handles this)
- Abbreviations unless widely understood (e.g., `id`, `url`, `api`)

**Prefer:**

- Descriptive, self-documenting names
- Consistent terminology across the codebase
- Single responsibility per file/function

**Comment Code**

- Always comment the functions, types and important objects with concise doc. For complex code, document inner logic when necessary for better understanding.
