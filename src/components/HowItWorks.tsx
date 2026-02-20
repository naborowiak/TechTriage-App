import React from 'react';
import { MessageSquare, Camera, Mic, Video, CheckCircle2, ArrowRight, Shield, Zap, Clock, Sparkles, FileText } from 'lucide-react';
import { ScoutSignalIcon } from './Logo';
import { AnimatedElement } from '../hooks/useAnimations';

export function ArcadeEmbed() {
  return (
    <div style={{ position: 'relative', paddingBottom: 'calc(54.60793502030615% + 41px)', height: '0', width: '100%' }}>
      <iframe
        src="https://demo.arcade.software/mQTnZSy0FqkBmcbbbk0U?embed&embed_mobile=tab&embed_desktop=inline&show_copy_link=true"
        title="Resolve a Wi‑Fi outage and download the case report"
        frameBorder="0"
        loading="lazy"
        allowFullScreen
        allow="clipboard-write"
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', colorScheme: 'light' }}
      />
    </div>
  );
}

export const HowItWorks: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  const features = [
    {
      name: 'Chat Support',
      tagline: 'Ask Anything',
      icon: MessageSquare,
      description: 'Describe your problem in plain English and get step-by-step solutions from a real support agent. No tech jargon required — just tell us what\'s going on.',
      benefits: [
        'Instant responses 24/7',
        'No tech jargon required',
        'Remembers your devices & history',
      ],
      availability: 'All Plans',
      howItWorks: 'Type your question, get an answer. It\'s that simple.',
    },
    {
      name: 'Photo Analysis',
      tagline: 'Show, Don\'t Tell',
      icon: Camera,
      description: 'Upload a photo of error messages, blinking lights, or device screens. Your agent reads what\'s on screen and tells you exactly what\'s wrong and how to fix it.',
      benefits: [
        'Reads error codes & screens',
        'Identifies blinking light patterns',
        'No need to describe the problem',
      ],
      availability: 'All Plans',
      howItWorks: 'Snap a photo, upload it, get a diagnosis.',
    },
    {
      name: 'Voice Support',
      tagline: 'Talk It Through',
      icon: Mic,
      description: 'Talk through your issue hands-free, just like a phone call. Your agent listens, asks follow-up questions, and walks you through the fix in real time.',
      benefits: [
        'Hands-free troubleshooting',
        'Natural back-and-forth conversation',
        'Send photos mid-call if needed',
      ],
      availability: 'Home & Pro',
      howItWorks: 'Tap the mic, start talking, get guided through the fix.',
    },
    {
      name: 'Video Diagnostic',
      tagline: 'Show Us Live',
      icon: Video,
      description: 'Point your camera at the problem and get real-time diagnosis. Your agent sees exactly what you see and guides you step by step.',
      benefits: [
        'Real-time visual diagnosis',
        'Agent sees what you see',
        'Session recording saved to your case',
      ],
      availability: 'Home & Pro (Credits)',
      howItWorks: 'Open your camera, point it at the issue, follow the guidance.',
    },
  ];

  const reportSections = [
    { icon: Sparkles, title: 'Outcome Status', desc: 'Resolved, In Progress, or Needs Pro' },
    { icon: FileText, title: 'Issue Summary', desc: 'Clear description of the problem' },
    { icon: Zap, title: 'Diagnosis', desc: 'Root cause analysis & findings' },
    { icon: CheckCircle2, title: 'Actions & Next Steps', desc: 'What was done + recommendations' },
  ];

  return (
    <div className="pt-32 pb-20 bg-white dark:bg-midnight-950 min-h-screen transition-colors">
      <div className="container mx-auto px-6">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-20 relative">
          <AnimatedElement animation="fadeInDown" className="relative z-10">
            <div className="inline-flex items-center gap-2 mb-6">
              <ScoutSignalIcon size={24} animate={true} />
              <span className="text-gradient-electric font-bold text-sm uppercase tracking-wider">How TotalAssist Works</span>
            </div>
          </AnimatedElement>
          <AnimatedElement animation="fadeInUp" delay={0.1} className="relative z-10">
            <h1 className="text-5xl font-bold text-text-primary dark:text-white mb-6 tracking-tight">
              Four ways to fix your <span className="text-gradient-electric">tech</span>
            </h1>
          </AnimatedElement>
          <AnimatedElement animation="fadeInUp" delay={0.2} className="relative z-10">
            <p className="text-xl text-text-secondary font-medium">
              Chat, snap a photo, call, or show us on video. TotalAssist meets you where you are.
            </p>
          </AnimatedElement>
        </div>

        {/* Arcade Demo Embed — separated with background + divider */}
        <div className="relative -mx-6 px-6 py-16 mb-24 bg-light-100/70 dark:bg-midnight-900/50 border-y border-light-200 dark:border-midnight-800">
          <AnimatedElement animation="fadeInUp" delay={0.3}>
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-text-primary dark:text-white mb-2">See it in action</h2>
                <p className="text-text-secondary text-sm">Walk through a real Wi-Fi troubleshooting session — from diagnosis to case report.</p>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-layered border border-light-300 dark:border-midnight-700">
                <ArcadeEmbed />
              </div>
            </div>
          </AnimatedElement>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-24">
          {features.map((feature, i) => (
            <AnimatedElement
              key={i}
              animation={i % 2 === 0 ? 'fadeInLeft' : 'fadeInRight'}
              delay={0.1 + i * 0.15}
            >
              <div
                className="card-clean rounded-2xl p-8 relative overflow-hidden group hover:-translate-y-1.5 hover:shadow-lg transition-all duration-300 h-full"
              >
                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(6,182,212,0.10) 100%)' }}>
                        <feature.icon className="w-7 h-7 text-electric-indigo" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-text-primary dark:text-white">{feature.name}</h3>
                        <p className="text-sm font-medium text-gradient-electric">{feature.tagline}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      feature.availability === 'All Plans'
                        ? 'text-white' : 'bg-surface-100 dark:bg-midnight-700 text-text-secondary dark:text-light-400'
                    }`}
                      style={feature.availability === 'All Plans' ? { background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)' } : undefined}
                    >
                      {feature.availability}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-text-secondary mb-6 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Benefits */}
                  <ul className="space-y-2 mb-6">
                    {feature.benefits.map((benefit, j) => (
                      <li key={j} className="flex items-center gap-3 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-electric-cyan shrink-0" />
                        <span className="text-text-secondary">{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  {/* How it works */}
                  <div className="bg-surface-50 dark:bg-midnight-800 rounded-lg px-4 py-3 border border-surface-border dark:border-midnight-700">
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1">How it works</p>
                    <p className="text-sm text-text-primary dark:text-white font-medium">{feature.howItWorks}</p>
                  </div>
                </div>
              </div>
            </AnimatedElement>
          ))}
        </div>

        {/* Case Report Section */}
        <AnimatedElement animation="fadeInUp">
          <div className="card-clean rounded-2xl p-8 md:p-12 mb-24 relative overflow-hidden">
            <div className="relative z-10">
              <AnimatedElement animation="fadeInLeft" delay={0.1}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(6,182,212,0.10) 100%)' }}>
                    <FileText className="w-6 h-6 text-electric-indigo" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-text-primary dark:text-white">Every Session Gets a Case Report</h2>
                    <p className="text-text-secondary text-sm">A clear summary of what happened, what was fixed, and what to do next</p>
                  </div>
                </div>
              </AnimatedElement>

              <div className="grid md:grid-cols-4 gap-4 mb-8">
                {reportSections.map((section, i) => (
                  <AnimatedElement key={i} animation="scaleIn" delay={0.2 + i * 0.1}>
                    <div className="bg-surface-50 dark:bg-midnight-800 rounded-xl p-5 border border-surface-border dark:border-midnight-700 hover:border-electric-indigo/30 transition-colors h-full">
                      <section.icon className="w-6 h-6 text-electric-cyan mb-3" />
                      <h4 className="text-text-primary dark:text-white font-bold mb-1">{section.title}</h4>
                      <p className="text-text-muted text-xs">{section.desc}</p>
                    </div>
                  </AnimatedElement>
                ))}
              </div>

              <AnimatedElement animation="fadeInUp" delay={0.5}>
                <div className="bg-midnight-950 rounded-xl overflow-hidden border border-midnight-700 shadow-clean-lg">
                  {/* PDF Header */}
                  <div className="bg-midnight-900 px-6 py-4" style={{ borderBottom: '2px solid transparent', borderImage: 'linear-gradient(135deg, #6366F1, #06B6D4) 1' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-gradient-electric font-bold text-lg tracking-wide">TOTALASSIST</h4>
                        <p className="text-electric-cyan text-xs font-medium tracking-wider">CASE REPORT</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white text-xs font-bold">DIAGNOSTIC REPORT</p>
                        <p className="text-text-muted text-xs">Feb 9, 2026</p>
                      </div>
                    </div>
                  </div>

                  {/* Outcome Badge */}
                  <div className="px-6 py-4">
                    <div className="bg-green-500 text-white px-4 py-2 rounded-md inline-flex items-center gap-2 font-bold text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      ISSUE RESOLVED
                    </div>
                  </div>

                  {/* Report Content */}
                  <div className="px-6 pb-6 space-y-5 text-sm">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1 h-4 bg-electric-indigo rounded-full"></div>
                        <span className="text-text-muted text-xs font-bold tracking-wider">SESSION OVERVIEW</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div><span className="text-text-muted">Duration:</span> <span className="text-white">4m 32s</span></div>
                        <div><span className="text-text-muted">Photos:</span> <span className="text-white">2</span></div>
                        <div><span className="text-text-muted">Messages:</span> <span className="text-white">8</span></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1 h-4 bg-electric-indigo rounded-full"></div>
                        <span className="text-text-muted text-xs font-bold tracking-wider">ISSUE SUMMARY</span>
                      </div>
                      <p className="text-white/90">Router showing red power LED with blinking amber internet indicator, unable to connect to network.</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1 h-4 bg-electric-indigo rounded-full"></div>
                        <span className="text-text-muted text-xs font-bold tracking-wider">ANALYSIS & DIAGNOSIS</span>
                      </div>
                      <p className="text-white/90">ISP connection failure due to firmware corruption. Router required factory reset to clear corrupted authentication cache.</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1 h-4 bg-electric-indigo rounded-full"></div>
                        <span className="text-text-muted text-xs font-bold tracking-wider">ACTIONS TAKEN</span>
                      </div>
                      <div className="space-y-2">
                        {['Power cycled the router for 30 seconds', 'Performed factory reset via pinhole button', 'Re-entered ISP credentials from welcome letter'].map((step, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <span className="w-5 h-5 bg-electric-indigo rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">{i + 1}</span>
                            <span className="text-white/90">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1 h-4 bg-electric-indigo rounded-full"></div>
                        <span className="text-text-muted text-xs font-bold tracking-wider">RECOMMENDATIONS</span>
                      </div>
                      <ul className="space-y-1">
                        {['Update router firmware to latest version', 'Consider enabling automatic updates'].map((rec, i) => (
                          <li key={i} className="flex items-center gap-2 text-white/90">
                            <div className="w-1.5 h-1.5 bg-electric-indigo rounded-full"></div>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="bg-midnight-900 px-6 py-3 border-t border-midnight-700">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-muted">Full conversation transcript included in report</span>
                      <span className="text-gradient-electric font-bold">TOTALASSIST</span>
                    </div>
                  </div>
                </div>
              </AnimatedElement>
            </div>
          </div>
        </AnimatedElement>

        {/* Why Scout Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-24">
          {[
            { icon: Clock, title: 'Available 24/7', desc: 'No waiting on hold or scheduling appointments. TotalAssist is ready whenever tech trouble strikes.' },
            { icon: Shield, title: 'Remembers Everything', desc: 'TotalAssist saves your device info and past issues. Never explain your setup twice or remember what worked last time.' },
            { icon: Zap, title: 'Actually Affordable', desc: 'Most issues solved in minutes for a fraction of a service call. Unlimited help with our memberships.' },
          ].map((item, i) => (
            <AnimatedElement key={i} animation="fadeInUp" delay={0.1 + i * 0.15}>
              <div className="text-center group">
                <div className="w-16 h-16 card-clean rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(6,182,212,0.06) 100%)' }}>
                  <item.icon className="w-8 h-8 text-electric-indigo" />
                </div>
                <h4 className="text-xl font-bold text-text-primary dark:text-white mb-3">{item.title}</h4>
                <p className="text-text-secondary text-sm font-medium">{item.desc}</p>
              </div>
            </AnimatedElement>
          ))}
        </div>
      </div>

      {/* Full-width CTA Section */}
      <div
        className="relative py-20 text-center overflow-hidden"
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
        <div className="container mx-auto px-6 relative z-10">
          <AnimatedElement animation="fadeInUp">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to fix your tech?</h3>
          </AnimatedElement>
          <AnimatedElement animation="fadeInUp" delay={0.15}>
            <p className="text-white/90 font-medium mb-8 max-w-xl mx-auto">Start with a free account. No credit card required.</p>
          </AnimatedElement>
          <AnimatedElement animation="fadeInUp" delay={0.3}>
            <button
              onClick={onStart}
              className="bg-white text-electric-indigo hover:bg-surface-50 font-bold py-4 px-12 rounded-xl shadow-clean-md hover:shadow-clean-lg transition-all flex items-center gap-3 mx-auto hover:-translate-y-0.5"
            >
              Get Started Free <ArrowRight className="w-5 h-5" />
            </button>
          </AnimatedElement>
        </div>
      </div>
    </div>
  );
};
