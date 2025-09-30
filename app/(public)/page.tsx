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
  Zap,
  Shield,
  Rocket,
} from 'lucide-react';
import { Terminal } from './terminal';
import { sortedFeatures } from '@/lib/marketing/features.data';
import { AnimatedWordSwap } from '@/components/marketing/animated-word-swap.component';
import { ScrollReveal } from '@/components/marketing/scroll-reveal.component';
import { StatsCounter } from '@/components/marketing/stats-counter.component';
import { FloatingCard } from '@/components/marketing/floating-card.component';

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

  const swappingWords = [
    'Faster Than Ever',
    'With Confidence',
    'Like a Pro',
    'At Scale',
  ];

  return (
    <main className="relative">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 sm:pt-24 sm:pb-20 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />
        <div className="absolute inset-0 bg-grid-foreground/[0.02] bg-[size:60px_60px]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-12 lg:items-center">
            <div className="lg:col-span-6">
              {/* Badge */}
              <ScrollReveal direction="down" delay={0}>
                <div className="flex items-center gap-2 mb-8">
                  <Badge
                    variant="secondary"
                    className="px-3 py-1 text-sm font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors"
                  >
                    <Sparkles className="w-3 h-3 mr-1 animate-pulse" />
                    Enterprise SaaS Starter
                  </Badge>
                </div>
              </ScrollReveal>

              {/* Headline */}
              <ScrollReveal direction="up" delay={100}>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
                  Build Your SaaS
                  <span className="block mt-2">
                    <AnimatedWordSwap
                      words={swappingWords}
                      className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent"
                    />
                  </span>
                </h1>
              </ScrollReveal>

              {/* Description */}
              <ScrollReveal direction="up" delay={200}>
                <p className="mt-6 text-xl leading-relaxed text-muted-foreground max-w-2xl">
                  Launch your SaaS product in record time with our
                  production-ready template. Packed with enterprise features,
                  modern technologies, and essential integrations.
                </p>
              </ScrollReveal>

              {/* Highlights */}
              <ScrollReveal direction="up" delay={300}>
                <div className="mt-8 grid grid-cols-2 gap-3">
                  {highlights.map((highlight, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm text-foreground group hover:text-primary transition-colors"
                    >
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 group-hover:scale-110 transition-transform" />
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>
              </ScrollReveal>

              {/* CTA Buttons */}
              <ScrollReveal direction="up" delay={400}>
                <div className="mt-10 flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    className="text-base px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all group"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-base px-8 py-3 rounded-lg border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                    asChild
                  >
                    <a
                      href="https://github.com/Monsoft-Solutions/saas-starter"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Github className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                      View on GitHub
                    </a>
                  </Button>
                </div>
              </ScrollReveal>
            </div>

            {/* Terminal Demo */}
            <div className="mt-16 lg:mt-0 lg:col-span-6">
              <ScrollReveal direction="left" delay={200}>
                <FloatingCard intensity={5}>
                  <div className="relative">
                    <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-transparent to-accent/20 rounded-2xl blur-2xl" />
                    <div className="relative">
                      <Terminal />
                    </div>
                  </div>
                </FloatingCard>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Section Header */}
          <ScrollReveal direction="up" threshold={0.2}>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Everything you need to build a modern SaaS
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Each pillar links directly to deep-dive documentation so you can
                validate the implementation details before adopting the stack.
              </p>
              <div className="mt-6 flex justify-center">
                <Button
                  asChild
                  variant="secondary"
                  className="group hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all"
                >
                  <Link href="/features">
                    Explore all features
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </div>
          </ScrollReveal>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <ScrollReveal
                key={feature.slug}
                direction="up"
                delay={index * 100}
                threshold={0.1}
              >
                <FeatureCard
                  feature={feature}
                  href={`/features/${feature.slug}`}
                  className="h-full"
                  ctaLabel="View feature"
                />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <ScrollReveal direction="up">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Why choose our starter?
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Built with best practices and enterprise-grade architecture
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ScrollReveal direction="up" delay={0}>
              <div className="group p-8 rounded-2xl border border-border/50 bg-card hover:border-primary/30 hover:shadow-lg transition-all">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
                <p className="text-muted-foreground">
                  Built on Next.js 15 with Turbopack for blazing fast
                  development and optimal production performance.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <div className="group p-8 rounded-2xl border border-border/50 bg-card hover:border-primary/30 hover:shadow-lg transition-all">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Enterprise Security
                </h3>
                <p className="text-muted-foreground">
                  BetterAuth integration with multi-factor authentication,
                  session management, and OAuth providers.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={200}>
              <div className="group p-8 rounded-2xl border border-border/50 bg-card hover:border-primary/30 hover:shadow-lg transition-all">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Rocket className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Production Ready</h3>
                <p className="text-muted-foreground">
                  Complete CI/CD setup, monitoring, error tracking, and
                  deployment scripts for immediate launch.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-background via-background to-muted/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <ScrollReveal direction="up">
            <FloatingCard intensity={3}>
              <div className="relative bg-card rounded-2xl border border-border/50 shadow-lg overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-grid-foreground/[0.02] bg-[size:32px_32px]" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />

                <div className="relative p-8 sm:p-12 lg:p-16">
                  <div className="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
                    <div>
                      <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6 leading-tight">
                        Ready to launch your SaaS?
                      </h2>
                      <p className="text-xl text-muted-foreground leading-relaxed mb-8">
                        Stop building boilerplate and start building features.
                        Our enterprise-grade template gives you everything you
                        need to focus on what makes your product unique.
                      </p>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-3 gap-6 mb-8">
                        <StatsCounter
                          value={10}
                          suffix="+"
                          label="Integrations"
                        />
                        <StatsCounter
                          value={100}
                          suffix="%"
                          label="TypeScript"
                        />
                        <StatsCounter
                          value={24}
                          suffix="/7"
                          label="Production Ready"
                        />
                      </div>
                    </div>

                    <div className="mt-8 lg:mt-0 flex flex-col gap-4">
                      <Button
                        size="lg"
                        className="text-base px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all group"
                        asChild
                      >
                        <a
                          href="https://vercel.com/templates/next.js/next-js-saas-starter"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Deploy to Vercel
                          <ExternalLink className="ml-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                        </a>
                      </Button>

                      <Button
                        size="lg"
                        variant="outline"
                        className="text-base px-8 py-3 rounded-lg border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                        asChild
                      >
                        <a
                          href="https://github.com/Monsoft-Solutions/saas-starter"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Github className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                          View Documentation
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </FloatingCard>
          </ScrollReveal>
        </div>
      </section>
    </main>
  );
}
