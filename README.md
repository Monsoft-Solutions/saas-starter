# Enterprise SaaS Starter

A production-ready, enterprise-grade SaaS starter template built by **[Monsoft Solutions](https://monsoftsolutions.com)** and developed by **[@flechilla](https://github.com/flechilla)**.

Originally forked from [nextjs/saas-starter](https://github.com/nextjs/saas-starter) but completely rewritten with enterprise features, advanced authentication, multi-tenancy, and a comprehensive design system.

## ✨ Key Features

### 🔐 **Enterprise Authentication & Authorization**

- **BetterAuth Integration**: Modern TypeScript-first authentication framework
- **Multi-provider Social Auth**: Google, Facebook, LinkedIn, and TikTok OAuth
- **Account Linking**: Link multiple social accounts to a single user
- **Multi-tenant Organizations**: Users can belong to multiple organizations
- **Role-based Access Control**: Owner/Member roles with granular permissions
- **Session Management**: Secure session handling with automatic refresh

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
- **UI Framework**: [shadcn/ui](https://ui.shadcn.com/) with [Tailwind CSS](https://tailwindcss.com/)
- **Validation**: [Zod](https://zod.dev/) for runtime type validation
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

- **Email**: `test@test.com`
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
- **[💳 Stripe Integration](./docs/stripe/)**: Payment processing and webhooks
- **[🌍 Environment Configuration](./docs/environment-configuration.md)**: Multi-environment setup guide
- **[💎 Design System](./docs/design-system.md)**: Design tokens and components
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
├── emails/          # Email templates and logic
├── design-system/   # Design tokens and utilities
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
pnpm dev                 # Start development server with Turbopack (uses .env.local if present)
pnpm dev:local          # Explicitly use .env.local
pnpm dev:staging        # Run dev server with staging environment
pnpm dev:prod           # Run dev server with production environment
pnpm build              # Build for production
pnpm build:staging      # Build with staging environment
pnpm build:prod         # Build with production environment
pnpm start              # Start production server
pnpm start:staging      # Start with staging environment
pnpm start:prod         # Start with production environment

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
pnpm lint               # Check code formatting
pnpm lint:fix           # Fix formatting issues
pnpm type-check         # TypeScript type checking

# Email Development
pnpm preview:emails     # Preview email templates

# Design System
pnpm verify:design-tokens  # Validate design tokens
```

## 🏢 Enterprise Features

### 🔒 **Security & Compliance**

- **Session Security**: Secure session management with BetterAuth
- **Input Validation**: Runtime validation with Zod schemas
- **CSRF Protection**: Built-in Cross-Site Request Forgery protection
- **SQL Injection Prevention**: Type-safe database queries
- **Environment Isolation**: Separate development/production configurations

### 📊 **Monitoring & Analytics**

- **Activity Logging**: Comprehensive audit trail for all user actions
- **Email Tracking**: Email delivery and engagement monitoring
- **Error Handling**: Structured error logging and reporting
- **Performance Monitoring**: Built-in performance tracking

### 🔄 **Scalability**

- **Multi-tenant Architecture**: Efficient organization-based isolation
- **Database Optimization**: Indexed queries and connection pooling
- **API Rate Limiting**: Built-in protection against abuse
- **Efficient Caching**: Optimized data fetching patterns

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
- **[shadcn/ui](https://ui.shadcn.com/)**: Beautifully designed components
- **[Drizzle ORM](https://orm.drizzle.team/)**: TypeScript ORM for SQL databases

### Community

Special thanks to the open-source community and all contributors who help make this project better.

---

**⭐ If this project helps you build amazing SaaS applications, please give it a star on GitHub!**

**🔗 Links**

- **[Monsoft Solutions](https://monsoftsolutions.com)** - Enterprise Software Development
- **[@flechilla on GitHub](https://github.com/flechilla)** - Follow for more projects
- **[Documentation](./docs-dev/README.md)** - Complete project documentation
- **[Issues](https://github.com/Monsoft-Solutions/saas-starter/issues)** - Report bugs or request features

---

_Built with ❤️ by Monsoft Solutions_
