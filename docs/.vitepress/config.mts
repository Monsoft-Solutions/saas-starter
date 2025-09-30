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
      { text: 'Configuration', link: '/environment-configuration' },
      { text: 'Authentication', link: '/auth/' },
      { text: 'Payments', link: '/stripe/' },
      { text: 'Design System', link: '/design-system' },
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
        text: 'Development',
        items: [{ text: 'Unit Testing', link: '/unit-testing' }],
      },
    ],

    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/Monsoft-Solutions/saas-starter',
      },
    ],

    footer: {
      message: 'Built with ❤️ using Next.js, BetterAuth, Stripe, and shadcn/ui',
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
