import 'server-only';

import { z } from 'zod';
import { NextRequest } from 'next/server';
import {
  validateRequest,
  validateQueryParams,
} from '@/lib/validation/request-validator.util';
import { validatedOk } from '@/lib/validation/validated-response.util';
import { error } from '@/lib/http/response';
import {
  createApiHandler,
  withApiAuth,
  withOrganization,
  type RouteHandlerArgs,
  type ApiHandlerOptions,
  type AuthenticatedHandlerOptions,
  type OrganizationHandlerOptions,
} from './api-handler';
import {
  type OrganizationContext,
  type ServerContext,
} from '@/lib/auth/server-context';

/**
 * Handler function signature for validated API routes.
 * Input data is pre-validated and typed from the input schema.
 */
export type ValidatedApiHandler<
  TInput extends z.ZodTypeAny,
  TOutput extends z.ZodTypeAny,
  TContext = void,
> = (args: {
  data: z.infer<TInput>;
  request: NextRequest;
  route: RouteHandlerArgs['route'];
  context: TContext;
}) => Promise<z.infer<TOutput>>;

/**
 * Options for validated API handlers.
 */
export type ValidatedApiHandlerOptions = ApiHandlerOptions & {
  /**
   * Where to find the input data.
   * - 'body': Parse and validate request body (default for POST/PUT/PATCH)
   * - 'query': Validate URL search params (default for GET/DELETE)
   */
  inputSource?: 'body' | 'query';
};

/**
 * Creates a fully validated API handler with input and output schema validation.
 *
 * This handler provides:
 * - Automatic request body/query parameter parsing and validation
 * - Type-safe handler function with inferred input types
 * - Automatic response validation against output schema
 * - Consistent error handling for validation failures
 *
 * @param inputSchema - Zod schema for validating request input
 * @param outputSchema - Zod schema for validating response output
 * @param handler - The handler function that processes validated input
 * @param options - Optional configuration
 *
 * @example
 * ```typescript
 * // Define schemas
 * const inputSchema = z.object({
 *   name: z.string().min(1),
 *   email: z.string().email(),
 * });
 *
 * const outputSchema = z.object({
 *   id: z.string(),
 *   name: z.string(),
 *   email: z.string(),
 * });
 *
 * // Create validated handler
 * export const POST = createValidatedApiHandler(
 *   inputSchema,
 *   outputSchema,
 *   async ({ data }) => {
 *     // data is fully typed from inputSchema
 *     const user = await createUser(data);
 *     return user; // automatically validated against outputSchema
 *   }
 * );
 * ```
 */
export function createValidatedApiHandler<
  TInput extends z.ZodTypeAny,
  TOutput extends z.ZodTypeAny,
>(
  inputSchema: TInput,
  outputSchema: TOutput,
  handler: ValidatedApiHandler<TInput, TOutput, void>,
  options: ValidatedApiHandlerOptions = {}
) {
  const { inputSource = 'body', ...handlerOptions } = options;

  return createApiHandler<z.infer<TOutput>>(async (args) => {
    const { request, route } = args;

    // Parse and validate input based on source
    let inputData: unknown;

    if (inputSource === 'query') {
      inputData = Object.fromEntries(request.nextUrl.searchParams.entries());
    } else {
      try {
        inputData = await request.json();
      } catch (parseError) {
        return error('Invalid JSON in request body', {
          status: 400,
          details: parseError instanceof Error ? parseError.message : undefined,
        });
      }
    }

    const validation =
      inputSource === 'query'
        ? validateQueryParams(request.nextUrl.searchParams, inputSchema)
        : validateRequest(inputData, inputSchema);

    if (!validation.success) {
      return error(validation.error, {
        status: 400,
        details: validation.details ? String(validation.details) : undefined,
      });
    }

    // Execute handler with validated data
    const result = await handler({
      data: validation.data,
      request,
      route,
      context: undefined as void,
    });

    // Validate and return response
    return validatedOk(result, outputSchema, {
      status: handlerOptions.successStatus,
    });
  }, handlerOptions);
}

/**
 * Creates a validated API handler that requires authentication.
 *
 * @param inputSchema - Zod schema for validating request input
 * @param outputSchema - Zod schema for validating response output
 * @param handler - The handler function with authenticated context
 * @param options - Optional configuration including auth options
 *
 * @example
 * ```typescript
 * export const POST = createValidatedAuthenticatedHandler(
 *   inputSchema,
 *   outputSchema,
 *   async ({ data, context }) => {
 *     const { user } = context; // authenticated user available
 *     return await performAction(user.id, data);
 *   }
 * );
 * ```
 */
export function createValidatedAuthenticatedHandler<
  TInput extends z.ZodTypeAny,
  TOutput extends z.ZodTypeAny,
>(
  inputSchema: TInput,
  outputSchema: TOutput,
  handler: ValidatedApiHandler<TInput, TOutput, ServerContext>,
  options: ValidatedApiHandlerOptions & AuthenticatedHandlerOptions = {}
) {
  const { inputSource = 'body', ...authOptions } = options;

  return withApiAuth<z.infer<TOutput>>(async ({ request, route, context }) => {
    // Parse and validate input based on source
    let inputData: unknown;

    if (inputSource === 'query') {
      inputData = Object.fromEntries(request.nextUrl.searchParams.entries());
    } else {
      try {
        inputData = await request.json();
      } catch (parseError) {
        return error('Invalid JSON in request body', {
          status: 400,
          details: parseError instanceof Error ? parseError.message : undefined,
        });
      }
    }

    const validation =
      inputSource === 'query'
        ? validateQueryParams(request.nextUrl.searchParams, inputSchema)
        : validateRequest(inputData, inputSchema);

    if (!validation.success) {
      return error(validation.error, {
        status: 400,
        details: validation.details ? String(validation.details) : undefined,
      });
    }

    // Execute handler with validated data and auth context
    const result = await handler({
      data: validation.data,
      request,
      route,
      context,
    });

    // Validate and return response
    return validatedOk(result, outputSchema, { status: options.successStatus });
  }, authOptions);
}

/**
 * Creates a validated API handler that requires an active organization.
 *
 * @param inputSchema - Zod schema for validating request input
 * @param outputSchema - Zod schema for validating response output
 * @param handler - The handler function with organization context
 * @param options - Optional configuration including organization options
 *
 * @example
 * ```typescript
 * export const POST = createValidatedOrganizationHandler(
 *   inputSchema,
 *   outputSchema,
 *   async ({ data, context }) => {
 *     const { user, organization } = context; // both available
 *     return await performOrganizationAction(organization.id, data);
 *   }
 * );
 * ```
 */
export function createValidatedOrganizationHandler<
  TInput extends z.ZodTypeAny,
  TOutput extends z.ZodTypeAny,
>(
  inputSchema: TInput,
  outputSchema: TOutput,
  handler: ValidatedApiHandler<TInput, TOutput, OrganizationContext>,
  options: ValidatedApiHandlerOptions & OrganizationHandlerOptions = {}
) {
  const { inputSource = 'body', ...orgOptions } = options;

  return withOrganization<z.infer<TOutput>>(
    async ({ request, route, context }) => {
      // Parse and validate input based on source
      let inputData: unknown;

      if (inputSource === 'query') {
        inputData = Object.fromEntries(request.nextUrl.searchParams.entries());
      } else {
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

      const validation =
        inputSource === 'query'
          ? validateQueryParams(request.nextUrl.searchParams, inputSchema)
          : validateRequest(inputData, inputSchema);

      if (!validation.success) {
        return error(validation.error, {
          status: 400,
          details: validation.details ? String(validation.details) : undefined,
        });
      }

      // Execute handler with validated data and organization context
      const result = await handler({
        data: validation.data,
        request,
        route,
        context,
      });

      // Validate and return response
      return validatedOk(result, outputSchema, {
        status: options.successStatus,
      });
    },
    orgOptions
  );
}

/**
 * Type helper to extract the input type from a validated handler.
 */
export type ExtractHandlerInput<T> =
  T extends ValidatedApiHandler<
    infer I,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    infer _O,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    infer _C
  >
    ? z.infer<I>
    : never;

/**
 * Type helper to extract the output type from a validated handler.
 */
export type ExtractHandlerOutput<T> =
  T extends ValidatedApiHandler<
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    infer _I,
    infer O,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    infer _C
  >
    ? z.infer<O>
    : never;

/**
 * Re-export route param handler utilities for convenience.
 * For routes with dynamic parameters like /api/resource/[id].
 */
export {
  createValidatedRouteParamHandler,
  HandlerError,
  type ValidatedRouteParamHandler,
  type ValidatedRouteParamHandlerOptions,
} from './validated-route-param-handler';
