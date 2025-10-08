# Enterprise SaaS Starter

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)
![Maintained](https://img.shields.io/badge/Maintained-yes-green.svg)

**[🚀 Live Demo](#) • [📖 Documentation](./docs/README.md) • [💬 Discord](#) • [🐛 Report Bug](https://github.com/Monsoft-Solutions/saas-starter/issues)**

</div>

A production-ready, enterprise-grade SaaS starter template built by **[Monsoft Solutions](https://monsoftsolutions.com)** and developed by **[@flechilla](https://github.com/flechilla)**.

Originally forked from [nextjs/saas-starter](https://github.com/nextjs/saas-starter) but completely rewritten with enterprise features, advanced authentication, multi-tenancy, and a comprehensive design system.

## 📋 Table of Contents

- [Quick Overview](#-quick-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Local Development Setup](#-local-development-setup)
- [Testing](#-testing)
- [Production Deployment](#-production-deployment)
- [Documentation](#-documentation)
- [Development Standards](#-development-standards)
- [Available Commands](#-available-commands)
- [Enterprise Features](#-enterprise-features)
- [Contributing](#-contributing)
- [License](#-license)

## 🎯 Quick Overview

> **Production-ready** Next.js 15 SaaS boilerplate with everything you need to launch your SaaS business

- 🔐 **Complete Authentication** - Multi-tenant auth with social providers & RBAC
- 💳 **Stripe Payments** - Full subscription management & billing portal
- 👑 **Admin Dashboard** - Powerful admin panel with analytics & user management
- 🔄 **Background Jobs** - Async processing with BullMQ & Redis
- 📧 **Email System** - Beautiful templates with Resend integration
- ⚡ **Cache Layer** - Provider-agnostic caching with Upstash Redis
- 🎨 **Design System** - Notion-inspired UI with shadcn/ui components
- 🔌 **Type-Safe API** - End-to-end type safety with Zod validation
- 📝 **Logging** - Production-ready logging with Winston
- 🧪 **Testing** - Comprehensive test coverage with Vitest

## 💡 Why Choose This Starter?

<table>
<tr>
<td width="50%">

### ⚡ **Fast Development**

- Pre-configured authentication & authorization
- Ready-to-use admin dashboard
- Complete payment integration
- Professional email templates
- Modern UI components library

</td>
<td width="50%">

### 🛡️ **Production Ready**

- Enterprise-grade security
- Comprehensive error handling
- Performance optimized caching
- Structured logging & monitoring
- Full test coverage

</td>
</tr>
<tr>
<td width="50%">

### 🎨 **Beautiful Design**

- Notion-inspired interface
- Dark/light mode support
- Responsive mobile-first design
- Accessible components
- Customizable design tokens

</td>
<td width="50%">

### 🚀 **Scalable Architecture**

- Multi-tenant from day one
- Background job processing
- Provider-agnostic caching
- Type-safe API architecture
- Database optimization

</td>
</tr>
</table>

## ✨ Key Features

### 🔐 **Enterprise Authentication & Authorization**

- **BetterAuth Integration**: Modern TypeScript-first authentication framework
- **Multi-provider Social Auth**: Google, Facebook, LinkedIn, and TikTok OAuth
- **Account Linking**: Link multiple social accounts to a single user
- **Multi-tenant Organizations**: Users can belong to multiple organizations
- **Role-based Access Control**: Owner/Member roles with granular permissions
- **Session Management**: Secure session handling with automatic refresh
- **Super Admin Space**: Complete admin panel for system-wide management and monitoring

### 🏢 **Multi-tenant Architecture**

- **Organization Management**: Complete multi-tenant organization system
- **Member Management**: Invite, remove, and manage organization members
- **Role-based Navigation**: Dynamic navigation based on user permissions
- **Activity Logging**: Comprehensive audit trail for all user actions
- **Invitation System**: Secure organization invitation workflow

### 💎 **Professional Design System**

- **Token-based Design**: Centralized design tokens for consistency
- **Notion-inspired UI**: Clean, modern aesthetic with professional components
- **shadcn/ui Components**: Extensive library of customizable UI components
- **Responsive Design**: Mobile-first responsive design patterns
- **Dark/Light Mode**: Built-in theme switching with system preference detection
- **Advanced Layouts**: Command palette, breadcrumbs, and sophisticated navigation

### 👑 **Super Admin Space**

- **Comprehensive Dashboard**: System-wide metrics, user growth, and revenue analytics
- **User Management**: View, search, and manage all users with role assignment and banning
- **Organization Management**: Monitor and manage all organizations and subscriptions
- **Subscription Analytics**: Track MRR, churn rate, plan distribution, and revenue trends
- **Activity Logs**: Complete audit trail with filtering, search, and CSV export
- **Multi-layer Security**: Five-layer defense architecture with Better Auth admin plugin
- **Impersonation**: Securely impersonate users for support and troubleshooting

### 💳 **Complete Stripe Integration**

- **Subscription Management**: Full subscription lifecycle management
- **Multiple Plans**: Support for multiple pricing tiers and billing periods
- **Customer Portal**: Self-service billing and subscription management
- **Webhook Processing**: Real-time webhook handling for subscription events
- **Invoice Management**: Automated invoice generation and management
- **Payment Failed Recovery**: Automated dunning management

### 📧 **Professional Email System**

- **Resend Integration**: Reliable transactional email delivery
- **Rich Email Templates**: Professional email templates with React Email
- **Email Types**: Welcome, password reset, team invitations, payment notifications
- **Template Components**: Reusable email components and layouts
- **Email Logging**: Track and monitor email delivery and engagement

### ⚡ **Provider-Agnostic Cache System**

- **Multi-Provider Support**: In-memory for development, Upstash Redis for production
- **Type-Safe Operations**: Full TypeScript support with generic types
- **Cache-Aside Pattern**: Built-in `getOrSet` for efficient data fetching
- **Pattern Invalidation**: Smart cache invalidation with wildcard patterns
- **Performance Monitoring**: Built-in statistics and health monitoring
- **Graceful Degradation**: Cache failures don't break application functionality

### 🔄 **Async Background Job Processing**

- **BullMQ Integration**: Redis-backed queue management with robust job processing
- **Job Types**: Email jobs, webhook jobs, and custom job definitions
- **Retry Logic**: Automatic retry with exponential backoff for failed jobs
- **Job Monitoring**: Real-time job status tracking and comprehensive dashboard
- **Priority Queues**: Support for job prioritization and scheduling
- **Dead Letter Queue**: Failed job handling with manual retry capabilities

### 🔌 **Type-Safe API Architecture**

- **Unified API Patterns**: Consistent patterns for API routes, server actions, and hooks
- **Zod Validation**: Runtime type validation for all API inputs and outputs
- **Permission System**: Granular permission-based access control for all operations
- **Error Handling**: Standardized error responses with proper HTTP status codes
- **Type Inference**: End-to-end type safety from client to server
- **Documentation**: Comprehensive API documentation with examples and best practices

### 📝 **Production Logging System**

- **Winston Integration**: Structured logging with environment-based configuration
- **Log Levels**: Support for debug, info, warn, and error log levels
- **Log Rotation**: Automatic daily log rotation with compression
- **Error Tracking**: Comprehensive error and exception logging
- **Performance Monitoring**: Request timing and performance metrics
- **Production Ready**: Separate logs for different environments

### 🛠 **Developer Experience**

- **TypeScript Excellence**: 100% TypeScript with strict type safety
- **Zod Validation**: Runtime type validation for all data
- **Modern Stack**: Next.js 15, App Router, and latest React features
- **Database Management**: PostgreSQL with Drizzle ORM and type-safe queries
- **Development Tools**: ESLint, Prettier, Husky, and lint-staged
- **Testing Framework**: Vitest with comprehensive test coverage

## 🚀 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router and Turbopack
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: [BetterAuth](https://www.better-auth.com/) with social providers
- **Payments**: [Stripe](https://stripe.com/) with subscription management
- **Email**: [Resend](https://resend.com/) with React Email templates
- **Caching**: [Upstash Redis](https://upstash.com/) with provider-agnostic cache layer
- **Background Jobs**: [BullMQ](https://docs.bullmq.io/) with Redis-backed queues
- **Logging**: [Winston](https://github.com/winstonjs/winston) with structured logging
- **UI Framework**: [shadcn/ui](https://ui.shadcn.com/) with [Tailwind CSS](https://tailwindcss.com/)
- **Validation**: [Zod](https://zod.dev/) for runtime type validation
- **Testing**: [Vitest](https://vitest.dev/) with React Testing Library
- **Deployment**: [Vercel](https://vercel.com/) optimized

## 📦 Quick Start

```bash
git clone https://github.com/Monsoft-Solutions/saas-starter
cd saas-starter
pnpm install
```

## 🔧 Local Development Setup

### 1. Prerequisites

Ensure you have the following installed:

- **Node.js** 18+ and **pnpm**
- **PostgreSQL** database
- **Stripe CLI** for webhook testing

```bash
# Install Stripe CLI
npm install -g stripe-cli
stripe login
```

### 2. Environment Configuration

The application supports multiple environments (local, development, staging, production). For local development:

```bash
# Copy the local environment template
cp .env.local.example .env.local

# Or use the interactive setup script
pnpm db:setup
```

**Required environment variables** in `.env.local`:

```env
# Database
POSTGRES_URL=postgresql://...

# Authentication
BETTER_AUTH_SECRET=your_random_secret_key_32_chars
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

# Stripe Integration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email Service
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_WEBHOOK_SECRET=your_webhook_secret

# Cache Configuration
CACHE_PROVIDER=in-memory
CACHE_DEFAULT_TTL=3600

# Application
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

📚 **For full environment configuration guide**, see [Environment Configuration](./docs/environment-configuration.md)

### 3. Database Setup

Initialize and migrate your database:

```bash
# Run migrations and seed data
pnpm db:migrate
pnpm db:seed
```

**Default test credentials:**

- **Regular User**:
  - **Email**: `test@test.com`
  - **Password**: `admin123`

- **Super Admin** (access to admin panel at `/admin`):
  - **Email**: `admin@test.com`
  - **Password**: `admin123`

### 4. Stripe Configuration

Set up your Stripe products and pricing:

```bash
# Configure Stripe products automatically
node scripts/setup-stripe-features.js
```

### 5. Start Development

```bash
# Start the development server with Turbopack
pnpm dev

# In a separate terminal, listen for Stripe webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🧪 Testing

### Payment Testing

Use Stripe's test card numbers:

- **Successful Payment**: `4242 4242 4242 4242`
- **Payment Declined**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`
- **Expiration**: Any future date
- **CVC**: Any 3-digit number

### Email Testing

Preview email templates during development:

```bash
pnpm preview:emails
```

### Database Testing

Explore your database with Drizzle Studio:

```bash
pnpm db:studio
```

### Cache Testing

Test cache functionality and performance:

```bash
# Run cache-specific tests
pnpm test tests/cache

# Check cache statistics via API
curl http://localhost:3000/api/cache/stats
```

## 🚀 Production Deployment

### Vercel Deployment (Recommended)

1. **Prepare Your Repository**

   ```bash
   git add .
   git commit -m "Deploy to production"
   git push origin main
   ```

2. **Connect to Vercel**
   - Import your project in [Vercel](https://vercel.com/)
   - Connect your GitHub repository
   - Configure environment variables

3. **Production Environment Variables**

   Set these variables in your Vercel project settings:

   ```env
   # Core Application
   BASE_URL=https://yourdomain.com
   POSTGRES_URL=your_production_database_url

   # Authentication
   BETTER_AUTH_SECRET=production_secret_32_chars
   BETTER_AUTH_URL=https://yourdomain.com

   # Stripe Production
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_production_...

   # Email Production
   RESEND_API_KEY=re_production_...
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   RESEND_WEBHOOK_SECRET=production_webhook_secret

   # Cache Production
   CACHE_PROVIDER=upstash
   CACHE_DEFAULT_TTL=3600
   REDIS_REST_URL=https://your-instance.upstash.io
   REDIS_REST_TOKEN=your_upstash_token

   # Optional: Social Authentication
   GOOGLE_CLIENT_ID=production_google_id
   GOOGLE_CLIENT_SECRET=production_google_secret
   FACEBOOK_CLIENT_ID=production_facebook_id
   FACEBOOK_CLIENT_SECRET=production_facebook_secret
   LINKEDIN_CLIENT_ID=production_linkedin_id
   LINKEDIN_CLIENT_SECRET=production_linkedin_secret
   ```

4. **Production Stripe Webhook**
   - Create a production webhook in [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
   - Set endpoint: `https://yourdomain.com/api/stripe/webhook`
   - Enable events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`

5. **Database Migration**
   ```bash
   # Run migrations in production
   pnpm db:migrate
   ```

### Alternative Deployment Platforms

The application is compatible with:

- **Vercel** (recommended)
- **Netlify**
- **Railway**
- **AWS Amplify**
- **Self-hosted** with Docker

## 📚 Documentation

### Comprehensive Documentation

- **[📖 Full Documentation](./docs/README.md)**: Complete system documentation
- **[🔐 Authentication Guide](./docs/auth/)**: BetterAuth and OAuth setup
- **[👑 Super Admin Space](./docs/admin-space/overview.md)**: Admin panel documentation and features
- **[💳 Stripe Integration](./docs/stripe/)**: Payment processing and webhooks
- **[🔌 API Architecture](./docs/api/)**: Type-safe API patterns, validation, and permissions
- **[⚡ Cache System](./docs/cache/)**: Provider-agnostic caching with Upstash Redis
- **[🔄 Background Jobs](./docs/async-job-processing.md)**: Async job processing with BullMQ
- **[📝 Logging System](./docs/logging.md)**: Production logging with Winston
- **[🌍 Environment Configuration](./docs/environment-configuration.md)**: Multi-environment setup guide
- **[💎 Design System](./docs/design-system.md)**: Tailwind CSS v4 design tokens and utilities
- **[📧 Email System](./docs/emails.md)**: Email templates and delivery
- **[🧪 Testing Guide](./docs/unit-testing.md)**: Testing framework and patterns

### Architecture Overview

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
│   + Design      │    │   Organizations  │    │   + Webhooks    │
│   System        │    │   + Social Auth  │    │   + Resend      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Cache Layer   │    │   Activity       │    │   Upstash       │
│   + Monitoring  │    │   Logging        │    │   Redis         │
│   + Statistics  │    │   + Analytics    │    │   + Edge        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🏗 Development Standards

### File Organization

```
lib/
├── types/           # TypeScript type definitions
├── db/
│   ├── schemas/     # Database table schemas
│   ├── queries/     # Type-safe database queries
│   └── migrations/  # Database migration files
├── auth/            # Authentication utilities
├── cache/           # Provider-agnostic cache system
├── emails/          # Email templates and logic
├── utils/           # Utility functions (including cn)
└── payments/        # Stripe integration logic
```

### Naming Conventions

- **Files**: `kebab-case.type.ts` (e.g., `user-profile.type.ts`)
- **Components**: `PascalCase.component.tsx`
- **Variables**: `camelCase`
- **Constants**: `SCREAMING_SNAKE_CASE`
- **Database**: `snake_case`

### Code Quality

- **TypeScript**: 100% type coverage, no `any` types
- **Validation**: Zod schemas for all data validation
- **Testing**: Comprehensive test coverage with Vitest
- **Linting**: ESLint + Prettier with strict rules
- **Git Hooks**: Pre-commit validation with Husky

## 🎯 Available Commands

```bash
# Development
pnpm dev                 # Start dev server (Next.js auto-loads .env.local → .env.development → .env)
pnpm dev:local          # Start dev server for local development (no external services)
pnpm dev:staging        # Run dev server with staging environment (.env.staging)
pnpm dev:prod           # Run dev server with production environment (.env.production)
pnpm build              # Build for production (Next.js auto-loads env files, no .env required)
pnpm build:staging      # Build with staging environment (.env.staging)
pnpm build:prod         # Build with production environment (.env.production)
pnpm start              # Start production server (uses built-in env vars)
pnpm start:staging      # Start with staging environment (.env.staging)
pnpm start:prod         # Start with production environment (.env.production)

# Database Management
pnpm db:setup           # Interactive environment setup (local)
pnpm db:setup:staging   # Setup staging database
pnpm db:setup:prod      # Setup production database
pnpm db:migrate         # Run database migrations (local)
pnpm db:migrate:staging # Run migrations on staging
pnpm db:migrate:prod    # Run migrations on production
pnpm db:seed            # Seed database with test data (local)
pnpm db:seed:staging    # Seed staging database
pnpm db:seed:prod       # Seed production database
pnpm db:generate        # Generate new migrations
pnpm db:studio          # Open Drizzle Studio (local)
pnpm db:studio:staging  # Open Drizzle Studio for staging
pnpm db:studio:prod     # Open Drizzle Studio for production

# Testing & Quality
pnpm test               # Run unit tests
pnpm test:emails        # Test email templates
pnpm test:cache         # Run cache-specific tests
pnpm lint               # Check code formatting
pnpm lint:fix           # Fix formatting issues
pnpm type-check         # TypeScript type checking

# Email Development
pnpm preview:emails     # Preview email templates

# Design System
# Design tokens now managed via Tailwind CSS v4 in app/globals.css
```

## 🏢 Enterprise Features

### 🔒 **Security & Compliance**

- **Session Security**: Secure session management with BetterAuth
- **Input Validation**: Runtime validation with Zod schemas
- **CSRF Protection**: Built-in Cross-Site Request Forgery protection
- **SQL Injection Prevention**: Type-safe database queries
- **Environment Isolation**: Separate development/production configurations
- **Multi-layer Admin Security**: Five-layer defense architecture for super admin access
- **Activity Logging**: Complete audit trail for compliance and security monitoring

### 📊 **Monitoring & Analytics**

- **Activity Logging**: Comprehensive audit trail for all user actions
- **Email Tracking**: Email delivery and engagement monitoring
- **Error Handling**: Structured error logging and reporting
- **Performance Monitoring**: Built-in performance tracking
- **Admin Dashboard**: System-wide metrics including user growth, revenue, and subscriptions
- **Subscription Analytics**: Track MRR, churn rate, LTV, and plan distribution

### 🔄 **Scalability**

- **Multi-tenant Architecture**: Efficient organization-based isolation
- **Database Optimization**: Indexed queries and connection pooling
- **API Rate Limiting**: Built-in protection against abuse
- **Provider-Agnostic Caching**: In-memory for development, Upstash Redis for production
- **Cache Performance**: Built-in monitoring and statistics tracking
- **Edge-Compatible**: Serverless Redis for global performance

## 🤝 Contributing

We welcome contributions to improve the Enterprise SaaS Starter! Here's how to get started:

### Development Setup

1. **Fork the repository** and clone your fork
2. **Install dependencies**: `pnpm install`
3. **Set up environment**: `pnpm db:setup`
4. **Run migrations**: `pnpm db:migrate && pnpm db:seed`
5. **Start development**: `pnpm dev`

### Contribution Guidelines

- **Follow our coding standards** and naming conventions
- **Write tests** for new features and bug fixes
- **Update documentation** for any new functionality
- **Ensure TypeScript compliance** with no `any` types
- **Run linting** before submitting: `pnpm lint`

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with proper tests
3. Update relevant documentation
4. Ensure all tests pass: `pnpm test`
5. Submit a pull request with a clear description

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

### Original Inspiration

This project was originally forked from [nextjs/saas-starter](https://github.com/nextjs/saas-starter) but has been completely rewritten with enterprise-grade features and architecture.

### Built By

- **[Monsoft Solutions](https://monsoftsolutions.com)**: Enterprise software development company
- **[@flechilla](https://github.com/flechilla)**: Lead developer and architect

### Technology Partners

- **[Next.js](https://nextjs.org/)**: The React framework for production
- **[BetterAuth](https://www.better-auth.com/)**: Modern authentication for TypeScript
- **[Stripe](https://stripe.com/)**: Online payment processing platform
- **[Resend](https://resend.com/)**: Email delivery service for developers
- **[Upstash](https://upstash.com/)**: Serverless Redis for edge-compatible caching
- **[BullMQ](https://docs.bullmq.io/)**: Premium message queue for Node.js
- **[Winston](https://github.com/winstonjs/winston)**: Universal logging library
- **[Vitest](https://vitest.dev/)**: Next generation testing framework
- **[shadcn/ui](https://ui.shadcn.com/)**: Beautifully designed components
- **[Drizzle ORM](https://orm.drizzle.team/)**: TypeScript ORM for SQL databases

### Community

Special thanks to the open-source community and all contributors who help make this project better.

---

**⭐ If this project helps you build amazing SaaS applications, please give it a star on GitHub!**

**🔗 Links**

- **[Monsoft Solutions](https://monsoftsolutions.com)** - Enterprise Software Development
- **[@flechilla on GitHub](https://github.com/flechilla)** - Follow for more projects
- **[Documentation](./docs/README.md)** - Complete project documentation
- **[Issues](https://github.com/Monsoft-Solutions/saas-starter/issues)** - Report bugs or request features
- **[Live Demo](#)** - Coming soon

---

_Built with ❤️ by Monsoft Solutions_
