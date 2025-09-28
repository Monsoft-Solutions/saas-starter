/**
 * Data required to render the welcome email delivered after a successful sign-up.
 */
export type WelcomeSignupEmailProps = {
  recipientName?: string;
  dashboardUrl: string;
  supportEmail?: string;
  teamName?: string;
};
