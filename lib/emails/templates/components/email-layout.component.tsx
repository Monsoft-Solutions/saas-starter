import React from 'react';
import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
} from '@react-email/components';
import type { ReactNode } from 'react';

import { colors, spacing, typography } from '@/lib/design-system';

import { DEFAULT_BRAND_SIGNATURE } from '../constants';
import { EmailFooter } from './email-footer.component';
import { EmailHeader } from './email-header.component';

const palette = colors.light;
const baseFontFamily =
  '"Inter", "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const bodyStyle = {
  backgroundColor: palette.background,
  color: palette.foreground,
  fontFamily: baseFontFamily,
  fontSize: typography.fontSizes.base,
  margin: '0',
  padding: spacing[8],
} as const;

const containerStyle = {
  width: '100%',
  maxWidth: '600px',
  margin: '0 auto',
  padding: spacing[8],
  backgroundColor: palette.card,
  borderRadius: '16px',
  boxShadow: '0 16px 40px rgba(15, 23, 42, 0.08)',
} as const;

const contentSectionStyle = {
  paddingTop: spacing[6],
  paddingBottom: spacing[6],
} as const;

export type EmailLayoutProps = {
  children: ReactNode;
  heading: string;
  previewText?: string;
  supportEmail?: string;
  signature?: string;
};

/**
 * Shared structural layout used by all transactional email templates.
 */
export const EmailLayout = ({
  children,
  heading,
  previewText,
  supportEmail,
  signature = DEFAULT_BRAND_SIGNATURE,
}: EmailLayoutProps) => (
  <Html>
    <Head />
    <Preview>{previewText ?? heading}</Preview>
    <Body style={bodyStyle}>
      <Container style={containerStyle}>
        <EmailHeader heading={heading} />
        <Section style={contentSectionStyle}>{children}</Section>
        <EmailFooter supportEmail={supportEmail} signature={signature} />
      </Container>
    </Body>
  </Html>
);
