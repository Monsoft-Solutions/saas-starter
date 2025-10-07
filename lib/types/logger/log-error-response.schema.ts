import { z } from 'zod';

/**
 * Zod schema for log-error endpoint response.
 * Returns a simple success confirmation when error is logged.
 */
export const logErrorResponseSchema = z.object({
  success: z.boolean(),
});

/**
 * Log error response type (inferred from schema).
 * Use this for the response from POST /api/log-error.
 */
export type LogErrorResponse = z.infer<typeof logErrorResponseSchema>;
