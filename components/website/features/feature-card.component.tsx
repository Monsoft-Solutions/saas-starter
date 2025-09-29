import Link from 'next/link';
import type { CSSProperties } from 'react';
import { ArrowUpRight, Check } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  cn,
  notionRadius,
  notionSpacing,
  themeUtils,
} from '@/lib/design-system';
import type { FeatureDefinition } from '@/lib/marketing/features.schema';

/**
 * Default call-to-action label surfaced when the feature card is rendered as a link.
 */
const DEFAULT_CTA_LABEL = 'Explore feature';

const highlightListStyles: CSSProperties = {
  gap: notionSpacing.elementGap,
};

const highlightItemStyles: CSSProperties = {
  gap: notionSpacing.microGap,
};

const cardContentStyles: CSSProperties = {
  gap: notionSpacing.elementGap,
};

const ctaStyles: CSSProperties = {
  gap: notionSpacing.microGap,
};

/**
 * Props describing how the reusable feature card should render within marketing grids.
 */
export type FeatureCardProps = {
  feature: FeatureDefinition;
  href?: string;
  className?: string;
  cardClassName?: string;
  ctaLabel?: string;
};

/**
 * Marketing feature card presenting a concise summary, highlight bullets, and optional CTA.
 */
export function FeatureCard({
  feature,
  href,
  className,
  cardClassName,
  ctaLabel = DEFAULT_CTA_LABEL,
}: FeatureCardProps) {
  const content = (
    <Card
      className={cn(
        'h-full overflow-hidden border-border/60 transition-transform duration-200',
        'group-data-[interactive=true]:group-hover:-translate-y-1 group-data-[interactive=true]:group-hover:shadow-lg',
        'group-data-[interactive=true]:group-focus-visible:-translate-y-1 group-data-[interactive=true]:group-focus-visible:shadow-lg',
        cardClassName
      )}
      style={{
        borderRadius: notionRadius.cardLarge,
      }}
    >
      <CardHeader
        className="gap-3"
        style={{
          rowGap: notionSpacing.elementGap,
        }}
      >
        <Badge
          variant="outline"
          style={{
            borderRadius: notionRadius.badge,
          }}
          className="w-fit bg-muted/70 text-muted-foreground"
        >
          {feature.label}
        </Badge>
        <CardTitle className="text-2xl leading-tight tracking-tight">
          {feature.headline}
        </CardTitle>
        <CardDescription className="text-base leading-relaxed text-muted-foreground">
          {feature.summary}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col" style={cardContentStyles}>
        <ul
          className="flex flex-col text-sm leading-relaxed text-muted-foreground"
          style={highlightListStyles}
        >
          {feature.highlightBullets.map((bullet) => (
            <li
              key={bullet}
              className="flex items-start"
              style={highlightItemStyles}
            >
              <Check
                className="mt-0.5 h-4 w-4"
                style={{ color: themeUtils.getColorValue('primary') }}
                aria-hidden="true"
              />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
        {href && (
          <div
            className="mt-auto flex items-center text-sm font-medium text-primary"
            style={ctaStyles}
          >
            <span>{ctaLabel}</span>
            <ArrowUpRight
              className="h-4 w-4 transition-transform duration-200 group-data-[interactive=true]:group-hover:translate-x-0.5 group-data-[interactive=true]:group-focus-visible:translate-x-0.5"
              aria-hidden="true"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (!href) {
    return (
      <div
        className={cn('group block h-full', className)}
        data-interactive="false"
        style={{ borderRadius: notionRadius.cardLarge }}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      aria-label={`View details for ${feature.label}`}
      className={cn(
        'group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className
      )}
      data-interactive="true"
      style={{ borderRadius: notionRadius.cardLarge }}
    >
      {content}
    </Link>
  );
}
