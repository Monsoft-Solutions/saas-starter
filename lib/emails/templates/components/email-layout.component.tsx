import React from 'react';
import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Tailwind,
} from '@react-email/components';
import type { ReactNode } from 'react';

import { DEFAULT_BRAND_SIGNATURE } from '../constants';
import { EmailFooter } from './email-footer.component';
import { EmailHeader } from './email-header.component';

/**
 * Tailwind configuration for email rendering.
 * Uses pixel-based measurements for email client compatibility.
 */
const tailwindConfig = {
  theme: {
    extend: {
      colors: {
        background: '#ffffff',
        foreground: '#37352f',
        card: '#ffffff',
        'card-foreground': '#37352f',
        primary: '#2e3440',
        'primary-foreground': '#ffffff',
        secondary: '#fbfaf9',
        'secondary-foreground': '#37352f',
        muted: '#f7f6f3',
        'muted-foreground': '#787066',
        accent: '#f1f0ee',
        'accent-foreground': '#37352f',
        border: '#e9e5e2',
      },
    },
  },
};

export type EmailLayoutProps = {
  children: ReactNode;
  heading: string;
  previewText?: string;
  supportEmail?: string;
  signature?: string;
};

/**
 * Shared structural layout used by all transactional email templates.
 * Uses React Email's Tailwind component to automatically inline styles for email client compatibility.
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
    <Tailwind config={tailwindConfig}>
      <Body className="bg-background text-foreground font-sans m-0 p-8">
        <Container className="w-full max-w-[600px] mx-auto p-8 bg-card rounded-2xl shadow-lg">
          <EmailHeader heading={heading} />
          <Section className="py-6">{children}</Section>
          <EmailFooter supportEmail={supportEmail} signature={signature} />
        </Container>
      </Body>
    </Tailwind>
  </Html>
);
