import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FeatureCard } from '@/components/marketing/features';
import {
  ArrowRight,
  Sparkles,
  CheckCircle,
  Github,
  ExternalLink,
} from 'lucide-react';
import { Terminal } from './terminal';
import { sortedFeatures } from '@/lib/marketing/features.data';

export default function HomePage() {
  const features = sortedFeatures();
  const highlights = [
    'Enterprise-grade authentication',
    'Complete payment processing',
    'Multi-tenant organizations',
    'Professional email system',
    'Modern design system',
    'Production-ready deployment',
  ];

  return (
    <main className="relative">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 sm:pt-24 sm:pb-20 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />
        <div className="absolute inset-0 bg-grid-foreground/[0.02] bg-[size:60px_60px]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-12 lg:items-center">
            <div className="lg:col-span-6">
              {/* Badge */}
              <div className="flex items-center gap-2 mb-8">
                <Badge
                  variant="secondary"
                  className="px-3 py-1 text-sm font-medium bg-primary/10 text-primary border-primary/20"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Enterprise SaaS Starter
                </Badge>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
                Build Your SaaS
                <span className="block bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                  Faster Than Ever
                </span>
              </h1>

              {/* Description */}
              <p className="mt-6 text-xl leading-relaxed text-muted-foreground max-w-2xl">
                Launch your SaaS product in record time with our
                production-ready template. Packed with enterprise features,
                modern technologies, and essential integrations.
              </p>

              {/* Highlights */}
              <div className="mt-8 grid grid-cols-2 gap-3">
                {highlights.map((highlight, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm text-foreground"
                  >
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="text-base px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base px-8 py-3 rounded-lg border-border/50 hover:border-border transition-all"
                  asChild
                >
                  <a
                    href="https://github.com/Monsoft-Solutions/saas-starter"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="mr-2 h-5 w-5" />
                    View on GitHub
                  </a>
                </Button>
              </div>
            </div>

            {/* Terminal Demo */}
            <div className="mt-16 lg:mt-0 lg:col-span-6">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-transparent to-accent/20 rounded-2xl blur-2xl" />
                <div className="relative">
                  <Terminal />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Everything you need to build a modern SaaS
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Each pillar links directly to deep-dive documentation so you can
              validate the implementation details before adopting the stack.
            </p>
            <div className="mt-6 flex justify-center">
              <Button asChild variant="secondary">
                <Link href="/features">Explore all features</Link>
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <FeatureCard
                key={feature.slug}
                feature={feature}
                href={`/features/${feature.slug}`}
                className="h-full"
                ctaLabel="View feature"
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-background via-background to-muted/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="relative bg-card rounded-2xl border border-border/50 shadow-lg overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-grid-foreground/[0.02] bg-[size:32px_32px]" />

            <div className="relative p-8 sm:p-12 lg:p-16">
              <div className="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6 leading-tight">
                    Ready to launch your SaaS?
                  </h2>
                  <p className="text-xl text-muted-foreground leading-relaxed mb-8">
                    Stop building boilerplate and start building features. Our
                    enterprise-grade template gives you everything you need to
                    focus on what makes your product unique.
                  </p>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-6 mb-8">
                    <div className="text-center lg:text-left">
                      <div className="text-2xl font-bold text-primary">10+</div>
                      <div className="text-sm text-muted-foreground">
                        Integrations
                      </div>
                    </div>
                    <div className="text-center lg:text-left">
                      <div className="text-2xl font-bold text-primary">
                        100%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        TypeScript
                      </div>
                    </div>
                    <div className="text-center lg:text-left">
                      <div className="text-2xl font-bold text-primary">
                        24/7
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Production Ready
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 lg:mt-0 flex flex-col gap-4">
                  <Button
                    size="lg"
                    className="text-base px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all"
                    asChild
                  >
                    <a
                      href="https://vercel.com/templates/next.js/next-js-saas-starter"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Deploy to Vercel
                      <ExternalLink className="ml-2 h-5 w-5" />
                    </a>
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    className="text-base px-8 py-3 rounded-lg border-border/50 hover:border-border transition-all"
                    asChild
                  >
                    <a
                      href="https://github.com/Monsoft-Solutions/saas-starter"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Github className="mr-2 h-5 w-5" />
                      View Documentation
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
