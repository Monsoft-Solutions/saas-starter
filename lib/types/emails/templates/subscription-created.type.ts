/**
 * @typedef SubscriptionCreatedEmailProps
 * @property {string} [recipientName] - The recipient's name.
 * @property {string} planName - The name of the subscription plan.
 * @property {string} amount - The subscription amount.
 * @property {string} dashboardUrl - The URL to the user's dashboard.
 * @property {string} supportEmail - The support email address.
 */
export type SubscriptionCreatedEmailProps = {
  recipientName?: string;
  planName: string;
  amount: string;
  dashboardUrl: string;
  supportEmail: string;
};
