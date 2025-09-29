import type { Metadata } from 'next';
import Link from 'next/link';
import type { CSSProperties } from 'react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FeatureCard } from '@/components/marketing/features';
import { sortedFeatures } from '@/lib/marketing/features.data';
import {
  notionRadius,
  notionSpacing,
  themeUtils,
  typography,
} from '@/lib/design-system';

export const metadata: Metadata = {
  title: 'Features | SaaS Starter',
  description:
    'Explore how the SaaS Starter handles authentication, billing, email, testing, and design system workflows out of the box.',
};

const heroStyles: CSSProperties = {
  paddingBlock: notionSpacing.sectionGap,
  gap: notionSpacing.elementGap,
};

const heroBadgeStyles: CSSProperties = {
  borderRadius: notionRadius.badge,
};

const heroTitleStyles: CSSProperties = {
  fontSize: typography.fontSizes['4xl'],
  lineHeight: typography.lineHeights.tight,
  letterSpacing: typography.letterSpacing.tight,
  fontWeight: typography.fontWeights.semibold,
};

const heroHighlightListStyles: CSSProperties = {
  gap: notionSpacing.elementGap,
};

const heroHighlightItemStyles: CSSProperties = {
  gap: notionSpacing.microGap,
};

const heroActionsStyles: CSSProperties = {
  gap: notionSpacing.elementGap,
};

const featureSectionStyles: CSSProperties = {
  paddingBlock: notionSpacing.sectionGap,
  gap: notionSpacing.sectionGap,
};

const featureGridStyles: CSSProperties = {
  gap: notionSpacing.componentGap,
};

/**
 * Marketing features landing page showing highlights and deep dives for each capability.
 */
export default function FeaturesPage() {
  const features = sortedFeatures();

  const pageHighlights = [
    'Feature pillars map directly to the technical docs, so teams can dive deeper instantly.',
    'Reusable UI components keep marketing and product experiences visually aligned.',
    'Every feature ships with guardrails for accessibility, testing, and multi-tenant readiness.',
  ];

  return (
    <main>
      <section className="page-container flex flex-col" style={heroStyles}>
        <div
          className="flex flex-col items-start"
          style={{ gap: notionSpacing.elementGap }}
        >
          <Badge
            variant="outline"
            className="bg-muted/70 text-muted-foreground"
            style={heroBadgeStyles}
          >
            Product Tour
          </Badge>
          <h1
            className="max-w-3xl text-balance text-foreground"
            style={heroTitleStyles}
          >
            Feature deep dives engineered for launch-day confidence
          </h1>
          <p
            className="max-w-2xl text-pretty text-lg text-muted-foreground"
            style={{ lineHeight: typography.lineHeights.relaxed }}
          >
            Discover how the SaaS Starter delivers authentication, billing,
            email, testing, and design system foundations without sacrificing
            quality or speed.
          </p>
        </div>

        <div
          className="grid gap-6 sm:grid-cols-2"
          style={heroHighlightListStyles}
        >
          {pageHighlights.map((highlight) => (
            <div
              key={highlight}
              className="flex items-start rounded-xl border border-border/60 bg-card/60 p-6 text-sm text-muted-foreground shadow-sm"
              style={{
                ...heroHighlightItemStyles,
                borderRadius: notionRadius.card,
              }}
            >
              <span
                className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full"
                style={{ backgroundColor: themeUtils.getColorValue('primary') }}
                aria-hidden="true"
              />
              <span>{highlight}</span>
            </div>
          ))}
        </div>

        <div
          className="flex flex-col items-start sm:flex-row"
          style={heroActionsStyles}
        >
          <Button size="lg" asChild>
            <Link href="/pricing">View pricing</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/docs">Browse documentation</Link>
          </Button>
        </div>
      </section>

      <section
        className="page-container flex flex-col"
        style={featureSectionStyles}
      >
        <div className="flex flex-col" style={{ gap: notionSpacing.microGap }}>
          <h2
            className="text-3xl text-foreground"
            style={{
              fontSize: typography.fontSizes['3xl'],
              lineHeight: typography.lineHeights.tight,
              letterSpacing: typography.letterSpacing.tight,
            }}
          >
            Explore every cornerstone feature
          </h2>
          <p
            className="max-w-2xl text-base text-muted-foreground"
            style={{ lineHeight: typography.lineHeights.relaxed }}
          >
            Each card links to an in-depth walkthrough covering technical docs,
            guardrails, and implementation patterns tailored to modern SaaS
            teams.
          </p>
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
          style={featureGridStyles}
        >
          {features.map((feature) => (
            <FeatureCard
              key={feature.slug}
              feature={feature}
              href={`/features/${feature.slug}`}
              className="h-full"
              ctaLabel="View details"
            />
          ))}
        </div>
      </section>
    </main>
  );
}
