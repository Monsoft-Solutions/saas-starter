import { NextRequest } from 'next/server';
import { createApiHandler } from '@/lib/server/api-handler';
import { error } from '@/lib/http/response';
import logger from '@/lib/logger/logger.service';
import { clientErrorPayloadSchema } from '@/lib/types/logger/client-error-payload.schema';

/**
 * Client Error Logging API Route
 *
 * Receives error reports from client-side code and logs them using Winston.
 * This allows client-side errors to be captured in server logs without
 * bundling Winston in the client.
 *
 * Validates all incoming payloads with Zod to ensure type safety and prevent
 * abuse. Returns 400 for invalid payloads.
 */

export const POST = createApiHandler(
  async ({ request }: { request: NextRequest }) => {
    const rawPayload = await request.json();

    // Validate payload with Zod schema
    const parseResult = clientErrorPayloadSchema.safeParse(rawPayload);

    if (!parseResult.success) {
      const validationErrors = parseResult.error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join('; ');

      logger.warn('Invalid client error payload received', {
        meta: {
          validationErrors: parseResult.error.errors,
          receivedPayload: rawPayload,
        },
      });

      return error('Invalid payload', {
        status: 400,
        details: validationErrors,
      });
    }

    const payload = parseResult.data;

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

    return { success: true };
  },
  {
    logName: 'Client error logging API',
    successStatus: 200,
  }
);
