---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: 'SaaS Starter'
  text: 'Next.js 15 SaaS Boilerplate'
  tagline: Production-ready SaaS starter with BetterAuth, Stripe, and shadcn/ui
  actions:
    - theme: brand
      text: Get Started
      link: /README
    - theme: alt
      text: View on GitHub
      link: https://github.com/yourusername/saas-starter

features:
  - title: 🌍 Type-Safe Environment Config
    details: Multi-environment support with Zod validation, interactive setup script, and secure secrets management for local, staging, and production
    link: /environment-configuration
    linkText: Learn more
  - title: 🔐 Multi-Tenant Authentication
    details: BetterAuth with organization support, social providers (Google, Facebook, LinkedIn, TikTok), and role-based access control
    link: /auth/
    linkText: View docs
  - title: 💳 Stripe Integration
    details: Complete subscription management, webhooks, billing portal, and automated setup scripts for quick deployment
    link: /stripe/
    linkText: View docs
  - title: 🎨 Modern UI Design System
    details: Token-based design system with Notion-inspired components, dark mode support, and shadcn/ui components
    link: /design-system
    linkText: View docs
  - title: 📧 Email System
    details: Transactional emails with Resend, beautiful templates, and automated notifications for user actions
    link: /emails
    linkText: View docs
  - title: 🗄️ Type-Safe Database
    details: PostgreSQL with Drizzle ORM, migrations, seeding, and comprehensive type inference throughout
    link: /README#database-schema
    linkText: Learn more
  - title: 🚀 Production Ready
    details: Next.js 15 with App Router, TypeScript, Zod validation, testing framework, and comprehensive documentation
    link: /README
    linkText: Get started
  - title: 🛡️ Admin Space
    details: Powerful admin dashboard with role-based access control, user management, team analytics, and comprehensive security features
    link: /admin-space/overview
    linkText: View docs
  - title: 🔄 Background Jobs
    details: Asynchronous job processing with BullMQ, Redis-backed queue management, retry logic, and comprehensive monitoring for email and webhook jobs
    link: /async-job-processing
    linkText: View docs
  - title: ⚡ Cache System
    details: Redis-based caching with Upstash integration, automatic invalidation, and optimized performance for frequently accessed data
    link: /cache/
    linkText: View docs
  - title: 📝 Logging System
    details: Structured logging with Winston, environment-based configuration, log rotation, and comprehensive error tracking for debugging and monitoring
    link: /logging
    linkText: View docs
  - title: 🔌 API Architecture
    details: Type-safe API client with Zod validation, permission-based access control, server actions, and comprehensive error handling patterns
    link: /api/
    linkText: View docs
  - title: 🧪 Unit Testing
    details: Comprehensive testing setup with Vitest, TypeScript support, mocking utilities, and best practices for testing React components and server logic
    link: /unit-testing
    linkText: View docs
---
