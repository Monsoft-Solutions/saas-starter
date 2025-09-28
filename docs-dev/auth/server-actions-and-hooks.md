# Server Actions & Hooks Standards

The helpers in `lib/auth/server-context.ts`, `lib/auth/middleware.ts`, `lib/server/api-handler.ts`, and `lib/api/client.ts` provide a consistent contract for session access, organization requirements, response envelopes, and client consumption. Always rely on these utilities instead of calling BetterAuth directly inside server actions or duplicating fetch logic in hooks—ESLint will flag direct `auth.api.getSession()` usage outside the server context module.

## Session Access Helpers

Use the exports from `lib/auth/server-context.ts` for every server-only entry point:

- `getServerSession()` / `requireServerSession()` – Resolve the BetterAuth session once per request (memoized by headers). Prefer the `require*` variant when the request must be authenticated.
- `getServerContext()` / `requireServerContext()` – Provide a normalized payload `{ headers, session, user, organization }`. The `user` is typed via `ServerUser`, which merges BetterAuth fields with local guarantees (`email`, `id`, `image` etc.).
- `requireOrganizationContext()` – Narrow the context to scenarios that demand an active organization (billing, dashboards). Throws `OrganizationNotFoundError` when the organization is missing.

These helpers are the only approved place where `auth.api.getSession()` is called. If a new pattern is needed, add a dedicated helper here so the lint guard remains effective.

## Server Action Helpers

`lib/auth/middleware.ts` wraps server actions with validation, auth checks, and shared logging hooks:

- `validatedAction(schema, handler)` – Parses `FormData` with Zod and returns `{ error: string }` when validation fails. Use for unauthenticated actions (e.g., sign-in, sign-up).
- `validatedActionWithUser(schema, handler)` – Extends the above by resolving the `ServerUser` through `requireServerContext()`. When the session is missing the helper redirects to `/sign-in` to avoid duplicate messaging.
- `validatedActionWithContext(schema, handler)` – Supplies the full `ServerContext` object when the action needs headers, organization, or other session metadata in addition to validated input.
- `withOrganization(handler)` – Ensures an active organization through `requireOrganizationContext()`. Reuse this wrapper for billing flows and any organization-scoped operations so we only fetch BetterAuth state once.

Example usage:

```ts
'use server';

import { z } from 'zod';
import {
  validatedActionWithUser,
  withOrganization,
} from '@/lib/auth/middleware';

const preferencesSchema = z.object({
  theme: z.enum(['light', 'dark']),
});

export const updatePreferences = validatedActionWithUser(
  preferencesSchema,
  async (data, _formData, user) => {
    await savePreferences({ userId: user.id, theme: data.theme });
    return { success: 'Preferences saved.' };
  }
);

export const createCheckout = withOrganization(
  async (_formData, organization) => {
    await startCheckout({ organizationId: organization.id });
  }
);
```

## API Client & Hooks

`lib/api/client.ts` introduces a shared fetcher that understands the `ApiResponse<T>` envelope returned by route handlers. Always pair this with the server response helpers in `lib/http/response.ts` so client code can rely on a predictable shape.

- `fetchApi<T>(input, init?)` – Performs the request with `credentials: 'include'`, parses JSON when present, and throws `ApiClientError` for non-2xx responses.
- `createApiFetcher<T>(init?)` – Convenience factory for SWR/React Query; returns a fetcher that delegates to `fetchApi`.
- `ApiClientError` – Bubble this to the UI when you need to surface the server message (`error`, `details`, `code`).

When building hooks, import the shared fetcher instead of duplicating `fetch` calls:

```ts
import useSWR from 'swr';
import { createApiFetcher } from '@/lib/api/client';
import type { OrganizationSubscriptionResponse } from '@/lib/types/api/subscription.type';

const fetchSubscription = createApiFetcher<OrganizationSubscriptionResponse>();

export function useOrganizationSubscription() {
  return useSWR('/api/organization/subscription', fetchSubscription);
}
```

This keeps client code aligned with server response contracts and prevents accidental divergence in error handling.

## API Route Handlers & Response Helpers

Route handlers should wrap their logic with the factories exported by `lib/server/api-handler.ts` and return responses through `lib/http/response.ts`:

- `createApiHandler(handler, options)` – Normalizes mixed return types (`void`, raw data, `NextResponse`) into a consistent `NextResponse<ApiResponse<T>>`.
- `withApiAuth(handler, options)` – Uses `getServerContextFromHeaders()` to inject `ServerContext` and issues a structured 401 when the session is missing.
- `withOrganization(handler, options)` – Extends `withApiAuth` to require an active organization and responds with a customizable status/message when absent.

Response utilities living in `lib/http/response.ts` provide helpers you should use from both wrapped handlers and standalone utilities:

- `ok(data, init?)`, `created(data, init?)`, `noContent()` for success payloads.
- `error(message, { status, details, code })` for standardized failures.
- `ApiResponse<T>` / `ApiError` types ensure server and client agree on the envelope.
- `isApiError(value)` helps narrow unknown JSON when processing downstream.

Combining these wrappers with the server context helpers guarantees that every request path hydrates BetterAuth once, emits predictable responses, and cooperates with the shared client fetcher.
