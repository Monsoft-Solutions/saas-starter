/**
 * Super admin middleware wrapper for server actions.
 * Ensures that only super-admins can execute protected admin actions.
 */
import { redirect } from 'next/navigation';
import {
  requireSuperAdminContext,
  SuperAdminRequiredError,
  type SuperAdminContext,
} from './super-admin-context';
import type { ActionState } from './middleware';
import logger from '@/lib/logger/logger.service';

type SuperAdminActionFunction<T> = (
  formData: FormData,
  context: SuperAdminContext
) => Promise<T> | T;

type SuperAdminActionWrapper<T> = {
  (formData: FormData): Promise<T>;
  (prevState: ActionState, formData: FormData): Promise<ActionState>;
};

/**
 * Wraps a server action with super-admin authorization.
 * Uses Better Auth role checking under the hood.
 */
export function withSuperAdmin<T>(
  action: SuperAdminActionFunction<T>,
  _options?: {
    logAction?: string;
  }
): SuperAdminActionWrapper<T> {
  const handler = async (
    ...args: [FormData] | [ActionState, FormData]
  ): Promise<T | ActionState> => {
    const isStatefulCall = args.length === 2;
    const formData = (isStatefulCall ? args[1] : args[0]) as FormData;
    const prevState = (isStatefulCall ? args[0] : undefined) as
      | ActionState
      | undefined;

    try {
      // Verify super-admin context (uses Better Auth role)
      const context = await requireSuperAdminContext();

      // Execute action
      const result = await action(formData, context);

      if (isStatefulCall) {
        return (result ?? {}) as ActionState;
      }

      return result as T;
    } catch (error) {
      logger.error('[withSuperAdmin] Action failed', { error });

      if (error instanceof SuperAdminRequiredError) {
        redirect('/app'); // Redirect non-admins to regular app

        return undefined as unknown as T;
      }

      if (isStatefulCall && prevState) {
        return {
          ...prevState,
          error: error instanceof Error ? error.message : 'Action failed',
        } satisfies ActionState;
      }

      throw error;
    }
  };

  return handler as SuperAdminActionWrapper<T>;
}
