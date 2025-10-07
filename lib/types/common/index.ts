/**
 * Common types and schemas shared across the application.
 * Centralized exports for clean imports.
 */

// Pagination schemas
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
