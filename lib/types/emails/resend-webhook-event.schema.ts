import { z } from 'zod';

const emailSentEventDataSchema = z.object({
  email_id: z.string(),
});

const emailDeliveredEventDataSchema = z.object({
  email_id: z.string(),
});

const emailBouncedEventDataSchema = z.object({
  email_id: z.string(),
  bounce: z.object({
    message: z.string(),
    subType: z.string(),
    type: z.string(),
  }),
});

const emailComplainedEventDataSchema = z.object({
  email_id: z.string(),
});

export const resendWebhookEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('email.sent'),
    data: emailSentEventDataSchema,
  }),
  z.object({
    type: z.literal('email.delivered'),
    data: emailDeliveredEventDataSchema,
  }),
  z.object({
    type: z.literal('email.bounced'),
    data: emailBouncedEventDataSchema,
  }),
  z.object({
    type: z.literal('email.complained'),
    data: emailComplainedEventDataSchema,
  }),
]);

export type ResendWebhookEvent = z.infer<typeof resendWebhookEventSchema>;
