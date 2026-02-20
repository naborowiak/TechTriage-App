import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { PageView } from '../types';
import { services } from '../data/servicePageData';
import { useScrollReveal } from '../hooks/useAnimations';

interface ServicesSectionProps {
  onNavigate: (view: PageView) => void;
}

const serviceImages: Record<string, string> = {
  chat: '/type_question.jpg',
  photo: '/show_problem.jpg',
  voice: '/talk_support.jpeg',
  video: '/video_support.png',
};

const AUTO_ROTATE_MS = 6000;

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onNavigate }) => {
  useScrollReveal();
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

  return (
    <section
      className="py-24 bg-white dark:bg-midnight-900 border-t border-light-300 dark:border-midnight-700 transition-colors"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="reveal mb-12 lg:mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-text-primary dark:text-white">
            Support that fits your problem
          </h2>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-0 items-start">

          {/* Left — Algolia-style accordion */}
          <div className="reveal w-full lg:w-[45%]">
            <ul className="media-accordion">
              {services.map((service, i) => {
                const Icon = service.icon;
                const isActive = i === activeIndex;

                return (
                  <li
                    key={service.id}
                    className={`relative w-full accordion_item group overflow-hidden py-[29px] px-4 lg:pl-6 lg:pr-10 cursor-pointer${isActive ? ' current' : ''}`}
                    onClick={() => handleToggle(i)}
                    aria-expanded={isActive}
                    aria-controls={`service-panel-${service.id}`}
                  >
                    {/* Header */}
                    <button
                      type="button"
                      className="relative block w-full text-left modern-accordion-button"
                    >
                      <div className="relative z-10 flex justify-between lg:justify-start items-center gap-8 lg:gap-16">
                        <div className="flex items-center gap-3">
                          <Icon
                            className="w-5 h-5 shrink-0 transition-colors duration-300 dark:text-white/50"
                            style={isActive ? { color: '#6366F1' } : undefined}
                          />
                          <span className="accordion-title font-sora text-lg lg:text-[21px] lg:leading-[140%] font-bold text-gray-700 dark:text-white/60 transition-colors duration-300">
                            {service.name}
                          </span>
                        </div>
                        <ChevronRight
                          className="accordion-chevron w-4 h-4 shrink-0 transition-all duration-300 text-text-muted dark:text-white/40"
                          style={isActive ? { transform: 'rotate(90deg)' } : undefined}
                        />
                      </div>
                    </button>

                    {/* Accordion content */}
                    <div
                      id={`service-panel-${service.id}`}
                      className="accordion-content mt-4"
                      aria-hidden={!isActive}
                    >
                      <div className="relative z-10 text-gray-700 dark:text-white/70 leading-relaxed pr-8">
                        {/* Mobile-only image */}
                        <div className="lg:hidden mb-4 rounded-xl overflow-hidden aspect-[16/10]">
                          <img
                            src={serviceImages[service.id]}
                            alt={service.name}
                            width={1200}
                            height={800}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <p className="text-[15px] leading-relaxed mb-3">
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
                          className="flex items-center gap-1.5 text-sm font-bold text-[#6366F1] hover:gap-2.5 transition-all group/link"
                        >
                          Learn more <ArrowRight className="w-4 h-4 arcade-arrow" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Right — Image preview (desktop only) */}
          <div className="reveal hidden lg:block w-full lg:w-[55%] sticky top-24" style={{ transitionDelay: '200ms' }}>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-light-100 dark:bg-midnight-800">
              {services.map((service, i) => (
                <img
                  key={service.id}
                  src={serviceImages[service.id]}
                  alt={service.name}
                  width={1200}
                  height={800}
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
