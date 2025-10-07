import { z } from 'zod';

/**
 * Base action state schema for server actions.
 * All server actions should return data that extends this schema.
 */
export const actionStateSchema = z.object({
  error: z.string().optional(),
  success: z.string().optional(),
});

/**
 * Base action state type inferred from schema.
 */
export type ActionState = z.infer<typeof actionStateSchema>;

/**
 * Creates a typed action state schema by extending the base schema with additional fields.
 *
 * @param dataShape - Additional fields to include in the action state
 * @returns Extended Zod schema with type inference
 *
 * @example
 * ```typescript
 * // Define typed action state for sign-in
 * export const signInStateSchema = createActionStateSchema({
 *   email: z.string().email().optional(),
 *   redirectUrl: z.string().url().optional(),
 * });
 *
 * export type SignInState = z.infer<typeof signInStateSchema>;
 *
 * // Use in action
 * export async function signIn(
 *   prevState: SignInState,
 *   formData: FormData
 * ): Promise<SignInState> {
 *   // ...
 *   return {
 *     success: 'Signed in successfully',
 *     redirectUrl: '/app',
 *   };
 * }
 * ```
 */
export function createActionStateSchema<T extends z.ZodRawShape>(dataShape: T) {
  return actionStateSchema.extend(dataShape);
}

/**
 * Helper to create a success action state.
 *
 * @param message - Success message
 * @param data - Additional data to include
 * @returns Action state with success message
 *
 * @example
 * ```typescript
 * return actionSuccess('User created successfully', { userId: user.id });
 * ```
 */
export function actionSuccess<T extends Record<string, unknown>>(
  message: string,
  data?: T
): ActionState & T {
  return {
    success: message,
    ...data,
  } as ActionState & T;
}

/**
 * Helper to create an error action state.
 *
 * @param message - Error message
 * @param data - Additional data to include (e.g., field values to preserve)
 * @returns Action state with error message
 *
 * @example
 * ```typescript
 * return actionError('Invalid credentials', { email: formData.get('email') });
 * ```
 */
export function actionError<T extends Record<string, unknown>>(
  message: string,
  data?: T
): ActionState & T {
  return {
    error: message,
    ...data,
  } as ActionState & T;
}

/**
 * Type utility to extract the data type from an action state schema.
 *
 * @example
 * ```typescript
 * const schema = createActionStateSchema({
 *   email: z.string(),
 * });
 *
 * type MyActionState = ActionStateData<typeof schema>;
 * // MyActionState = { error?: string; success?: string; email?: string }
 * ```
 */
export type ActionStateData<T extends z.ZodTypeAny> = z.infer<T>;
