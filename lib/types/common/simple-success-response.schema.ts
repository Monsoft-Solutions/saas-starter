import { z } from 'zod';

/**
 * Schema for simple success response
 * Used for operations that only return a success flag without additional data
 */
export const simpleSuccessResponseSchema = z.object({
  success: z.boolean(),
});

/**
 * Type for simple success response
 */
export type SimpleSuccessResponse = z.infer<typeof simpleSuccessResponseSchema>;
