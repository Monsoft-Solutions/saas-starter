# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
pnpm dev                 # Start development server with Turbopack
pnpm build              # Build for production
pnpm start              # Start production server

# Database
pnpm db:setup           # Create .env file (interactive setup)
pnpm db:migrate         # Run database migrations
pnpm db:seed            # Seed database with test user (test@test.com / admin123)
pnpm db:generate        # Generate Drizzle migrations
pnpm db:studio          # Open Drizzle Studio

# Stripe (for local testing)
stripe listen --forward-to localhost:3000/api/stripe/webhook
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
- **IMPORTANT**: Always use the design system from `/lib/design-system/` - import tokens, utilities, and patterns
- Import design tokens: `import { colors, typography, spacing, radius } from '@/lib/design-system'`
- Use `cn()` utility for class merging: `import { cn } from '@/lib/design-system'`
- Leverage predefined patterns: `themeUtils.patterns.card`, `themeUtils.patterns.heading`, etc.
- Use Notion-inspired spacing: `notionSpacing.cardPadding`, `notionSpacing.sectionGap`
- Apply consistent radius: `notionRadius.default`, `notionRadius.card`, `notionRadius.button`
- Never define custom colors, typography sizes, spacing, or radius - use design system tokens
- Avoid custom styles in components unless absolutely necessary

**Schema & Database:**

- One database schema per file in `/lib/db/schemas/`
- Use Zod for all object validation and schema definitions
- Maintain proper type inference throughout the stack

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

- Use Zod schemas for all data validation
- Type everything explicitly - no implicit any types
- Validate inputs at boundaries (API routes, form submissions, etc.)

## Naming Conventions

### File Naming Conventions

Follow the pattern: `<file-name>.<file-type>.ts`

**Database & Schema:**

- `*.table.ts` - Drizzle table definitions
- `*.schema.ts` - Zod validation schemas
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
