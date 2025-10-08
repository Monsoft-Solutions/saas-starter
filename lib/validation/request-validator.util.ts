import { z } from 'zod';
import { env } from '../env';

/**
 * Result of a validation operation.
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: unknown };

/**
 * Validates request data with consistent error formatting.
 *
 * @param data - The data to validate
 * @param schema - The Zod schema to validate against
 * @returns Validation result with typed data or error information
 *
 * @example
 * ```typescript
 * const result = validateRequest(body, createUserSchema);
 * if (!result.success) {
 *   return error(result.error, { status: 400, details: result.details });
 * }
 * const { name, email } = result.data;
 * ```
 */
export function validateRequest<T extends z.ZodTypeAny>(
  data: unknown,
  schema: T
): ValidationResult<z.infer<T>> {
  const result = schema.safeParse(data);

  if (!result.success) {
    const firstError = result.error.errors[0];
    return {
      success: false,
      error: firstError?.message ?? 'Validation failed',
      details:
        env.NODE_ENV === 'development' || env.NODE_ENV === 'test'
          ? result.error.format()
          : undefined,
    };
  }

  return { success: true, data: result.data };
}

/**
 * Validates query parameters from a URL search params object.
 * Properly handles multi-value query parameters (e.g., ?tag=a&tag=b).
 *
 * @param searchParams - The URL search params to validate
 * @param schema - The Zod schema to validate against
 * @returns Validation result with typed data or error information
 *
 * @example
 * ```typescript
 * const querySchema = z.object({
 *   page: z.coerce.number().min(1).default(1),
 *   limit: z.coerce.number().min(1).max(100).default(20),
 *   tags: z.array(z.string()).optional(), // Multi-value support
 * });
 *
 * const result = validateQueryParams(request.nextUrl.searchParams, querySchema);
 * if (!result.success) {
 *   return error(result.error, { status: 400 });
 * }
 * ```
 */
export function validateQueryParams<T extends z.ZodTypeAny>(
  searchParams: URLSearchParams,
  schema: T
): ValidationResult<z.infer<T>> {
  // Get all unique parameter keys
  const keys = Array.from(new Set(Array.from(searchParams.keys())));

  // Build params object with proper multi-value handling
  const params = keys.reduce<Record<string, string | string[]>>((acc, key) => {
    const all = searchParams.getAll(key);
    // If multiple values exist, return array; otherwise return single value
    acc[key] = all.length > 1 ? all : (all[0] ?? '');
    return acc;
  }, {});

  return validateRequest(params, schema);
}

/**
 * Validates route parameters.
 *
 * @param params - The route parameters to validate
 * @param schema - The Zod schema to validate against
 * @returns Validation result with typed data or error information
 *
 * @example
 * ```typescript
 * const paramsSchema = z.object({
 *   id: z.string().uuid(),
 * });
 *
 * const result = validateRouteParams(route.params, paramsSchema);
 * if (!result.success) {
 *   return error(result.error, { status: 400 });
 * }
 * ```
 */
export function validateRouteParams<T extends z.ZodTypeAny>(
  params: Record<string, string | string[]>,
  schema: T
): ValidationResult<z.infer<T>> {
  return validateRequest(params, schema);
}

/**
 * Validates form data from a FormData object.
 *
 * @param formData - The FormData to validate
 * @param schema - The Zod schema to validate against
 * @returns Validation result with typed data or error information
 *
 * @example
 * ```typescript
 * const formSchema = z.object({
 *   name: z.string().min(1),
 *   email: z.string().email(),
 * });
 *
 * const result = validateFormData(formData, formSchema);
 * if (!result.success) {
 *   return { error: result.error };
 * }
 * ```
 */
export function validateFormData<T extends z.ZodTypeAny>(
  formData: FormData,
  schema: T
): ValidationResult<z.infer<T>> {
  const data = Object.fromEntries(formData);
  return validateRequest(data, schema);
}
