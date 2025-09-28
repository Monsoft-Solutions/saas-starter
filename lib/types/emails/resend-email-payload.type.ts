import { ResendAttachment, ResendRecipientList, ResendTag } from '@/lib/types';

/**
 * Canonical transactional email payload accepted by our Resend dispatcher.
 */
export type ResendEmailPayload = {
  to: ResendRecipientList;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: ResendRecipientList;
  cc?: ResendRecipientList;
  bcc?: ResendRecipientList;
  attachments?: ResendAttachment[];
  tags?: ResendTag[];
  headers?: Record<string, string>;
  scheduledAt?: string;
  templateType?: string;
};
