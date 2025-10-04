/**
 * Invitation Landing Component Props
 *
 * Props for the InvitationLanding component that displays invitation details
 * and provides sign-up/sign-in options.
 */
import type { Invitation } from './invitation.type';

export type InvitationLandingProps = {
  /** The invitation data to display */
  invitation: Invitation;
  /** The invitation ID from the URL */
  invitationId: string;
};
