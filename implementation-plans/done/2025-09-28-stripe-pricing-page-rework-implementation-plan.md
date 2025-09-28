# Implementation Plan: Dynamic Stripe Pricing Page

- **Date**: 2025-09-28
- **Author**: AI Assistant

## 1. Executive Summary

This document outlines the implementation plan for creating a reusable pricing component that dynamically displays products and prices from Stripe. This component will be used on both public-facing and internal app pages, support multiple pricing intervals (e.g., monthly, annually), and highlight the current subscription plan for authenticated users.

## 2. Technical Analysis

The current pricing page at `app/(public)/pricing/page.tsx` is not reusable and uses a hardcoded approach to display plans. It lacks the flexibility to be embedded within the authenticated user area and doesn't have a clean separation of concerns.

This plan will refactor the existing logic into a self-contained, reusable server component that can be placed anywhere in the application.

## 3. Dependencies & Prerequisites

- Stripe account with configured products and prices. Products should have both monthly and yearly prices.
- Environment variables for Stripe (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) must be correctly set up in the `.env` file.
- Existing BetterAuth integration for user session management.

## 4. Architecture Overview

The new architecture will be centered around a reusable server component, promoting modularity and DRY principles.

1.  **Reusable Pricing Component (`components/payments/pricing-plans.tsx`)**: This will be a new server component responsible for fetching Stripe products and the user's subscription status. It will accept an optional `user` object to tailor its display and will contain all nested client components, such as the billing interval toggle.
2.  **Data Fetching Layer (`lib/payments/stripe.ts`)**: Existing functions will be enhanced, and a new `getProductsWithPrices` function will be created to fetch products and their associated prices in a structured way.
3.  **Database Query Layer (`lib/db/payments/stripe.query.ts`)**: A new query file will be created to house the logic for fetching an organization's subscription details.
4.  **UI Layer (`app/(public)/pricing/page.tsx` and `app/(app)/app/billing/page.tsx`)**: The existing public pricing page will be simplified to act as a host for the reusable component. A new billing page will be created in the app section to demonstrate its use in an authenticated context.
5.  **Server Actions (`lib/payments/actions.ts`)**: Existing server actions for checkout and customer portal will be triggered from the reusable component.

## 5. Implementation Phases

### Phase 1: Enhance Stripe Data Fetching & DB Queries

- **Objective**: Create robust services to fetch Stripe products with prices and get user subscription status.
- **Tasks**:
  1.  In `lib/payments/stripe.ts`, create a new function `getProductsWithPrices` that returns products with a nested array of their monthly and yearly prices.
  2.  Create a new file `lib/db/payments/stripe.query.ts`.
  3.  In this new file, create a function that uses `getActiveOrganization()` to find and return the current user's active subscription details (`stripeProductId`).
  4.  Update the types in `lib/types/` accordingly for the new product and price structures.

### Phase 2: Create the Reusable Pricing Component

- **Objective**: Build a self-contained pricing component that handles all display logic.
- **Tasks**:
  1.  Create a new server component at `components/payments/pricing-plans.tsx`.
  2.  This component will accept an optional `user` prop.
  3.  It will call `getProductsWithPrices` to fetch plan details.
  4.  If a `user` prop is provided, it will call the new database query to get subscription status.
  5.  Implement a client component for the monthly/annual toggle switch (`PricingToggle.tsx`) and use it within `pricing-plans.tsx`.
  6.  Dynamically render `PricingCard` components based on the fetched data and selected interval.
  7.  The `PricingCard` will be updated to:
      - Display a "Current Plan" badge if the product matches the user's subscription.
      - Show a "Manage Subscription" button (using `customerPortalAction`) for the active plan.
      - Show a "Subscribe" button (using `checkoutAction`) for other plans.

### Phase 3: Refactor Public Pricing Page

- **Objective**: Update the existing public pricing page to use the new reusable component.
- **Tasks**:
  1.  In `app/(public)/pricing/page.tsx`, remove the existing data fetching and rendering logic.
  2.  Fetch the user session.
  3.  Render the `<PricingPlans />` component, passing the `user` object if it exists.

### Phase 4: Create Authenticated Billing Page

- **Objective**: Demonstrate the reusability of the pricing component for logged-in users.
- **Tasks**:
  1.  Create a new page at `app/(app)/app/billing/page.tsx`.
  2.  This page will be protected by the authentication middleware.
  3.  Fetch the authenticated user's session.
  4.  Render the `<PricingPlans />` component, passing the required `user` object.

### Phase 5: Testing and Validation

- **Objective**: Ensure the new pricing component works correctly in all contexts.
- **Tasks**:
  1.  **Public Page (`/pricing`)**:
      - Verify unauthenticated users see plans correctly.
      - Verify authenticated users without a subscription see plans correctly and are redirected to checkout.
      - Verify authenticated users with a subscription see their plan highlighted and can access the customer portal.
  2.  **Authenticated Page (`/app/billing`)**:
      - Verify the page is protected and only accessible to logged-in users.
      - Verify the user's current plan is highlighted and the "Manage Subscription" link works.
  3.  Test the checkout flow for both monthly and annual selections from both pages.

## 6. Folder Structure

The implementation will involve creating new files and modifying existing ones.

```
/
├── app/
│   ├── (public)/
│   │   └── pricing/
│   │       └── page.tsx      # Refactored to use the new component
│   └── (app)/
│       └── app/
│           └── billing/
│               └── page.tsx      # New page for authenticated users
├── lib/
│   ├── payments/
│   │   ├── stripe.ts       # New data fetching logic
│   └── db/
│       └── payments/
│           └── stripe.query.ts # New file for subscription queries
└── components/
    └── payments/
        ├── pricing-plans.tsx # The new reusable server component
        └── pricing-toggle.tsx  # New client component for the toggle
```

## 7. Configuration Changes

No changes to `next.config.ts`, `tsconfig.json`, or other configuration files are anticipated.

## 8. Risk Assessment

- **Stripe API Changes**: The Stripe API is stable, but any future changes could require updates. Mitigation: Lock the API version in the Stripe client initialization (already done).
- **Performance**: Fetching all products and prices might be slow if the catalog is very large. Mitigation: For now, the product count is low. In the future, implement caching for the Stripe data with a reasonable revalidation period. The pricing page already sets `revalidate`.
- **Data Integrity**: Mismatched products and prices in Stripe could lead to display issues. Mitigation: Ensure Stripe products are configured correctly with both monthly and annual prices. The code should gracefully handle products with missing prices.

## 9. Success Metrics

- The pricing page loads and displays all active products from Stripe.
- The monthly/annual price toggle functions correctly, updating the displayed prices.
- Authenticated users with an active subscription can see their current plan highlighted.
- The "Subscribe" and "Manage Subscription" buttons function correctly, leading to the expected checkout or customer portal sessions.
- The overall user experience is clear and intuitive.

## 10. Reference

- [Stripe Products API](https://stripe.com/docs/api/products)
- [Stripe Prices API](https://stripe.com/docs/api/prices)
- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs)
