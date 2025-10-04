/**
 * Invitation Type Definition
 *
 * Represents an invitation entity with organization and inviter details.
 * Used throughout the invitation acceptance flow.
 */
export type Invitation = {
  /** Unique invitation identifier */
  id: string;
  /** Email address of the invitee */
  email: string;
  /** Role assigned to the invitee (null for default member role) */
  role: string | null;
  /** Current status of the invitation (pending, accepted, expired) */
  status: string;
  /** Organization details the user is being invited to */
  organization: {
    /** Organization identifier */
    id: string;
    /** Organization name */
    name: string;
  } | null;
  /** Details of the person who sent the invitation */
  inviter: {
    /** Inviter's name */
    name: string | null;
    /** Inviter's email address */
    email: string | null;
  } | null;
  /** Expiration date/time - accepts both Date object and ISO string from API */
  expiresAt: Date | string;
};
