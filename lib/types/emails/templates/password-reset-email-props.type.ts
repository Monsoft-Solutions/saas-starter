/**
 * Data required to render a password reset email containing the recovery link.
 */
export type PasswordResetEmailProps = {
  recipientName?: string;
  resetUrl: string;
  expiresInMinutes: number;
  supportEmail?: string;
};
