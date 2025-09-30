import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import {
  getServerContextFromHeaders,
  type OrganizationContext,
  type ServerContext,
} from '@/lib/auth/server-context';
import {
  error as errorResponse,
  isApiError,
  noContent,
  ok,
  type ApiResponse,
} from '@/lib/http/response';
import logger from '@/lib/logger/logger.service';

type RouteParamRecord = Record<string, string | string[]>;

type IncomingRouteContext = {
  params: Promise<RouteParamRecord>;
};

/**
 * Resolved form of the route context handed to downstream handlers.
 */
export type RouteContext = {
  params: RouteParamRecord;
};

const defaultIncomingRouteContext: IncomingRouteContext = {
  params: Promise.resolve({}),
};

/**
 * Supported result types returned by wrapped API handlers.
 */
export type ApiHandlerResult<T> =
  | NextResponse<ApiResponse<T>>
  | NextResponse
  | ApiResponse<T>
  | T
  | void;

/**
 * Shared arguments passed to every handler, irrespective of auth requirements.
 */
export type RouteHandlerArgs = {
  request: NextRequest;
  route: RouteContext;
};

/**
 * Arguments supplied to handlers that require additional authenticated context.
 */
export type ApiHandlerArgs<Ctx> = RouteHandlerArgs & {
  context: Ctx;
};

/**
 * Signature implemented by consumer handlers before being wrapped.
 */
export type RouteHandler<Ctx, Result> = (
  args: ApiHandlerArgs<Ctx>
) => Promise<ApiHandlerResult<Result>>;

/**
 * Runtime tuning knobs for the generic API handler wrapper.
 */
export type ApiHandlerOptions = {
  successStatus?: number;
  logName?: string;
  onError?: (error: unknown) => void;
};

async function resolveRouteContext(
  context: IncomingRouteContext
): Promise<RouteContext> {
  const params = await Promise.resolve(context.params);

  return {
    params,
  };
}

/**
 * Normalizes mixed handler results into deterministic Next.js responses.
 */
function normalizeResult<T>(
  result: ApiHandlerResult<T>,
  successStatus?: number
): NextResponse<ApiResponse<T>> {
  if (result instanceof NextResponse) {
    return result as NextResponse<ApiResponse<T>>;
  }

  if (typeof result === 'undefined') {
    return noContent() as NextResponse<ApiResponse<T>>;
  }

  if (isApiError(result)) {
    return errorResponse(result.error, {
      details: result.details,
      code: result.code,
      status: 500,
    });
  }

  const statusInit =
    successStatus && successStatus !== 200 ? successStatus : undefined;

  return ok(result as T, statusInit);
}

export function createApiHandler<T>(
  handler: (args: RouteHandlerArgs) => Promise<ApiHandlerResult<T>>,
  options: ApiHandlerOptions = {}
) {
  const { successStatus, logName = 'API handler error', onError } = options;

  return async (
    request: NextRequest,
    routeContext: IncomingRouteContext
  ): Promise<NextResponse<ApiResponse<T>>> => {
    try {
      const normalizedRoute = await resolveRouteContext(
        routeContext ?? defaultIncomingRouteContext
      );
      const result = await handler({
        request,
        route: normalizedRoute,
      });

      return normalizeResult(result, successStatus);
    } catch (unknownError) {
      onError?.(unknownError);

      const message =
        unknownError instanceof Error ? unknownError.message : 'Unknown error';
      const stack =
        unknownError instanceof Error ? unknownError.stack : undefined;

      logger.error(logName, {
        message,
        stack,
        url: request.nextUrl?.pathname ?? request.url,
        raw: unknownError instanceof Error ? undefined : String(unknownError),
      });

      return errorResponse('Internal Server Error');
    }
  };
}

/**
 * Additional configuration for handlers that require authentication.
 */
export type AuthenticatedHandlerOptions = ApiHandlerOptions & {
  unauthorizedMessage?: string;
};

export function withApiAuth<T>(
  handler: RouteHandler<ServerContext, T>,
  options: AuthenticatedHandlerOptions = {}
) {
  const { unauthorizedMessage = 'Unauthorized', ...rest } = options;

  return createApiHandler<T>(async ({ request, route }) => {
    const context = await getServerContextFromHeaders(request.headers);

    if (!context) {
      return errorResponse(unauthorizedMessage, { status: 401 });
    }

    return handler({ request, route, context });
  }, rest);
}

/**
 * Extended options for handlers that require an active organization.
 */
export type OrganizationHandlerOptions = AuthenticatedHandlerOptions & {
  missingOrganizationMessage?: string;
  missingOrganizationStatus?: number;
};

export function withOrganization<T>(
  handler: RouteHandler<OrganizationContext, T>,
  options: OrganizationHandlerOptions = {}
) {
  const {
    missingOrganizationMessage = 'Active organization required',
    missingOrganizationStatus = 409,
    ...rest
  } = options;

  return withApiAuth<T>(async ({ request, route, context }) => {
    const organization = context.organization;

    if (!organization) {
      return errorResponse(missingOrganizationMessage, {
        status: missingOrganizationStatus,
      });
    }

    const organizationContext: OrganizationContext = {
      ...context,
      organization,
    };

    return handler({
      request,
      route,
      context: organizationContext,
    });
  }, rest);
}
