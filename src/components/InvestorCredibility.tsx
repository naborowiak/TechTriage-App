import React from 'react';
import { Sparkles, FileText, Shield } from 'lucide-react';
import { useScrollReveal } from '../hooks/useAnimations';

const items = [
  {
    icon: Sparkles,
    title: 'Multi-modal AI diagnostics',
    description: 'Gemini 2.0 Flash powers text, photo, voice, and video analysis.',
  },
  {
    icon: FileText,
    title: 'Case-based repair history',
    description: 'Structured case records with downloadable PDF diagnostic reports.',
  },
  {
    icon: Shield,
    title: 'Enterprise-grade infrastructure',
    description: 'Stripe payments, OpenID Connect auth, PostgreSQL, real-time WebSocket.',
  },
];

export const InvestorCredibility: React.FC = () => {
  useScrollReveal();
  return (
    <section className="py-16 bg-light-100 dark:bg-midnight-950 border-t border-light-300 dark:border-midnight-700 transition-colors">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="reveal">
          <h2 className="text-2xl font-bold text-text-primary dark:text-white text-center mb-12">
            Built for scale and safety
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 reveal-stagger">
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="reveal">
                <div className="text-center">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(6,182,212,0.10) 100%)' }}
                  >
                    <Icon className="w-6 h-6 text-electric-indigo" />
                  </div>
                  <h3 className="text-base font-bold text-text-primary dark:text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
