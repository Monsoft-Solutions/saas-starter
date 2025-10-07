import { z } from 'zod';
import { NextResponse } from 'next/server';
import { ok, error, type ApiResponse } from '@/lib/http/response';
import logger from '@/lib/logger/logger.service';
import { env } from '../env';

/**
 * Validates response data against a schema before returning it.
 * Helps prevent accidental data exposure and ensures API contract compliance.
 *
 * @param data - The response data to validate
 * @param schema - The Zod schema to validate against
 * @param options - Optional status code override
 * @returns NextResponse with validated data or error response
 *
 * @example
 * ```typescript
 * const userResponseSchema = z.object({
 *   id: z.string(),
 *   name: z.string(),
 *   email: z.string().email(),
 * });
 *
 * const user = await getUserById(id);
 * return validatedOk(user, userResponseSchema);
 * ```
 */
export function validatedOk<T extends z.ZodTypeAny>(
  data: unknown,
  schema: T,
  options?: { status?: number }
): NextResponse<ApiResponse<z.infer<T>>> {
  const result = schema.safeParse(data);

  if (!result.success) {
    logger.error('Response validation failed', {
      errors: result.error.errors,
      schema: schema.description ?? 'unknown',
      receivedType: typeof data,
    });

    // In development/test, expose validation errors for debugging
    if (env.NODE_ENV === 'development' || env.NODE_ENV === 'test') {
      return error('Response validation failed', {
        status: 500,
        details: JSON.stringify(result.error.format(), null, 2),
      });
    }

    // In production, hide internal validation errors
    return error('Internal server error', { status: 500 });
  }

  return ok(result.data, options?.status);
}

/**
 * Validates response data for a created resource (201 status).
 *
 * @param data - The response data to validate
 * @param schema - The Zod schema to validate against
 * @returns NextResponse with validated data or error response
 *
 * @example
 * ```typescript
 * const newUser = await createUser(userData);
 * return validatedCreated(newUser, userResponseSchema);
 * ```
 */
export function validatedCreated<T extends z.ZodTypeAny>(
  data: unknown,
  schema: T
): NextResponse<ApiResponse<z.infer<T>>> {
  return validatedOk(data, schema, { status: 201 });
}

/**
 * Type guard to check if validation should be enforced.
 * Can be controlled via environment variable for gradual rollout.
 */
export function shouldValidateResponse(): boolean {
  // Always validate in development and test environments
  if (env.NODE_ENV === 'development' || env.NODE_ENV === 'test') {
    return true;
  }

  // In production, allow opt-in via environment variable
  return process.env.STRICT_RESPONSE_VALIDATION === 'true';
}

/**
 * Validates response data only if strict validation is enabled.
 * Useful for gradual migration to validated responses.
 *
 * @param data - The response data to optionally validate
 * @param schema - The Zod schema to validate against
 * @param options - Optional status code override
 * @returns NextResponse with data (validated if enabled)
 *
 * @example
 * ```typescript
 * // During migration, use optionalValidatedOk for backward compatibility
 * return optionalValidatedOk(data, schema);
 * ```
 */
export function optionalValidatedOk<T extends z.ZodTypeAny>(
  data: unknown,
  schema: T,
  options?: { status?: number }
): NextResponse<ApiResponse<z.infer<T>>> {
  if (shouldValidateResponse()) {
    return validatedOk(data, schema, options);
  }

  // Skip validation but still return data
  return ok(data as z.infer<T>, options?.status);
}
