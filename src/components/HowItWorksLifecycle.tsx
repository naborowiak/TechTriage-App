import React from 'react';
import { MessageSquare, Zap, Users, FileText } from 'lucide-react';
import { AnimatedElement } from '../hooks/useAnimations';

// Brand gradient flow: cyan → light blue → blue → purple
// Works whether cards are side-by-side (desktop) or stacked (mobile)
const steps = [
  {
    icon: MessageSquare,
    title: 'Show us the chaos',
    description: 'Type it, snap it, or say it. Whatever gets the point across fastest.',
    // Cyan
    gradient: {
      dark: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
      light: 'linear-gradient(135deg, #ECFEFF 0%, #CFFAFE 100%)',
    },
    border: { dark: '#0E7490', light: '#A5F3FC' },
    accent: '#06B6D4',
    iconBg: { dark: 'rgba(6,182,212,0.2)', light: 'rgba(6,182,212,0.15)' },
  },
  {
    icon: Zap,
    title: 'Tap through the fix',
    description: 'No jargon. Just Assist Pills you tap — like texting, but smarter.',
    // Light blue
    gradient: {
      dark: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
      light: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
    },
    border: { dark: '#1D4ED8', light: '#93C5FD' },
    accent: '#3B82F6',
    iconBg: { dark: 'rgba(59,130,246,0.2)', light: 'rgba(59,130,246,0.15)' },
  },
  {
    icon: Users,
    title: 'AI fixes it. Humans back it up.',
    description: 'Our agent handles 90% of issues. When it can\'t, a real tech takes over with full context.',
    // Indigo / blue
    gradient: {
      dark: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
      light: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
    },
    border: { dark: '#4338CA', light: '#A5B4FC' },
    accent: '#6366F1',
    iconBg: { dark: 'rgba(99,102,241,0.2)', light: 'rgba(99,102,241,0.15)' },
  },
  {
    icon: FileText,
    title: 'Get the receipt',
    description: 'Every fix becomes a Case — timestamped, downloadable, shareable.',
    // Purple
    gradient: {
      dark: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
      light: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
    },
    border: { dark: '#6D28D9', light: '#C4B5FD' },
    accent: '#8B5CF6',
    iconBg: { dark: 'rgba(139,92,246,0.2)', light: 'rgba(139,92,246,0.15)' },
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
            From broken to fixed in four moves
          </h2>
        </AnimatedElement>

        <div className="relative">
          {/* Connector line — desktop only */}
          <div className="hidden md:block absolute top-[52px] left-[calc(12.5%+20px)] right-[calc(12.5%+20px)] h-0.5 bg-surface-border dark:bg-midnight-700" aria-hidden="true" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <AnimatedElement key={i} animation="fadeInUp" delay={0.1 + i * 0.1}>
                  <div
                    className="hiw-card group rounded-2xl p-6 text-center h-full relative cursor-default"
                    style={{
                      border: `4px solid var(--hiw-border-${i})`,
                    }}
                  >
                    {/* Gradient background — theme-aware via CSS custom properties */}
                    <div
                      className="absolute inset-0 rounded-[calc(1rem-4px)] dark:hidden"
                      style={{ background: step.gradient.light }}
                      aria-hidden="true"
                    />
                    <div
                      className="absolute inset-0 rounded-[calc(1rem-4px)] hidden dark:block"
                      style={{ background: step.gradient.dark, opacity: 0.15 }}
                      aria-hidden="true"
                    />

                    {/* Card content — above gradient layers */}
                    <div className="relative z-10">
                      {/* Numbered circle */}
                      <div
                        className="hiw-step-number w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-5 text-white font-bold text-base shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${step.accent}, ${step.accent}CC)` }}
                      >
                        {i + 1}
                      </div>
                      {/* Icon with bounce animation */}
                      <div
                        className="hiw-icon-box w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-5"
                        style={{ background: `var(--hiw-iconbg-${i})` }}
                      >
                        <Icon
                          className="w-7 h-7 hiw-icon-bounce"
                          style={{ color: step.accent }}
                        />
                      </div>
                      <h3 className="hiw-title text-base font-bold text-text-primary dark:text-white mb-2">
                        {step.title}
                      </h3>
                      <p className="text-sm text-text-secondary leading-relaxed">
                        {step.description}
                      </p>
                    </div>

                    {/* Hover glow — bottom edge accent */}
                    <div
                      className="absolute bottom-0 left-4 right-4 h-[3px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                      style={{ background: `linear-gradient(90deg, transparent, ${step.accent}, transparent)` }}
                      aria-hidden="true"
                    />
                  </div>
                </AnimatedElement>
              );
            })}
          </div>
        </div>
      </div>

      {/* CSS custom properties for theme-aware border & icon bg colors */}
      <style>{`
        :root {
          --hiw-border-0: ${steps[0].border.light};
          --hiw-border-1: ${steps[1].border.light};
          --hiw-border-2: ${steps[2].border.light};
          --hiw-border-3: ${steps[3].border.light};
          --hiw-iconbg-0: ${steps[0].iconBg.light};
          --hiw-iconbg-1: ${steps[1].iconBg.light};
          --hiw-iconbg-2: ${steps[2].iconBg.light};
          --hiw-iconbg-3: ${steps[3].iconBg.light};
        }
        .dark {
          --hiw-border-0: ${steps[0].border.dark};
          --hiw-border-1: ${steps[1].border.dark};
          --hiw-border-2: ${steps[2].border.dark};
          --hiw-border-3: ${steps[3].border.dark};
          --hiw-iconbg-0: ${steps[0].iconBg.dark};
          --hiw-iconbg-1: ${steps[1].iconBg.dark};
          --hiw-iconbg-2: ${steps[2].iconBg.dark};
          --hiw-iconbg-3: ${steps[3].iconBg.dark};
        }
      `}</style>
    </section>
  );
};
