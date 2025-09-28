import { NextResponse } from 'next/server';

/**
 * Standardized error payload returned by API handlers.
 */
export type ApiError = {
  error: string;
  details?: string;
  code?: string;
};

/**
 * Successful API responses carry data of type `T`; failures return `ApiError`.
 */
export type ApiResponse<T> = T | ApiError;

type InitOrStatus = number | ResponseInit | undefined;

type ErrorOptions = {
  status?: number;
  details?: string;
  code?: string;
  headers?: HeadersInit;
};

function toResponseInit(init?: InitOrStatus): ResponseInit | undefined {
  if (typeof init === 'number') {
    return { status: init };
  }

  return init;
}

/**
 * Wraps a JSON payload in a 200 OK response by default.
 */
export function ok<T>(data: T, init?: InitOrStatus) {
  return NextResponse.json<T>(data, toResponseInit(init));
}

/**
 * Emits a JSON payload with a 201 Created status by default.
 */
export function created<T>(data: T, init?: InitOrStatus) {
  const responseInit = toResponseInit(init) ?? {};
  return NextResponse.json<T>(data, {
    ...responseInit,
    status: responseInit.status ?? 201,
  });
}

/**
 * Returns an empty 204 No Content response.
 */
export function noContent(init?: ResponseInit) {
  return new NextResponse(null, { status: 204, ...init });
}

/**
 * Generates a standardized error response with configurable status and details.
 */
export function error(message: string, options: ErrorOptions = {}) {
  const { status = 500, details, code, headers } = options;
  const payload: ApiError = {
    error: message,
    ...(details ? { details } : {}),
    ...(code ? { code } : {}),
  };

  return NextResponse.json<ApiError>(payload, {
    status,
    ...(headers ? { headers } : {}),
  });
}

/**
 * Runtime guard that narrows unknown JSON payloads to `ApiError`.
 */
export function isApiError(value: unknown): value is ApiError {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return (
    'error' in value && typeof (value as { error: unknown }).error === 'string'
  );
}
