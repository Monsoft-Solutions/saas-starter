import { ResendRecipient } from './resend-recipient.type';

/**
 * Recipients can be single entries or arrays up to the Resend API cap.
 */
export type ResendRecipientList = ResendRecipient | ResendRecipient[];
