/**
 * Shared HTTP client utilities for talking to the server-side `ApiResponse<T>` contract.
 * Exposes typed helpers that raise rich errors and play nicely with React data libraries.
 */
import { isApiError } from '@/lib/http/response';

/**
 * Error raised when the API client encounters a non-successful response.
 */
export class ApiClientError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: string;

  constructor(
    message: string,
    options: { status: number; code?: string; details?: string }
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
  }
}

/**
 * Runtime guard that narrows unknown errors to `ApiClientError`.
 */
export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}

/**
 * Merges caller-provided headers with sensible defaults for JSON APIs.
 */
function buildHeaders(headers?: HeadersInit): Headers {
  const merged = new Headers(headers ?? {});

  if (!merged.has('Accept')) {
    merged.set('Accept', 'application/json');
  }

  return merged;
}

/**
 * Attempts to deserialize the response payload, handling empty and JSON bodies gracefully.
 */
async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  if (!text.length) {
    return null;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text);
    } catch {
      // Fall through to return the raw text below.
    }
  }

  return text;
}

/**
 * Normalizes a failed fetch response into an `ApiClientError` with contextual metadata.
 */
function createErrorFromResponse(
  response: Response,
  payload: unknown
): ApiClientError {
  if (isApiError(payload)) {
    return new ApiClientError(payload.error, {
      status: response.status,
      code: payload.code,
      details: payload.details,
    });
  }

  const message =
    typeof payload === 'string' && payload.length > 0
      ? payload
      : response.statusText || 'Request failed';

  return new ApiClientError(message, {
    status: response.status,
    details: typeof payload === 'string' ? payload : undefined,
  });
}

/**
 * Performs a fetch call that understands the server's `ApiResponse<T>` format.
 */
export async function fetchApi<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T | undefined> {
  const response = await fetch(input, {
    ...init,
    credentials: init?.credentials ?? 'include',
    headers: buildHeaders(init?.headers),
  });

  const payload = await parseBody(response);

  if (!response.ok) {
    throw createErrorFromResponse(response, payload);
  }

  if (payload === null) {
    return undefined;
  }

  if (isApiError(payload)) {
    throw new ApiClientError(payload.error, {
      status: response.status,
      code: payload.code,
      details: payload.details,
    });
  }

  return payload as T;
}

/**
 * Generates a reusable fetcher suitable for SWR/React Query hooks.
 */
export function createApiFetcher<T>(init?: RequestInit) {
  return async (input: string | URL): Promise<T | undefined> =>
    fetchApi<T>(input, init);
}
