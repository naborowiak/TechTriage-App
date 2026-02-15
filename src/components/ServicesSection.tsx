import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { PageView } from '../types';
import { services } from '../data/servicePageData';
import { AnimatedElement } from '../hooks/useAnimations';

interface ServicesSectionProps {
  onNavigate: (view: PageView) => void;
}

const serviceImages: Record<string, string> = {
  chat: '/type_question.jpeg',
  photo: '/show_problem.jpg',
  voice: '/talk_support.jpeg',
  video: '/video_support.png',
};

const accentColors: Record<string, string> = {
  cyan: '#06B6D4',
  indigo: '#6366F1',
  purple: '#8B5CF6',
};

const linkTextColors: Record<string, string> = {
  cyan: 'text-[#06B6D4]',
  indigo: 'text-[#6366F1]',
  purple: 'text-[#8B5CF6]',
};

const AUTO_ROTATE_MS = 6000;

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onNavigate }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Auto-rotate through services
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % services.length);
    }, AUTO_ROTATE_MS);
    return () => clearInterval(timer);
  }, [paused, activeIndex]);

  const handleToggle = useCallback((index: number) => {
    setActiveIndex(index);
    setPaused(true);
  }, []);

  const activeService = services[activeIndex];
  const activeAccent = accentColors[activeService.colorClass] || accentColors.indigo;

  return (
    <section
      className="py-24 bg-white dark:bg-midnight-900 border-t border-light-300 dark:border-midnight-700 transition-colors"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="container mx-auto px-6 max-w-6xl">
        <AnimatedElement animation="fadeInUp" className="text-center mb-16">
          <span className="inline-block text-gradient-electric font-bold text-sm uppercase tracking-wider mb-4">
            Our Services
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-text-primary dark:text-white">
            Four ways to get help
          </h2>
          <p className="text-xl max-w-2xl mx-auto text-text-secondary">
            Pick the way that works best for you.
          </p>
        </AnimatedElement>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">

          {/* Left — Accordion */}
          <div className="w-full lg:w-[45%] space-y-3">
            {services.map((service, i) => {
              const Icon = service.icon;
              const isActive = i === activeIndex;
              const accent = accentColors[service.colorClass] || accentColors.indigo;
              const linkColor = linkTextColors[service.colorClass] || linkTextColors.indigo;

              return (
                <div
                  key={service.id}
                  className={[
                    'rounded-xl border transition-all duration-300 overflow-hidden',
                    isActive
                      ? 'bg-white dark:bg-midnight-800 border-light-300 dark:border-midnight-600 shadow-lg dark:shadow-midnight-950/40'
                      : 'bg-light-50 dark:bg-midnight-900 border-light-200 dark:border-midnight-700 hover:border-light-300 dark:hover:border-midnight-600',
                  ].join(' ')}
                >
                  {/* Header */}
                  <button
                    onClick={() => handleToggle(i)}
                    className="w-full flex items-center gap-4 px-5 py-4 text-left cursor-pointer"
                    aria-expanded={isActive}
                    aria-controls={`service-panel-${service.id}`}
                  >
                    {/* Progress bar accent (active only) */}
                    <div
                      className="w-1 self-stretch rounded-full shrink-0 transition-colors duration-300"
                      style={{ backgroundColor: isActive ? accent : 'transparent' }}
                    />
                    <div
                      className={[
                        'w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-300',
                        isActive ? 'bg-opacity-15' : 'bg-opacity-8',
                      ].join(' ')}
                      style={{ backgroundColor: `${accent}${isActive ? '22' : '14'}` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: accent }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={[
                        'text-base font-bold transition-colors duration-300',
                        isActive ? 'text-text-primary dark:text-white' : 'text-text-secondary dark:text-white/60',
                      ].join(' ')}>
                        {service.name}
                      </h3>
                      {!isActive && (
                        <p className="text-sm text-text-muted truncate mt-0.5">
                          {service.tagline}
                        </p>
                      )}
                    </div>
                    <ChevronDown
                      className={[
                        'w-5 h-5 shrink-0 text-text-muted transition-transform duration-300',
                        isActive ? 'rotate-180' : '',
                      ].join(' ')}
                    />
                  </button>

                  {/* Expandable panel */}
                  <div
                    id={`service-panel-${service.id}`}
                    className="overflow-hidden transition-all duration-300"
                    style={{
                      maxHeight: isActive ? '240px' : '0',
                      opacity: isActive ? 1 : 0,
                    }}
                  >
                    <div className="px-5 pb-5 pl-[4.25rem]">
                      {/* Mobile-only image */}
                      <div className="lg:hidden mb-4 rounded-xl overflow-hidden aspect-[16/10]">
                        <img
                          src={serviceImages[service.id]}
                          alt={service.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <p className="text-sm leading-relaxed text-text-secondary dark:text-white/70 mb-4">
                        {service.description}
                      </p>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-text-muted dark:text-white/40 mb-3">
                        {service.availability}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate(service.pageView);
                        }}
                        className={`flex items-center gap-1.5 text-sm font-semibold ${linkColor} hover:gap-2.5 transition-all group/link`}
                      >
                        Learn more <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-0.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right — Image preview (desktop only) */}
          <div className="hidden lg:block w-full lg:w-[55%] sticky top-24">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-light-100 dark:bg-midnight-800">
              {services.map((service, i) => (
                <img
                  key={service.id}
                  src={serviceImages[service.id]}
                  alt={service.name}
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
                  style={{ opacity: i === activeIndex ? 1 : 0 }}
                  loading={i === 0 ? 'eager' : 'lazy'}
                />
              ))}
              {/* Gradient overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              {/* Caption */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: activeAccent }}
                  />
                  <span className="text-xs font-bold uppercase tracking-wider text-white/70">
                    {activeService.tagline}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">
                  {activeService.name}
                </h3>
                <p className="text-sm text-white/70 max-w-md leading-relaxed">
                  {activeService.description}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
