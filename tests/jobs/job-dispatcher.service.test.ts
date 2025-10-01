import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock server-only module for testing
vi.mock('server-only', () => ({}));

/**
 * Unit tests for Job Dispatcher Service
 *
 * Tests cover:
 * - Job enqueueing with QStash
 * - Job execution record creation
 * - Job scheduling with CRON
 * - Error handling and logging
 * - Configuration retrieval
 * - URL normalization
 */

describe('Job Dispatcher Service', () => {
  let JobDispatcher: typeof import('@/lib/jobs/job-dispatcher.service').JobDispatcher;
  let mockQStash: any;
  let mockCreateJobExecution: any;
  let mockGetJobConfig: any;
  let mockLogger: any;

  beforeEach(async () => {
    vi.resetModules();

    // Mock QStash client
    mockQStash = {
      publishJSON: vi.fn().mockResolvedValue({ messageId: 'msg_123' }),
      schedules: {
        create: vi.fn().mockResolvedValue({ scheduleId: 'sched_123' }),
      },
    };

    vi.doMock('@/lib/jobs/qstash.client', () => ({
      qstash: mockQStash,
    }));

    // Mock database queries
    mockCreateJobExecution = vi.fn().mockResolvedValue({
      id: 1,
      jobId: 'test-job-id',
      jobType: 'send-email',
      status: 'pending',
    });

    vi.doMock('@/lib/db/queries', () => ({
      createJobExecution: mockCreateJobExecution,
    }));

    // Mock job registry - returns different configs based on job type
    mockGetJobConfig = vi.fn().mockImplementation((type: string) => {
      const configs: Record<string, any> = {
        'send-email': {
          type: 'send-email',
          endpoint: '/api/jobs/email',
          retries: 3,
          timeout: 30,
          description: 'Send transactional emails',
        },
        'cleanup-old-data': {
          type: 'cleanup-old-data',
          endpoint: '/api/jobs/cleanup',
          retries: 1,
          timeout: 600,
          description: 'Clean up old data',
        },
        'process-webhook': {
          type: 'process-webhook',
          endpoint: '/api/jobs/webhook',
          retries: 5,
          timeout: 60,
          description: 'Process webhooks',
        },
      };
      return configs[type] || configs['send-email'];
    });

    vi.doMock('@/lib/jobs/job-registry', () => ({
      getJobConfig: mockGetJobConfig,
    }));

    // Mock logger
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    };

    vi.doMock('@/lib/logger/logger.service', () => ({
      default: mockLogger,
    }));

    // Mock env
    vi.doMock('@/lib/env', () => ({
      env: {
        BASE_URL: 'https://example.com',
      },
    }));

    // Import after mocking
    const module = await import('@/lib/jobs/job-dispatcher.service');
    JobDispatcher = module.JobDispatcher;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetAllMocks();
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('enqueue', () => {
    it('should enqueue a job successfully', async () => {
      const dispatcher = new JobDispatcher();

      const jobId = await dispatcher.enqueue(
        'send-email' as any,
        { to: 'test@example.com', template: 'welcome' },
        { userId: 1 }
      );

      expect(jobId).toBeTruthy();
      expect(mockCreateJobExecution).toHaveBeenCalledWith(
        expect.objectContaining({
          jobId: expect.any(String),
          jobType: 'send-email',
          status: 'pending',
          userId: 1,
        })
      );
      expect(mockQStash.publishJSON).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://example.com/api/jobs/email',
          body: expect.objectContaining({
            type: 'send-email',
            payload: { to: 'test@example.com', template: 'welcome' },
          }),
          retries: 3,
        })
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        '[jobs] Enqueueing job',
        expect.any(Object)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        '[jobs] Job enqueued successfully',
        expect.any(Object)
      );
    });

    it('should include metadata in job payload', async () => {
      const dispatcher = new JobDispatcher();

      await dispatcher.enqueue(
        'send-email' as any,
        { to: 'test@example.com' },
        {
          userId: 1,
          organizationId: 2,
          idempotencyKey: 'unique-key',
        }
      );

      expect(mockQStash.publishJSON).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            metadata: expect.objectContaining({
              userId: 1,
              organizationId: 2,
              idempotencyKey: 'unique-key',
              createdAt: expect.any(String),
            }),
          }),
        })
      );
    });

    it('should use custom options when provided', async () => {
      const dispatcher = new JobDispatcher();

      await dispatcher.enqueue(
        'send-email' as any,
        { to: 'test@example.com' },
        {},
        {
          delay: 10,
          retries: 5,
          callback: 'https://example.com/callback',
          headers: { 'X-Custom': 'value' },
        }
      );

      expect(mockQStash.publishJSON).toHaveBeenCalledWith(
        expect.objectContaining({
          retries: 5,
          delay: 10,
          callback: 'https://example.com/callback',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Custom': 'value',
          }),
        })
      );
    });

    it('should use registry config when no custom options provided', async () => {
      const dispatcher = new JobDispatcher();

      await dispatcher.enqueue(
        'send-email' as any,
        { to: 'test@example.com' },
        {}
      );

      expect(mockQStash.publishJSON).toHaveBeenCalledWith(
        expect.objectContaining({
          retries: 3, // From registry
        })
      );
    });

    it('should handle QStash publish errors', async () => {
      mockQStash.publishJSON.mockRejectedValueOnce(
        new Error('QStash publish failed')
      );

      const dispatcher = new JobDispatcher();

      await expect(
        dispatcher.enqueue('send-email' as any, { to: 'test@example.com' }, {})
      ).rejects.toThrow('QStash publish failed');

      expect(mockLogger.error).toHaveBeenCalledWith(
        '[jobs] Failed to enqueue job',
        expect.objectContaining({
          error: 'QStash publish failed',
        })
      );
    });

    it('should normalize base URL correctly', async () => {
      vi.doMock('@/lib/env', () => ({
        env: {
          BASE_URL: 'https://example.com/', // Trailing slash
        },
      }));

      vi.resetModules();
      const module = await import('@/lib/jobs/job-dispatcher.service');
      const dispatcher = new module.JobDispatcher();

      await dispatcher.enqueue(
        'send-email' as any,
        { to: 'test@example.com' },
        {}
      );

      expect(mockQStash.publishJSON).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://example.com/api/jobs/email', // No double slash
        })
      );
    });

    it('should generate unique job IDs', async () => {
      const dispatcher = new JobDispatcher();

      const jobId1 = await dispatcher.enqueue(
        'send-email' as any,
        { to: 'test1@example.com' },
        {}
      );
      const jobId2 = await dispatcher.enqueue(
        'send-email' as any,
        { to: 'test2@example.com' },
        {}
      );

      expect(jobId1).not.toBe(jobId2);
    });

    it('should create job execution record before publishing', async () => {
      const callOrder: string[] = [];

      mockCreateJobExecution.mockImplementation(() => {
        callOrder.push('createJobExecution');
        return Promise.resolve({ id: 1 });
      });

      mockQStash.publishJSON.mockImplementation(() => {
        callOrder.push('publishJSON');
        return Promise.resolve({ messageId: 'msg_123' });
      });

      const dispatcher = new JobDispatcher();
      await dispatcher.enqueue(
        'send-email' as any,
        { to: 'test@example.com' },
        {}
      );

      expect(callOrder).toEqual(['createJobExecution', 'publishJSON']);
    });
  });

  describe('schedule', () => {
    it('should schedule a job successfully', async () => {
      const dispatcher = new JobDispatcher();

      const scheduleId = await dispatcher.schedule(
        'cleanup-old-data' as any,
        '0 2 * * *',
        { retention: 30 },
        {}
      );

      expect(scheduleId).toBe('sched_123');
      expect(mockQStash.schedules.create).toHaveBeenCalledWith({
        destination: 'https://example.com/api/jobs/cleanup',
        cron: '0 2 * * *',
        body: expect.stringContaining('"type":"cleanup-old-data"'),
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        '[jobs] Scheduling job',
        expect.any(Object)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        '[jobs] Job scheduled successfully',
        expect.objectContaining({
          scheduleId: 'sched_123',
        })
      );
    });

    it('should include metadata in scheduled job', async () => {
      const dispatcher = new JobDispatcher();

      await dispatcher.schedule(
        'cleanup-old-data' as any,
        '0 2 * * *',
        { retention: 30 },
        {
          organizationId: 1,
        }
      );

      const bodyArg = mockQStash.schedules.create.mock.calls[0][0].body;
      const parsedBody = JSON.parse(bodyArg);

      expect(parsedBody.metadata).toMatchObject({
        organizationId: 1,
        createdAt: expect.any(String),
      });
    });

    it('should handle schedule creation errors', async () => {
      mockQStash.schedules.create.mockRejectedValueOnce(
        new Error('Schedule failed')
      );

      const dispatcher = new JobDispatcher();

      await expect(
        dispatcher.schedule('cleanup-old-data' as any, '0 2 * * *', {}, {})
      ).rejects.toThrow('Schedule failed');
    });

    it('should generate unique job IDs for scheduled jobs', async () => {
      const dispatcher = new JobDispatcher();

      await dispatcher.schedule('cleanup-old-data' as any, '0 2 * * *', {}, {});
      await dispatcher.schedule('cleanup-old-data' as any, '0 3 * * *', {}, {});

      const body1 = JSON.parse(
        mockQStash.schedules.create.mock.calls[0][0].body
      );
      const body2 = JSON.parse(
        mockQStash.schedules.create.mock.calls[1][0].body
      );

      expect(body1.jobId).not.toBe(body2.jobId);
    });
  });

  describe('Configuration', () => {
    it('should retrieve job config from registry', async () => {
      const dispatcher = new JobDispatcher();

      await dispatcher.enqueue(
        'send-email' as any,
        { to: 'test@example.com' },
        {}
      );

      expect(mockGetJobConfig).toHaveBeenCalledWith('send-email');
    });

    it('should use job config endpoint', async () => {
      mockGetJobConfig.mockReturnValueOnce({
        type: 'process-webhook',
        endpoint: '/api/jobs/webhook',
        retries: 5,
        timeout: 60,
      });

      const dispatcher = new JobDispatcher();

      await dispatcher.enqueue(
        'process-webhook' as any,
        { source: 'stripe' },
        {}
      );

      expect(mockQStash.publishJSON).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://example.com/api/jobs/webhook',
          retries: 5,
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should log errors with context', async () => {
      mockQStash.publishJSON.mockRejectedValueOnce(
        new Error('Network timeout')
      );

      const dispatcher = new JobDispatcher();

      try {
        await dispatcher.enqueue(
          'send-email' as any,
          { to: 'test@example.com' },
          { userId: 1 }
        );
      } catch (error) {
        // Expected to throw
      }

      expect(mockLogger.error).toHaveBeenCalledWith(
        '[jobs] Failed to enqueue job',
        expect.objectContaining({
          jobId: expect.any(String),
          type: 'send-email',
          error: 'Network timeout',
        })
      );
    });

    it('should handle unknown errors gracefully', async () => {
      mockQStash.publishJSON.mockRejectedValueOnce('String error');

      const dispatcher = new JobDispatcher();

      try {
        await dispatcher.enqueue(
          'send-email' as any,
          { to: 'test@example.com' },
          {}
        );
      } catch (error) {
        // Expected to throw
      }

      expect(mockLogger.error).toHaveBeenCalledWith(
        '[jobs] Failed to enqueue job',
        expect.objectContaining({
          error: 'Unknown error',
        })
      );
    });
  });
});
