/**
 * Server action helpers that centralize BetterAuth validation, session enforcement,
 * and organization requirements. These wrappers keep cross-route behaviors aligned.
 */
import { z } from 'zod';
import { redirect } from 'next/navigation';
import {
  OrganizationNotFoundError,
  UnauthorizedError,
  requireOrganizationContext,
  requireServerContext,
  type OrganizationDetails,
  type ServerUser,
} from '@/lib/auth/server-context';

const VALIDATION_FALLBACK_MESSAGE = 'Invalid form submission.';

/**
 * Shared state shape returned by server actions using the auth helpers.
 * Consumers (e.g. `useActionState`) can enrich the object with extra fields per action.
 */
export type ActionState = {
  error?: string;
  success?: string;
} & Record<string, string | number | undefined>;

type ActionResult = ActionState | void;

type ValidatedActionFunction<S extends z.ZodTypeAny> = (
  data: z.infer<S>,
  formData: FormData
) => Promise<ActionResult> | ActionResult;

type ValidatedActionWithUserFunction<S extends z.ZodTypeAny> = (
  data: z.infer<S>,
  formData: FormData,
  user: ServerUser
) => Promise<ActionResult> | ActionResult;

type ActionWithOrganizationFunction<T> = (
  formData: FormData,
  organization: OrganizationDetails
) => Promise<T> | T;

type OrganizationActionWrapper<T> = {
  (formData: FormData): Promise<T>;
  (prevState: ActionState, formData: FormData): Promise<ActionState>;
};

/**
 * Extracts a human-friendly validation message from a Zod error response.
 */
function resolveValidationError(error: z.ZodError): string {
  return error.issues[0]?.message ?? VALIDATION_FALLBACK_MESSAGE;
}

/**
 * Guards an unauthenticated server action behind Zod validation and normalized error handling.
 */
export function validatedAction<S extends z.ZodTypeAny>(
  schema: S,
  action: ValidatedActionFunction<S>
) {
  return async (_prevState: ActionState, formData: FormData) => {
    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: resolveValidationError(result.error) };
    }

    const outcome = await action(result.data, formData);
    return (outcome ?? {}) as ActionState;
  };
}

/**
 * Guards an authenticated server action, ensuring a BetterAuth session before invoking the handler.
 */
export function validatedActionWithUser<S extends z.ZodTypeAny>(
  schema: S,
  action: ValidatedActionWithUserFunction<S>
) {
  return async (_prevState: ActionState, formData: FormData) => {
    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: resolveValidationError(result.error) };
    }

    try {
      const { user } = await requireServerContext();
      const outcome = await action(result.data, formData, user);
      return (outcome ?? {}) as ActionState;
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        redirect('/sign-in');
      }

      throw error;
    }
  };
}

/**
 * Wraps a server action so it always executes with an active organization context.
 * Supports both `formAction(formData)` and `useActionState`-style `(prevState, formData)` signatures.
 */
export function withOrganization<T>(
  action: ActionWithOrganizationFunction<T>
): OrganizationActionWrapper<T> {
  const handler = async (
    ...args: [FormData] | [ActionState, FormData]
  ): Promise<T | ActionState> => {
    const isStatefulCall = args.length === 2;
    const formData = (isStatefulCall ? args[1] : args[0]) as FormData;
    const prevState = (isStatefulCall ? args[0] : undefined) as
      | ActionState
      | undefined;

    try {
      const { organization } = await requireOrganizationContext();
      const result = await action(formData, organization);

      if (isStatefulCall) {
        return (result ?? {}) as ActionState;
      }

      return result as T;
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        redirect('/sign-in');
      }

      if (error instanceof OrganizationNotFoundError) {
        if (isStatefulCall && prevState) {
          return {
            ...prevState,
            error: error.message,
          } satisfies ActionState;
        }

        throw new Error(error.message);
      }

      throw error;
    }
  };

  return handler as OrganizationActionWrapper<T>;
}
