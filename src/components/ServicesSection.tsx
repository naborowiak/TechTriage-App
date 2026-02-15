import React from 'react';
import { ArrowRight } from 'lucide-react';
import { PageView } from '../types';
import { services } from '../data/servicePageData';
import { AnimatedElement } from '../hooks/useAnimations';

interface ServicesSectionProps {
  onNavigate: (view: PageView) => void;
}

const glowColors: Record<string, string> = {
  cyan: 'hover:shadow-[0_0_24px_rgba(6,182,212,0.18)]',
  indigo: 'hover:shadow-[0_0_24px_rgba(99,102,241,0.18)]',
  purple: 'hover:shadow-[0_0_24px_rgba(139,92,246,0.18)]',
};

const iconBgColors: Record<string, string> = {
  cyan: 'bg-[#06B6D4]/10 text-[#06B6D4]',
  indigo: 'bg-[#6366F1]/10 text-[#6366F1]',
  purple: 'bg-[#8B5CF6]/10 text-[#8B5CF6]',
};

const linkTextColors: Record<string, string> = {
  cyan: 'text-[#06B6D4]',
  indigo: 'text-[#6366F1]',
  purple: 'text-[#8B5CF6]',
};

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onNavigate }) => {
  return (
    <section className="py-24 bg-white dark:bg-midnight-900 border-t border-light-300 dark:border-midnight-700 transition-colors">
      <div className="container mx-auto px-6 max-w-6xl">
        <AnimatedElement animation="fadeInUp" className="text-center mb-16">
          <span className="inline-block text-electric-indigo font-bold text-sm uppercase tracking-wider mb-4">
            Our Services
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-text-primary dark:text-white">
            Four ways to get your tech fixed
          </h2>
          <p className="text-xl max-w-2xl mx-auto text-text-secondary">
            Chat, snap a photo, talk it through, or show us on video. Pick the way that works for you.
          </p>
        </AnimatedElement>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, i) => {
            const Icon = service.icon;
            const glow = glowColors[service.colorClass] || glowColors.indigo;
            const iconBg = iconBgColors[service.colorClass] || iconBgColors.indigo;
            const linkColor = linkTextColors[service.colorClass] || linkTextColors.indigo;

            return (
              <AnimatedElement key={service.id} animation="fadeInUp" delay={0.15 + i * 0.1}>
                <button
                  onClick={() => onNavigate(service.pageView)}
                  className={`w-full text-left card-clean rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 ${glow} cursor-pointer group h-full flex flex-col`}
                  aria-label={`Learn more about ${service.name}`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${iconBg}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-text-primary dark:text-white mb-2">
                    {service.name}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed mb-4 flex-1">
                    {service.description}
                  </p>
                  <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${linkColor} group-hover:gap-2.5 transition-all`}>
                    Learn more <ArrowRight className="w-4 h-4" />
                  </span>
                </button>
              </AnimatedElement>
            );
          })}
        </div>
      </div>
    </section>
  );
};
