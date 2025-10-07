import { z } from 'zod';

/**
 * Zod transform to trim and sanitize strings.
 * Removes leading/trailing whitespace and collapses multiple spaces.
 *
 * @param options - Optional validation constraints
 * @returns Zod schema with sanitization transforms
 *
 * @example
 * ```typescript
 * const nameSchema = z.object({
 *   firstName: sanitizedString({ min: 1, max: 50 }),
 *   lastName: sanitizedString({ min: 1, max: 50 }),
 * });
 * ```
 */
export function sanitizedString(options?: {
  min?: number;
  max?: number;
  pattern?: RegExp;
}) {
  let schema = z.string().trim();

  if (options?.min !== undefined) {
    schema = schema.min(options.min);
  }

  if (options?.max !== undefined) {
    schema = schema.max(options.max);
  }

  if (options?.pattern) {
    schema = schema.regex(options.pattern);
  }

  return schema.transform((val) => {
    // Remove multiple consecutive spaces
    return val.replace(/\s+/g, ' ');
  });
}

/**
 * Email sanitization and validation.
 * Trims whitespace, converts to lowercase, and validates format.
 *
 * @example
 * ```typescript
 * const loginSchema = z.object({
 *   email: sanitizedEmail,
 *   password: z.string().min(8),
 * });
 * ```
 */
export const sanitizedEmail = z
  .string()
  .trim()
  .toLowerCase()
  .email()
  .transform((email) => {
    // Remove all whitespace (even internal)
    return email.replace(/\s+/g, '');
  });

/**
 * URL sanitization and validation.
 * Trims whitespace and validates URL format.
 *
 * @example
 * ```typescript
 * const websiteSchema = z.object({
 *   website: sanitizedUrl,
 * });
 * ```
 */
export const sanitizedUrl = z.string().trim().url();

/**
 * Slug sanitization.
 * Converts string to lowercase, removes special characters, and replaces spaces with hyphens.
 *
 * @example
 * ```typescript
 * const blogPostSchema = z.object({
 *   title: sanitizedString({ min: 1, max: 200 }),
 *   slug: sanitizedSlug,
 * });
 * ```
 */
export const sanitizedSlug = z
  .string()
  .trim()
  .toLowerCase()
  .transform((val) => {
    return val
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Collapse multiple hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  });

/**
 * Phone number sanitization.
 * Removes all non-numeric characters except + at the start.
 *
 * @example
 * ```typescript
 * const contactSchema = z.object({
 *   phone: sanitizedPhone,
 * });
 * ```
 */
export const sanitizedPhone = z.string().transform((val) => {
  const trimmed = val.trim();
  // Keep leading + for international numbers, remove all other non-digits
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : digits;
});

/**
 * HTML content sanitization placeholder.
 * In production, this should use a library like DOMPurify (client) or sanitize-html (server).
 *
 * @example
 * ```typescript
 * const blogPostSchema = z.object({
 *   content: sanitizedHtml,
 * });
 * ```
 */
export const sanitizedHtml = z.string().transform((html) => {
  // TODO: Integrate sanitize-html library for production use
  // For now, just trim whitespace
  // In production: return sanitizeHtml(html, allowedTags, allowedAttributes);
  return html.trim();
});

/**
 * Numeric string coercion with optional range validation.
 * Converts string to number and validates range.
 *
 * @param options - Optional min/max constraints
 * @returns Zod schema that coerces string to number
 *
 * @example
 * ```typescript
 * const paginationSchema = z.object({
 *   page: sanitizedNumber({ min: 1 }),
 *   limit: sanitizedNumber({ min: 1, max: 100 }),
 * });
 * ```
 */
export function sanitizedNumber(options?: { min?: number; max?: number }) {
  let schema = z.coerce.number();

  if (options?.min !== undefined) {
    schema = schema.min(options.min);
  }

  if (options?.max !== undefined) {
    schema = schema.max(options.max);
  }

  return schema;
}

/**
 * Boolean coercion from string.
 * Accepts 'true', '1', 'yes' as true, everything else as false.
 *
 * @example
 * ```typescript
 * const settingsSchema = z.object({
 *   emailNotifications: sanitizedBoolean,
 *   darkMode: sanitizedBoolean,
 * });
 * ```
 */
export const sanitizedBoolean = z
  .string()
  .transform((val) => {
    const normalized = val.toLowerCase().trim();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
  })
  .pipe(z.boolean());

/**
 * Date string sanitization and parsing.
 * Validates ISO 8601 date format.
 *
 * @example
 * ```typescript
 * const eventSchema = z.object({
 *   startDate: sanitizedDate,
 *   endDate: sanitizedDate,
 * });
 * ```
 */
export const sanitizedDate = z
  .string()
  .datetime()
  .transform((val) => new Date(val));

/**
 * Array of strings with individual string sanitization.
 *
 * @param options - Optional string validation options
 * @returns Zod schema for array of sanitized strings
 *
 * @example
 * ```typescript
 * const tagsSchema = z.object({
 *   tags: sanitizedStringArray({ min: 1, max: 50 }),
 * });
 * ```
 */
export function sanitizedStringArray(options?: {
  min?: number;
  max?: number;
  itemMin?: number;
  itemMax?: number;
}) {
  const itemSchema = sanitizedString({
    min: options?.itemMin,
    max: options?.itemMax,
  });

  let schema = z.array(itemSchema);

  if (options?.min !== undefined) {
    schema = schema.min(options.min);
  }

  if (options?.max !== undefined) {
    schema = schema.max(options.max);
  }

  return schema;
}
