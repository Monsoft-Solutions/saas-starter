import { expect, test } from 'vitest';

import {
  renderEmailChangeConfirmationEmail,
  renderPasswordChangedEmail,
  renderPasswordResetEmail,
  renderTeamInvitationEmail,
  renderWelcomeSignupEmail,
} from '@/lib/emails/templates';
import type {
  EmailChangeConfirmationEmailProps,
  PasswordChangedEmailProps,
  PasswordResetEmailProps,
  TeamInvitationEmailProps,
  WelcomeSignupEmailProps,
} from '@/lib/types';

// Mock data for testing
const mockUser = {
  recipientName: 'John Doe',
  email: 'john@example.com',
  supportEmail: 'support@example.com',
};

const mockWelcomeProps: WelcomeSignupEmailProps = {
  ...mockUser,
  dashboardUrl: 'https://app.example.com/dashboard',
  teamName: 'Test Team',
};

const mockPasswordResetProps: PasswordResetEmailProps = {
  ...mockUser,
  resetUrl: 'https://app.example.com/reset-password?token=abc123',
  expiresInMinutes: 30,
};

const mockPasswordChangedProps: PasswordChangedEmailProps = {
  ...mockUser,
  changedAt: new Date('2024-01-15T10:30:00Z').toISOString(),
};

const mockEmailChangeProps: EmailChangeConfirmationEmailProps = {
  ...mockUser,
  confirmationUrl: 'https://app.example.com/confirm-email?token=def456',
  newEmail: 'new@example.com',
  oldEmail: 'old@example.com',
};

const mockTeamInvitationProps: TeamInvitationEmailProps = {
  ...mockUser,
  inviterName: 'Jane Smith',
  teamName: 'Test Team',
  inviteUrl: 'https://app.example.com/invitation?token=ghi789',
  role: 'member',
};

test('renders welcome signup email', async () => {
  const result = await renderWelcomeSignupEmail(mockWelcomeProps);

  expect(result).toHaveProperty('html');
  expect(result).toHaveProperty('text');
  expect(result.html).toContain('Welcome to Test Team');
  expect(result.html).toContain('Hi John Doe,');
  expect(result.html).toContain('Open your dashboard');
  expect(result.html).toContain('support@example.com');
});

test('renders password reset email', async () => {
  const result = await renderPasswordResetEmail(mockPasswordResetProps);

  expect(result).toHaveProperty('html');
  expect(result).toHaveProperty('text');
  expect(result.html).toContain('Reset your Next.js SaaS Starter password');
  expect(result.html).toContain('Hi John Doe,');
  expect(result.html).toContain('Reset password');
  expect(result.html).toContain('support@example.com');
});

test('renders password changed email', async () => {
  const result = await renderPasswordChangedEmail(mockPasswordChangedProps);

  expect(result).toHaveProperty('html');
  expect(result).toHaveProperty('text');
  expect(result.html).toContain(
    'Your Next.js SaaS Starter password was updated'
  );
  expect(result.html).toContain('Hi John Doe,');
  expect(result.html).toContain('support@example.com');
});

test('renders email change confirmation email', async () => {
  const result = await renderEmailChangeConfirmationEmail(mockEmailChangeProps);

  expect(result).toHaveProperty('html');
  expect(result).toHaveProperty('text');
  expect(result.html).toContain('Confirm your email update');
  expect(result.html).toContain('Hi John Doe,');
  expect(result.html).toContain('Confirm email change');
  expect(result.html).toContain('New email: <!-- -->new@example.com');
  expect(result.html).toContain('Current email: <!-- -->old@example.com');
  expect(result.html).toContain('support@example.com');
});

test('renders team invitation email', async () => {
  const result = await renderTeamInvitationEmail(mockTeamInvitationProps);

  expect(result).toHaveProperty('html');
  expect(result).toHaveProperty('text');
  expect(result.html).toContain('Jane Smith invited you to Test Team');
  expect(result.html).toContain('Hi John Doe,');
  expect(result.html).toContain('Accept invitation');
  expect(result.html).toContain('support@example.com');
});

test('renders email without recipient name', async () => {
  const propsWithoutName = { ...mockWelcomeProps, recipientName: undefined };
  const result = await renderWelcomeSignupEmail(propsWithoutName);

  expect(result.html).toContain('Hi there,');
  expect(result.html).not.toContain('Hi undefined,');
});

test('renders email without team name', async () => {
  const propsWithoutTeam = { ...mockWelcomeProps, teamName: undefined };
  const result = await renderWelcomeSignupEmail(propsWithoutTeam);

  expect(result.html).toContain('Welcome to');
  expect(result.html).not.toContain('Test Team');
});

test('email content is properly escaped', async () => {
  const propsWithSpecialChars: WelcomeSignupEmailProps = {
    ...mockWelcomeProps,
    recipientName: 'John & Jane <test@example.com>',
    teamName: 'Test & Co <script>',
  };

  const result = await renderWelcomeSignupEmail(propsWithSpecialChars);

  // HTML should be escaped
  expect(result.html).toContain('John &amp; Jane &lt;test@example.com&gt;');
  expect(result.html).toContain('Test &amp; Co &lt;script&gt;');

  // Text should not be HTML encoded
  expect(result.text).toContain('John & Jane <test@example.com>');
  expect(result.text).toContain('Test & Co <script>');
});

test('all templates include support email in footer', async () => {
  const templates = await Promise.all([
    renderWelcomeSignupEmail(mockWelcomeProps),
    renderPasswordResetEmail(mockPasswordResetProps),
    renderPasswordChangedEmail(mockPasswordChangedProps),
    renderEmailChangeConfirmationEmail(mockEmailChangeProps),
    renderTeamInvitationEmail(mockTeamInvitationProps),
  ]);

  templates.forEach((result) => {
    expect(result.html).toContain('support@example.com');
  });
});

test('all templates have consistent structure', async () => {
  const templates = await Promise.all([
    renderWelcomeSignupEmail(mockWelcomeProps),
    renderPasswordResetEmail(mockPasswordResetProps),
    renderPasswordChangedEmail(mockPasswordChangedProps),
    renderEmailChangeConfirmationEmail(mockEmailChangeProps),
    renderTeamInvitationEmail(mockTeamInvitationProps),
  ]);

  templates.forEach((result) => {
    expect(result.html).toMatch(/<!DOCTYPE html/);
    expect(result.html).toMatch(/<html/);
    expect(result.html).toMatch(/<\/html>/);
    expect(result.text).toBeTruthy();
    expect(result.text.length).toBeGreaterThan(0);
  });
});
