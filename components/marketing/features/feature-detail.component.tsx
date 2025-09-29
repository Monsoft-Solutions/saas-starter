import Link from 'next/link';
import type { CSSProperties } from 'react';
import { ArrowUpRight, Check } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  cn,
  notionRadius,
  notionSpacing,
  themeUtils,
  typography,
} from '@/lib/design-system';
import type { FeatureDefinition } from '@/lib/marketing/features.schema';

/**
 * Default heading displayed above the highlights list when no override is provided.
 */
const DEFAULT_HIGHLIGHT_HEADING = 'Key highlights';

/**
 * Default heading displayed above the related docs list when no override is provided.
 */
const DEFAULT_DOCS_HEADING = 'Learn more in the docs';

const containerStyles: CSSProperties = {
  borderRadius: notionRadius.cardLarge,
  padding: notionSpacing.cardPaddingLarge,
};

const headerSpacing: CSSProperties = {
  gap: notionSpacing.elementGap,
};

const contentGrid: CSSProperties = {
  gap: notionSpacing.sectionGap,
};

const listSpacing: CSSProperties = {
  gap: notionSpacing.elementGap,
};

const listItemSpacing: CSSProperties = {
  gap: notionSpacing.microGap,
};

const docsListSpacing: CSSProperties = {
  gap: notionSpacing.elementGap,
};

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
        'border border-border/60 bg-card/70 shadow-sm backdrop-blur-sm',
        'flex flex-col',
        className
      )}
      style={containerStyles}
    >
      <header className="flex flex-col" style={headerSpacing}>
        <Badge
          variant="outline"
          className="w-fit bg-muted/70 text-muted-foreground"
          style={{ borderRadius: notionRadius.badge }}
        >
          {feature.label}
        </Badge>
        <h1
          className="text-3xl font-semibold tracking-tight text-foreground"
          style={{
            fontSize: typography.fontSizes['3xl'],
            lineHeight: typography.lineHeights.tight,
            letterSpacing: typography.letterSpacing.tight,
            fontWeight: typography.fontWeights.semibold,
          }}
        >
          {feature.headline}
        </h1>
        <p
          className="text-lg leading-relaxed text-muted-foreground"
          style={{
            fontSize: typography.fontSizes.xl,
            lineHeight: typography.lineHeights.relaxed,
          }}
        >
          {feature.summary}
        </p>
      </header>

      <div
        className="grid md:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)]"
        style={contentGrid}
      >
        <section className="flex flex-col" style={listSpacing}>
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {highlightHeading}
          </h2>
          <ul
            className="flex flex-col text-base leading-relaxed"
            style={listSpacing}
          >
            {feature.highlightBullets.map((bullet) => (
              <li
                key={bullet}
                className="flex items-start"
                style={listItemSpacing}
              >
                <Check
                  className="mt-0.5 h-5 w-5"
                  style={{ color: themeUtils.getColorValue('primary') }}
                  aria-hidden="true"
                />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </section>

        <aside className="flex flex-col" style={docsListSpacing}>
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {docsHeading}
          </h2>
          <ul className="flex flex-col" style={docsListSpacing}>
            {feature.primaryDocs.map((doc) => (
              <li key={doc.href}>
                <Link
                  href={doc.href}
                  className={cn(
                    'group inline-flex items-center text-sm font-medium text-primary',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background'
                  )}
                  style={listItemSpacing}
                >
                  <span>{doc.title}</span>
                  <ArrowUpRight
                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5"
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
