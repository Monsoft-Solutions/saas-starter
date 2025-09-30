import { z } from 'zod';

/**
 * Client Error Payload Schema
 *
 * Validates error data sent from client-side to the server logging API.
 * Enforces string length limits and proper structure to prevent abuse.
 */

const errorObjectSchema = z.object({
  message: z.string().min(1).max(2000),
  stack: z.string().max(10000).optional(),
  digest: z.string().max(500).optional(),
  name: z.string().min(1).max(200),
});

export const clientErrorPayloadSchema = z.object({
  message: z.string().min(1).max(2000),
  error: errorObjectSchema.optional(),
  timestamp: z.string().datetime(),
  userAgent: z.string().max(1000).optional(),
  url: z.string().url().max(2000).optional(),
});

export type ClientErrorPayload = z.infer<typeof clientErrorPayloadSchema>;
