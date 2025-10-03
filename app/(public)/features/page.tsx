import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FeatureCard } from '@/components/marketing/features';
import { sortedFeatures } from '@/lib/marketing/features.data';

export const metadata: Metadata = {
  title: 'Features | SaaS Starter',
  description:
    'Explore how the SaaS Starter handles authentication, billing, email, testing, and design system workflows out of the box.',
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
    <main className="relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-1/4 top-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute -right-1/4 top-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl"
          aria-hidden="true"
        />
      </div>

      {/* Hero section with enhanced visuals */}
      <section className="page-container relative flex flex-col py-12 gap-4">
        <div className="flex flex-col items-start gap-4">
          <Badge
            variant="outline"
            className="group animate-in fade-in slide-in-from-bottom-2 border-primary/20 bg-primary/5 text-primary duration-700 rounded-sm"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5 transition-transform group-hover:rotate-12" />
            Product Tour
          </Badge>
          <h1 className="max-w-3xl animate-in fade-in slide-in-from-bottom-3 text-balance text-foreground duration-700 fill-mode-backwards delay-100 text-4xl font-semibold leading-tight tracking-tight">
            Feature deep dives engineered for{' '}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              launch-day confidence
            </span>
          </h1>
          <p className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 text-pretty text-lg text-muted-foreground duration-700 fill-mode-backwards delay-200 leading-relaxed">
            Discover how the SaaS Starter delivers authentication, billing,
            email, testing, and design system foundations without sacrificing
            quality or speed.
          </p>
        </div>

        {/* Enhanced highlight cards with stagger animation */}
        <div className="grid gap-4 gap-6 sm:grid-cols-2">
          {pageHighlights.map((highlight, index) => (
            <div
              key={highlight}
              className="group animate-in fade-in slide-in-from-bottom-5 flex items-start gap-2 rounded-lg border border-border/60 bg-gradient-to-br from-card/80 to-card/40 p-6 text-sm text-muted-foreground shadow-sm backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:border-primary/20 hover:shadow-md fill-mode-backwards"
              style={{
                animationDelay: `${300 + index * 100}ms`,
              }}
            >
              <span
                className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full shadow-sm transition-transform group-hover:scale-110 bg-primary"
                aria-hidden="true"
              />
              <span className="transition-colors group-hover:text-foreground">
                {highlight}
              </span>
            </div>
          ))}
        </div>

        {/* Enhanced CTA buttons */}
        <div className="animate-in fade-in slide-in-from-bottom-6 flex flex-col items-start gap-4 sm:flex-row fill-mode-backwards delay-500">
          <Button
            size="lg"
            className="group shadow-md transition-shadow hover:shadow-lg"
            asChild
          >
            <Link href="/pricing">
              View pricing
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="shadow-sm transition-shadow hover:shadow-md"
            asChild
          >
            <Link href="/docs">Browse documentation</Link>
          </Button>
        </div>
      </section>

      {/* Features grid section */}
      <section className="page-container relative flex flex-col py-12 gap-12">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl text-foreground text-3xl font-semibold leading-tight tracking-tight">
            Explore every cornerstone feature
          </h2>
          <p className="max-w-2xl text-base text-muted-foreground leading-relaxed">
            Each card links to an in-depth walkthrough covering technical docs,
            guardrails, and implementation patterns tailored to modern SaaS
            teams.
          </p>
        </div>

        {/* Staggered grid animation */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.slug}
              className="animate-in fade-in zoom-in-95 fill-mode-backwards"
              style={{
                animationDelay: `${index * 75}ms`,
                animationDuration: '500ms',
              }}
            >
              <FeatureCard
                feature={feature}
                href={`/features/${feature.slug}`}
                className="h-full"
                ctaLabel="View details"
              />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
