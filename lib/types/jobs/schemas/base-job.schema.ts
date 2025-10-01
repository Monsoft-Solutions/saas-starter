import { z } from 'zod';

/**
 * Common metadata that accompanies every background job. Allows handlers to
 * attribute executions to users or organisations and reason about idempotency.
 */
export const BaseJobMetadataSchema = z.object({
  userId: z.number().optional(),
  organizationId: z.number().optional(),
  createdAt: z.string().datetime(),
  idempotencyKey: z.string().optional(),
});

/**
 * Envelope shared by all job payloads. Provides a consistent structure for
 * the dispatcher, worker wrappers, and database audit records.
 */
export const BaseJobSchema = z.object({
  jobId: z.string().uuid(),
  type: z.string(),
  metadata: BaseJobMetadataSchema,
});

export type BaseJobMetadata = z.infer<typeof BaseJobMetadataSchema>;
export type BaseJob = z.infer<typeof BaseJobSchema>;
