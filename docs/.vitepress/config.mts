import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'SaaS Starter',
  description:
    'Comprehensive documentation for the Next.js SaaS Starter project with BetterAuth, Stripe, and modern UI components',

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Getting Started', link: '/README' },
      {
        text: 'Core Features',
        items: [
          { text: 'Authentication', link: '/auth/' },
          { text: 'API Architecture', link: '/api/' },
          { text: 'Admin Space', link: '/admin-space/overview' },
          { text: 'Payments', link: '/stripe/' },
        ],
      },
      {
        text: 'Infrastructure',
        items: [
          { text: 'Cache System', link: '/cache/' },
          { text: 'Background Jobs', link: '/async-job-processing' },
          { text: 'Logging', link: '/logging' },
          { text: 'Configuration', link: '/environment-configuration' },
        ],
      },
      {
        text: 'Development',
        items: [
          { text: 'Design System', link: '/design-system' },
          { text: 'Unit Testing', link: '/unit-testing' },
          { text: 'Email System', link: '/emails' },
        ],
      },
    ],

    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Overview', link: '/README' },
          { text: 'Quick Start', link: '/README#quick-start' },
          { text: 'Architecture', link: '/README#architecture-overview' },
          {
            text: 'Environment Configuration',
            link: '/environment-configuration',
          },
        ],
      },
      {
        text: 'Authentication & Security',
        items: [
          {
            text: 'Server Authorization',
            link: '/auth/server-authorization-overview',
          },
          {
            text: 'Server Actions & Hooks',
            link: '/auth/server-actions-and-hooks',
          },
          { text: 'OAuth Setup', link: '/auth/OAUTH_SETUP' },
        ],
      },
      {
        text: 'API Architecture',
        items: [
          { text: 'Overview', link: '/api/' },
          {
            text: 'Type-Safe API Client',
            link: '/api/type-safe-api-guide',
          },
          {
            text: 'API Handlers & Validation',
            link: '/api/handlers-and-validation',
          },
          {
            text: 'Server Actions & Permissions',
            link: '/api/server-actions-and-permissions',
          },
          {
            text: 'Schemas & Validation',
            link: '/api/schemas-and-validation',
          },
        ],
      },
      {
        text: 'Admin Space',
        items: [
          { text: 'Overview', link: '/admin-space/overview' },
          {
            text: 'Authentication & Authorization',
            link: '/admin-space/authentication',
          },
          { text: 'Features Guide', link: '/admin-space/features' },
          { text: 'API Reference', link: '/admin-space/api-reference' },
          { text: 'Security Architecture', link: '/admin-space/security' },
          { text: 'Development Guide', link: '/admin-space/development' },
        ],
      },
      {
        text: 'Stripe Integration',
        items: [
          { text: 'Overview', link: '/stripe/README' },
          { text: 'Integration Guide', link: '/stripe/stripe-integration' },
          { text: 'Setup Script', link: '/stripe/setup-script-guide' },
          {
            text: 'Webhooks Configuration',
            link: '/stripe/webhooks-configuration',
          },
          {
            text: 'Checkout & Billing',
            link: '/stripe/checkout-and-billing-portal',
          },
          {
            text: 'Metadata Validation',
            link: '/stripe/stripe-metadata-validation',
          },
        ],
      },
      {
        text: 'UI & Design',
        items: [
          { text: 'Design System', link: '/design-system' },
          { text: 'Navigation System', link: '/navigation' },
        ],
      },
      {
        text: 'Communication',
        items: [{ text: 'Email System', link: '/emails' }],
      },
      {
        text: 'Background Processing',
        items: [
          {
            text: 'Async Job Processing',
            link: '/async-job-processing',
          },
          {
            text: 'Setup Guide',
            link: '/async-job-processing/setup',
          },
          {
            text: 'Core Concepts',
            link: '/async-job-processing/core-concepts',
          },
          {
            text: 'Usage Guide',
            link: '/async-job-processing/usage',
          },
          {
            text: 'Creating Jobs',
            link: '/async-job-processing/creating-jobs',
          },
          {
            text: 'Email Jobs',
            link: '/async-job-processing/email-jobs',
          },
          {
            text: 'Webhook Jobs',
            link: '/async-job-processing/webhook-jobs',
          },
          {
            text: 'Monitoring & Debugging',
            link: '/async-job-processing/monitoring',
          },
          {
            text: 'Testing',
            link: '/async-job-processing/testing',
          },
          {
            text: 'Deployment',
            link: '/async-job-processing/deployment',
          },
          {
            text: 'API Reference',
            link: '/async-job-processing/api-reference',
          },
        ],
      },
      {
        text: 'Development',
        items: [
          { text: 'Unit Testing', link: '/unit-testing' },
          { text: 'Logging System', link: '/logging' },
        ],
      },
      {
        text: 'Cache System',
        items: [
          { text: 'Overview', link: '/cache/' },
          { text: 'Configuration', link: '/cache/configuration' },
          { text: 'Upstash Setup', link: '/cache/upstash-setup' },
          { text: 'Quick Reference', link: '/cache/quick-reference' },
        ],
      },
    ],

    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/Monsoft-Solutions/saas-starter',
      },
    ],

    footer: {
      message:
        'Built with ❤️ using Next.js, BetterAuth, Stripe, and shadcn/ui | Made by <a href="https://monsoftsolutions.com" target="_blank" rel="noopener noreferrer">MonsoftLabs</a>',
      copyright: 'Copyright © 2025 SaaS Starter Team',
    },

    editLink: {
      pattern:
        'https://github.com/Monsoft-Solutions/saas-starter/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    search: {
      provider: 'local',
    },
  },
});
