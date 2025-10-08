import { z } from 'zod';

/**
 * Common success response schema for API operations.
 * Used for operations that complete successfully but don't need to return specific data.
 */
export const successResponseSchema = z.object({
  success: z.boolean().default(true),
  message: z.string().optional(),
});

/**
 * Success response type (inferred from schema).
 * Use for simple success confirmations.
 */
export type SuccessResponse = z.infer<typeof successResponseSchema>;

/**
 * Generic success response schema with data payload.
 * Use this for successful operations that return typed data.
 *
 * @example
 * const userDataResponseSchema = createSuccessResponseSchema(userSchema);
 */
export function createSuccessResponseSchema<T extends z.ZodTypeAny>(
  dataSchema: T
) {
  return z.object({
    success: z.boolean().default(true),
    message: z.string().optional(),
    data: dataSchema,
  });
}
