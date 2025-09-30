import { PricingPlansServer } from '@/components/payments';
import { getServerContext } from '@/lib/auth/server-context';
import { ScrollReveal } from '@/components/marketing/scroll-reveal.component';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Sparkles, Zap } from 'lucide-react';

// Dynamic page to fetch live Stripe data and user session
export const revalidate = 3600;
export const dynamic = 'force-dynamic';

export default async function PricingPage() {
  // Get the current user session (will be null if not authenticated)
  const context = await getServerContext();

  const user = context?.user ?? null;

  const benefits = [
    'Cancel anytime',
    '24/7 Support',
    'All features included',
    'Free trial period',
  ];

  return (
    <main className="relative min-h-screen">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />
      <div className="absolute inset-0 bg-grid-foreground/[0.02] bg-[size:60px_60px]" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />

      {/* Content */}
      <div className="relative py-20 sm:py-24">
        <div className="page-container">
          {/* Header Section */}
          <div className="text-center mb-16">
            <ScrollReveal direction="down" delay={0}>
              <div className="flex items-center justify-center gap-2 mb-6">
                <Badge
                  variant="secondary"
                  className="px-3 py-1 text-sm font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors"
                >
                  <Sparkles className="w-3 h-3 mr-1 animate-pulse" />
                  Simple, transparent pricing
                </Badge>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                Choose Your{' '}
                <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                  Perfect Plan
                </span>
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={200}>
              <p className="text-xl leading-relaxed text-muted-foreground max-w-3xl mx-auto mb-8">
                Select the plan that best fits your needs. All plans include a
                free trial period so you can explore all features risk-free.
              </p>
            </ScrollReveal>

            {user && (
              <ScrollReveal direction="up" delay={300}>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                  <Zap className="w-4 h-4" />
                  <p className="text-sm font-medium">
                    Welcome back, {user.name || user.email}!
                  </p>
                </div>
              </ScrollReveal>
            )}

            {/* Benefits Grid */}
            <ScrollReveal direction="up" delay={400}>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm text-foreground group"
                  >
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <CheckCircle className="w-3 h-3 text-primary" />
                    </div>
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>

          {/* Pricing Plans */}
          <ScrollReveal direction="up" delay={500} threshold={0.1}>
            <PricingPlansServer
              user={user}
              defaultInterval="month"
              className="max-w-6xl mx-auto"
            />
          </ScrollReveal>

          {/* Trust Indicators */}
          <ScrollReveal direction="up" delay={600}>
            <div className="mt-16 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Trusted by developers and teams worldwide
              </p>
              <div className="flex items-center justify-center gap-8 opacity-60">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span className="text-sm">Secure payments</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span className="text-sm">Money-back guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span className="text-sm">No hidden fees</span>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </main>
  );
}
