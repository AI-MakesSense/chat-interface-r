'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, Building2, Users } from 'lucide-react';

interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  limitations: string[];
  cta: string;
  highlighted: boolean;
  icon: React.ElementType;
}

const tiers: PricingTier[] = [
  {
    name: 'Basic',
    price: '$29',
    period: '/year',
    description: 'Perfect for individuals and small projects',
    features: [
      '1 widget',
      '1 domain',
      'All core features',
      'Real-time preview',
      'Embed code generator',
      'Email support',
    ],
    limitations: [
      'Includes "Powered by" branding',
    ],
    cta: 'Get Started',
    highlighted: false,
    icon: Sparkles,
  },
  {
    name: 'Pro',
    price: '$49',
    period: '/year',
    description: 'Best for growing businesses and professionals',
    features: [
      '3 widgets',
      '1 domain',
      'All core features',
      'White-label (no branding)',
      'Advanced styling options',
      'Priority email support',
      'Email transcript feature',
      'Rating prompts',
    ],
    limitations: [],
    cta: 'Get Started',
    highlighted: true,
    icon: Building2,
  },
  {
    name: 'Agency',
    price: '$149',
    period: '/year',
    description: 'For agencies and enterprise deployments',
    features: [
      'Unlimited widgets',
      'Unlimited domains',
      'All Pro features',
      'White-label branding',
      'Advanced analytics',
      'Priority support',
      'Custom integrations',
      'Dedicated account manager',
    ],
    limitations: [],
    cta: 'Contact Sales',
    highlighted: false,
    icon: Users,
  },
];

export default function PricingPage() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="text-xl font-bold text-white">
              Widget Designer
            </Link>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-16">
        {/* Background Gradient */}
        <div
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
          aria-hidden="true"
        >
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-4 text-lg text-zinc-400 max-w-2xl mx-auto">
            Choose the plan that fits your needs. All plans include our powerful widget builder with real-time preview and easy deployment.
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            return (
              <div
                key={tier.name}
                className={`relative rounded-2xl p-8 ${
                  tier.highlighted
                    ? 'bg-gradient-to-b from-indigo-500/20 to-purple-500/10 ring-2 ring-indigo-500'
                    : 'bg-white/5 ring-1 ring-white/10'
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center rounded-full bg-indigo-500 px-4 py-1 text-sm font-medium text-white">
                      Recommended
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    tier.highlighted ? 'bg-indigo-500' : 'bg-white/10'
                  }`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{tier.name}</h3>
                </div>

                <p className="text-zinc-400 text-sm mb-6">{tier.description}</p>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">{tier.price}</span>
                  <span className="text-zinc-400">{tier.period}</span>
                </div>

                <Link href={isAuthenticated ? '/dashboard' : '/auth/signup'}>
                  <Button
                    className={`w-full ${
                      tier.highlighted
                        ? 'bg-indigo-600 hover:bg-indigo-500'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    {tier.cta}
                  </Button>
                </Link>

                <div className="mt-8 space-y-4">
                  <p className="text-sm font-medium text-white">What&apos;s included:</p>
                  <ul className="space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-zinc-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {tier.limitations.length > 0 && (
                    <div className="pt-4 border-t border-white/10">
                      <p className="text-sm font-medium text-zinc-400 mb-3">Limitations:</p>
                      <ul className="space-y-2">
                        {tier.limitations.map((limitation) => (
                          <li key={limitation} className="text-sm text-zinc-500">
                            • {limitation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mx-auto max-w-4xl px-6 lg:px-8 pb-24">
        <h2 className="text-2xl font-bold text-white text-center mb-12">
          Frequently Asked Questions
        </h2>
        <div className="space-y-6">
          <div className="bg-white/5 rounded-lg p-6 ring-1 ring-white/10">
            <h3 className="text-lg font-medium text-white mb-2">Can I upgrade or downgrade my plan?</h3>
            <p className="text-zinc-400">Yes, you can change your plan at any time. When upgrading, you&apos;ll be charged the prorated difference. When downgrading, the change takes effect at your next billing cycle.</p>
          </div>
          <div className="bg-white/5 rounded-lg p-6 ring-1 ring-white/10">
            <h3 className="text-lg font-medium text-white mb-2">What payment methods do you accept?</h3>
            <p className="text-zinc-400">We accept all major credit cards (Visa, MasterCard, American Express) through our secure payment processor, Stripe.</p>
          </div>
          <div className="bg-white/5 rounded-lg p-6 ring-1 ring-white/10">
            <h3 className="text-lg font-medium text-white mb-2">Is there a free trial?</h3>
            <p className="text-zinc-400">We don&apos;t offer a free trial, but our Basic plan is affordable and lets you test all core features. You can upgrade anytime if you need more widgets or domains.</p>
          </div>
          <div className="bg-white/5 rounded-lg p-6 ring-1 ring-white/10">
            <h3 className="text-lg font-medium text-white mb-2">What happens if I exceed my widget limit?</h3>
            <p className="text-zinc-400">You won&apos;t be able to create new widgets until you upgrade to a higher plan or delete existing widgets. Your existing widgets will continue to work normally.</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="border-t border-white/10 bg-gradient-to-b from-zinc-950 to-zinc-900">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
            Join thousands of developers building beautiful chat widgets for their N8n workflows.
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-500">
              Start Building Today
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <p className="text-sm text-zinc-500">
            © {new Date().getFullYear()} Widget Designer. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
