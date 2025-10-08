import { z } from 'zod';
import { type ActionState } from './action-state.type';
import { env } from '@/lib/env';

/**
 * Creates a type-safe server action with input and output validation.
 *
 * @param inputSchema - Zod schema for validating form data
 * @param outputSchema - Zod schema for validating action return value
 * @param handler - The action handler function
 * @returns Type-safe action compatible with useActionState
 *
 * @example
 * ```typescript
 * const signInInputSchema = z.object({
 *   email: z.string().email(),
 *   password: z.string().min(8),
 * });
 *
 * const signInOutputSchema = createActionStateSchema({
 *   email: z.string().optional(),
 *   redirectUrl: z.string().optional(),
 * });
 *
 * export const signIn = createTypedAction(
 *   signInInputSchema,
 *   signInOutputSchema,
 *   async (data) => {
 *     // data is typed from inputSchema
 *     const result = await authenticateUser(data.email, data.password);
 *
 *     if (!result.success) {
 *       return {
 *         error: 'Invalid credentials',
 *         email: data.email,
 *       };
 *     }
 *
 *     return {
 *       success: 'Signed in successfully',
 *       redirectUrl: '/app',
 *     };
 *   }
 * );
 * ```
 */
export function createTypedAction<
  TInput extends z.ZodTypeAny,
  TOutput extends z.ZodTypeAny,
>(
  inputSchema: TInput,
  outputSchema: TOutput,
  handler: (data: z.infer<TInput>) => Promise<z.infer<TOutput>>
) {
  return async (
    _prevState: z.infer<TOutput>,
    formData: FormData
  ): Promise<z.infer<TOutput>> => {
    // Validate input
    const inputData = Object.fromEntries(formData);
    const inputResult = inputSchema.safeParse(inputData);

    if (!inputResult.success) {
      const firstError = inputResult.error.errors[0];
      const errorMessage = firstError?.message ?? 'Validation failed';

      // Return error as typed output
      return {
        error: errorMessage,
      } as z.infer<TOutput>;
    }

    // Execute handler
    const output = await handler(inputResult.data);

    // Validate output in development and test
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.NODE_ENV === 'test'
    ) {
      const outputResult = outputSchema.safeParse(output);

      if (!outputResult.success) {
        console.error('Action output validation failed:', {
          errors: outputResult.error.errors,
          output,
        });

        return {
          error: 'Internal error: Invalid action response',
        } as z.infer<TOutput>;
      }

      return outputResult.data;
    }

    return output;
  };
}

/**
 * Creates a type-safe authenticated server action with user context.
 *
 * @param inputSchema - Zod schema for validating form data
 * @param outputSchema - Zod schema for validating action return value
 * @param handler - The action handler function with user parameter
 * @returns Type-safe action compatible with useActionState
 *
 * @example
 * ```typescript
 * import { requireServerContext } from '@/lib/auth/server-context';
 *
 * export const updateProfile = createTypedActionWithUser(
 *   updateProfileInputSchema,
 *   updateProfileOutputSchema,
 *   async (data, user) => {
 *     // user is typed and guaranteed to exist
 *     await updateUserProfile(user.id, data);
 *
 *     return {
 *       success: 'Profile updated successfully',
 *     };
 *   }
 * );
 * ```
 */
export function createTypedActionWithUser<
  TInput extends z.ZodTypeAny,
  TOutput extends z.ZodTypeAny,
  TUser = unknown,
>(
  inputSchema: TInput,
  outputSchema: TOutput,
  handler: (data: z.infer<TInput>, user: TUser) => Promise<z.infer<TOutput>>,
  getUserContext: () => Promise<TUser>
) {
  return async (
    _prevState: z.infer<TOutput>,
    formData: FormData
  ): Promise<z.infer<TOutput>> => {
    // Validate input
    const inputData = Object.fromEntries(formData);
    const inputResult = inputSchema.safeParse(inputData);

    if (!inputResult.success) {
      const firstError = inputResult.error.errors[0];
      const errorMessage = firstError?.message ?? 'Validation failed';

      return {
        error: errorMessage,
      } as z.infer<TOutput>;
    }

    // Get user context
    try {
      const user = await getUserContext();

      // Execute handler
      const output = await handler(inputResult.data, user);

      // Validate output in development and test
      if (env.NODE_ENV === 'development' || env.NODE_ENV === 'test') {
        const outputResult = outputSchema.safeParse(output);

        if (!outputResult.success) {
          console.error('Action output validation failed:', {
            errors: outputResult.error.errors,
            output,
          });

          return {
            error: 'Internal error: Invalid action response',
          } as z.infer<TOutput>;
        }

        return outputResult.data;
      }

      return output;
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unauthorized',
      } as z.infer<TOutput>;
    }
  };
}

/**
 * Type utility to infer the action state type from a typed action.
 *
 * @example
 * ```typescript
 * const signIn = createTypedAction(...);
 * type SignInState = InferActionState<typeof signIn>;
 * ```
 */
export type InferActionState<
  T extends (
    prevState: ActionState,
    formData: FormData
  ) => Promise<ActionState>,
> = Awaited<ReturnType<T>>;
