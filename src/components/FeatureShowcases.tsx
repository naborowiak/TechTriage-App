import React from 'react';
import { ArrowRight } from 'lucide-react';
import { PageView } from '../types';
import { AnimatedElement } from '../hooks/useAnimations';

interface FeatureShowcasesProps {
  onNavigate: (view: PageView) => void;
}

const showcases = [
  {
    badge: 'Photo Analysis',
    heading: "Show us what's wrong, don't explain it.",
    copy: "Snap a picture of cables, error screens, or blinking lights. TotalAssist reads the image and tells you exactly what to do next — in plain language.",
    image: '/photo-analysis.png',
    imageAlt: 'Photo analysis feature showing device diagnosis',
    link: PageView.SERVICE_PHOTO,
    linkText: 'Learn more',
  },
  {
    badge: 'Video Diagnostic',
    heading: 'Short video sessions for tricky problems.',
    copy: "When photos aren't enough, point your camera at the problem. Get real-time guidance in a 10-minute session that turns into a clear repair plan.",
    image: '/video_support.png',
    imageAlt: 'Live video diagnostic session',
    link: PageView.SERVICE_VIDEO,
    linkText: 'Learn more',
  },
  {
    badge: 'Assist Pills',
    heading: "Tap, don't type.",
    copy: "TotalAssist uses on-screen choices like 'Wi-Fi keeps dropping' or 'This light is blinking' — so you answer with a tap instead of typing essays.",
    image: '/chat-support.png',
    imageAlt: 'Assist Pills guided troubleshooting interface',
    link: PageView.SERVICE_CHAT,
    linkText: 'Learn more',
  },
  {
    badge: 'Repair Records',
    heading: 'Keep a repair record for your home tech.',
    copy: "Every session becomes a Case: what went wrong, what you tried, what worked. Download a PDF to share with family or a future technician.",
    image: '/case-history.png',
    imageAlt: 'Case history and PDF repair records',
    link: null,
    linkText: null,
  },
];

export const FeatureShowcases: React.FC<FeatureShowcasesProps> = ({ onNavigate }) => {
  return (
    <section className="py-24 bg-white dark:bg-midnight-900 border-t border-light-300 dark:border-midnight-700 transition-colors">
      <div className="container mx-auto px-6 max-w-6xl">
        <AnimatedElement animation="fadeInUp" className="text-center mb-16">
          <span className="inline-block text-gradient-electric font-bold text-sm uppercase tracking-wider mb-4">
            Features
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold text-text-primary dark:text-white">
            Built for how you actually get help
          </h2>
        </AnimatedElement>

        <div className="space-y-0">
          {showcases.map((item, i) => {
            const isReversed = i % 2 === 1;
            const animLeft = isReversed ? 'fadeInRight' : 'fadeInLeft';
            const animRight = isReversed ? 'fadeInLeft' : 'fadeInRight';

            return (
              <div
                key={i}
                className={`flex flex-col lg:flex-row ${isReversed ? 'lg:flex-row-reverse' : ''} gap-8 lg:gap-16 items-center ${
                  i > 0 ? 'pt-16 border-t border-light-200 dark:border-midnight-800' : ''
                } ${i < showcases.length - 1 ? 'pb-16' : ''}`}
              >
                {/* Image */}
                <AnimatedElement animation={animLeft} className="w-full lg:w-1/2">
                  <div className="rounded-2xl overflow-hidden bg-light-100 dark:bg-midnight-800">
                    <img
                      src={item.image}
                      alt={item.imageAlt}
                      className="w-full aspect-[16/10] object-cover"
                      loading="lazy"
                    />
                  </div>
                </AnimatedElement>

                {/* Text */}
                <AnimatedElement animation={animRight} delay={0.15} className="w-full lg:w-1/2">
                  <span className="inline-block text-gradient-electric font-bold text-sm uppercase tracking-wider mb-3">
                    {item.badge}
                  </span>
                  <h3 className="text-2xl lg:text-3xl font-bold text-text-primary dark:text-white mb-4">
                    {item.heading}
                  </h3>
                  <p className="text-text-secondary text-base lg:text-lg leading-relaxed mb-6">
                    {item.copy}
                  </p>
                  {item.link && (
                    <button
                      onClick={() => onNavigate(item.link!)}
                      className="inline-flex items-center gap-2 text-electric-indigo font-semibold hover:gap-3 transition-all group"
                    >
                      {item.linkText}
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  )}
                </AnimatedElement>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
