import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock server-only module for testing
vi.mock('server-only', () => ({}));

/**
 * Unit tests for Stripe Webhook Job Worker
 *
 * Tests cover:
 * - checkout.session.completed event handling
 * - invoice.payment_failed event handling
 * - customer.subscription.updated event handling
 * - customer.subscription.deleted event handling
 * - Activity logging for each event type
 * - Email notifications
 * - Cache invalidation
 * - Error handling
 * - Edge cases (missing data)
 */

describe('Stripe Webhook Job Worker', () => {
  let mockGetOrganizationByStripeCustomerId: any;
  let mockGetOrganizationOwner: any;
  let mockGetUserById: any;
  let mockLogActivity: any;
  let mockHandleSubscriptionChange: any;
  let mockSendSubscriptionCreatedEmailAsync: any;
  let mockSendPaymentFailedEmailAsync: any;
  let mockCacheService: any;
  let mockLogger: any;
  let capturedHandler: any;

  beforeEach(async () => {
    vi.resetModules();

    // Mock QStash client and receiver
    vi.doMock('@/lib/jobs/qstash.client', () => ({
      qstash: {
        publishJSON: vi.fn(),
      },
      getQStashReceiver: () => ({
        verify: vi.fn().mockResolvedValue(true),
      }),
    }));

    // Mock job worker handler - capture the handler that's passed to it
    vi.doMock('@/lib/jobs/job-worker.handler', () => ({
      createJobWorker: (handler: any) => {
        capturedHandler = handler;
        return handler;
      },
    }));

    // Mock database queries
    mockGetOrganizationByStripeCustomerId = vi.fn();
    mockGetOrganizationOwner = vi.fn();
    mockGetUserById = vi.fn();
    mockLogActivity = vi.fn().mockResolvedValue(undefined);

    vi.doMock('@/lib/db/queries', () => ({
      getOrganizationByStripeCustomerId: mockGetOrganizationByStripeCustomerId,
      getOrganizationOwner: mockGetOrganizationOwner,
      getUserById: mockGetUserById,
      logActivity: mockLogActivity,
    }));

    // Mock Stripe payment handler
    mockHandleSubscriptionChange = vi.fn().mockResolvedValue(undefined);

    vi.doMock('@/lib/payments/stripe', () => ({
      handleSubscriptionChange: mockHandleSubscriptionChange,
    }));

    // Mock email functions
    mockSendSubscriptionCreatedEmailAsync = vi
      .fn()
      .mockResolvedValue(undefined);
    mockSendPaymentFailedEmailAsync = vi.fn().mockResolvedValue(undefined);

    vi.doMock('@/lib/emails/enqueue', () => ({
      sendSubscriptionCreatedEmailAsync: mockSendSubscriptionCreatedEmailAsync,
      sendPaymentFailedEmailAsync: mockSendPaymentFailedEmailAsync,
    }));

    // Mock cache service
    mockCacheService = {
      delete: vi.fn().mockResolvedValue(undefined),
    };

    vi.doMock('@/lib/cache', () => ({
      cacheService: mockCacheService,
      CacheKeys: {
        organizationSubscription: (id: number) => `org:${id}:subscription`,
        stripeCustomer: (customerId: string) => `stripe:customer:${customerId}`,
      },
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
        QSTASH_TOKEN: 'test-token',
        QSTASH_CURRENT_SIGNING_KEY: 'test-key',
        QSTASH_NEXT_SIGNING_KEY: 'test-key',
      },
    }));

    // Import the route to trigger handler capture
    await import('@/app/api/jobs/stripe-webhook/route');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetAllMocks();
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('checkout.session.completed', () => {
    it('should process checkout session completed event', async () => {
      // Setup mocks
      const mockOrganization = {
        id: 1,
        planName: 'Pro',
      };
      const mockOwner = {
        id: 10,
        email: 'owner@example.com',
        name: 'John Doe',
      };

      mockGetOrganizationByStripeCustomerId.mockResolvedValue(mockOrganization);
      mockGetOrganizationOwner.mockResolvedValue(mockOwner.id);
      mockGetUserById.mockResolvedValue(mockOwner);

      // Create job payload
      const payload = {
        eventType: 'checkout.session.completed',
        eventId: 'evt_123',
        eventData: {
          id: 'cs_123',
          customer: 'cus_123',
          amount_total: 9900, // $99.00
        },
        ipAddress: '192.168.1.1',
      };

      const job = {
        jobId: 'job-123',
        type: 'process-stripe-webhook',
        payload,
        metadata: {
          createdAt: new Date().toISOString(),
        },
      };

      // Call the captured handler directly
      await capturedHandler(payload, job);

      // Verify organization lookup
      expect(mockGetOrganizationByStripeCustomerId).toHaveBeenCalledWith(
        'cus_123'
      );

      // Verify owner lookup
      expect(mockGetOrganizationOwner).toHaveBeenCalledWith(1);

      // Verify activity logging
      expect(mockLogActivity).toHaveBeenCalledWith(
        10,
        'SUBSCRIPTION_CREATED',
        '192.168.1.1'
      );

      // Verify user lookup
      expect(mockGetUserById).toHaveBeenCalledWith(10);

      // Verify email sent
      expect(mockSendSubscriptionCreatedEmailAsync).toHaveBeenCalledWith({
        to: 'owner@example.com',
        recipientName: 'John Doe',
        planName: 'Pro',
        amount: '99.00',
        dashboardUrl: 'https://example.com/app/general',
      });
    });

    it('should handle missing customer in session', async () => {
      const payload = {
        eventType: 'checkout.session.completed',
        eventId: 'evt_123',
        eventData: {
          id: 'cs_123',
          // No customer
        },
        ipAddress: '192.168.1.1',
      };

      const job = {
        jobId: 'job-123',
        type: 'process-stripe-webhook',
        payload,
        metadata: {
          createdAt: new Date().toISOString(),
        },
      };

      await capturedHandler(payload, job);

      // Should not call organization lookup
      expect(mockGetOrganizationByStripeCustomerId).not.toHaveBeenCalled();
    });

    it('should handle organization not found', async () => {
      mockGetOrganizationByStripeCustomerId.mockResolvedValue(null);

      const payload = {
        eventType: 'checkout.session.completed',
        eventId: 'evt_123',
        eventData: {
          id: 'cs_123',
          customer: 'cus_123',
        },
      };

      const job = {
        jobId: 'job-123',
        type: 'process-stripe-webhook',
        payload,
        metadata: {
          createdAt: new Date().toISOString(),
        },
      };

      await capturedHandler(payload, job);

      // Should not proceed to owner lookup
      expect(mockGetOrganizationOwner).not.toHaveBeenCalled();
    });

    it('should calculate amount correctly', async () => {
      const mockOrganization = { id: 1, planName: 'Pro' };
      const mockOwner = { id: 10, email: 'owner@example.com', name: 'John' };

      mockGetOrganizationByStripeCustomerId.mockResolvedValue(mockOrganization);
      mockGetOrganizationOwner.mockResolvedValue(mockOwner.id);
      mockGetUserById.mockResolvedValue(mockOwner);

      const payload = {
        eventType: 'checkout.session.completed',
        eventId: 'evt_123',
        eventData: {
          customer: 'cus_123',
          amount_total: null, // No amount
        },
      };

      const job = {
        jobId: 'job-123',
        type: 'process-stripe-webhook',
        payload,
        metadata: {
          createdAt: new Date().toISOString(),
        },
      };

      await capturedHandler(payload, job);

      expect(mockSendSubscriptionCreatedEmailAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: '0.00',
        })
      );
    });
  });

  describe('invoice.payment_failed', () => {
    it('should process payment failed event', async () => {
      const mockOrganization = { id: 1 };
      const mockOwner = {
        id: 10,
        email: 'owner@example.com',
        name: 'John Doe',
      };

      mockGetOrganizationByStripeCustomerId.mockResolvedValue(mockOrganization);
      mockGetOrganizationOwner.mockResolvedValue(mockOwner.id);
      mockGetUserById.mockResolvedValue(mockOwner);

      const payload = {
        eventType: 'invoice.payment_failed',
        eventId: 'evt_456',
        eventData: {
          customer: 'cus_123',
          amount_due: 9900,
        },
        ipAddress: '192.168.1.1',
      };

      const job = {
        jobId: 'job-456',
        type: 'process-stripe-webhook',
        payload,
        metadata: {
          createdAt: new Date().toISOString(),
        },
      };

      await capturedHandler(payload, job);

      expect(mockLogActivity).toHaveBeenCalledWith(
        10,
        'PAYMENT_FAILED',
        '192.168.1.1'
      );

      expect(mockSendPaymentFailedEmailAsync).toHaveBeenCalledWith({
        to: 'owner@example.com',
        recipientName: 'John Doe',
        amountDue: '99.00',
        paymentDetailsUrl: 'https://example.com/app/settings/billing',
      });
    });

    it('should handle missing ipAddress', async () => {
      const mockOrganization = { id: 1 };
      const mockOwner = { id: 10, email: 'test@example.com', name: 'Test' };

      mockGetOrganizationByStripeCustomerId.mockResolvedValue(mockOrganization);
      mockGetOrganizationOwner.mockResolvedValue(mockOwner.id);
      mockGetUserById.mockResolvedValue(mockOwner);

      const payload = {
        eventType: 'invoice.payment_failed',
        eventId: 'evt_456',
        eventData: {
          customer: 'cus_123',
          amount_due: 9900,
        },
        // No ipAddress
      };

      const job = {
        jobId: 'job-456',
        type: 'process-stripe-webhook',
        payload,
        metadata: {
          createdAt: new Date().toISOString(),
        },
      };

      await capturedHandler(payload, job);

      expect(mockLogActivity).toHaveBeenCalledWith(10, 'PAYMENT_FAILED', '');
    });
  });

  describe('customer.subscription.updated', () => {
    it('should process subscription updated event', async () => {
      const mockOrganization = { id: 1 };

      mockGetOrganizationByStripeCustomerId.mockResolvedValue(mockOrganization);
      mockGetOrganizationOwner.mockResolvedValue(10);

      const payload = {
        eventType: 'customer.subscription.updated',
        eventId: 'evt_789',
        eventData: {
          id: 'sub_123',
          customer: 'cus_123',
          status: 'active',
        },
        ipAddress: '192.168.1.1',
      };

      const job = {
        jobId: 'job-789',
        type: 'process-stripe-webhook',
        payload,
        metadata: {
          createdAt: new Date().toISOString(),
        },
      };

      await capturedHandler(payload, job);

      // Verify subscription change handler called
      expect(mockHandleSubscriptionChange).toHaveBeenCalledWith(
        payload.eventData
      );

      // Verify cache invalidation
      expect(mockCacheService.delete).toHaveBeenCalledWith(
        'org:1:subscription'
      );
      expect(mockCacheService.delete).toHaveBeenCalledWith(
        'stripe:customer:cus_123'
      );

      // Verify activity logging
      expect(mockLogActivity).toHaveBeenCalledWith(
        10,
        'SUBSCRIPTION_UPDATED',
        '192.168.1.1'
      );
    });
  });

  describe('customer.subscription.deleted', () => {
    it('should process subscription deleted event', async () => {
      const mockOrganization = { id: 1 };

      mockGetOrganizationByStripeCustomerId.mockResolvedValue(mockOrganization);
      mockGetOrganizationOwner.mockResolvedValue(10);

      const payload = {
        eventType: 'customer.subscription.deleted',
        eventId: 'evt_012',
        eventData: {
          id: 'sub_123',
          customer: 'cus_123',
          status: 'canceled',
        },
        ipAddress: '192.168.1.1',
      };

      const job = {
        jobId: 'job-012',
        type: 'process-stripe-webhook',
        payload,
        metadata: {
          createdAt: new Date().toISOString(),
        },
      };

      await capturedHandler(payload, job);

      // Verify subscription change handler called
      expect(mockHandleSubscriptionChange).toHaveBeenCalledWith(
        payload.eventData
      );

      // Verify cache invalidation
      expect(mockCacheService.delete).toHaveBeenCalledWith(
        'org:1:subscription'
      );
      expect(mockCacheService.delete).toHaveBeenCalledWith(
        'stripe:customer:cus_123'
      );

      // Verify activity logging
      expect(mockLogActivity).toHaveBeenCalledWith(
        10,
        'SUBSCRIPTION_DELETED',
        '192.168.1.1'
      );
    });
  });

  describe('Unknown event types', () => {
    it('should log unknown event types', async () => {
      const payload = {
        eventType: 'unknown.event.type',
        eventId: 'evt_999',
        eventData: {},
      };

      const job = {
        jobId: 'job-999',
        type: 'process-stripe-webhook',
        payload,
        metadata: {
          createdAt: new Date().toISOString(),
        },
      };

      await capturedHandler(payload, job);

      expect(mockLogger.info).toHaveBeenCalledWith(
        '[jobs] Unhandled Stripe webhook event type: unknown.event.type'
      );
    });

    it('should not throw error for unknown events', async () => {
      const payload = {
        eventType: 'unknown.event',
        eventId: 'evt_999',
        eventData: {},
      };

      const job = {
        jobId: 'job-999',
        type: 'process-stripe-webhook',
        payload,
        metadata: {
          createdAt: new Date().toISOString(),
        },
      };

      // Should not throw
      await expect(capturedHandler(payload, job)).resolves.not.toThrow();
    });
  });

  describe('Logging', () => {
    it('should log job processing start', async () => {
      const payload = {
        eventType: 'checkout.session.completed',
        eventId: 'evt_123',
        eventData: {},
      };

      const job = {
        jobId: 'job-123',
        type: 'process-stripe-webhook',
        payload,
        metadata: {
          createdAt: new Date().toISOString(),
        },
      };

      await capturedHandler(payload, job);

      expect(mockLogger.info).toHaveBeenCalledWith(
        '[jobs] Processing Stripe webhook job',
        {
          jobId: 'job-123',
          eventType: 'checkout.session.completed',
        }
      );
    });
  });
});
