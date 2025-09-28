/**
 * @typedef PaymentFailedEmailProps
 * @property {string} [recipientName] - The recipient's name.
 * @property {string} amountDue - The amount due.
 * @property {string} paymentDetailsUrl - The URL to update payment details.
 * @property {string} supportEmail - The support email address.
 */
export type PaymentFailedEmailProps = {
  recipientName?: string;
  amountDue: string;
  paymentDetailsUrl: string;
  supportEmail: string;
};
