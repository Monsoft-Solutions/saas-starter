# API Architecture Documentation

Complete documentation for the type-safe API architecture in the SaaS Starter project.

## Documentation Structure

### [Overview](./index.md)

High-level architecture overview explaining the five-layer API architecture and key features.

### [Type-Safe API Client](./type-safe-api-guide.md)

Complete guide to using the type-safe API client with React hooks and SWR:

- Making API requests
- Using hooks for data fetching
- Cache management
- Domain-specific hooks
- Creating new APIs

### [API Handlers & Validation](./handlers-and-validation.md)

Guide to creating validated API route handlers:

- Handler types (public, authenticated, admin, organization)
- Input/output validation
- Query parameters and request body validation
- Error handling
- Best practices with examples

### [Server Actions & Permissions](./server-actions-and-permissions.md)

Complete guide to permission-protected server actions:

- Permission system overview
- Creating server actions with permissions
- Admin context access
- Permission wrappers (single, multiple, super admin)
- Error handling and testing

### [Schemas & Validation](./schemas-and-validation.md)

Comprehensive guide to organizing and creating validation schemas:

- Schema organization and naming conventions
- Request and response schemas
- Validation patterns (strings, numbers, dates, arrays, objects)
- Best practices for type safety
- Preventing data leakage

## Quick Start

### For Frontend Developers

1. Start with [Type-Safe API Client](./type-safe-api-guide.md)
2. Learn about [Schemas & Validation](./schemas-and-validation.md)

### For Backend Developers

1. Read [API Handlers & Validation](./handlers-and-validation.md)
2. Learn about [Server Actions & Permissions](./server-actions-and-permissions.md)

### For Full-Stack Features

1. Review the [Overview](./index.md) for architecture understanding
2. Follow the complete workflow:
   - Define schemas ([Schemas & Validation](./schemas-and-validation.md))
   - Create API handlers ([API Handlers & Validation](./handlers-and-validation.md))
   - Build client hooks ([Type-Safe API Client](./type-safe-api-guide.md))
   - Add permissions ([Server Actions & Permissions](./server-actions-and-permissions.md))

## Key Concepts

### Type Safety

All requests and responses are validated using Zod schemas with automatic TypeScript type inference.

### Permission Control

Server actions and admin API handlers support fine-grained permission checks using middleware wrappers.

### Optimistic Updates

Client hooks support optimistic UI updates with automatic rollback on error for better user experience.

### Cache Management

SWR-powered caching with intelligent invalidation and prefetching capabilities.

## Common Patterns

See each documentation page for detailed examples:

- **GET Requests**: [Type-Safe API Client](./type-safe-api-guide.md#making-api-requests)
- **Mutations with Optimistic Updates**: [Type-Safe API Client](./type-safe-api-guide.md#cache-management)
- **Admin Endpoints**: [API Handlers & Validation](./handlers-and-validation.md#admin-handlers)
- **Permission-Protected Actions**: [Server Actions & Permissions](./server-actions-and-permissions.md#permission-wrappers)
- **Schema Organization**: [Schemas & Validation](./schemas-and-validation.md#schema-organization)

## Related Documentation

- [Authentication & Security](../auth/index.md)
- [Admin Space](../admin-space/overview.md)
- [Logging](../logging.md)

---

**Last Updated:** 2025-10-08
