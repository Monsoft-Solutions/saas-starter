'use client';

import { SWRConfig } from 'swr';
import type { SWRConfiguration } from 'swr';

type SWRProviderProps = {
  children: React.ReactNode;
  value: SWRConfiguration;
};

export function SWRProvider({ children, value }: SWRProviderProps) {
  return <SWRConfig value={value}>{children}</SWRConfig>;
}
