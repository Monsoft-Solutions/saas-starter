import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock server-only module for testing
vi.mock('server-only', () => ({}));

/**
 * Unit tests for Job Worker Handler
 *
 * Tests cover:
 * - QStash signature verification
 * - Job payload parsing
 * - Job execution tracking
 * - Handler execution
 * - Error handling
 * - Response formatting
 * - Job status updates
 */

describe('Job Worker Handler', () => {
  let createJobWorker: typeof import('@/lib/jobs/job-worker.handler').createJobWorker;
  let mockReceiver: any;
  let mockGetJobExecutionByJobId: any;
  let mockUpdateJobExecution: any;
  let mockLogger: any;

  beforeEach(async () => {
    vi.resetModules();

    // Mock QStash receiver
    mockReceiver = {
      verify: vi.fn().mockResolvedValue(true),
    };

    vi.doMock('@/lib/jobs/qstash.client', () => ({
      getQStashReceiver: () => mockReceiver,
    }));

    // Mock database queries
    mockGetJobExecutionByJobId = vi.fn().mockResolvedValue({
      id: 1,
      jobId: 'test-job-id',
      jobType: 'send-email',
      status: 'pending',
      retryCount: 0,
    });

    mockUpdateJobExecution = vi.fn().mockResolvedValue({
      id: 1,
      jobId: 'test-job-id',
      status: 'completed',
    });

    vi.doMock('@/lib/db/queries', () => ({
      getJobExecutionByJobId: mockGetJobExecutionByJobId,
      updateJobExecution: mockUpdateJobExecution,
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

    // Import after mocking
    const module = await import('@/lib/jobs/job-worker.handler');
    createJobWorker = module.createJobWorker;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetAllMocks();
    vi.clearAllMocks();
    vi.resetModules();
  });

  const createMockRequest = (
    body: string,
    signature: string = 'valid-signature',
    url: string = 'https://example.com/api/jobs/email'
  ): NextRequest => {
    return {
      text: vi.fn().mockResolvedValue(body),
      headers: new Map([['Upstash-Signature', signature]]),
      url,
    } as unknown as NextRequest;
  };

  describe('Signature Verification', () => {
    it('should verify QStash signature successfully', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      const worker = createJobWorker(handler);

      const jobPayload = {
        jobId: 'test-job-id',
        type: 'send-email',
        payload: { to: 'test@example.com' },
        metadata: { createdAt: new Date().toISOString() },
      };

      const request = createMockRequest(JSON.stringify(jobPayload));
      const response = await worker(request);

      expect(mockReceiver.verify).toHaveBeenCalledWith({
        signature: 'valid-signature',
        body: JSON.stringify(jobPayload),
        url: 'https://example.com/api/jobs/email',
      });
      expect(response.status).toBe(200);
    });

    it('should reject request with missing signature', async () => {
      const handler = vi.fn();
      const worker = createJobWorker(handler);

      const request = {
        text: vi.fn().mockResolvedValue('{}'),
        headers: new Map(), // No signature
        url: 'https://example.com/api/jobs/email',
      } as unknown as NextRequest;

      const response = await worker(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Missing signature');
      expect(handler).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        '[jobs] Missing QStash signature header'
      );
    });

    it('should reject request with invalid signature', async () => {
      mockReceiver.verify.mockRejectedValueOnce(
        new Error('Signature verification failed')
      );

      const handler = vi.fn();
      const worker = createJobWorker(handler);

      const request = createMockRequest('{}');
      const response = await worker(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid signature');
      expect(handler).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        '[jobs] Invalid QStash signature',
        expect.any(Object)
      );
    });

    it('should handle lowercase signature header', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      const worker = createJobWorker(handler);

      const jobPayload = {
        jobId: 'test-job-id',
        type: 'send-email',
        payload: { to: 'test@example.com' },
        metadata: { createdAt: new Date().toISOString() },
      };

      const request = {
        text: vi.fn().mockResolvedValue(JSON.stringify(jobPayload)),
        headers: new Map([['upstash-signature', 'valid-signature']]), // lowercase
        url: 'https://example.com/api/jobs/email',
      } as unknown as NextRequest;

      const response = await worker(request);

      expect(mockReceiver.verify).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });
  });

  describe('Job Payload Parsing', () => {
    it('should parse job payload successfully', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      const worker = createJobWorker(handler);

      const jobPayload = {
        jobId: 'test-job-id',
        type: 'send-email',
        payload: { to: 'test@example.com', template: 'welcome' },
        metadata: { createdAt: new Date().toISOString(), userId: 1 },
      };

      const request = createMockRequest(JSON.stringify(jobPayload));
      await worker(request);

      expect(handler).toHaveBeenCalledWith(
        jobPayload.payload,
        expect.objectContaining({
          jobId: 'test-job-id',
          type: 'send-email',
          payload: jobPayload.payload,
        })
      );
    });

    it('should reject invalid JSON payload', async () => {
      const handler = vi.fn();
      const worker = createJobWorker(handler);

      const request = createMockRequest('invalid json');
      const response = await worker(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid job payload');
      expect(handler).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        '[jobs] Failed to parse job payload',
        expect.any(Object)
      );
    });
  });

  describe('Job Execution Tracking', () => {
    it('should update job status to processing before execution', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      const worker = createJobWorker(handler);

      const jobPayload = {
        jobId: 'test-job-id',
        type: 'send-email',
        payload: { to: 'test@example.com' },
        metadata: { createdAt: new Date().toISOString() },
      };

      const request = createMockRequest(JSON.stringify(jobPayload));
      await worker(request);

      expect(mockGetJobExecutionByJobId).toHaveBeenCalledWith('test-job-id');
      expect(mockUpdateJobExecution).toHaveBeenCalledWith(
        'test-job-id',
        expect.objectContaining({
          status: 'processing',
          startedAt: expect.any(Date),
          retryCount: 1,
        })
      );
    });

    it('should increment retry count on each attempt', async () => {
      mockGetJobExecutionByJobId.mockResolvedValueOnce({
        id: 1,
        jobId: 'test-job-id',
        retryCount: 2,
      });

      const handler = vi.fn().mockResolvedValue(undefined);
      const worker = createJobWorker(handler);

      const jobPayload = {
        jobId: 'test-job-id',
        type: 'send-email',
        payload: { to: 'test@example.com' },
        metadata: { createdAt: new Date().toISOString() },
      };

      const request = createMockRequest(JSON.stringify(jobPayload));
      await worker(request);

      expect(mockUpdateJobExecution).toHaveBeenCalledWith(
        'test-job-id',
        expect.objectContaining({
          retryCount: 3,
        })
      );
    });

    it('should handle missing job execution record gracefully', async () => {
      mockGetJobExecutionByJobId.mockResolvedValueOnce(null);

      const handler = vi.fn().mockResolvedValue(undefined);
      const worker = createJobWorker(handler);

      const jobPayload = {
        jobId: 'test-job-id',
        type: 'send-email',
        payload: { to: 'test@example.com' },
        metadata: { createdAt: new Date().toISOString() },
      };

      const request = createMockRequest(JSON.stringify(jobPayload));
      const response = await worker(request);

      expect(response.status).toBe(200);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        '[jobs] Job execution record not found for job',
        expect.any(Object)
      );
    });

    it('should update job status to completed after success', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      const worker = createJobWorker(handler);

      const jobPayload = {
        jobId: 'test-job-id',
        type: 'send-email',
        payload: { to: 'test@example.com' },
        metadata: { createdAt: new Date().toISOString() },
      };

      const request = createMockRequest(JSON.stringify(jobPayload));
      await worker(request);

      expect(mockUpdateJobExecution).toHaveBeenCalledWith(
        'test-job-id',
        expect.objectContaining({
          status: 'completed',
          completedAt: expect.any(Date),
        })
      );
    });

    it('should update job status to failed after error', async () => {
      const handler = vi.fn().mockRejectedValue(new Error('Handler failed'));
      const worker = createJobWorker(handler);

      const jobPayload = {
        jobId: 'test-job-id',
        type: 'send-email',
        payload: { to: 'test@example.com' },
        metadata: { createdAt: new Date().toISOString() },
      };

      const request = createMockRequest(JSON.stringify(jobPayload));
      await worker(request);

      expect(mockUpdateJobExecution).toHaveBeenCalledWith(
        'test-job-id',
        expect.objectContaining({
          status: 'failed',
          error: 'Handler failed',
          completedAt: expect.any(Date),
        })
      );
    });
  });

  describe('Handler Execution', () => {
    it('should execute handler with payload and job', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      const worker = createJobWorker(handler);

      const jobPayload = {
        jobId: 'test-job-id',
        type: 'send-email',
        payload: { to: 'test@example.com', template: 'welcome' },
        metadata: { createdAt: new Date().toISOString(), userId: 1 },
      };

      const request = createMockRequest(JSON.stringify(jobPayload));
      await worker(request);

      expect(handler).toHaveBeenCalledWith(
        { to: 'test@example.com', template: 'welcome' },
        expect.objectContaining({
          jobId: 'test-job-id',
          type: 'send-email',
          payload: { to: 'test@example.com', template: 'welcome' },
          metadata: expect.objectContaining({
            userId: 1,
          }),
        })
      );
    });

    it('should return success response on successful execution', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      const worker = createJobWorker(handler);

      const jobPayload = {
        jobId: 'test-job-id',
        type: 'send-email',
        payload: { to: 'test@example.com' },
        metadata: { createdAt: new Date().toISOString() },
      };

      const request = createMockRequest(JSON.stringify(jobPayload));
      const response = await worker(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        '[jobs] Job processed successfully',
        expect.any(Object)
      );
    });

    it('should return 500 error on handler failure', async () => {
      const handler = vi.fn().mockRejectedValue(new Error('Database error'));
      const worker = createJobWorker(handler);

      const jobPayload = {
        jobId: 'test-job-id',
        type: 'send-email',
        payload: { to: 'test@example.com' },
        metadata: { createdAt: new Date().toISOString() },
      };

      const request = createMockRequest(JSON.stringify(jobPayload));
      const response = await worker(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Database error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        '[jobs] Job processing failed',
        expect.objectContaining({
          error: 'Database error',
        })
      );
    });

    it('should handle non-Error exceptions', async () => {
      const handler = vi.fn().mockRejectedValue('String error');
      const worker = createJobWorker(handler);

      const jobPayload = {
        jobId: 'test-job-id',
        type: 'send-email',
        payload: { to: 'test@example.com' },
        metadata: { createdAt: new Date().toISOString() },
      };

      const request = createMockRequest(JSON.stringify(jobPayload));
      const response = await worker(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Unknown error');
    });
  });

  describe('Error Handling', () => {
    it('should handle database update errors gracefully', async () => {
      mockUpdateJobExecution.mockRejectedValueOnce(new Error('DB error'));

      const handler = vi.fn().mockResolvedValue(undefined);
      const worker = createJobWorker(handler);

      const jobPayload = {
        jobId: 'test-job-id',
        type: 'send-email',
        payload: { to: 'test@example.com' },
        metadata: { createdAt: new Date().toISOString() },
      };

      const request = createMockRequest(JSON.stringify(jobPayload));
      const response = await worker(request);

      // Should still return success even if DB update failed
      expect(response.status).toBe(200);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to update job execution'),
        expect.any(Object)
      );
    });

    it('should log errors with full context', async () => {
      const error = new Error('Handler failed');
      error.stack = 'Error: Handler failed\n  at handler.ts:10';

      const handler = vi.fn().mockRejectedValue(error);
      const worker = createJobWorker(handler);

      const jobPayload = {
        jobId: 'test-job-id',
        type: 'send-email',
        payload: { to: 'test@example.com' },
        metadata: { createdAt: new Date().toISOString() },
      };

      const request = createMockRequest(JSON.stringify(jobPayload));
      await worker(request);

      expect(mockLogger.error).toHaveBeenCalledWith(
        '[jobs] Job processing failed',
        expect.objectContaining({
          jobId: 'test-job-id',
          type: 'send-email',
          error: 'Handler failed',
          stack: expect.stringContaining('Error: Handler failed'),
        })
      );
    });
  });

  describe('Logging', () => {
    it('should log job processing start', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      const worker = createJobWorker(handler);

      const jobPayload = {
        jobId: 'test-job-id',
        type: 'send-email',
        payload: { to: 'test@example.com' },
        metadata: { createdAt: new Date().toISOString() },
      };

      const request = createMockRequest(JSON.stringify(jobPayload));
      await worker(request);

      expect(mockLogger.info).toHaveBeenCalledWith(
        '[jobs] Processing job',
        expect.objectContaining({
          jobId: 'test-job-id',
          type: 'send-email',
        })
      );
    });

    it('should log job completion', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      const worker = createJobWorker(handler);

      const jobPayload = {
        jobId: 'test-job-id',
        type: 'send-email',
        payload: { to: 'test@example.com' },
        metadata: { createdAt: new Date().toISOString() },
      };

      const request = createMockRequest(JSON.stringify(jobPayload));
      await worker(request);

      expect(mockLogger.info).toHaveBeenCalledWith(
        '[jobs] Job processed successfully',
        expect.objectContaining({
          jobId: 'test-job-id',
          type: 'send-email',
        })
      );
    });
  });
});
