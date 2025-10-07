/**
 * Global Next.js middleware that enforces the shared authorization rules.
 *
 * The logic here is intentionally thin: it delegates matching to the guard
 * registry and session/organization resolution to the server context helpers.
 * Any new protected surface should be registered via `route-guards.ts` rather
 * than modifying this file directly.
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  isBypassedRoute,
  isPublicRoute,
  matchRouteGuard,
  type RouteGuardScope,
} from '@/lib/auth/route-guards';
import { getAdminContextFromHeaders } from '@/lib/auth/admin-context';
import {
  getServerContextFromHeaders,
  getServerSessionFromHeaders,
} from '@/lib/auth/server-context';

const SIGN_IN_PATH = '/sign-in';

/**
 * Clones the incoming request headers into a mutable `Headers` instance.
 *
 * Next.js middleware hands us read-only headers, but BetterAuth requires a
 * standard `Headers` object. Copying them once lets downstream helpers reuse
 * the memoized session lookups.
 */
function cloneRequestHeaders(request: NextRequest): Headers {
  const cloned = new Headers();
  request.headers.forEach((value, key) => {
    cloned.append(key, value);
  });
  return cloned;
}

/**
 * Builds the sign-in redirect, preserving the original path for post-login.
 */
function buildSignInRedirect(request: NextRequest): URL {
  const signInUrl = new URL(SIGN_IN_PATH, request.url);
  const redirectTarget = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  if (redirectTarget && redirectTarget !== SIGN_IN_PATH) {
    signInUrl.searchParams.set('redirect', redirectTarget);
  }

  return signInUrl;
}

/**
 * Produces the appropriate unauthorized response for the current scope.
 */
function handleUnauthorized(
  scope: RouteGuardScope,
  request: NextRequest
): NextResponse {
  if (scope === 'api') {
    return NextResponse.json(
      {
        error: 'Unauthorized',
        details: 'Authentication required to access this endpoint.',
      },
      { status: 401 }
    );
  }

  return NextResponse.redirect(buildSignInRedirect(request));
}

/**
 * Responds when a user is authenticated but lacks an active organization.
 */
function handleMissingOrganization(scope: RouteGuardScope): NextResponse {
  if (scope === 'api') {
    return NextResponse.json(
      {
        error: 'OrganizationRequired',
        details: 'Active organization is required to access this endpoint.',
      },
      { status: 403 }
    );
  }

  return NextResponse.next();
}

function handlePermissionDenied(
  scope: RouteGuardScope,
  requiredPermissions: readonly string[]
): NextResponse {
  if (scope === 'api') {
    return NextResponse.json(
      {
        error: 'Forbidden',
        details: 'Insufficient permissions to access this endpoint.',
        requiredPermissions,
      },
      { status: 403 }
    );
  }

  return new NextResponse(
    'Forbidden: Your account lacks the required permissions for this area.',
    {
      status: 403,
      headers: {
        'x-required-permissions': requiredPermissions.join(','),
      },
    }
  );
}

/**
 * Entry point invoked for every request matched by the middleware config.
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (isBypassedRoute(pathname) || isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const match = matchRouteGuard(pathname);

  if (!match) {
    return NextResponse.next();
  }

  const { rule } = match;

  if (!rule.authRequired) {
    return NextResponse.next();
  }

  const requestHeaders = cloneRequestHeaders(request);

  if (rule.requiredPermissions?.length) {
    const adminContext = await getAdminContextFromHeaders(requestHeaders);

    if (!adminContext) {
      const session = await getServerSessionFromHeaders(requestHeaders);

      if (!session) {
        return handleUnauthorized(rule.scope, request);
      }

      return handlePermissionDenied(rule.scope, rule.requiredPermissions);
    }

    const missingPermission = rule.requiredPermissions.find(
      (permission) => !adminContext.admin.permissions.has(permission)
    );

    if (missingPermission) {
      return handlePermissionDenied(rule.scope, rule.requiredPermissions);
    }

    if (rule.organizationRequired && !adminContext.organization) {
      return handleMissingOrganization(rule.scope);
    }

    return NextResponse.next();
  }

  if (rule.organizationRequired) {
    const context = await getServerContextFromHeaders(requestHeaders);

    if (!context) {
      return handleUnauthorized(rule.scope, request);
    }

    if (!context.organization) {
      return handleMissingOrganization(rule.scope);
    }

    return NextResponse.next();
  }

  const session = await getServerSessionFromHeaders(requestHeaders);

  if (!session) {
    return handleUnauthorized(rule.scope, request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
  runtime: 'nodejs',
};
