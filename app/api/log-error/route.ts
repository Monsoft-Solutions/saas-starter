import { createValidatedApiHandler } from '@/lib/server/validated-api-handler';
import logger from '@/lib/logger/logger.service';
import { clientErrorPayloadSchema } from '@/lib/types/logger/client-error-payload.schema';
import { logErrorResponseSchema } from '@/lib/types/logger/log-error-response.schema';

/**
 * Client Error Logging API Route
 *
 * Receives error reports from client-side code and logs them using Winston.
 * This allows client-side errors to be captured in server logs without
 * bundling Winston in the client.
 *
 * Uses validated API handler with:
 * - Input validation: Client error payload schema
 * - Output validation: Log error response schema
 * - No authentication required (public endpoint)
 */

export const POST = createValidatedApiHandler(
  clientErrorPayloadSchema,
  logErrorResponseSchema,
  async ({ data }) => {
    const payload = data;

    // Log the error with structured metadata to avoid field collisions
    logger.error('Client-side error', {
      meta: {
        clientError: {
          clientMessage: payload.message,
          errorName: payload.error?.name,
          errorMessage: payload.error?.message,
          errorStack: payload.error?.stack,
          errorDigest: payload.error?.digest,
          userAgent: payload.userAgent,
          url: payload.url,
          timestamp: payload.timestamp,
        },
      },
    });

    // Response is automatically validated against logErrorResponseSchema
    return { success: true };
  },
  {
    logName: 'Client error logging API',
    successStatus: 200,
  }
);
