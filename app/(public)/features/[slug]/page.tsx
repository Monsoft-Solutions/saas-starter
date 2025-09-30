import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { CSSProperties } from 'react';
import { ChevronRight, Home } from 'lucide-react';

import { FeatureDetail } from '@/components/marketing/features';
import { notionSpacing, typography } from '@/lib/design-system';
import { FEATURES, getFeatureBySlug } from '@/lib/marketing/features.data';
import {
  FEATURE_SLUGS,
  type FeatureDefinition,
} from '@/lib/marketing/features.schema';
import { resolveRoute } from '@/lib/navigation/resolve-route.util';

const pageStyles: CSSProperties = {
  paddingBlock: notionSpacing.sectionGap,
  gap: notionSpacing.sectionGap,
};

const breadcrumbStyles: CSSProperties = {
  gap: notionSpacing.microGap,
};

const breadcrumbLabelStyles: CSSProperties = {
  fontSize: typography.fontSizes.sm,
};

const featureSlugSet = new Set<string>([...FEATURE_SLUGS]);

/**
 * Resolves incoming feature slugs against the registry, bubbles invalid ones to a 404.
 */
function resolveFeatureOrNotFound(slugParam: string): FeatureDefinition {
  if (!featureSlugSet.has(slugParam)) {
    notFound();
  }

  return getFeatureBySlug(slugParam as FeatureDefinition['slug']);
}

/**
 * Static params ensure each feature detail is prerendered at build time.
 */
export function generateStaticParams() {
  return FEATURES.map((feature) => ({ slug: feature.slug }));
}

/**
 * Supplies SEO metadata for each feature detail page from the shared registry.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const feature = resolveFeatureOrNotFound(slug);
  const detailPath = `${resolveRoute('marketing.features')}/${feature.slug}`;
  const title = `${feature.label} | SaaS Starter Features`;

  return {
    title,
    description: feature.summary,
    alternates: {
      canonical: detailPath,
    },
    openGraph: {
      title,
      description: feature.summary,
      url: detailPath,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: feature.summary,
    },
  };
}

/**
 * Feature detail view that surfaces registry content with breadcrumb navigation.
 */
export default async function FeatureDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const feature = resolveFeatureOrNotFound(slug);
  const featuresHref = resolveRoute('marketing.features');

  return (
    <div className="page-container relative flex flex-col" style={pageStyles}>
      {/* Background gradient effects */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -left-1/3 top-0 h-96 w-96 animate-pulse rounded-full bg-primary/5 blur-3xl"
          style={{ animationDuration: '4s' }}
          aria-hidden="true"
        />
        <div
          className="absolute -right-1/3 top-1/3 h-96 w-96 animate-pulse rounded-full bg-primary/5 blur-3xl"
          style={{ animationDuration: '6s', animationDelay: '1s' }}
          aria-hidden="true"
        />
      </div>

      {/* Enhanced breadcrumb navigation */}
      <nav
        className="animate-in fade-in slide-in-from-bottom-2 flex items-center text-sm text-muted-foreground duration-500"
        aria-label="Breadcrumb"
        style={breadcrumbStyles}
      >
        <Link
          href="/"
          className="group inline-flex items-center gap-1.5 rounded-md px-2 py-1 transition-all hover:bg-muted/50 hover:text-foreground"
          style={breadcrumbLabelStyles}
        >
          <Home className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
          <span>Home</span>
        </Link>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        <Link
          href={featuresHref}
          className="rounded-md px-2 py-1 transition-all hover:bg-muted/50 hover:text-foreground"
          style={breadcrumbLabelStyles}
        >
          Features
        </Link>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        <span
          className="rounded-md bg-primary/10 px-2 py-1 font-medium text-foreground"
          style={breadcrumbLabelStyles}
        >
          {feature.label}
        </span>
      </nav>

      {/* Animated feature detail */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-backwards delay-100">
        <FeatureDetail feature={feature} />
      </div>
    </div>
  );
}
