/**
 * Data required to render a password changed confirmation email for auditing.
 */
export type PasswordChangedEmailProps = {
  recipientName?: string;
  changedAt: string;
  ipAddress?: string;
  supportEmail?: string;
};
