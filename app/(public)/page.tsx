import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  CreditCard,
  Database,
  Zap,
  Shield,
  Globe,
  Users,
  Sparkles,
  CheckCircle,
  Github,
  ExternalLink,
} from 'lucide-react';
import { Terminal } from './terminal';
import { cn } from '@/lib/design-system';

export default function HomePage() {
  const features = [
    {
      icon: Zap,
      title: 'Next.js 15 & React',
      description:
        'Built with the latest Next.js App Router and React Server Components for optimal performance and developer experience.',
      color: 'text-orange-500',
    },
    {
      icon: Database,
      title: 'PostgreSQL & Drizzle ORM',
      description:
        'Type-safe database operations with Drizzle ORM and PostgreSQL for robust data management.',
      color: 'text-blue-500',
    },
    {
      icon: CreditCard,
      title: 'Complete Stripe Integration',
      description:
        'Full subscription management, customer portal, and webhook handling for seamless payments.',
      color: 'text-purple-500',
    },
    {
      icon: Shield,
      title: 'Enterprise Authentication',
      description:
        'BetterAuth with multi-provider OAuth, organizations, and role-based access control.',
      color: 'text-green-500',
    },
    {
      icon: Globe,
      title: 'Production Ready',
      description:
        'Professional email templates, monitoring, logging, and deployment configurations included.',
      color: 'text-indigo-500',
    },
    {
      icon: Users,
      title: 'Multi-tenant Architecture',
      description:
        'Built-in organization management with member invitations and role-based permissions.',
      color: 'text-pink-500',
    },
  ];

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
              A complete, production-ready foundation with enterprise features
              and modern architecture.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative p-8 bg-card rounded-xl border border-border/50 shadow-sm hover:shadow-md transition-all duration-200 hover:border-border"
              >
                {/* Icon */}
                <div
                  className={cn(
                    'flex items-center justify-center w-12 h-12 rounded-lg mb-6 transition-transform group-hover:scale-110',
                    'bg-gradient-to-br from-background to-muted border border-border/50'
                  )}
                >
                  <feature.icon className={cn('w-6 h-6', feature.color)} />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-foreground mb-3 leading-tight">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
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
