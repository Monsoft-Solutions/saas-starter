/**
 * API error types and error handling utilities
 *
 * @module lib/types/api/api-error.type
 */

import { z } from 'zod';

/**
 * Schema for API error response
 * Matches the error response format from lib/http/response.ts
 */
export const apiErrorResponseSchema = z.object({
  error: z.string(),
  details: z.unknown().optional(),
});

/**
 * API error response type
 */
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;

/**
 * Custom API error class with enhanced error information
 * Thrown when API requests fail
 *
 * @example
 * ```typescript
 * try {
 *   await apiRequest(route, config);
 * } catch (error) {
 *   if (error instanceof ApiError) {
 *     console.error(`API error ${error.status}: ${error.message}`);
 *     console.error('Details:', error.details);
 *   }
 * }
 * ```
 */
export class ApiError extends Error {
  /**
   * HTTP status code of the error response
   */
  public readonly status: number;

  /**
   * Optional error details (validation errors, debug info, etc.)
   */
  public readonly details?: unknown;

  /**
   * Timestamp when the error occurred
   */
  public readonly timestamp: Date;

  /**
   * Request URL that caused the error
   */
  public readonly url?: string;

  /**
   * HTTP method that caused the error
   */
  public readonly method?: string;

  /**
   * Creates a new API error instance
   *
   * @param message - Human-readable error message
   * @param status - HTTP status code
   * @param details - Optional error details
   * @param url - Optional request URL
   * @param method - Optional HTTP method
   */
  constructor(
    message: string,
    status: number,
    details?: unknown,
    url?: string,
    method?: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    this.timestamp = new Date();
    this.url = url;
    this.method = method;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Checks if this is a client error (4xx status code)
   */
  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  /**
   * Checks if this is a server error (5xx status code)
   */
  get isServerError(): boolean {
    return this.status >= 500 && this.status < 600;
  }

  /**
   * Checks if this is an authentication error (401)
   */
  get isAuthError(): boolean {
    return this.status === 401;
  }

  /**
   * Checks if this is a forbidden error (403)
   */
  get isForbiddenError(): boolean {
    return this.status === 403;
  }

  /**
   * Checks if this is a not found error (404)
   */
  get isNotFoundError(): boolean {
    return this.status === 404;
  }

  /**
   * Checks if this is a validation error (400)
   */
  get isValidationError(): boolean {
    return this.status === 400;
  }

  /**
   * Converts error to a plain object for logging
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
      url: this.url,
      method: this.method,
      stack: this.stack,
    };
  }

  /**
   * Creates an ApiError from a Response object
   *
   * @param response - Fetch Response object
   * @param errorData - Optional parsed error data from response
   * @returns ApiError instance
   */
  static async fromResponse(
    response: Response,
    errorData?: unknown
  ): Promise<ApiError> {
    let message = 'Request failed';
    let details: unknown;

    // Try to parse error data if not provided
    if (!errorData) {
      try {
        const json = await response.json();
        errorData = json;
      } catch {
        // If JSON parsing fails, use status text
        message = response.statusText || message;
      }
    }

    // Extract error message and details from error data
    if (errorData && typeof errorData === 'object') {
      const parsed = apiErrorResponseSchema.safeParse(errorData);
      if (parsed.success) {
        message = parsed.data.error;
        details = parsed.data.details;
      } else if ('error' in errorData && typeof errorData.error === 'string') {
        message = errorData.error;
      }
    }

    return new ApiError(
      message,
      response.status,
      details,
      response.url,
      undefined // method not available from Response object
    );
  }

  /**
   * Creates an ApiError for network failures
   *
   * @param url - Request URL
   * @param method - HTTP method
   * @param cause - Original error that caused the network failure
   * @returns ApiError instance
   */
  static networkError(url: string, method: string, cause?: Error): ApiError {
    const error = new ApiError(
      'Network request failed',
      0, // 0 indicates network error
      { cause: cause?.message },
      url,
      method
    );

    if (cause?.stack) {
      error.stack = cause.stack;
    }

    return error;
  }
}

/**
 * Type guard to check if an error is an ApiError
 *
 * @param error - Error to check
 * @returns True if error is an ApiError instance
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
