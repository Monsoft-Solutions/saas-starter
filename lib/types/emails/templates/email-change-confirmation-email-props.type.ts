/**
 * Data required to render an email change confirmation for verification flows.
 */
export type EmailChangeConfirmationEmailProps = {
  recipientName?: string;
  confirmationUrl: string;
  newEmail: string;
  oldEmail?: string;
  supportEmail?: string;
};
