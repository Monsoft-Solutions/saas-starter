import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  BaseJobMetadataSchema,
  BaseJobSchema,
} from '@/lib/types/jobs/schemas/base-job.schema';
import {
  SendEmailJobPayloadSchema,
  SendEmailJobSchema,
} from '@/lib/types/jobs/schemas/send-email-job.schema';
import {
  StripeWebhookJobPayloadSchema,
  StripeWebhookJobSchema,
} from '@/lib/types/jobs/schemas/stripe-webhook-job.schema';
import { JOB_TYPES } from '@/lib/types/jobs/enums/job-type.enum';

/**
 * Unit tests for Job Schemas
 *
 * Tests cover:
 * - Base job schema validation
 * - Base job metadata validation
 * - Email job schema validation
 * - Stripe webhook job schema validation
 * - Schema field requirements
 * - Type validation and constraints
 * - Invalid data rejection
 */

describe('Job Schemas', () => {
  describe('BaseJobMetadataSchema', () => {
    it('should validate valid metadata', () => {
      const validMetadata = {
        userId: 1,
        organizationId: 2,
        createdAt: new Date().toISOString(),
        idempotencyKey: 'unique-key-123',
      };

      const result = BaseJobMetadataSchema.safeParse(validMetadata);

      expect(result.success).toBe(true);
    });

    it('should allow optional userId', () => {
      const metadata = {
        createdAt: new Date().toISOString(),
      };

      const result = BaseJobMetadataSchema.safeParse(metadata);

      expect(result.success).toBe(true);
    });

    it('should allow optional organizationId', () => {
      const metadata = {
        userId: 1,
        createdAt: new Date().toISOString(),
      };

      const result = BaseJobMetadataSchema.safeParse(metadata);

      expect(result.success).toBe(true);
    });

    it('should allow optional idempotencyKey', () => {
      const metadata = {
        userId: 1,
        createdAt: new Date().toISOString(),
      };

      const result = BaseJobMetadataSchema.safeParse(metadata);

      expect(result.success).toBe(true);
    });

    it('should require createdAt', () => {
      const metadata = {
        userId: 1,
      };

      const result = BaseJobMetadataSchema.safeParse(metadata);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('createdAt');
      }
    });

    it('should validate createdAt as datetime', () => {
      const metadata = {
        createdAt: 'invalid-date',
      };

      const result = BaseJobMetadataSchema.safeParse(metadata);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('createdAt');
      }
    });

    it('should reject non-numeric userId', () => {
      const metadata = {
        userId: 'not-a-number',
        createdAt: new Date().toISOString(),
      };

      const result = BaseJobMetadataSchema.safeParse(metadata);

      expect(result.success).toBe(false);
    });

    it('should reject non-numeric organizationId', () => {
      const metadata = {
        organizationId: 'not-a-number',
        createdAt: new Date().toISOString(),
      };

      const result = BaseJobMetadataSchema.safeParse(metadata);

      expect(result.success).toBe(false);
    });
  });

  describe('BaseJobSchema', () => {
    it('should validate valid base job', () => {
      const validJob = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'send-email',
        metadata: {
          userId: 1,
          createdAt: new Date().toISOString(),
        },
      };

      const result = BaseJobSchema.safeParse(validJob);

      expect(result.success).toBe(true);
    });

    it('should require jobId', () => {
      const job = {
        type: 'send-email',
        metadata: {
          createdAt: new Date().toISOString(),
        },
      };

      const result = BaseJobSchema.safeParse(job);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('jobId');
      }
    });

    it('should validate jobId as UUID', () => {
      const job = {
        jobId: 'not-a-uuid',
        type: 'send-email',
        metadata: {
          createdAt: new Date().toISOString(),
        },
      };

      const result = BaseJobSchema.safeParse(job);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('jobId');
      }
    });

    it('should require type', () => {
      const job = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        metadata: {
          createdAt: new Date().toISOString(),
        },
      };

      const result = BaseJobSchema.safeParse(job);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('type');
      }
    });

    it('should require metadata', () => {
      const job = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'send-email',
      };

      const result = BaseJobSchema.safeParse(job);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('metadata');
      }
    });

    it('should validate metadata structure', () => {
      const job = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'send-email',
        metadata: {
          invalidField: 'value',
        },
      };

      const result = BaseJobSchema.safeParse(job);

      expect(result.success).toBe(false);
    });
  });

  describe('SendEmailJobPayloadSchema', () => {
    it('should validate valid email job payload', () => {
      const payload = {
        template: 'welcome',
        to: 'test@example.com',
        data: {
          recipientName: 'John Doe',
          dashboardUrl: '/app',
        },
      };

      const result = SendEmailJobPayloadSchema.safeParse(payload);

      expect(result.success).toBe(true);
    });

    it('should validate all supported email templates', () => {
      const templates = [
        'welcome',
        'passwordReset',
        'passwordChanged',
        'emailChange',
        'teamInvitation',
        'subscriptionCreated',
        'paymentFailed',
      ];

      templates.forEach((template) => {
        const payload = {
          template,
          to: 'test@example.com',
          data: {},
        };

        const result = SendEmailJobPayloadSchema.safeParse(payload);

        expect(result.success).toBe(true);
      });
    });

    it('should reject unsupported email template', () => {
      const payload = {
        template: 'unsupported-template',
        to: 'test@example.com',
        data: {},
      };

      const result = SendEmailJobPayloadSchema.safeParse(payload);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('template');
      }
    });

    it('should validate email format for to field', () => {
      const payload = {
        template: 'welcome',
        to: 'invalid-email',
        data: {},
      };

      const result = SendEmailJobPayloadSchema.safeParse(payload);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('to');
      }
    });

    it('should require to field', () => {
      const payload = {
        template: 'welcome',
        data: {},
      };

      const result = SendEmailJobPayloadSchema.safeParse(payload);

      expect(result.success).toBe(false);
    });

    it('should require template field', () => {
      const payload = {
        to: 'test@example.com',
        data: {},
      };

      const result = SendEmailJobPayloadSchema.safeParse(payload);

      expect(result.success).toBe(false);
    });

    it('should require data field', () => {
      const payload = {
        template: 'welcome',
        to: 'test@example.com',
      };

      const result = SendEmailJobPayloadSchema.safeParse(payload);

      expect(result.success).toBe(false);
    });

    it('should accept empty data object', () => {
      const payload = {
        template: 'welcome',
        to: 'test@example.com',
        data: {},
      };

      const result = SendEmailJobPayloadSchema.safeParse(payload);

      expect(result.success).toBe(true);
    });

    it('should accept complex data objects', () => {
      const payload = {
        template: 'welcome',
        to: 'test@example.com',
        data: {
          nested: {
            object: {
              value: 123,
            },
          },
          array: [1, 2, 3],
          boolean: true,
        },
      };

      const result = SendEmailJobPayloadSchema.safeParse(payload);

      expect(result.success).toBe(true);
    });
  });

  describe('SendEmailJobSchema', () => {
    it('should validate complete email job', () => {
      const job = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        type: JOB_TYPES.SEND_EMAIL,
        payload: {
          template: 'welcome',
          to: 'test@example.com',
          data: {
            recipientName: 'John Doe',
          },
        },
        metadata: {
          userId: 1,
          createdAt: new Date().toISOString(),
        },
      };

      const result = SendEmailJobSchema.safeParse(job);

      expect(result.success).toBe(true);
    });

    it('should enforce type literal', () => {
      const job = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'wrong-type',
        payload: {
          template: 'welcome',
          to: 'test@example.com',
          data: {},
        },
        metadata: {
          createdAt: new Date().toISOString(),
        },
      };

      const result = SendEmailJobSchema.safeParse(job);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('type');
      }
    });

    it('should validate payload structure', () => {
      const job = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        type: JOB_TYPES.SEND_EMAIL,
        payload: {
          invalid: 'payload',
        },
        metadata: {
          createdAt: new Date().toISOString(),
        },
      };

      const result = SendEmailJobSchema.safeParse(job);

      expect(result.success).toBe(false);
    });
  });

  describe('StripeWebhookJobPayloadSchema', () => {
    it('should validate valid Stripe webhook payload', () => {
      const payload = {
        eventType: 'checkout.session.completed',
        eventId: 'evt_123',
        eventData: {
          id: 'cs_123',
          customer: 'cus_123',
        },
        customerId: 'cus_123',
        ipAddress: '192.168.1.1',
      };

      const result = StripeWebhookJobPayloadSchema.safeParse(payload);

      expect(result.success).toBe(true);
    });

    it('should require eventType', () => {
      const payload = {
        eventId: 'evt_123',
        eventData: {},
      };

      const result = StripeWebhookJobPayloadSchema.safeParse(payload);

      expect(result.success).toBe(false);
    });

    it('should require eventId', () => {
      const payload = {
        eventType: 'checkout.session.completed',
        eventData: {},
      };

      const result = StripeWebhookJobPayloadSchema.safeParse(payload);

      expect(result.success).toBe(false);
    });

    it('should require eventData', () => {
      const payload = {
        eventType: 'checkout.session.completed',
        eventId: 'evt_123',
      };

      const result = StripeWebhookJobPayloadSchema.safeParse(payload);

      expect(result.success).toBe(false);
    });

    it('should allow optional customerId', () => {
      const payload = {
        eventType: 'checkout.session.completed',
        eventId: 'evt_123',
        eventData: {},
      };

      const result = StripeWebhookJobPayloadSchema.safeParse(payload);

      expect(result.success).toBe(true);
    });

    it('should allow optional subscriptionId', () => {
      const payload = {
        eventType: 'checkout.session.completed',
        eventId: 'evt_123',
        eventData: {},
      };

      const result = StripeWebhookJobPayloadSchema.safeParse(payload);

      expect(result.success).toBe(true);
    });

    it('should allow optional ipAddress', () => {
      const payload = {
        eventType: 'checkout.session.completed',
        eventId: 'evt_123',
        eventData: {},
      };

      const result = StripeWebhookJobPayloadSchema.safeParse(payload);

      expect(result.success).toBe(true);
    });

    it('should accept complex eventData', () => {
      const payload = {
        eventType: 'checkout.session.completed',
        eventId: 'evt_123',
        eventData: {
          id: 'cs_123',
          customer: 'cus_123',
          subscription: 'sub_123',
          amount_total: 5000,
          metadata: {
            userId: '1',
          },
          nested: {
            deeply: {
              nested: {
                value: true,
              },
            },
          },
        },
      };

      const result = StripeWebhookJobPayloadSchema.safeParse(payload);

      expect(result.success).toBe(true);
    });
  });

  describe('StripeWebhookJobSchema', () => {
    it('should validate complete Stripe webhook job', () => {
      const job = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        type: JOB_TYPES.PROCESS_STRIPE_WEBHOOK,
        payload: {
          eventType: 'checkout.session.completed',
          eventId: 'evt_123',
          eventData: {
            id: 'cs_123',
          },
        },
        metadata: {
          createdAt: new Date().toISOString(),
          idempotencyKey: 'evt_123',
        },
      };

      const result = StripeWebhookJobSchema.safeParse(job);

      expect(result.success).toBe(true);
    });

    it('should enforce type literal', () => {
      const job = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'wrong-type',
        payload: {
          eventType: 'checkout.session.completed',
          eventId: 'evt_123',
          eventData: {},
        },
        metadata: {
          createdAt: new Date().toISOString(),
        },
      };

      const result = StripeWebhookJobSchema.safeParse(job);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('type');
      }
    });

    it('should validate payload structure', () => {
      const job = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        type: JOB_TYPES.PROCESS_STRIPE_WEBHOOK,
        payload: {
          invalid: 'payload',
        },
        metadata: {
          createdAt: new Date().toISOString(),
        },
      };

      const result = StripeWebhookJobSchema.safeParse(job);

      expect(result.success).toBe(false);
    });

    it('should support idempotency key in metadata', () => {
      const job = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        type: JOB_TYPES.PROCESS_STRIPE_WEBHOOK,
        payload: {
          eventType: 'checkout.session.completed',
          eventId: 'evt_123',
          eventData: {},
        },
        metadata: {
          createdAt: new Date().toISOString(),
          idempotencyKey: 'evt_123',
        },
      };

      const result = StripeWebhookJobSchema.safeParse(job);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.metadata.idempotencyKey).toBe('evt_123');
      }
    });
  });

  describe('Schema Extensibility', () => {
    it('should allow BaseJobSchema to be extended', () => {
      const CustomJobSchema = BaseJobSchema.extend({
        type: z.literal('custom-job'),
        payload: z.object({
          customField: z.string(),
        }),
      });

      const job = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'custom-job',
        payload: {
          customField: 'value',
        },
        metadata: {
          createdAt: new Date().toISOString(),
        },
      };

      const result = CustomJobSchema.safeParse(job);

      expect(result.success).toBe(true);
    });
  });

  describe('Type Inference', () => {
    it('should infer correct types from schemas', () => {
      const validJob = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        type: JOB_TYPES.SEND_EMAIL,
        payload: {
          template: 'welcome' as const,
          to: 'test@example.com',
          data: {
            recipientName: 'John',
          },
        },
        metadata: {
          userId: 1,
          createdAt: new Date().toISOString(),
        },
      };

      const result = SendEmailJobSchema.parse(validJob);

      // TypeScript should infer correct types
      expect(result.jobId).toBeTruthy();
      expect(result.type).toBe(JOB_TYPES.SEND_EMAIL);
      expect(result.payload.template).toBe('welcome');
      expect(result.payload.to).toBe('test@example.com');
      expect(result.metadata.userId).toBe(1);
    });
  });
});
