/**
 * Server-only utilities that hydrate BetterAuth sessions, normalize user records, and memoize
 * organization lookups so request handlers can rely on a consistent `ServerContext` shape.
 */
import 'server-only';

import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/drizzle';
import { organization as organizationTable } from '@/lib/db/schemas';
import logger from '@/lib/logger/logger.service';
import { CacheKey } from '@/lib/types/cache/cache-key.type';

/**
 * Captures the request headers object returned by Next.js.
 */
export type RequestHeaders = Awaited<ReturnType<typeof headers>>;

type ExtractResponse<T> = T extends { response: infer R } ? R : T;

type SessionResult = ExtractResponse<
  Awaited<ReturnType<typeof auth.api.getSession>>
>;

type SessionResultWithFallback = SessionResult extends {
  user: infer _User;
  session: infer _Session;
}
  ? SessionResult
  : {
      user: {
        id: string;
        email?: string;
        image?: string | null;
        [key: string]: unknown;
      };
      session: Record<string, unknown>;
    };

/**
 * Represents the session payload returned by BetterAuth once `null` cases are removed.
 */
type ServerSession = NonNullable<SessionResultWithFallback>;

/**
 * Organization metadata enriched with Stripe subscription attributes.
 */
type FullOrganizationResult = ExtractResponse<
  Awaited<ReturnType<typeof auth.api.getFullOrganization>>
>;

export type OrganizationDetails = NonNullable<FullOrganizationResult> & {
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeProductId?: string;
  planName?: string;
  subscriptionStatus?: string;
};

/**
 * Normalized representation of the authenticated user.
 */
type SessionUser = ServerSession['user'];

type NormalizedUserFields = {
  id: string;
  email: string;
  name?: string | null;
  image: string | null;
};

export type ServerUser = SessionUser & NormalizedUserFields;

/**
 * Container with request-scoped authentication data that downstream handlers can rely on.
 */
export type ServerContext = {
  headers: RequestHeaders;
  session: ServerSession;
  user: ServerUser;
  organization: OrganizationDetails | null;
};

/**
 * Convenience alias when an organization is guaranteed to exist.
 */
export type OrganizationContext = Omit<ServerContext, 'organization'> & {
  organization: OrganizationDetails;
};

/**
 * Raised when a server-only caller requires authentication but no session is available.
 */
export class UnauthorizedError extends Error {
  constructor(message = 'Server session required') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Raised when an authenticated caller does not have an active organization.
 */
export class OrganizationNotFoundError extends Error {
  constructor(message = 'Active organization not found') {
    super(message);
    this.name = 'OrganizationNotFoundError';
  }
}

// Short-lived cache TTL for request-scoped data (30 seconds)
const REQUEST_CACHE_TTL = 30;

/**
 * Creates a mutable copy of the read-only headers instance provided by Next.js.
 */
function cloneHeaders(requestHeaders: RequestHeaders): Headers {
  const cloned = new Headers();

  requestHeaders.forEach((value, key) => {
    cloned.append(key, value);
  });

  return cloned;
}

/**
 * Converts the cached headers handle into a plain `Headers` object for BetterAuth calls.
 */
function toHeadersInit(requestHeaders: RequestHeaders): Headers {
  return cloneHeaders(requestHeaders);
}

/**
 * Unboxes BetterAuth's `{ response }` envelope when present to return the raw payload.
 */
function unwrapResponse<T>(result: T): ExtractResponse<T> {
  if (result && typeof result === 'object' && 'response' in result) {
    return (result as { response: unknown }).response as ExtractResponse<T>;
  }

  return result as unknown as ExtractResponse<T>;
}

/**
 * Memoizes asynchronous lookups using cache service to avoid duplicate work.
 */
async function memoize<T>(
  cacheKey: CacheKey,
  factory: () => Promise<T>,
  ttl: number = REQUEST_CACHE_TTL
): Promise<T> {
  const { cacheService } = await import('@/lib/cache');

  return cacheService.getOrSet(cacheKey, factory, { ttl });
}

/**
 * Lazily fetches and caches the BetterAuth session for the current request headers.
 */
async function loadSession(
  requestHeaders: RequestHeaders
): Promise<ServerSession | null> {
  const { CacheKeys } = await import('@/lib/cache');
  const cacheKey = CacheKeys.serverSession(requestHeaders);

  return memoize(cacheKey, async () => {
    const rawSession = await auth.api.getSession({
      headers: toHeadersInit(requestHeaders),
    });
    const sessionResult = unwrapResponse(rawSession) as SessionResult | null;

    if (!sessionResult) {
      return null;
    }

    return sessionResult as ServerSession;
  });
}

/**
 * Resolves the active organization, syncing with BetterAuth and enriching with Stripe data.
 */
async function loadOrganization(
  requestHeaders: RequestHeaders,
  session: ServerSession
): Promise<OrganizationDetails | null> {
  const { CacheKeys } = await import('@/lib/cache');
  const userId = normalizeUser(session).id;
  const cacheKey = CacheKeys.serverOrganization(requestHeaders, userId);

  return memoize(cacheKey, async () => {
    try {
      const baseRequest = { headers: toHeadersInit(requestHeaders) };

      const activeMember = unwrapResponse(
        await auth.api.getActiveMember(baseRequest)
      );

      const sessionActiveOrganizationId = (
        session.session as { activeOrganizationId?: string } | undefined
      )?.activeOrganizationId;

      let organizationId =
        sessionActiveOrganizationId ?? activeMember?.organizationId ?? null;

      if (!organizationId) {
        const organizations = unwrapResponse(
          await auth.api.listOrganizations(baseRequest)
        );

        organizationId = organizations?.[0]?.id ?? null;

        if (organizationId) {
          try {
            await auth.api.setActiveOrganization({
              headers: baseRequest.headers,
              body: { organizationId },
            });
          } catch (error) {
            logger.warn('Failed to set active organization', { error });
          }
        }
      }

      if (!organizationId) {
        return null;
      }

      const betterAuthOrganization = unwrapResponse(
        await auth.api.getFullOrganization({
          headers: baseRequest.headers,
          query: { organizationId },
        })
      );

      if (!betterAuthOrganization) {
        return null;
      }

      // Cache subscription data lookup
      const { cacheService, CacheKeys } = await import('@/lib/cache');
      const subscriptionInfo = await cacheService.getOrSet(
        CacheKeys.organizationSubscription(organizationId),
        async () => {
          const subscriptionData = await db
            .select({
              stripeCustomerId: organizationTable.stripeCustomerId,
              stripeSubscriptionId: organizationTable.stripeSubscriptionId,
              stripeProductId: organizationTable.stripeProductId,
              planName: organizationTable.planName,
              subscriptionStatus: organizationTable.subscriptionStatus,
            })
            .from(organizationTable)
            .where(eq(organizationTable.id, organizationId))
            .limit(1);

          return subscriptionData[0] || null;
        },
        { ttl: 300 } // Cache for 5 minutes
      );

      return {
        ...betterAuthOrganization,
        stripeCustomerId: subscriptionInfo?.stripeCustomerId ?? undefined,
        stripeSubscriptionId:
          subscriptionInfo?.stripeSubscriptionId ?? undefined,
        stripeProductId: subscriptionInfo?.stripeProductId ?? undefined,
        planName: subscriptionInfo?.planName ?? undefined,
        subscriptionStatus: subscriptionInfo?.subscriptionStatus ?? undefined,
      };
    } catch (error) {
      logger.error('Failed to resolve organization for the current request', {
        error,
      });
      return null;
    }
  });
}

/**
 * Normalizes the BetterAuth user object into the strongly typed `ServerUser` shape.
 */
function normalizeUser(session: ServerSession): ServerUser {
  const baseUser = session.user as Record<string, unknown>;

  // BetterAuth user IDs can surface as strings or numbers; normalize to a stable string shape.
  const rawId = baseUser.id;
  const id =
    typeof rawId === 'string'
      ? rawId
      : typeof rawId === 'number'
        ? String(rawId)
        : null;
  if (!id) {
    throw new Error('BetterAuth session is missing a user id');
  }

  const rawEmail = baseUser.email;
  // Email is our canonical identifier in notifications; require it explicitly to avoid downstream null checks.
  if (typeof rawEmail !== 'string' || rawEmail.length === 0) {
    throw new Error('BetterAuth session is missing a user email');
  }

  const rawName = baseUser.name;
  const name =
    typeof rawName === 'string'
      ? rawName
      : rawName === null || typeof rawName === 'undefined'
        ? null
        : null;

  const rawImage = baseUser.image;
  const image =
    typeof rawImage === 'string' && rawImage.length > 0 ? rawImage : null;

  return {
    ...(baseUser as SessionUser),
    id,
    email: rawEmail,
    name: name ?? undefined,
    image,
  } as ServerUser;
}

/**
 * Produces the fully hydrated server context while caching intermediate calls.
 */
async function loadContext(
  requestHeaders: RequestHeaders
): Promise<ServerContext | null> {
  const { CacheKeys } = await import('@/lib/cache');
  const cacheKey = CacheKeys.serverContext(requestHeaders);

  return memoize(cacheKey, async () => {
    const session = await loadSession(requestHeaders);
    if (!session) {
      return null;
    }

    const organization = await loadOrganization(requestHeaders, session);
    const user = normalizeUser(session);

    return {
      headers: requestHeaders,
      session,
      user,
      organization,
    };
  });
}

/**
 * Fetches the BetterAuth session for the active request, caching per header instance.
 */
export async function getServerSession(): Promise<ServerSession | null> {
  const requestHeaders = await headers();
  return loadSession(requestHeaders);
}

/**
 * Fetches the BetterAuth session using a supplied headers instance.
 */
export async function getServerSessionFromHeaders(
  requestHeaders: Headers
): Promise<ServerSession | null> {
  return loadSession(requestHeaders as RequestHeaders);
}

/**
 * Ensures that a BetterAuth session exists for the active request.
 */
export async function requireServerSession(): Promise<ServerSession> {
  const session = await getServerSession();
  if (!session) {
    throw new UnauthorizedError();
  }

  return session;
}

/**
 * Retrieves a fully-hydrated server context (session, user, organization) for the request.
 */
export async function getServerContext(): Promise<ServerContext | null> {
  const requestHeaders = await headers();
  return loadContext(requestHeaders);
}

/**
 * Ensures that a hydrated server context exists for the active request.
 */
export async function requireServerContext(): Promise<ServerContext> {
  const context = await getServerContext();
  if (!context) {
    throw new UnauthorizedError();
  }

  return context;
}

/**
 * Derives a server context using an explicit headers instance.
 */
export async function getServerContextFromHeaders(
  requestHeaders: Headers
): Promise<ServerContext | null> {
  return loadContext(requestHeaders as RequestHeaders);
}

/**
 * Retrieves a server context that is guaranteed to include an organization.
 */
export async function requireOrganizationContext(): Promise<OrganizationContext> {
  const context = await getServerContext();
  if (!context) {
    throw new UnauthorizedError();
  }

  if (!context.organization) {
    throw new OrganizationNotFoundError();
  }

  return {
    ...context,
    organization: context.organization,
  };
}

/**
 * Checks if the current user is an admin (owner) of their organization.
 * TODO: THis logic should be improved to check for the super admin role.
 */
export async function requireOrganizationAdminContext(): Promise<OrganizationContext> {
  const context = await requireOrganizationContext();

  // Check if user is owner of the organization
  const { getOrganizationOwner } = await import(
    '@/lib/db/queries/organization.query'
  );
  const ownerId = await getOrganizationOwner(context.organization.id);

  if (ownerId !== context.user.id) {
    throw new UnauthorizedError('Admin access required');
  }

  return context;
}
