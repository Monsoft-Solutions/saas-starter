/**
 * Common types and schemas shared across the application.
 * Centralized exports for clean imports.
 */

// Pagination request schemas
export {
  paginationRequestSchema,
  type PaginationRequest,
  searchablePaginationRequestSchema,
  type SearchablePaginationRequest,
} from './pagination-request.schema';

// Pagination response schemas
export {
  paginationResponseSchema,
  type PaginationResponse,
} from './pagination-response.schema';

// Success response schemas
export {
  successResponseSchema,
  type SuccessResponse,
  createSuccessResponseSchema,
} from './success-response.schema';
