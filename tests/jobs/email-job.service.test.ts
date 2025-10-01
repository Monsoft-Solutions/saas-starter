import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock server-only module for testing
vi.mock('server-only', () => ({}));

/**
 * Unit tests for Email Job Service
 *
 * Tests cover:
 * - Email job enqueueing
 * - Metadata attribution
 * - Retry configuration
 * - Integration with job dispatcher
 * - Async email sending functions
 * - Recipient email resolution
 */

describe('Email Job Service', () => {
  let enqueueEmailJob: typeof import('@/lib/jobs/services/email-job.service').enqueueEmailJob;
  let mockJobDispatcher: any;

  beforeEach(async () => {
    vi.resetModules();

    // Mock job dispatcher
    mockJobDispatcher = {
      enqueue: vi.fn().mockResolvedValue('job-id-123'),
    };

    vi.doMock('@/lib/jobs/job-dispatcher.service', () => ({
      jobDispatcher: mockJobDispatcher,
    }));

    // Import after mocking
    const module = await import('@/lib/jobs/services/email-job.service');
    enqueueEmailJob = module.enqueueEmailJob;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetAllMocks();
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('enqueueEmailJob', () => {
    it('should enqueue email job with correct payload', async () => {
      const payload = {
        template: 'welcome' as const,
        to: 'test@example.com',
        data: {
          recipientName: 'John Doe',
          dashboardUrl: '/app',
        },
      };

      const jobId = await enqueueEmailJob(payload);

      expect(jobId).toBe('job-id-123');
      expect(mockJobDispatcher.enqueue).toHaveBeenCalledWith(
        'send-email',
        payload,
        {},
        {
          retries: 3,
          delay: 0,
        }
      );
    });

    it('should include metadata when provided', async () => {
      const payload = {
        template: 'welcome' as const,
        to: 'test@example.com',
        data: {},
      };

      const metadata = {
        userId: 1,
        organizationId: 2,
      };

      await enqueueEmailJob(payload, metadata);

      expect(mockJobDispatcher.enqueue).toHaveBeenCalledWith(
        'send-email',
        payload,
        metadata,
        {
          retries: 3,
          delay: 0,
        }
      );
    });

    it('should use default retry configuration', async () => {
      const payload = {
        template: 'welcome' as const,
        to: 'test@example.com',
        data: {},
      };

      await enqueueEmailJob(payload);

      expect(mockJobDispatcher.enqueue).toHaveBeenCalledWith(
        'send-email',
        payload,
        {},
        expect.objectContaining({
          retries: 3,
        })
      );
    });

    it('should use zero delay', async () => {
      const payload = {
        template: 'welcome' as const,
        to: 'test@example.com',
        data: {},
      };

      await enqueueEmailJob(payload);

      expect(mockJobDispatcher.enqueue).toHaveBeenCalledWith(
        'send-email',
        payload,
        {},
        expect.objectContaining({
          delay: 0,
        })
      );
    });

    it('should handle all email templates', async () => {
      const templates = [
        'welcome',
        'passwordReset',
        'passwordChanged',
        'emailChange',
        'teamInvitation',
        'subscriptionCreated',
        'paymentFailed',
      ] as const;

      for (const template of templates) {
        mockJobDispatcher.enqueue.mockClear();

        await enqueueEmailJob({
          template,
          to: 'test@example.com',
          data: {},
        });

        expect(mockJobDispatcher.enqueue).toHaveBeenCalledWith(
          'send-email',
          expect.objectContaining({ template }),
          {},
          expect.any(Object)
        );
      }
    });

    it('should pass through complex data payloads', async () => {
      const payload = {
        template: 'welcome' as const,
        to: 'test@example.com',
        data: {
          recipientName: 'John Doe',
          dashboardUrl: '/app',
          nested: {
            object: {
              value: 123,
            },
          },
          array: [1, 2, 3],
        },
      };

      await enqueueEmailJob(payload);

      expect(mockJobDispatcher.enqueue).toHaveBeenCalledWith(
        'send-email',
        expect.objectContaining({
          data: payload.data,
        }),
        {},
        expect.any(Object)
      );
    });

    it('should return job ID from dispatcher', async () => {
      mockJobDispatcher.enqueue.mockResolvedValueOnce('custom-job-id');

      const payload = {
        template: 'welcome' as const,
        to: 'test@example.com',
        data: {},
      };

      const jobId = await enqueueEmailJob(payload);

      expect(jobId).toBe('custom-job-id');
    });

    it('should handle dispatcher errors', async () => {
      mockJobDispatcher.enqueue.mockRejectedValueOnce(
        new Error('QStash error')
      );

      const payload = {
        template: 'welcome' as const,
        to: 'test@example.com',
        data: {},
      };

      await expect(enqueueEmailJob(payload)).rejects.toThrow('QStash error');
    });

    it('should work with empty data object', async () => {
      const payload = {
        template: 'welcome' as const,
        to: 'test@example.com',
        data: {},
      };

      await enqueueEmailJob(payload);

      expect(mockJobDispatcher.enqueue).toHaveBeenCalledWith(
        'send-email',
        expect.objectContaining({
          data: {},
        }),
        {},
        expect.any(Object)
      );
    });

    it('should work with empty metadata', async () => {
      const payload = {
        template: 'welcome' as const,
        to: 'test@example.com',
        data: {},
      };

      await enqueueEmailJob(payload, {});

      expect(mockJobDispatcher.enqueue).toHaveBeenCalledWith(
        'send-email',
        payload,
        {},
        expect.any(Object)
      );
    });

    it('should work with partial metadata', async () => {
      const payload = {
        template: 'welcome' as const,
        to: 'test@example.com',
        data: {},
      };

      await enqueueEmailJob(payload, { userId: 1 });

      expect(mockJobDispatcher.enqueue).toHaveBeenCalledWith(
        'send-email',
        payload,
        { userId: 1 },
        expect.any(Object)
      );
    });
  });

  describe('Async Email Sending Functions', () => {
    let mockEnqueueEmailJob: any;
    let mockResolveRecipientEmail: any;

    beforeEach(async () => {
      vi.resetModules();

      // Mock enqueueEmailJob
      mockEnqueueEmailJob = vi.fn().mockResolvedValue('job-id-123');

      vi.doMock('@/lib/jobs/services', () => ({
        enqueueEmailJob: mockEnqueueEmailJob,
      }));

      // Mock resolveRecipientEmail
      mockResolveRecipientEmail = vi
        .fn()
        .mockImplementation((to) =>
          typeof to === 'string' ? to : to[0]?.email || to[0]
        );

      vi.doMock('@/lib/emails/email-recipient.util', () => ({
        resolveRecipientEmail: mockResolveRecipientEmail,
      }));
    });

    it('should enqueue welcome email', async () => {
      const { sendWelcomeEmailAsync } = await import('@/lib/emails/enqueue');

      await sendWelcomeEmailAsync(
        {
          to: 'test@example.com',
          recipientName: 'John Doe',
          dashboardUrl: '/app',
        },
        { userId: 1 }
      );

      expect(mockEnqueueEmailJob).toHaveBeenCalledWith(
        {
          template: 'welcome',
          to: 'test@example.com',
          data: expect.objectContaining({
            recipientName: 'John Doe',
            dashboardUrl: '/app',
          }),
        },
        { userId: 1 }
      );
    });

    it('should enqueue password reset email', async () => {
      const { sendPasswordResetEmailAsync } = await import(
        '@/lib/emails/enqueue'
      );

      await sendPasswordResetEmailAsync(
        {
          to: 'test@example.com',
          recipientName: 'John Doe',
          resetUrl: 'https://example.com/reset',
          expiresInMinutes: 60,
        },
        { userId: 1 }
      );

      expect(mockEnqueueEmailJob).toHaveBeenCalledWith(
        {
          template: 'passwordReset',
          to: 'test@example.com',
          data: expect.objectContaining({
            recipientName: 'John Doe',
            resetUrl: 'https://example.com/reset',
          }),
        },
        { userId: 1 }
      );
    });

    it('should enqueue password changed email', async () => {
      const { sendPasswordChangedEmailAsync } = await import(
        '@/lib/emails/enqueue'
      );

      await sendPasswordChangedEmailAsync(
        {
          to: 'test@example.com',
          recipientName: 'John Doe',
          changedAt: new Date().toISOString(),
        },
        { userId: 1 }
      );

      expect(mockEnqueueEmailJob).toHaveBeenCalledWith(
        {
          template: 'passwordChanged',
          to: 'test@example.com',
          data: expect.objectContaining({
            recipientName: 'John Doe',
          }),
        },
        { userId: 1 }
      );
    });

    it('should enqueue email change confirmation', async () => {
      const { sendEmailChangeConfirmationEmailAsync } = await import(
        '@/lib/emails/enqueue'
      );

      await sendEmailChangeConfirmationEmailAsync(
        {
          to: 'new@example.com',
          recipientName: 'John Doe',
          confirmationUrl: 'https://example.com/confirm',
          newEmail: 'new@example.com',
          oldEmail: 'old@example.com',
        },
        { userId: 1 }
      );

      expect(mockEnqueueEmailJob).toHaveBeenCalledWith(
        {
          template: 'emailChange',
          to: 'new@example.com',
          data: expect.objectContaining({
            recipientName: 'John Doe',
            confirmationUrl: 'https://example.com/confirm',
          }),
        },
        { userId: 1 }
      );
    });

    it('should enqueue team invitation email', async () => {
      const { sendTeamInvitationEmailAsync } = await import(
        '@/lib/emails/enqueue'
      );

      await sendTeamInvitationEmailAsync(
        {
          to: 'invite@example.com',
          inviterName: 'Jane Doe',
          teamName: 'Acme Inc',
          inviteUrl: 'https://example.com/invite',
          role: 'member',
        },
        { organizationId: 1 }
      );

      expect(mockEnqueueEmailJob).toHaveBeenCalledWith(
        {
          template: 'teamInvitation',
          to: 'invite@example.com',
          data: expect.objectContaining({
            inviterName: 'Jane Doe',
            teamName: 'Acme Inc',
          }),
        },
        { organizationId: 1 }
      );
    });

    it('should enqueue subscription created email', async () => {
      const { sendSubscriptionCreatedEmailAsync } = await import(
        '@/lib/emails/enqueue'
      );

      await sendSubscriptionCreatedEmailAsync(
        {
          to: 'test@example.com',
          recipientName: 'John Doe',
          planName: 'Pro',
          amount: '99.00',
          dashboardUrl: '/app',
        },
        { userId: 1, organizationId: 1 }
      );

      expect(mockEnqueueEmailJob).toHaveBeenCalledWith(
        {
          template: 'subscriptionCreated',
          to: 'test@example.com',
          data: expect.objectContaining({
            recipientName: 'John Doe',
            planName: 'Pro',
          }),
        },
        { userId: 1, organizationId: 1 }
      );
    });

    it('should enqueue payment failed email', async () => {
      const { sendPaymentFailedEmailAsync } = await import(
        '@/lib/emails/enqueue'
      );

      await sendPaymentFailedEmailAsync(
        {
          to: 'test@example.com',
          recipientName: 'John Doe',
          amountDue: '99.00',
          paymentDetailsUrl: '/billing',
        },
        { userId: 1, organizationId: 1 }
      );

      expect(mockEnqueueEmailJob).toHaveBeenCalledWith(
        {
          template: 'paymentFailed',
          to: 'test@example.com',
          data: expect.objectContaining({
            recipientName: 'John Doe',
            amountDue: '99.00',
          }),
        },
        { userId: 1, organizationId: 1 }
      );
    });

    it('should work without metadata', async () => {
      const { sendWelcomeEmailAsync } = await import('@/lib/emails/enqueue');

      await sendWelcomeEmailAsync({
        to: 'test@example.com',
        recipientName: 'John Doe',
        dashboardUrl: '/app',
      });

      expect(mockEnqueueEmailJob).toHaveBeenCalledWith(expect.any(Object), {});
    });

    it('should resolve recipient email from complex types', async () => {
      const { sendWelcomeEmailAsync } = await import('@/lib/emails/enqueue');

      const recipientList = [{ email: 'test@example.com', name: 'John' }];

      await sendWelcomeEmailAsync({
        to: recipientList,
        recipientName: 'John Doe',
        dashboardUrl: '/app',
      });

      expect(mockResolveRecipientEmail).toHaveBeenCalledWith(recipientList);
    });
  });
});
