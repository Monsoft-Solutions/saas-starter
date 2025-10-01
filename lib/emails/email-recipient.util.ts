/**
 * Email Recipient Utilities
 *
 * Utility functions for handling email recipient data from Resend's
 * recipient list format. Provides safe extraction of primary email
 * addresses for idempotency tracking and logging purposes.
 */

import 'server-only';

import type { ResendRecipientList } from '@/lib/types';

/**
 * Resolves the primary recipient email from the Resend recipient list.
 *
 * Extracts the first email address from either a string or object format,
 * handling both single recipients and recipient arrays. Used primarily
 * for idempotency tracking and logging.
 *
 * @param to - Resend recipient list (string, object, or array)
 * @returns The primary email address as a trimmed string
 * @throws Error if no valid recipient is found
 */
export const resolveRecipientEmail = (to: ResendRecipientList): string => {
  const recipient = Array.isArray(to) ? to[0] : to;

  if (!recipient) {
    throw new Error('At least one email recipient is required');
  }

  const email = typeof recipient === 'string' ? recipient : recipient.email;
  return email.trim();
};
