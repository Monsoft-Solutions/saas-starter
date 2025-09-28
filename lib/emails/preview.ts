// Note: This file is used for development preview and should not be imported in client components

import {
  renderEmailChangeConfirmationEmail,
  renderPasswordChangedEmail,
  renderPasswordResetEmail,
  renderTeamInvitationEmail,
  renderWelcomeSignupEmail,
} from './templates';
import type {
  EmailChangeConfirmationEmailProps,
  PasswordChangedEmailProps,
  PasswordResetEmailProps,
  TeamInvitationEmailProps,
  WelcomeSignupEmailProps,
} from '@/lib/types';

/**
 * Preview data for all email templates
 */
const previewData = {
  welcomeSignup: {
    recipientName: 'John Doe',
    dashboardUrl: 'https://app.example.com/dashboard',
    supportEmail: 'support@example.com',
    teamName: 'Acme Corp',
  } satisfies WelcomeSignupEmailProps,

  passwordReset: {
    recipientName: 'John Doe',
    resetUrl: 'https://app.example.com/reset-password?token=abc123',
    supportEmail: 'support@example.com',
    expiresInMinutes: 10,
  } satisfies PasswordResetEmailProps,

  passwordChanged: {
    recipientName: 'John Doe',
    supportEmail: 'support@example.com',
    changedAt: '2024-01-15T10:30:00Z',
  } satisfies PasswordChangedEmailProps,

  emailChangeConfirmation: {
    recipientName: 'John Doe',
    confirmationUrl: 'https://app.example.com/confirm-email?token=def456',
    newEmail: 'new@example.com',
    oldEmail: 'old@example.com',
    supportEmail: 'support@example.com',
  } satisfies EmailChangeConfirmationEmailProps,

  teamInvitation: {
    recipientName: 'John Doe',
    inviterName: 'Jane Smith',
    teamName: 'Acme Corp',
    inviteUrl: 'https://app.example.com/invitation?token=ghi789',
    role: 'member',
    supportEmail: 'support@example.com',
  } satisfies TeamInvitationEmailProps,
} as const;

/**
 * Renders an email template to HTML for preview purposes
 */
export const renderEmailPreview = async (
  templateName: keyof typeof previewData,
  overrides?: Partial<WelcomeSignupEmailProps>
): Promise<string> => {
  const data = { ...previewData[templateName], ...overrides };

  switch (templateName) {
    case 'welcomeSignup':
      return (await renderWelcomeSignupEmail(data as WelcomeSignupEmailProps))
        .html;
    case 'passwordReset':
      return (await renderPasswordResetEmail(data as PasswordResetEmailProps))
        .html;
    case 'passwordChanged':
      return (
        await renderPasswordChangedEmail(data as PasswordChangedEmailProps)
      ).html;
    case 'emailChangeConfirmation':
      return (
        await renderEmailChangeConfirmationEmail(
          data as EmailChangeConfirmationEmailProps
        )
      ).html;
    case 'teamInvitation':
      return (await renderTeamInvitationEmail(data as TeamInvitationEmailProps))
        .html;
    default:
      throw new Error(`Unknown template: ${templateName}`);
  }
};

/**
 * Renders all email templates to HTML for preview
 */
export const renderAllEmailPreviews = async (): Promise<
  Record<keyof typeof previewData, string>
> => {
  const results = await Promise.all(
    Object.keys(previewData).map(async (templateName) => [
      templateName,
      await renderEmailPreview(templateName as keyof typeof previewData),
    ])
  );

  return Object.fromEntries(results) as Record<
    keyof typeof previewData,
    string
  >;
};

/**
 * Generates a simple HTML page showing all email previews
 */
export const generateEmailPreviewPage = async (): Promise<string> => {
  const previews = await renderAllEmailPreviews();

  return `
<!DOCTYPE html>
<html>
<head>
  <title>Email Templates Preview</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .template { margin: 20px 0; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .template h2 { color: #333; border-bottom: 2px solid #4f7399; padding-bottom: 10px; }
    .template .content { margin-top: 20px; }
    .template iframe { width: 100%; height: 600px; border: 1px solid #ddd; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>Email Templates Preview</h1>
  ${Object.entries(previews)
    .map(
      ([name, html]) => `
    <div class="template">
      <h2>${name}</h2>
      <div class="content">
        <iframe srcdoc="${html.replace(/"/g, '&quot;')}"></iframe>
      </div>
    </div>
  `
    )
    .join('')}
</body>
</html>`;
};
