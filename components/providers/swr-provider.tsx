'use client';

import { SWRConfig } from 'swr';
import type { SWRConfiguration } from 'swr';
import { swrGlobalConfig } from '@/lib/api/swr-config';

type SWRProviderProps = {
  children: React.ReactNode;
  value?: Partial<SWRConfiguration>; // Only accept partial/serializable config like fallback
};

export function SWRProvider({ children, value = {} }: SWRProviderProps) {
  // Merge global config with passed value (e.g., fallback)
  const config: SWRConfiguration = {
    ...swrGlobalConfig,
    ...value,
  };

  return <SWRConfig value={config}>{children}</SWRConfig>;
}
