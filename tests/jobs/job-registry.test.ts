import { describe, it, expect } from 'vitest';
import { JOB_REGISTRY, getJobConfig } from '@/lib/jobs/job-registry';
import { JOB_TYPES } from '@/lib/types/jobs/enums/job-type.enum';
import type { JobType } from '@/lib/types/jobs/enums/job-type.enum';

/**
 * Unit tests for Job Registry
 *
 * Tests cover:
 * - Registry completeness (all job types defined)
 * - Job configuration structure validation
 * - Config retrieval
 * - Error handling for unknown job types
 * - Endpoint format validation
 * - Retry and timeout configuration
 */

describe('Job Registry', () => {
  describe('Registry Completeness', () => {
    it('should have configuration for all job types', () => {
      const jobTypes = Object.values(JOB_TYPES);

      jobTypes.forEach((type) => {
        expect(JOB_REGISTRY[type as JobType]).toBeDefined();
        expect(JOB_REGISTRY[type as JobType].type).toBe(type);
      });
    });

    it('should have all required fields for each job config', () => {
      const jobTypes = Object.values(JOB_TYPES);

      jobTypes.forEach((type) => {
        const config = JOB_REGISTRY[type as JobType];

        expect(config).toMatchObject({
          type: expect.any(String),
          endpoint: expect.any(String),
          retries: expect.any(Number),
          timeout: expect.any(Number),
          description: expect.any(String),
        });
      });
    });
  });

  describe('Email Job Config', () => {
    it('should have valid email job configuration', () => {
      const config = JOB_REGISTRY[JOB_TYPES.SEND_EMAIL];

      expect(config).toEqual({
        type: 'send-email',
        endpoint: '/api/jobs/email',
        retries: 3,
        timeout: 30,
        description: 'Send transactional emails via Resend',
      });
    });

    it('should have API route endpoint', () => {
      const config = JOB_REGISTRY[JOB_TYPES.SEND_EMAIL];

      expect(config.endpoint).toMatch(/^\/api\/jobs\//);
    });

    it('should have reasonable retry count', () => {
      const config = JOB_REGISTRY[JOB_TYPES.SEND_EMAIL];

      expect(config.retries).toBeGreaterThan(0);
      expect(config.retries).toBeLessThanOrEqual(10);
    });

    it('should have reasonable timeout', () => {
      const config = JOB_REGISTRY[JOB_TYPES.SEND_EMAIL];

      expect(config.timeout).toBeGreaterThan(0);
      expect(config.timeout).toBeLessThanOrEqual(600);
    });
  });

  describe('Webhook Job Config', () => {
    it('should have valid webhook job configuration', () => {
      const config = JOB_REGISTRY[JOB_TYPES.PROCESS_WEBHOOK];

      expect(config).toEqual({
        type: 'process-webhook',
        endpoint: '/api/jobs/webhook',
        retries: 5,
        timeout: 60,
        description: 'Process incoming webhooks from third-party services',
      });
    });
  });

  describe('Stripe Webhook Job Config', () => {
    it('should have valid Stripe webhook job configuration', () => {
      const config = JOB_REGISTRY[JOB_TYPES.PROCESS_STRIPE_WEBHOOK];

      expect(config).toEqual({
        type: 'process-stripe-webhook',
        endpoint: '/api/jobs/stripe-webhook',
        retries: 5,
        timeout: 120,
        description: 'Process Stripe webhook events with retries',
      });
    });

    it('should have higher timeout than regular webhook', () => {
      const stripeConfig = JOB_REGISTRY[JOB_TYPES.PROCESS_STRIPE_WEBHOOK];
      const webhookConfig = JOB_REGISTRY[JOB_TYPES.PROCESS_WEBHOOK];

      expect(stripeConfig.timeout).toBeGreaterThan(webhookConfig.timeout);
    });
  });

  describe('Export Data Job Config', () => {
    it('should have valid export data job configuration', () => {
      const config = JOB_REGISTRY[JOB_TYPES.EXPORT_DATA];

      expect(config).toEqual({
        type: 'export-data',
        endpoint: '/api/jobs/export',
        retries: 2,
        timeout: 300,
        description: 'Generate and export data files (CSV, Excel)',
      });
    });

    it('should have long timeout for data export', () => {
      const config = JOB_REGISTRY[JOB_TYPES.EXPORT_DATA];

      expect(config.timeout).toBeGreaterThanOrEqual(300);
    });
  });

  describe('Generate Report Job Config', () => {
    it('should have valid generate report job configuration', () => {
      const config = JOB_REGISTRY[JOB_TYPES.GENERATE_REPORT];

      expect(config).toEqual({
        type: 'generate-report',
        endpoint: '/api/jobs/report',
        retries: 2,
        timeout: 180,
        description: 'Generate analytics and business reports',
      });
    });
  });

  describe('Cleanup Job Config', () => {
    it('should have valid cleanup job configuration', () => {
      const config = JOB_REGISTRY[JOB_TYPES.CLEANUP_OLD_DATA];

      expect(config).toEqual({
        type: 'cleanup-old-data',
        endpoint: '/api/jobs/cleanup',
        retries: 1,
        timeout: 600,
        description: 'Clean up old data and temporary files',
      });
    });

    it('should have lowest retry count', () => {
      const config = JOB_REGISTRY[JOB_TYPES.CLEANUP_OLD_DATA];

      expect(config.retries).toBe(1);
    });

    it('should have longest timeout', () => {
      const config = JOB_REGISTRY[JOB_TYPES.CLEANUP_OLD_DATA];
      const allTimeouts = Object.values(JOB_REGISTRY).map((c) => c.timeout);

      expect(config.timeout).toBe(Math.max(...allTimeouts));
    });
  });

  describe('getJobConfig', () => {
    it('should retrieve config for valid job type', () => {
      const config = getJobConfig(JOB_TYPES.SEND_EMAIL);

      expect(config).toEqual(JOB_REGISTRY[JOB_TYPES.SEND_EMAIL]);
    });

    it('should retrieve config for all job types', () => {
      const jobTypes = Object.values(JOB_TYPES);

      jobTypes.forEach((type) => {
        const config = getJobConfig(type as JobType);
        expect(config).toBeDefined();
        expect(config.type).toBe(type);
      });
    });

    it('should throw error for unknown job type', () => {
      const unknownType = 'unknown-job-type' as JobType;

      expect(() => getJobConfig(unknownType)).toThrow(
        'Unknown job type: unknown-job-type'
      );
    });

    it('should return same config instance from registry', () => {
      const config1 = getJobConfig(JOB_TYPES.SEND_EMAIL);
      const config2 = JOB_REGISTRY[JOB_TYPES.SEND_EMAIL];

      expect(config1).toBe(config2);
    });
  });

  describe('Endpoint Format Validation', () => {
    it('should have consistent endpoint format for all jobs', () => {
      const jobTypes = Object.values(JOB_TYPES);

      jobTypes.forEach((type) => {
        const config = JOB_REGISTRY[type as JobType];

        // All endpoints should start with /api/jobs/
        expect(config.endpoint).toMatch(/^\/api\/jobs\//);

        // Endpoints should not have trailing slashes
        expect(config.endpoint).not.toMatch(/\/$/);

        // Endpoints should be kebab-case
        expect(config.endpoint).toMatch(/^\/api\/jobs\/[a-z-]+$/);
      });
    });

    it('should have unique endpoints for each job type', () => {
      const endpoints = Object.values(JOB_REGISTRY).map((c) => c.endpoint);
      const uniqueEndpoints = new Set(endpoints);

      expect(uniqueEndpoints.size).toBe(endpoints.length);
    });
  });

  describe('Retry Configuration', () => {
    it('should have positive retry count for all jobs', () => {
      const jobTypes = Object.values(JOB_TYPES);

      jobTypes.forEach((type) => {
        const config = JOB_REGISTRY[type as JobType];

        expect(config.retries).toBeGreaterThan(0);
      });
    });

    it('should have higher retries for critical jobs', () => {
      const webhookRetries = JOB_REGISTRY[JOB_TYPES.PROCESS_WEBHOOK].retries;
      const stripeRetries =
        JOB_REGISTRY[JOB_TYPES.PROCESS_STRIPE_WEBHOOK].retries;
      const cleanupRetries = JOB_REGISTRY[JOB_TYPES.CLEANUP_OLD_DATA].retries;

      // Webhooks should have higher retries than cleanup
      expect(webhookRetries).toBeGreaterThan(cleanupRetries);
      expect(stripeRetries).toBeGreaterThan(cleanupRetries);
    });
  });

  describe('Timeout Configuration', () => {
    it('should have positive timeout for all jobs', () => {
      const jobTypes = Object.values(JOB_TYPES);

      jobTypes.forEach((type) => {
        const config = JOB_REGISTRY[type as JobType];

        expect(config.timeout).toBeGreaterThan(0);
      });
    });

    it('should have longer timeouts for heavy jobs', () => {
      const emailTimeout = JOB_REGISTRY[JOB_TYPES.SEND_EMAIL].timeout;
      const exportTimeout = JOB_REGISTRY[JOB_TYPES.EXPORT_DATA].timeout;
      const cleanupTimeout = JOB_REGISTRY[JOB_TYPES.CLEANUP_OLD_DATA].timeout;

      // Export and cleanup should have longer timeouts than email
      expect(exportTimeout).toBeGreaterThan(emailTimeout);
      expect(cleanupTimeout).toBeGreaterThan(emailTimeout);
    });
  });

  describe('Description Validation', () => {
    it('should have non-empty description for all jobs', () => {
      const jobTypes = Object.values(JOB_TYPES);

      jobTypes.forEach((type) => {
        const config = JOB_REGISTRY[type as JobType];

        expect(config.description).toBeTruthy();
        expect(config.description.length).toBeGreaterThan(10);
      });
    });

    it('should have descriptive descriptions', () => {
      const jobTypes = Object.values(JOB_TYPES);

      jobTypes.forEach((type) => {
        const config = JOB_REGISTRY[type as JobType];

        // Description should contain action words
        const hasActionWord = /send|process|generate|export|clean|create/i.test(
          config.description
        );
        expect(hasActionWord).toBe(true);
      });
    });
  });

  describe('Type Safety', () => {
    it('should have type field matching job type constant', () => {
      const jobTypes = Object.values(JOB_TYPES);

      jobTypes.forEach((type) => {
        const config = JOB_REGISTRY[type as JobType];

        expect(config.type).toBe(type);
      });
    });

    it('should maintain type consistency across registry', () => {
      Object.entries(JOB_REGISTRY).forEach(([key, config]) => {
        expect(key).toBe(config.type);
      });
    });
  });

  describe('Registry Immutability', () => {
    it('should return same reference from registry', () => {
      // Note: In JavaScript, objects are mutable by reference
      // TypeScript helps prevent accidental mutations through type safety
      const config1 = getJobConfig(JOB_TYPES.SEND_EMAIL);
      const config2 = getJobConfig(JOB_TYPES.SEND_EMAIL);
      const directAccess = JOB_REGISTRY[JOB_TYPES.SEND_EMAIL];

      // All should reference the same object
      expect(config1).toBe(config2);
      expect(config1).toBe(directAccess);

      // Verify the values are correct
      expect(config1.retries).toBe(3);
      expect(config1.endpoint).toBe('/api/jobs/email');
    });
  });

  describe('Integration with Job Types Enum', () => {
    it('should have exactly one config per job type enum', () => {
      const enumCount = Object.keys(JOB_TYPES).length;
      const registryCount = Object.keys(JOB_REGISTRY).length;

      expect(registryCount).toBe(enumCount);
    });

    it('should have matching keys between enum and registry', () => {
      const enumValues = Object.values(JOB_TYPES);
      const registryKeys = Object.keys(JOB_REGISTRY);

      enumValues.forEach((value) => {
        expect(registryKeys).toContain(value);
      });
    });
  });
});
