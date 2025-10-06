import { redirect } from 'next/navigation';
import type { ActionState } from './middleware';
import {
  AdminAccessRequiredError,
  requireAdminContext,
  type AdminContext,
} from './admin-context';
import type { AdminPermission } from '@/lib/types/admin/permission.enum';
import logger from '@/lib/logger/logger.service';

export class PermissionDeniedError extends Error {
  constructor(
    public readonly requiredPermissions: readonly AdminPermission[],
    public readonly resource?: string,
    message = 'Insufficient permissions to perform this action.'
  ) {
    super(message);
    this.name = 'PermissionDeniedError';
  }
}

type PermissionActionFunction<T> = (
  formData: FormData,
  context: AdminContext
) => Promise<T> | T;

type PermissionActionWrapper<T> = {
  (formData: FormData): Promise<T>;
  (prevState: ActionState, formData: FormData): Promise<ActionState>;
};

function ensurePermissions(
  context: AdminContext,
  required: readonly AdminPermission[],
  resource?: string
): void {
  const missing = required.filter(
    (permission) => !context.admin.permissions.has(permission)
  );

  if (missing.length) {
    throw new PermissionDeniedError(required, resource);
  }
}

function handlePermissionFailure(
  prevState: ActionState | undefined,
  required: readonly AdminPermission[],
  resource?: string
): ActionState {
  const messageParts = [
    `Forbidden: ${required.join(', ')} permission required.`,
  ];

  if (resource) {
    messageParts.push(`Resource: ${resource}`);
  }

  const message = messageParts.join(' ');

  if (prevState) {
    return {
      ...prevState,
      error: message,
    } satisfies ActionState;
  }

  return {
    error: message,
  } satisfies ActionState;
}

function withPermissionsInternal<T>(
  required: readonly AdminPermission[],
  action: PermissionActionFunction<T>,
  resource?: string
): PermissionActionWrapper<T> {
  const handler = async (
    ...args: [FormData] | [ActionState, FormData]
  ): Promise<T | ActionState> => {
    const isStatefulCall = args.length === 2;
    const formData = (isStatefulCall ? args[1] : args[0]) as FormData;
    const prevState = (isStatefulCall ? args[0] : undefined) as
      | ActionState
      | undefined;

    try {
      const context = await requireAdminContext();
      ensurePermissions(context, required, resource);

      const result = await action(formData, context);

      if (isStatefulCall) {
        return (result ?? {}) as ActionState;
      }

      return result as T;
    } catch (error) {
      if (error instanceof AdminAccessRequiredError) {
        redirect('/app');
      }

      if (error instanceof PermissionDeniedError) {
        logger.warn('[withPermissions] Permission denied', {
          requiredPermissions: error.requiredPermissions,
          resource: error.resource ?? resource,
        });

        if (isStatefulCall) {
          return handlePermissionFailure(
            prevState,
            required,
            error.resource ?? resource
          );
        }

        redirect('/app');
      }

      if (isStatefulCall && prevState) {
        return {
          ...prevState,
          error:
            error instanceof Error
              ? error.message
              : 'Action failed unexpectedly',
        } satisfies ActionState;
      }

      throw error;
    }
  };

  return handler as PermissionActionWrapper<T>;
}

export function withPermissions<T>(
  required: readonly AdminPermission[],
  action: PermissionActionFunction<T>,
  resource?: string
): PermissionActionWrapper<T> {
  return withPermissionsInternal(required, action, resource);
}

export function withPermission<T>(
  required: AdminPermission,
  action: PermissionActionFunction<T>,
  resource?: string
): PermissionActionWrapper<T> {
  return withPermissionsInternal([required], action, resource);
}

export function withSuperAdminPermission<T>(
  action: PermissionActionFunction<T>,
  resource?: string
): PermissionActionWrapper<T> {
  return withPermissionsInternal(['users:write'], action, resource);
}
