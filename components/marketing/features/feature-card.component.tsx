import Link from 'next/link';
import { ArrowUpRight, Check } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { FeatureDefinition } from '@/lib/marketing/features.schema';

/**
 * Default CTA label rendered when the feature card links to a detail page.
 */
const DEFAULT_CTA_LABEL = 'Explore feature';

// These are now handled by Tailwind classes
// gap: notionSpacing.elementGap (16px) -> gap-4
// gap: notionSpacing.microGap (8px) -> gap-2

/**
 * Props describing how a feature card should render within marketing grids.
 */
export type FeatureCardProps = {
  feature: FeatureDefinition;
  href?: string;
  className?: string;
  cardClassName?: string;
  ctaLabel?: string;
};

/**
 * Marketing feature card summarizing a feature pillar with highlight bullets and optional CTA.
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
        'group/card relative h-full overflow-hidden border-border/60 bg-gradient-to-br from-card via-card to-card/80 transition-all duration-300',
        'group-data-[interactive=true]:group-hover:-translate-y-2 group-data-[interactive=true]:group-hover:shadow-xl group-data-[interactive=true]:group-hover:border-primary/30',
        'group-data-[interactive=true]:group-focus-visible:-translate-y-2 group-data-[interactive=true]:group-focus-visible:shadow-xl group-data-[interactive=true]:group-focus-visible:border-primary/30',
        'rounded-xl', // 12px (notionRadius.cardLarge equivalent)
        cardClassName
      )}
    >
      {/* Hover gradient effect */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-data-[interactive=true]:group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), hsl(var(--primary) / 0.05), transparent 40%)',
        }}
        aria-hidden="true"
      />

      <CardHeader className="relative gap-4">
        <Badge
          variant="outline"
          className={cn(
            'w-fit bg-muted/70 text-muted-foreground transition-all duration-300 group-data-[interactive=true]:group-hover:border-primary/40 group-data-[interactive=true]:group-hover:bg-primary/10 group-data-[interactive=true]:group-hover:text-primary rounded-sm',
            className
          )}
        >
          {feature.label}
        </Badge>
        <CardTitle className="text-2xl leading-tight tracking-tight transition-colors duration-300 group-data-[interactive=true]:group-hover:text-primary">
          {feature.headline}
        </CardTitle>
        <CardDescription className="text-base leading-relaxed text-muted-foreground transition-colors duration-300 group-data-[interactive=true]:group-hover:text-foreground/80">
          {feature.summary}
        </CardDescription>
      </CardHeader>
      <CardContent className="relative flex flex-1 flex-col gap-4">
        <ul className="flex flex-col text-sm leading-relaxed text-muted-foreground gap-4">
          {feature.highlightBullets.map((bullet, index) => (
            <li
              key={bullet}
              className="group/item flex items-start transition-all duration-200 gap-2"
              style={{
                transitionDelay: `${index * 50}ms`,
              }}
            >
              <Check
                className="mt-0.5 h-4 w-4 transition-all duration-300 group-data-[interactive=true]:group-hover:scale-110"
                style={{ color: 'var(--color-primary)' }}
                aria-hidden="true"
              />
              <span className="transition-colors duration-200 group-data-[interactive=true]:group-hover:text-foreground/90">
                {bullet}
              </span>
            </li>
          ))}
        </ul>
        {href && (
          <div className="mt-auto flex items-center text-sm font-medium text-primary transition-all duration-300 group-data-[interactive=true]:group-hover:translate-x-1 gap-2">
            <span>{ctaLabel}</span>
            <ArrowUpRight
              className="h-4 w-4 transition-all duration-300 group-data-[interactive=true]:group-hover:translate-x-1 group-data-[interactive=true]:group-hover:-translate-y-0.5 group-data-[interactive=true]:group-focus-visible:translate-x-1 group-data-[interactive=true]:group-focus-visible:-translate-y-0.5"
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
        className={cn('group block h-full rounded-xl', className)}
        data-interactive="false"
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
        'group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xl',
        className
      )}
      data-interactive="true"
    >
      {content}
    </Link>
  );
}
