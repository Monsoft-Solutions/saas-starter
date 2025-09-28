import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateOrganizationSlug(name: string): string {
  const normalized = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

  const base = normalized.length > 0 ? normalized : 'organization';
  const randomSegment =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().split('-')[0]
      : Math.random().toString(36).slice(2, 10);

  return `${base}-${randomSegment}`.slice(0, 48);
}
