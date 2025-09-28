/**
 * Data required to render a team invitation email.
 */
export type TeamInvitationEmailProps = {
  recipientName?: string;
  inviterName: string;
  teamName: string;
  inviteUrl: string;
  role: 'member' | 'owner';
  supportEmail?: string;
  expiresAt?: string;
};
