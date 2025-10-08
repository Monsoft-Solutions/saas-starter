import 'server-only';

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { validateRequest } from '@/lib/validation/request-validator.util';
import { validatedOk } from '@/lib/validation/validated-response.util';
import { error } from '@/lib/http/response';
import {
  requireServerContext,
  type ServerContext,
} from '@/lib/auth/server-context';
import logger from '@/lib/logger/logger.service';

/**
 * Custom error class for business logic errors in validated handlers.
 * Allows handlers to return specific HTTP status codes and messages.
 */
export class HandlerError extends Error {
  constructor(
    message: string,
    public readonly status: number = 500,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'HandlerError';
  }
}

/**
 * Handler function signature for validated API routes with route parameters.
 * Includes validated input data, route params, and authenticated context.
 */
export type ValidatedRouteParamHandler<
  TParams extends z.ZodTypeAny,
  TInput extends z.ZodTypeAny,
  TOutput extends z.ZodTypeAny,
> = (args: {
  params: z.infer<TParams>;
  data: z.infer<TInput>;
  request: NextRequest;
  context: ServerContext;
}) => Promise<z.infer<TOutput>>;

/**
 * Options for validated route param handlers.
 */
export type ValidatedRouteParamHandlerOptions = {
  /**
   * Optional name for logging purposes
   */
  logName?: string;

  /**
   * HTTP status code for successful responses (default: 200)
   */
  successStatus?: number;

  /**
   * Custom error handler
   */
  onError?: (error: unknown) => void;
};

/**
 * Creates a validated API handler for routes with dynamic parameters (e.g., /api/resource/[id]).
 *
 * This handler provides:
 * - Automatic route parameter validation
 * - Automatic request body validation
 * - Automatic response validation
 * - Authentication (requires user session)
 * - Consistent error handling
 *
 * @param paramsSchema - Zod schema for validating route parameters (e.g., { id: z.string() })
 * @param inputSchema - Zod schema for validating request body
 * @param outputSchema - Zod schema for validating response output
 * @param handler - The handler function that processes validated input
 * @param options - Optional configuration
 *
 * @example
 * ```typescript
 * // Define schemas
 * const paramsSchema = z.object({
 *   id: z.string().regex(/^\d+$/), // Numeric ID
 * });
 *
 * const inputSchema = z.object({
 *   action: z.enum(['approve', 'reject']),
 * });
 *
 * const outputSchema = z.object({
 *   success: z.boolean(),
 * });
 *
 * // Create validated handler
 * export const PATCH = createValidatedRouteParamHandler(
 *   paramsSchema,
 *   inputSchema,
 *   outputSchema,
 *   async ({ params, data, context }) => {
 *     const itemId = parseInt(params.id, 10);
 *     await updateItem(itemId, data.action, context.user.id);
 *     return { success: true };
 *   }
 * );
 * ```
 */
export function createValidatedRouteParamHandler<
  TParams extends z.ZodTypeAny,
  TInput extends z.ZodTypeAny,
  TOutput extends z.ZodTypeAny,
>(
  paramsSchema: TParams,
  inputSchema: TInput,
  outputSchema: TOutput,
  handler: ValidatedRouteParamHandler<TParams, TInput, TOutput>,
  options: ValidatedRouteParamHandlerOptions = {}
) {
  return async (
    request: NextRequest,
    props: { params: Promise<Record<string, string>> }
  ) => {
    try {
      // Authenticate user
      const context = await requireServerContext();

      // Parse and validate route parameters
      const rawParams = await props.params;
      const paramsValidation = paramsSchema.safeParse(rawParams);

      if (!paramsValidation.success) {
        const firstError = paramsValidation.error.errors[0];
        return error(firstError?.message ?? 'Invalid route parameters', {
          status: 400,
          details:
            process.env.NODE_ENV === 'development'
              ? JSON.stringify(paramsValidation.error.format())
              : undefined,
        });
      }

      // Parse and validate request body
      let bodyData: unknown;
      const method = request.method.toUpperCase();
      const hasBody = ['POST', 'PUT', 'PATCH'].includes(method);

      if (hasBody) {
        try {
          const bodyText = await request.text();
          if (bodyText) {
            bodyData = JSON.parse(bodyText);
          } else {
            bodyData = {};
          }
        } catch (parseError) {
          return error('Invalid JSON in request body', {
            status: 400,
            details:
              parseError instanceof Error ? parseError.message : undefined,
          });
        }
      } else {
        bodyData = {};
      }

      const bodyValidation = validateRequest(bodyData, inputSchema);

      if (!bodyValidation.success) {
        return error(bodyValidation.error, {
          status: 400,
          details: bodyValidation.details
            ? JSON.stringify(bodyValidation.details)
            : undefined,
        });
      }

      // Execute handler with validated data
      const result = await handler({
        params: paramsValidation.data,
        data: bodyValidation.data,
        request,
        context,
      });

      // Validate and return response
      return validatedOk(result, outputSchema, {
        status: options.successStatus,
      });
    } catch (err) {
      // Handle business logic errors with custom status codes
      if (err instanceof HandlerError) {
        return error(err.message, {
          status: err.status,
          details: err.details ? JSON.stringify(err.details) : undefined,
        });
      }

      // Log unexpected errors
      const logPrefix = options.logName ?? 'API route with params';
      logger.error(`[${logPrefix}] Request failed`, {
        error: err,
      });

      // Call custom error handler if provided
      if (options.onError) {
        options.onError(err);
      }

      // Handle authentication errors
      if (err instanceof Error && err.name === 'UnauthorizedError') {
        return error('Unauthorized', { status: 401 });
      }

      // Generic error response
      return error('Internal Server Error', { status: 500 });
    }
  };
}
