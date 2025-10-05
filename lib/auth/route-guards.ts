/**
 * Central guard registry consumed by middleware and other server entry points.
 *
 * The helpers in this file translate between human-readable rules (prefixes,
 * exact paths, public exemptions) and the pattern matching logic the middleware
 * uses at runtime. Updating this registry is the single source of truth for
 * protected routes across the app and API surfaces.
 */
import { APP_BASE_PATH, appProtectedRoutePrefixes } from '@/config/navigation';

/**
 * Identifies the domain a guard applies to so we can tailor responses.
 */
export type RouteGuardScope = 'app' | 'api';

/**
 * Pattern definition that enables strict (exact) and prefix-based matches.
 */
export type RouteGuardPattern =
  | { kind: 'exact'; value: string }
  | { kind: 'prefix'; value: string };

/**
 * Guard rule describing enforced authentication and organization scopes.
 */
export type RouteGuardRule = {
  id: string;
  scope: RouteGuardScope;
  pattern: RouteGuardPattern;
  authRequired: boolean;
  organizationRequired?: boolean;
  superAdminRequired?: boolean;
};

/**
 * Public route definition that explicitly bypasses all guard checks.
 */
export type PublicRouteRule = {
  id: string;
  pattern: RouteGuardPattern;
};

/**
 * Registry describing every guard, along with bypass and public exceptions.
 */
export type RouteGuardRegistry = {
  bypass: RouteGuardPattern[];
  public: PublicRouteRule[];
  guards: RouteGuardRule[];
};

/**
 * Normalizes any path or prefix to ensure predictable leading/trailing slashes.
 *
 * Next's pathname matching is sensitive to duplicate slashes, so this function
 * ensures every stored rule follows a consistent format before matching.
 */
function normalizePath(value: string): string {
  if (!value || value === '/') {
    return '/';
  }

  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`;
  return withLeadingSlash.length > 1 && withLeadingSlash.endsWith('/')
    ? withLeadingSlash.slice(0, -1)
    : withLeadingSlash;
}

function createExactPattern(value: string): RouteGuardPattern {
  return { kind: 'exact', value: normalizePath(value) };
}

function createPrefixPattern(value: string): RouteGuardPattern {
  return { kind: 'prefix', value: normalizePath(value) };
}

/**
 * Evaluates whether the provided pathname satisfies the supplied pattern.
 */
export function matchesPattern(
  pattern: RouteGuardPattern,
  pathname: string
): boolean {
  const normalizedPath = normalizePath(pathname);

  if (pattern.kind === 'exact') {
    return normalizedPath === pattern.value;
  }

  if (normalizedPath === pattern.value) {
    return true;
  }

  return normalizedPath.startsWith(`${pattern.value}/`);
}

/**
 * Computes a deterministic weight used to sort guards by specificity.
 *
 * Longer prefixes win over shorter ones; exact matches receive an additional
 * weight boost so they are selected ahead of prefix rules for the same path.
 */
function guardWeight(rule: RouteGuardRule): number {
  const base = rule.pattern.value.length;
  return rule.pattern.kind === 'exact' ? base + 1000 : base;
}

/**
 * Builds auth guard rules for the application shell using the navigation config.
 *
 * This keeps the app section DRY: adding a new protected navigation entry will
 * automatically register a matching middleware guard.
 */
function deriveAppGuards(): RouteGuardRule[] {
  const prefixes = new Set<string>(
    appProtectedRoutePrefixes.length
      ? appProtectedRoutePrefixes
      : [APP_BASE_PATH]
  );

  return Array.from(prefixes).map((prefix) => ({
    id: `app:${prefix}`,
    scope: 'app',
    pattern: createPrefixPattern(prefix),
    authRequired: true,
  }));
}

/**
 * Assembles the full registry describing bypasses, public routes, and guards.
 */
function buildRegistry(): RouteGuardRegistry {
  const guards: RouteGuardRule[] = [
    ...deriveAppGuards(),

    // Super admin routes
    {
      id: 'admin:dashboard',
      scope: 'app',
      pattern: createPrefixPattern('/admin'),
      authRequired: true,
      superAdminRequired: true,
    },
    {
      id: 'api:admin',
      scope: 'api',
      pattern: createPrefixPattern('/api/admin'),
      authRequired: true,
      superAdminRequired: true,
    },

    // Organization routes
    {
      id: 'api:organization',
      scope: 'api',
      pattern: createPrefixPattern('/api/organization'),
      authRequired: true,
      organizationRequired: true,
    },
    {
      id: 'api:user',
      scope: 'api',
      pattern: createPrefixPattern('/api/user'),
      authRequired: true,
    },
    {
      id: 'api:stripe-checkout',
      scope: 'api',
      pattern: createPrefixPattern('/api/stripe/checkout'),
      authRequired: true,
      organizationRequired: true,
    },
  ];

  const publicRoutes: PublicRouteRule[] = [
    { id: 'public:home', pattern: createExactPattern('/') },
    { id: 'public:pricing', pattern: createExactPattern('/pricing') },
    { id: 'public:sign-in', pattern: createExactPattern('/sign-in') },
    { id: 'public:sign-up', pattern: createExactPattern('/sign-up') },
    { id: 'public:auth-api', pattern: createPrefixPattern('/api/auth') },
    {
      id: 'public:webhooks-resend',
      pattern: createPrefixPattern('/api/webhooks'),
    },
    {
      id: 'public:stripe-webhook',
      pattern: createExactPattern('/api/stripe/webhook'),
    },
    {
      id: 'public:accept-invitation',
      pattern: createPrefixPattern('/accept-invitation'),
    },
  ];

  const bypass: RouteGuardPattern[] = [
    createPrefixPattern('/_next'),
    createExactPattern('/favicon.ico'),
    createExactPattern('/robots.txt'),
    createExactPattern('/sitemap.xml'),
    createExactPattern('/manifest.json'),
    createExactPattern('/health'),
    createPrefixPattern('/static'),
    createPrefixPattern('/assets'),
    createExactPattern('/api/health'),
  ];

  return {
    bypass,
    public: publicRoutes,
    guards,
  };
}

export const routeGuardRegistry: RouteGuardRegistry = buildRegistry();

/**
 * Determines if middleware should bypass all guard logic for the pathname.
 */
export function isBypassedRoute(pathname: string): boolean {
  return routeGuardRegistry.bypass.some((pattern) =>
    matchesPattern(pattern, pathname)
  );
}

/**
 * Indicates whether the pathname is explicitly listed as public.
 */
export function isPublicRoute(pathname: string): boolean {
  return routeGuardRegistry.public.some(({ pattern }) =>
    matchesPattern(pattern, pathname)
  );
}

export type RouteGuardMatch = {
  rule: RouteGuardRule;
};

/**
 * Resolves the most specific guard for the provided pathname, if any.
 *
 * Guard selection prefers exact matches, then the longest matching prefix.
 */
export function matchRouteGuard(pathname: string): RouteGuardMatch | null {
  const applicable = routeGuardRegistry.guards.filter((rule) =>
    matchesPattern(rule.pattern, pathname)
  );

  if (!applicable.length) {
    return null;
  }

  const [rule] = applicable.sort((a, b) => guardWeight(b) - guardWeight(a));
  return { rule };
}
