import React from 'react';
import { MessageSquare, Zap, Users, FileText } from 'lucide-react';
import { AnimatedElement } from '../hooks/useAnimations';

const steps = [
  {
    icon: MessageSquare,
    title: 'Tell us what\'s not working',
    description: 'Describe it, snap a photo, record a video, or just type.',
  },
  {
    icon: Zap,
    title: 'Follow guided steps',
    description: 'Tap Assist Pills instead of typing. No jargon, just simple choices.',
  },
  {
    icon: Users,
    title: 'We fix it or escalate',
    description: 'AI guides you first. If needed, a human tech picks up with full context.',
  },
  {
    icon: FileText,
    title: 'Get your repair report',
    description: 'Every session becomes a Case with a downloadable PDF.',
  },
];

export const HowItWorksLifecycle: React.FC = () => {
  return (
    <section
      id="how-it-works-lifecycle"
      className="py-20 bg-light-100 dark:bg-midnight-950 border-t border-light-300 dark:border-midnight-700 transition-colors"
    >
      <div className="container mx-auto px-6 max-w-6xl">
        <AnimatedElement animation="fadeInUp" className="text-center mb-16">
          <span className="inline-block text-gradient-electric font-bold text-sm uppercase tracking-wider mb-4">
            How It Works
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold text-text-primary dark:text-white">
            Four steps to a fix
          </h2>
        </AnimatedElement>

        <div className="relative">
          {/* Connector line — desktop only */}
          <div className="hidden md:block absolute top-[40px] left-[calc(12.5%+20px)] right-[calc(12.5%+20px)] h-0.5 bg-surface-border dark:bg-midnight-700" aria-hidden="true" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <AnimatedElement key={i} animation="fadeInUp" delay={0.1 + i * 0.1}>
                  <div className="card-clean rounded-2xl p-6 text-center h-full relative">
                    {/* Numbered circle */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-sm relative z-10"
                      style={{ background: 'linear-gradient(135deg, #6366F1, #06B6D4)' }}
                    >
                      {i + 1}
                    </div>
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(6,182,212,0.10) 100%)' }}>
                      <Icon className="w-6 h-6 text-electric-indigo" />
                    </div>
                    <h3 className="text-base font-bold text-text-primary dark:text-white mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </AnimatedElement>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
