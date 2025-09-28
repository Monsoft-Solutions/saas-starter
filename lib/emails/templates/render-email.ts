import { render } from '@react-email/render';
import type { ReactElement } from 'react';

export type RenderedEmail = {
  html: string;
  text: string;
};

/**
 * Transforms a React email component into HTML and plaintext variants.
 */
export const renderEmail = async (
  component: ReactElement
): Promise<RenderedEmail> => ({
  html: await render(component),
  text: await render(component, { plainText: true }),
});
