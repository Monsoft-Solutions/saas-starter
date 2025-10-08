import 'server-only';

import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import {
  validateQueryParams,
  validateRequest,
} from '@/lib/validation/request-validator.util';
import { validatedOk } from '@/lib/validation/validated-response.util';
import { error } from '@/lib/http/response';
import {
  ensureApiPermissions,
  type PermissionCheckResult,
} from '@/lib/auth/api-permission';
import type { AdminContext } from '@/lib/auth/admin-context';
import type { AdminPermission } from '@/lib/types/admin/permission.enum';
import logger from '@/lib/logger/logger.service';
import { env } from '../env';

/**
 * Handler function signature for validated admin API routes.
 * Input data is pre-validated and typed from the input schema.
 * Context includes authenticated admin user and permissions.
 */
export type ValidatedAdminHandler<
  TInput extends z.ZodTypeAny,
  TOutput extends z.ZodTypeAny,
> = (args: {
  data: z.infer<TInput>;
  request: NextRequest;
  context: AdminContext;
}) => Promise<z.infer<TOutput>>;

/**
 * Options for validated admin API handlers.
 */
export type ValidatedAdminHandlerOptions = {
  /**
   * Resource name for permission checking and logging
   */
  resource: string;

  /**
   * Required admin permissions for this route
   */
  requiredPermissions?: readonly AdminPermission[];

  /**
   * Where to find the input data.
   * - 'query': Validate URL search params (default for GET)
   * - 'body': Parse and validate request body (for POST/PUT/PATCH)
   */
  inputSource?: 'body' | 'query';

  /**
   * HTTP status code for successful responses (default: 200)
   */
  successStatus?: number;

  /**
   * Optional name for logging purposes
   */
  logName?: string;
};

/**
 * Creates a validated admin API handler with permission checking and input/output validation.
 *
 * This handler provides:
 * - Admin authentication and permission checking
 * - Automatic request query/body validation
 * - Type-safe handler function with inferred input types
 * - Automatic response validation against output schema
 * - Consistent error handling
 *
 * @param inputSchema - Zod schema for validating request input
 * @param outputSchema - Zod schema for validating response output
 * @param handler - The handler function that processes validated input
 * @param options - Configuration including permissions and resource name
 *
 * @example
 * ```typescript
 * // Define schemas
 * const querySchema = z.object({
 *   limit: z.coerce.number().int().min(1).max(100).default(50),
 *   offset: z.coerce.number().int().min(0).default(0),
 * });
 *
 * const responseSchema = z.object({
 *   data: z.array(z.object({ id: z.string(), name: z.string() })),
 *   total: z.number(),
 * });
 *
 * // Create validated admin handler
 * export const GET = createValidatedAdminHandler(
 *   querySchema,
 *   responseSchema,
 *   async ({ data, context }) => {
 *     // context.admin has permissions
 *     const results = await fetchData(data.limit, data.offset);
 *     return { data: results, total: results.length };
 *   },
 *   {
 *     resource: 'admin.data.list',
 *     requiredPermissions: ['data:read'],
 *     inputSource: 'query',
 *   }
 * );
 * ```
 */
export function createValidatedAdminHandler<
  TInput extends z.ZodTypeAny,
  TOutput extends z.ZodTypeAny,
>(
  inputSchema: TInput,
  outputSchema: TOutput,
  handler: ValidatedAdminHandler<TInput, TOutput>,
  options: ValidatedAdminHandlerOptions
) {
  const {
    resource,
    requiredPermissions,
    inputSource = 'query',
    successStatus,
    logName,
  } = options;

  return async (request: NextRequest): Promise<NextResponse> => {
    const logPrefix = logName ?? resource;

    try {
      // Step 1: Check admin permissions
      const permissionCheck: PermissionCheckResult = await ensureApiPermissions(
        request,
        {
          resource,
          requiredPermissions,
        }
      );

      if (!permissionCheck.ok) {
        return permissionCheck.response;
      }

      const { context } = permissionCheck;

      // Step 2: Parse and validate input based on source
      let inputData: unknown;

      if (inputSource === 'query') {
        // For GET requests, parse query parameters
        inputData = Object.fromEntries(request.nextUrl.searchParams.entries());
      } else {
        // For POST/PUT/PATCH, parse JSON body
        try {
          inputData = await request.json();
        } catch (parseError) {
          return error('Invalid JSON in request body', {
            status: 400,
            details:
              parseError instanceof Error ? parseError.message : undefined,
          });
        }
      }

      // Step 3: Validate input
      const validation =
        inputSource === 'query'
          ? validateQueryParams(request.nextUrl.searchParams, inputSchema)
          : validateRequest(inputData, inputSchema);

      if (!validation.success) {
        return error(validation.error, {
          status: 400,
          details:
            env.NODE_ENV === 'development' && validation.details
              ? JSON.stringify(validation.details)
              : undefined,
        });
      }

      // Step 4: Execute handler with validated data
      const result = await handler({
        data: validation.data,
        request,
        context,
      });

      // Step 5: Validate and return response
      return validatedOk(result, outputSchema, {
        status: successStatus,
      });
    } catch (err) {
      // Log unexpected errors
      logger.error(`[${logPrefix}] Request failed`, {
        error: err,
      });

      // Generic error response
      return error('Internal Server Error', { status: 500 });
    }
  };
}
