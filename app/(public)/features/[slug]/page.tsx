import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { CSSProperties } from 'react';
import { ChevronRight } from 'lucide-react';

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
    <div className="page-container flex flex-col" style={pageStyles}>
      <nav
        className="flex items-center text-sm text-muted-foreground"
        aria-label="Breadcrumb"
        style={breadcrumbStyles}
      >
        <Link
          href={featuresHref}
          className="transition-colors hover:text-foreground"
          style={breadcrumbLabelStyles}
        >
          Features
        </Link>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        <span className="text-foreground" style={breadcrumbLabelStyles}>
          {feature.label}
        </span>
      </nav>
      <FeatureDetail feature={feature} />
    </div>
  );
}
