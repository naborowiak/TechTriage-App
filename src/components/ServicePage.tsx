import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Plus, Minus } from 'lucide-react';
import { PageView } from '../types';
import { getServiceById } from '../data/servicePageData';
import type { ServiceData } from '../data/servicePageData';
import { AnimatedElement } from '../hooks/useAnimations';
import { useAuth } from '../hooks/useAuth';

interface ServicePageProps {
  serviceId: string;
  onNavigate: (view: PageView) => void;
}

const accentColors: Record<string, { bg: string; text: string; badge: string; ctaBg: string }> = {
  cyan: {
    bg: 'bg-[#06B6D4]/10',
    text: 'text-[#06B6D4]',
    badge: 'bg-[#06B6D4]/10 text-[#06B6D4]',
    ctaBg: 'bg-[#06B6D4] hover:bg-[#0891b2]',
  },
  indigo: {
    bg: 'bg-[#6366F1]/10',
    text: 'text-[#6366F1]',
    badge: 'bg-[#6366F1]/10 text-[#6366F1]',
    ctaBg: 'bg-[#6366F1] hover:bg-[#4f46e5]',
  },
  purple: {
    bg: 'bg-[#8B5CF6]/10',
    text: 'text-[#8B5CF6]',
    badge: 'bg-[#8B5CF6]/10 text-[#8B5CF6]',
    ctaBg: 'bg-[#8B5CF6] hover:bg-[#7c3aed]',
  },
};

const ServicePageContent: React.FC<{ service: ServiceData; onNavigate: (view: PageView) => void }> = ({ service, onNavigate }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { isAuthenticated } = useAuth();
  const Icon = service.icon;
  const colors = accentColors[service.colorClass] || accentColors.indigo;

  const handleCTA = () => {
    if (isAuthenticated) {
      // Go to dashboard — the mode will be selectable from the dashboard tiles
      onNavigate(PageView.DASHBOARD);
    } else {
      onNavigate(PageView.SIGNUP);
    }
  };

  return (
    <div className="pt-32 pb-0 bg-white dark:bg-midnight-950 min-h-screen transition-colors">
      {/* HERO */}
      <section className="pb-16">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <AnimatedElement animation="fadeInUp">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${colors.bg} ${colors.text}`}>
              <Icon className="w-8 h-8" />
            </div>
          </AnimatedElement>
          <AnimatedElement animation="fadeInUp" delay={0.1}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary dark:text-white mb-4 tracking-tight">
              {service.name}
            </h1>
            <p className={`text-xl font-semibold mb-6 ${colors.text}`}>{service.tagline}</p>
          </AnimatedElement>
          <AnimatedElement animation="fadeInUp" delay={0.2}>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-8 leading-relaxed">
              {service.heroDescription}
            </p>
          </AnimatedElement>
          <AnimatedElement animation="fadeInUp" delay={0.3}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${colors.badge}`}>
                <CheckCircle2 className="w-4 h-4" />
                {service.availability}
              </span>
            </div>
          </AnimatedElement>
          <AnimatedElement animation="fadeInUp" delay={0.4}>
            <button
              onClick={handleCTA}
              className="mt-8 inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg transition-all shadow-lg hover:-translate-y-0.5 btn-gradient-electric"
            >
              {service.ctaText} <ArrowRight className="w-5 h-5" />
            </button>
          </AnimatedElement>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 bg-light-100 dark:bg-midnight-900 border-t border-light-300 dark:border-midnight-700 transition-colors">
        <div className="container mx-auto px-6 max-w-5xl">
          <AnimatedElement animation="fadeInUp" className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary dark:text-white mb-4">
              How {service.name} Works
            </h2>
          </AnimatedElement>
          <div className="grid md:grid-cols-3 gap-8">
            {service.howItWorks.map((step, i) => (
              <AnimatedElement key={i} animation="fadeInUp" delay={0.15 + i * 0.1}>
                <div className="card-clean rounded-2xl p-8 h-full">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg mb-5" style={{ background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)' }}>
                    {i + 1}
                  </div>
                  <h3 className="text-xl font-bold text-text-primary dark:text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-text-secondary leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </AnimatedElement>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 bg-white dark:bg-midnight-950 border-t border-light-300 dark:border-midnight-700 transition-colors">
        <div className="container mx-auto px-6 max-w-5xl">
          <AnimatedElement animation="fadeInUp" className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary dark:text-white mb-4">
              Why use {service.name}
            </h2>
          </AnimatedElement>
          <div className="grid md:grid-cols-2 gap-6">
            {service.features.map((feature, i) => {
              const FeatureIcon = feature.icon;
              return (
                <AnimatedElement key={i} animation="fadeInUp" delay={0.1 + i * 0.1}>
                  <div className="card-clean rounded-2xl p-6 h-full flex gap-5">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(6,182,212,0.10) 100%)' }}>
                      <FeatureIcon className="w-6 h-6 text-electric-indigo" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-text-primary dark:text-white mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-text-secondary text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </AnimatedElement>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-light-100 dark:bg-midnight-900 border-t border-light-300 dark:border-midnight-700 transition-colors">
        <div className="container mx-auto px-6 max-w-3xl">
          <AnimatedElement animation="fadeInUp" className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary dark:text-white mb-4">
              {service.name} FAQ
            </h2>
          </AnimatedElement>
          <AnimatedElement animation="fadeInUp" delay={0.1}>
            <div className="space-y-4">
              {service.faqs.map((faq, i) => (
                <div
                  key={i}
                  className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                    openFaq === i
                      ? 'border-electric-indigo/30 bg-electric-indigo/[0.03]'
                      : 'border-light-300 dark:border-midnight-700 bg-white dark:bg-midnight-950 hover:border-light-400 dark:hover:border-midnight-600'
                  }`}
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full p-5 flex items-center justify-between text-left min-h-[48px]"
                    aria-expanded={openFaq === i}
                  >
                    <span className="font-semibold text-lg text-text-primary dark:text-white pr-4">
                      {faq.question}
                    </span>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      openFaq === i
                        ? 'text-white'
                        : 'bg-light-200 dark:bg-midnight-700 text-text-secondary'
                    }`}
                      style={openFaq === i ? { background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)' } : undefined}
                    >
                      {openFaq === i ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    </div>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      openFaq === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-5 pb-5 leading-relaxed text-text-secondary">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </AnimatedElement>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-20 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 40%, #06B6D4 100%)' }}
      >
        {/* Radial glow texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 20% 50%, rgba(255,255,255,0.12) 0%, transparent 70%), radial-gradient(ellipse 50% 60% at 80% 30%, rgba(6,182,212,0.18) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 50% 80%, rgba(99,102,241,0.15) 0%, transparent 60%)',
          }}
        />
        {/* Subtle dot grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          aria-hidden="true"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="container mx-auto px-6 max-w-4xl text-center relative z-10">
          <AnimatedElement animation="fadeInUp">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to try {service.name}?
            </h2>
          </AnimatedElement>
          <AnimatedElement animation="fadeInUp" delay={0.15}>
            <p className="text-white/90 font-medium mb-8 max-w-xl mx-auto text-lg">
              Start with a free account. No credit card required.
            </p>
          </AnimatedElement>
          <AnimatedElement animation="fadeInUp" delay={0.3}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleCTA}
                className="bg-white text-electric-indigo hover:bg-surface-50 font-bold py-4 px-10 rounded-xl text-lg transition-all shadow-clean hover:shadow-clean-md hover:-translate-y-0.5 flex items-center gap-3"
              >
                Get Started Free <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => onNavigate(PageView.PRICING)}
                className="text-white/80 hover:text-white font-semibold text-base transition-colors flex items-center gap-2"
              >
                View all plans <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </AnimatedElement>
        </div>
      </section>
    </div>
  );
};

export const ServicePage: React.FC<ServicePageProps> = ({ serviceId, onNavigate }) => {
  const service = getServiceById(serviceId);

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-50 dark:bg-midnight-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary dark:text-white mb-4">Service not found</h1>
          <button
            onClick={() => onNavigate(PageView.HOME)}
            className="text-electric-indigo font-semibold hover:underline"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return <ServicePageContent service={service} onNavigate={onNavigate} />;
};
