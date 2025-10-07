import 'server-only';

import { NextResponse } from 'next/server';
import {
  AdminAccessRequiredError,
  requireAdminContextFromHeaders,
  type AdminContext,
} from './admin-context';
import { getServerSessionFromHeaders } from './server-context';
import type { AdminPermission } from '@/lib/types/admin/permission.enum';

export type PermissionCheckSuccess = {
  ok: true;
  context: AdminContext;
};

export type PermissionCheckFailure = {
  ok: false;
  response: NextResponse;
};

export type PermissionCheckResult =
  | PermissionCheckSuccess
  | PermissionCheckFailure;

function unauthorizedResponse(): NextResponse {
  return NextResponse.json(
    {
      error: 'Unauthorized',
      details: 'Authentication required to access this resource.',
    },
    { status: 401 }
  );
}

function forbiddenResponse(
  resource: string,
  required: readonly AdminPermission[],
  missing?: readonly AdminPermission[],
  details = 'Insufficient permissions to access this resource.'
): NextResponse {
  const requiredList = Array.from(required);
  const missingList = Array.from(missing ?? required);

  return NextResponse.json(
    {
      error: 'Forbidden',
      resource,
      details,
      requiredPermissions: requiredList,
      missingPermissions: missingList,
    },
    { status: 403 }
  );
}

export async function ensureApiPermissions(
  request: Request,
  options: {
    resource: string;
    requiredPermissions?: readonly AdminPermission[];
  }
): Promise<PermissionCheckResult> {
  const required = options.requiredPermissions ?? [];
  const resource = options.resource;
  const requestHeaders = new Headers(request.headers);

  try {
    const context = await requireAdminContextFromHeaders(requestHeaders);

    if (!required.length) {
      return { ok: true, context };
    }

    const missing = required.filter(
      (permission) => !context.admin.permissions.has(permission)
    );

    if (missing.length) {
      return {
        ok: false,
        response: forbiddenResponse(resource, required, missing),
      };
    }

    return { ok: true, context };
  } catch (error) {
    if (error instanceof AdminAccessRequiredError) {
      const session = await getServerSessionFromHeaders(requestHeaders);

      if (!session) {
        return { ok: false, response: unauthorizedResponse() };
      }

      return {
        ok: false,
        response: forbiddenResponse(
          resource,
          required,
          required,
          'Admin role required to access this resource.'
        ),
      };
    }

    throw error;
  }
}
