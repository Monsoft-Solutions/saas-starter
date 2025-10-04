import Link from 'next/link';
import { ArrowUpRight, Check } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { FeatureDefinition } from '@/lib/marketing/features.schema';

/**
 * Default heading displayed above the highlights list when no override is provided.
 */
const DEFAULT_HIGHLIGHT_HEADING = 'Key highlights';

/**
 * Default heading displayed above the related docs list when no override is provided.
 */
const DEFAULT_DOCS_HEADING = 'Learn more in the docs';

// These are now handled by Tailwind classes:
// borderRadius.cardLarge -> rounded-xl (12px)
// padding.cardPaddingLarge -> p-8 (32px)
// gap.elementGap -> gap-4 (16px)
// gap.sectionGap -> gap-12 (48px)
// gap.microGap -> gap-2 (8px)

/**
 * Props configuring the feature detail layout.
 */
export type FeatureDetailProps = {
  feature: FeatureDefinition;
  className?: string;
  highlightHeading?: string;
  docsHeading?: string;
};

/**
 * Full-width marketing feature narrative built from the shared feature registry.
 */
export function FeatureDetail({
  feature,
  className,
  highlightHeading = DEFAULT_HIGHLIGHT_HEADING,
  docsHeading = DEFAULT_DOCS_HEADING,
}: FeatureDetailProps) {
  return (
    <article
      className={cn(
        'group/detail relative overflow-hidden border border-border/60 bg-gradient-to-br from-card via-card/95 to-card/80 shadow-md backdrop-blur-sm transition-shadow duration-300 hover:shadow-lg',
        'flex flex-col rounded-xl p-8',
        className
      )}
    >
      {/* Subtle hover gradient effect */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/detail:opacity-100"
        style={{
          background:
            'radial-gradient(800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), hsl(var(--primary) / 0.03), transparent 50%)',
        }}
        aria-hidden="true"
      />

      <header className="relative flex flex-col gap-4">
        <Badge
          variant="outline"
          className="group/badge w-fit border-primary/30 bg-primary/10 text-primary transition-all duration-300 hover:border-primary/50 hover:bg-primary/15 rounded-sm"
        >
          <span className="transition-transform group-hover/badge:scale-105">
            {feature.label}
          </span>
        </Badge>
        <h1 className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-3xl font-semibold tracking-tight text-transparent">
          {feature.headline}
        </h1>
        <p className="text-lg leading-relaxed text-muted-foreground">
          {feature.summary}
        </p>
      </header>

      <div className="relative grid gap-12 md:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)]">
        <section className="flex flex-col gap-4">
          <h2 className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            <span
              className="h-px w-8 bg-gradient-to-r from-primary/60 to-transparent"
              aria-hidden="true"
            />
            {highlightHeading}
          </h2>
          <ul className="flex flex-col text-base leading-relaxed gap-4">
            {feature.highlightBullets.map((bullet, index) => (
              <li
                key={bullet}
                className="group/item flex items-start transition-all duration-200 hover:translate-x-1 gap-2"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <Check
                  className="mt-0.5 h-5 w-5 transition-all duration-300 group-hover/item:scale-110 group-hover/item:rotate-12"
                  style={{ color: 'var(--color-primary)' }}
                  aria-hidden="true"
                />
                <span className="transition-colors duration-200 group-hover/item:text-foreground">
                  {bullet}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <aside className="flex flex-col gap-4">
          <h2 className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            <span
              className="h-px w-8 bg-gradient-to-r from-primary/60 to-transparent"
              aria-hidden="true"
            />
            {docsHeading}
          </h2>
          <ul className="flex flex-col gap-4">
            {feature.primaryDocs.map((doc, index) => (
              <li
                key={doc.href}
                className="animate-in fade-in slide-in-from-right-2 fill-mode-backwards"
                style={{
                  animationDelay: `${200 + index * 100}ms`,
                  animationDuration: '400ms',
                }}
              >
                <Link
                  href={doc.href}
                  className={cn(
                    'group/link inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-primary transition-all duration-200',
                    'hover:bg-primary/10 hover:shadow-sm',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background'
                  )}
                >
                  <span className="transition-all group-hover/link:translate-x-0.5">
                    {doc.title}
                  </span>
                  <ArrowUpRight
                    className="h-4 w-4 transition-all duration-200 group-hover/link:translate-x-1 group-hover/link:-translate-y-1 group-focus-visible/link:translate-x-1 group-focus-visible/link:-translate-y-1"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </article>
  );
}
