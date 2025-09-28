# SaaS Starter Documentation

## Overview

This directory contains comprehensive documentation for the SaaS Starter application. The documentation covers all major systems and integrations implemented in the application.

## 📂 Documentation Structure

### 🏗 **Architecture & Systems**

- **[Design System](./design-system.md)**: Token-based design system with Notion-inspired components
- **[Navigation System](./navigation.md)**: Dynamic navigation with role-based filtering
- **[Email System](./emails.md)**: Transactional email templates and delivery

### 💳 **Stripe Integration**

- **[Stripe Integration](./stripe/)**: Complete subscription and billing system
  - [Integration Overview](./stripe/stripe-integration.md): Architecture and implementation details
  - [Setup Script Guide](./stripe/setup-script-guide.md): Automated Stripe account configuration
  - [Webhooks Configuration](./stripe/webhooks-configuration.md): Real-time event processing
  - [Checkout & Billing Portal](./stripe/checkout-and-billing-portal.md): Subscription flows

### 🔐 **Authentication & Authorization**

- **[Server Authorization Overview](./auth/server-authorization-overview.md)**: Request lifecycle, guard registry, and session caching helpers
- **[Server Actions & Hooks](./auth/server-actions-and-hooks.md)**: Patterns for validated server actions, API handlers, and typed client fetchers
- **[OAuth Setup](./auth/OAUTH_SETUP.md)**: Social authentication provider configuration

### 🧪 **Development & Testing**

- **[Unit Testing](./unit-testing.md)**: Testing framework and patterns
- **[Stripe Metadata Validation](./stripe-metadata-validation.md)**: Type-safe Stripe data handling

## 🚀 Quick Start

### 1. Environment Setup

Copy the required environment variables:

```bash
# Database
POSTGRES_URL=postgresql://...

# Authentication
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:3000

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Application
BASE_URL=http://localhost:3000
```

### 2. Database Setup

```bash
# Create and migrate database
pnpm db:setup
pnpm db:migrate

# Seed with test data
pnpm db:seed
```

### 3. Stripe Configuration

```bash
# Set up Stripe products and pricing
node scripts/setup-stripe-features.js
```

### 4. Development

```bash
# Start development server
pnpm dev

# Test user credentials
# Email: test@test.com
# Password: admin123
```

## 🏗 Architecture Overview

The application follows a modern full-stack architecture:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js 15    │    │   PostgreSQL     │    │   External      │
│   App Router    │◄───┤   + Drizzle ORM  │    │   Services      │
│   + TypeScript  │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   shadcn/ui     │    │   BetterAuth     │    │   Stripe API    │
│   + Tailwind    │    │   Multi-tenant   │    │   + Webhooks    │
│   Components    │    │   Organizations  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Key Technologies

- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: BetterAuth with multi-tenant organizations
- **Payments**: Stripe with subscription management
- **UI**: shadcn/ui components with Tailwind CSS
- **Email**: Resend for transactional emails
- **Type Safety**: TypeScript with Zod validation

## 📋 Development Standards

### Code Organization

The application follows strict naming conventions and file organization:

- **File Types**: `*.type.ts`, `*.schema.ts`, `*.query.ts`, `*.action.ts`
- **Components**: `*.component.tsx`, `*.hook.ts`, `*.context.tsx`
- **Database**: `*.table.ts`, `*.migration.ts`

### Type Safety

- **Zod Schemas**: All data validation uses Zod
- **Type Inference**: Database queries maintain type safety
- **No Any Types**: Explicit typing throughout the codebase

### Design System

- **Token-Based**: Centralized design tokens for consistency
- **Notion-Inspired**: Clean, modern UI patterns
- **Component Library**: Reusable shadcn/ui components

## 🔧 Core Features

### ✅ Implemented Features

- **Multi-tenant Organizations**: User can belong to multiple organizations
- **Role-based Access Control**: Owner/member roles with permissions
- **Subscription Management**: Stripe integration with billing portal
- **Email Notifications**: Automated transactional emails
- **Activity Logging**: Audit trail for user actions
- **Dynamic Navigation**: Context-aware navigation system
- **Design System**: Consistent UI with design tokens

### 🚧 In Development

- **In-app Notifications**: Real-time notification system
- **Advanced Logging**: Winston-based logging infrastructure
- **Provider-agnostic Cache**: Flexible caching layer
- **Better Organization Management**: Enhanced organization features

## 📖 Documentation Guidelines

### For Developers

1. **Read Architecture Docs**: Start with system overviews
2. **Follow Code Standards**: Use established patterns and naming
3. **Maintain Type Safety**: Keep TypeScript coverage high
4. **Test Thoroughly**: Write tests for new features
5. **Update Documentation**: Keep docs current with changes

### For Integration

1. **Stripe Setup**: Use the setup script for initial configuration
2. **Email Templates**: Follow template patterns for new emails
3. **Database Changes**: Use migrations for schema updates
4. **Environment Variables**: Follow validation patterns

## 🧪 Testing

### Test Data

After running `pnpm db:seed`:

- **Test User**: `test@test.com` / `admin123`
- **Test Organization**: Automatically created
- **Stripe Test Cards**: `4242 4242 4242 4242`

### Testing Commands

```bash
# Run unit tests
pnpm test

# Test Stripe integration
node scripts/setup-stripe-features.js

# Test email templates
pnpm preview-emails

# Database tests
pnpm db:studio
```

## 🚨 Troubleshooting

### Common Issues

| Issue                  | Documentation                        |
| ---------------------- | ------------------------------------ |
| Stripe setup problems  | [Stripe Integration](./stripe/)      |
| Email delivery issues  | [Email System](./emails.md)          |
| Authentication errors  | [OAuth Setup](./auth/OAUTH_SETUP.md) |
| Navigation not working | [Navigation System](./navigation.md) |
| Database connection    | Check environment variables          |

### Debug Commands

```bash
# Check environment
node -e "console.log(process.env.POSTGRES_URL ? 'DB Connected' : 'DB Missing')"

# Test Stripe connection
node scripts/setup-stripe-features.js

# Check email configuration
pnpm preview-emails
```

## 📚 External Resources

- **[Next.js Documentation](https://nextjs.org/docs)**
- **[Stripe API Reference](https://stripe.com/docs/api)**
- **[Drizzle ORM Docs](https://orm.drizzle.team)**
- **[BetterAuth Documentation](https://www.better-auth.com)**
- **[shadcn/ui Components](https://ui.shadcn.com)**

## 🤝 Contributing

When contributing to the project:

1. **Follow Standards**: Use established patterns and naming
2. **Update Documentation**: Keep docs current with changes
3. **Maintain Type Safety**: Ensure TypeScript coverage
4. **Test Changes**: Verify all functionality works
5. **Review Security**: Follow security best practices

---

**Last Updated**: September 28, 2025  
**Framework Version**: Next.js 15  
**Documentation Version**: 1.0
