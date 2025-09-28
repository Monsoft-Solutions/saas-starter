/**
 * Resend recipient definition allowing plain email or formatted name/email pairs.
 */
export type ResendRecipient =
  | string
  | {
      email: string;
      name?: string;
    };
