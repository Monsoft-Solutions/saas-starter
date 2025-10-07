/**
 * Single source of truth for activity types.
 * When you change a value here, TypeScript will error everywhere it's used.
 * Used for: TypeScript types, Zod schemas, and pgEnum definitions.
 */
export enum ActivityType {
  SIGN_UP = 'sign_up',
  SIGN_IN = 'sign_in',
  SIGN_OUT = 'sign_out',
  UPDATE_PASSWORD = 'password.updated',
  DELETE_ACCOUNT = 'account.deleted',
  UPDATE_ACCOUNT = 'account.updated',
  CREATE_ORGANIZATION = 'organization.created',
  REMOVE_ORGANIZATION_MEMBER = 'organization.member.removed',
  INVITE_ORGANIZATION_MEMBER = 'organization.member.invited',
  ACCEPT_INVITATION = 'invitation.accepted',
  SUBSCRIPTION_CREATED = 'subscription.created',
  SUBSCRIPTION_UPDATED = 'subscription.updated',
  SUBSCRIPTION_DELETED = 'subscription.deleted',
  PAYMENT_FAILED = 'payment.failed',
}
