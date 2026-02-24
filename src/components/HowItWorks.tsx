import React from 'react';
import { MessageSquare, Camera, Mic, Video, CheckCircle2, ArrowRight, Shield, Zap, Clock, Sparkles, FileText, Search, Wrench, Lightbulb } from 'lucide-react';
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

  // Dummy data for the PDF-style report preview
  const dummyReport = {
    client: 'Bill Wonka',
    date: 'February 24, 2026',
    sessionId: 'TA-20260224-0847',
    mode: 'Photo Analysis',
    agent: 'TotalAssist AI',
    duration: '6m 18s',
    device: 'Smart Thermostat',
    brand: 'Ecobee',
    model: 'SmartThermostat Premium',
    status: 'Resolved',
    outcome: 'HVAC system restored to normal operation',
    rootCause: 'Thermostat firmware update interrupted by power fluctuation, leaving the scheduling module in a corrupted state',
    primaryFix: 'Factory reset and firmware reinstall via USB recovery mode',
    issue: 'Ecobee thermostat screen frozen on "Calibrating..." for 3+ hours after an overnight update. HVAC system not responding to temperature changes.',
    rootCauseItems: [
      'Firmware v4.8.2 update interrupted at 73% by a brief power dip (confirmed via utility outage log)',
      'Corrupted scheduling module prevented the thermostat from completing its calibration cycle',
      'HVAC relay remained in last-known state (heat off) due to thermostat communication failure',
    ],
    resolutionSteps: [
      'Identified frozen calibration loop from photo of thermostat screen',
      'Guided client through USB recovery mode (hold Menu + Power for 10 seconds)',
      'Performed factory reset and reinstalled firmware v4.8.3 via Ecobee portal',
      'Verified HVAC response by toggling temperature set point up 3°F',
    ],
    recommendations: [
      'Connect thermostat to a UPS-backed outlet to prevent future update interruptions',
      'Enable automatic firmware updates during low-usage hours (2–5 AM)',
    ],
  };

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
              Get help <span className="text-gradient-electric">your way</span>
            </h1>
          </AnimatedElement>
          <AnimatedElement animation="fadeInUp" delay={0.2} className="relative z-10">
            <p className="text-xl text-text-secondary font-medium">
              Type it, snap it, say it, or show it — pick whatever feels easiest and your agent handles the rest.
            </p>
          </AnimatedElement>
        </div>

        {/* Arcade Demo Embed — separated with background + divider */}
        <div id="see-it-in-action" className="relative -mx-6 px-6 py-16 mb-24 bg-light-100/70 dark:bg-midnight-900/50 border-y border-light-200 dark:border-midnight-800">
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
        <div className="mb-24">
          <AnimatedElement animation="fadeInUp">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <div className="inline-flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-electric-indigo" />
                <span className="text-gradient-electric font-bold text-sm uppercase tracking-wider">Case Reports</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary dark:text-white mb-3 tracking-tight">
                Every session gets a <span className="text-gradient-electric">diagnostic report</span>
              </h2>
              <p className="text-text-secondary font-medium">
                A clear summary of what happened, what was fixed, and what to do next — downloadable as a PDF.
              </p>
            </div>
          </AnimatedElement>

          {/* PDF Document Preview */}
          <AnimatedElement animation="fadeInUp" delay={0.2}>
            <div className="max-w-3xl mx-auto">
              {/* Document shadow wrapper — looks like a floating page */}
              <div
                className="rounded-[20px] overflow-hidden"
                style={{
                  boxShadow: '0 8px 40px rgba(11,16,32,0.12), 0 2px 12px rgba(11,16,32,0.06)',
                  border: '1px solid rgba(0,0,0,0.06)',
                }}
              >
                {/* ── Gradient Hero Header ── */}
                <div
                  className="relative overflow-hidden px-6 sm:px-7 pt-6 sm:pt-7 pb-5 sm:pb-6"
                  style={{ background: 'linear-gradient(135deg, #5B4BFF, #2AA7FF)' }}
                >
                  {/* Decorative glow blobs */}
                  <div
                    className="absolute -top-36 -left-36 w-96 h-96 pointer-events-none"
                    aria-hidden="true"
                    style={{ filter: 'blur(50px)', opacity: 0.25, background: 'radial-gradient(circle, rgba(255,255,255,0.4), transparent)' }}
                  />
                  <div
                    className="absolute -top-40 -right-40 w-96 h-96 pointer-events-none"
                    aria-hidden="true"
                    style={{ filter: 'blur(50px)', opacity: 0.18, background: 'radial-gradient(circle, rgba(255,255,255,0.4), transparent)' }}
                  />

                  {/* Brand row */}
                  <div className="relative z-10 mb-5">
                    <img src="/total_assist-new-white.png" alt="TotalAssist" className="h-10 sm:h-12 w-auto" />
                  </div>

                  {/* Title */}
                  <div className="relative z-10">
                    <h3 className="text-white text-2xl sm:text-[28px] font-bold tracking-tight leading-tight">Diagnostic Report</h3>
                    <p className="text-white/80 text-sm mt-1">Support session summary and findings</p>
                  </div>

                  {/* Meta pills */}
                  <div className="relative z-10 flex flex-wrap gap-2 mt-4">
                    {[
                      { label: 'Session', value: dummyReport.sessionId },
                      { label: 'Date', value: dummyReport.date.split(',')[0] },
                      { label: 'Mode', value: dummyReport.mode },
                      { label: 'Agent', value: dummyReport.agent },
                    ].map((pill, i) => (
                      <div
                        key={i}
                        className="flex gap-2 items-baseline px-3 py-1.5 rounded-full text-white"
                        style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.20)' }}
                      >
                        <span className="text-[11px] opacity-75">{pill.label}</span>
                        <span className="text-xs font-bold">{pill.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── White Content Area ── */}
                <div className="bg-white">
                  <div className="px-5 sm:px-6 pt-5">
                    {/* Card container */}
                    <div
                      className="rounded-[20px] overflow-hidden"
                      style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 24px rgba(11,16,32,0.08)' }}
                    >

                      {/* ── Executive Summary ── */}
                      <div className="px-5 sm:px-6 pt-5 pb-4">
                        <div className="flex items-start gap-3">
                          <div
                            className="w-9 h-9 rounded-[10px] grid place-items-center shrink-0"
                            style={{ background: 'rgba(91,75,255,0.10)', border: '1px solid rgba(91,75,255,0.12)' }}
                          >
                            <FileText className="w-5 h-5" style={{ color: 'rgba(64,84,255,0.90)' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[#0B1020] text-lg font-bold tracking-tight">Executive Summary</h4>
                            <p className="text-[#6B7280] text-xs mt-0.5">At-a-glance outcome of this support session.</p>
                          </div>
                          {/* Status badge */}
                          <div
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full font-bold text-xs whitespace-nowrap shrink-0"
                            style={{ background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.18)', color: 'rgba(5,120,80,0.90)' }}
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ background: '#10B981', boxShadow: '0 0 0 3px rgba(16,185,129,0.20)' }}
                              aria-hidden="true"
                            />
                            {dummyReport.status}
                          </div>
                        </div>

                        {/* Exec summary rows */}
                        <div
                          className="mt-3 rounded-[14px] overflow-hidden"
                          style={{ background: 'rgba(91,75,255,0.03)', border: '1px solid rgba(91,75,255,0.08)' }}
                        >
                          {[
                            { label: 'Outcome', value: dummyReport.outcome },
                            { label: 'Root Cause', value: dummyReport.rootCause },
                            { label: 'Primary Fix', value: dummyReport.primaryFix },
                          ].map((row, i, arr) => (
                            <div
                              key={i}
                              className="flex px-3.5 py-3"
                              style={i < arr.length - 1 ? { borderBottom: '1px solid rgba(91,75,255,0.06)' } : undefined}
                            >
                              <div
                                className="w-24 shrink-0 text-[11px] tracking-[0.10em] uppercase font-bold pt-0.5"
                                style={{ color: 'rgba(91,75,255,0.60)' }}
                              >
                                {row.label}
                              </div>
                              <div className="text-[13px] font-semibold text-[#0B1020] leading-snug">{row.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Divider */}
                      <hr className="border-0 h-px" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.03), rgba(0,0,0,0.07), rgba(0,0,0,0.03))' }} />

                      {/* ── Session Details ── */}
                      <div className="px-5 sm:px-6 pt-5 pb-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div
                            className="w-9 h-9 rounded-[10px] grid place-items-center shrink-0"
                            style={{ background: 'rgba(91,75,255,0.10)', border: '1px solid rgba(91,75,255,0.12)' }}
                          >
                            <Sparkles className="w-5 h-5" style={{ color: 'rgba(64,84,255,0.90)' }} />
                          </div>
                          <div>
                            <h4 className="text-[#0B1020] text-lg font-bold tracking-tight">Session Details</h4>
                            <p className="text-[#6B7280] text-xs mt-0.5">Key information for this support session.</p>
                          </div>
                        </div>

                        <div
                          className="rounded-[14px] overflow-hidden"
                          style={{ background: '#FAFBFC', border: '1px solid rgba(0,0,0,0.06)' }}
                        >
                          {[
                            { label: 'Client', value: dummyReport.client },
                            { label: 'Date', value: dummyReport.date },
                            { label: 'Session ID', value: dummyReport.sessionId },
                            { label: 'Mode', value: dummyReport.mode },
                            { label: 'Agent', value: dummyReport.agent },
                            { label: 'Duration', value: dummyReport.duration },
                            { label: 'Device', value: dummyReport.device },
                            { label: 'Brand', value: dummyReport.brand },
                            { label: 'Model', value: dummyReport.model },
                          ].map((row, i, arr) => (
                            <div
                              key={i}
                              className="flex px-3.5 py-2.5 text-[13px]"
                              style={i < arr.length - 1 ? { borderBottom: '1px solid rgba(0,0,0,0.04)' } : undefined}
                            >
                              <div className="w-24 shrink-0 text-[11px] tracking-[0.08em] uppercase text-[#6B7280] font-semibold">{row.label}</div>
                              <div className="font-semibold text-[#0B1020]">{row.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <hr className="border-0 h-px" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.03), rgba(0,0,0,0.07), rgba(0,0,0,0.03))' }} />

                      {/* ── Issue Summary ── */}
                      <div className="px-5 sm:px-6 pt-5 pb-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div
                            className="w-9 h-9 rounded-[10px] grid place-items-center shrink-0"
                            style={{ background: 'rgba(91,75,255,0.10)', border: '1px solid rgba(91,75,255,0.12)' }}
                          >
                            <Zap className="w-5 h-5" style={{ color: 'rgba(64,84,255,0.90)' }} />
                          </div>
                          <div>
                            <h4 className="text-[#0B1020] text-lg font-bold tracking-tight">Issue Summary</h4>
                            <p className="text-[#6B7280] text-xs mt-0.5">What the client reported and what was observed.</p>
                          </div>
                        </div>

                        <div
                          className="rounded-[14px] px-3.5 py-3"
                          style={{ background: 'rgba(91,75,255,0.04)', border: '1px solid rgba(91,75,255,0.14)' }}
                        >
                          <div className="text-[10px] uppercase tracking-[0.12em] font-extrabold" style={{ color: 'rgba(91,75,255,0.70)' }}>Issue</div>
                          <div className="text-sm font-semibold text-[#0B1020] leading-relaxed mt-2">{dummyReport.issue}</div>
                        </div>
                      </div>

                      <hr className="border-0 h-px" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.03), rgba(0,0,0,0.07), rgba(0,0,0,0.03))' }} />

                      {/* ── Root Cause Analysis ── */}
                      <div className="px-5 sm:px-6 pt-5 pb-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div
                            className="w-9 h-9 rounded-[10px] grid place-items-center shrink-0"
                            style={{ background: 'rgba(91,75,255,0.10)', border: '1px solid rgba(91,75,255,0.12)' }}
                          >
                            <Search className="w-5 h-5" style={{ color: 'rgba(64,84,255,0.90)' }} />
                          </div>
                          <div>
                            <h4 className="text-[#0B1020] text-lg font-bold tracking-tight">Root Cause Analysis</h4>
                            <p className="text-[#6B7280] text-xs mt-0.5">Why the problem occurred.</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {dummyReport.rootCauseItems.map((item, i) => (
                            <div
                              key={i}
                              className="flex gap-2.5 items-start px-3 py-2.5 rounded-xl text-[13px] leading-relaxed"
                              style={{ background: '#FAFBFC', border: '1px solid rgba(0,0,0,0.06)', color: 'rgba(11,16,32,0.80)' }}
                            >
                              <span
                                className="w-5 h-5 rounded-lg grid place-items-center shrink-0 mt-0.5"
                                style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.16)' }}
                              >
                                <CheckCircle2 className="w-3 h-3" style={{ color: 'rgba(16,185,129,0.90)' }} />
                              </span>
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>

                      <hr className="border-0 h-px" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.03), rgba(0,0,0,0.07), rgba(0,0,0,0.03))' }} />

                      {/* ── Resolution Steps ── */}
                      <div className="px-5 sm:px-6 pt-5 pb-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div
                            className="w-9 h-9 rounded-[10px] grid place-items-center shrink-0"
                            style={{ background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.12)' }}
                          >
                            <Wrench className="w-5 h-5" style={{ color: 'rgba(5,120,80,0.90)' }} />
                          </div>
                          <div>
                            <h4 className="text-[#0B1020] text-lg font-bold tracking-tight">Resolution Steps</h4>
                            <p className="text-[#6B7280] text-xs mt-0.5">Actions taken to restore service.</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {dummyReport.resolutionSteps.map((step, i) => (
                            <div
                              key={i}
                              className="flex gap-2.5 items-start px-3 py-2.5 rounded-xl text-[13px] leading-relaxed"
                              style={{ background: '#FAFBFC', border: '1px solid rgba(0,0,0,0.06)', color: 'rgba(11,16,32,0.80)' }}
                            >
                              <span
                                className="w-6 h-6 rounded-full grid place-items-center text-white text-xs font-extrabold shrink-0 mt-0.5"
                                style={{ background: 'linear-gradient(135deg, rgba(91,75,255,0.70), rgba(42,167,255,0.70))' }}
                              >
                                {i + 1}
                              </span>
                              {step}
                            </div>
                          ))}
                        </div>
                      </div>

                      <hr className="border-0 h-px" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.03), rgba(0,0,0,0.07), rgba(0,0,0,0.03))' }} />

                      {/* ── Recommendations ── */}
                      <div className="px-5 sm:px-6 pt-5 pb-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div
                            className="w-9 h-9 rounded-[10px] grid place-items-center shrink-0"
                            style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.12)' }}
                          >
                            <Lightbulb className="w-5 h-5" style={{ color: 'rgba(180,100,10,0.90)' }} />
                          </div>
                          <div>
                            <h4 className="text-[#0B1020] text-lg font-bold tracking-tight">Recommendations</h4>
                            <p className="text-[#6B7280] text-xs mt-0.5">Suggested next steps to prevent recurrence.</p>
                          </div>
                        </div>

                        <div
                          className="rounded-[14px] px-3.5 py-3"
                          style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}
                        >
                          <div className="text-[10px] uppercase tracking-[0.12em] font-extrabold" style={{ color: 'rgba(146,64,14,0.80)' }}>Next Steps</div>
                          <ul className="mt-2 space-y-1.5">
                            {dummyReport.recommendations.map((rec, i) => (
                              <li key={i} className="flex items-start gap-2 text-[13px] leading-relaxed" style={{ color: 'rgba(11,16,32,0.72)' }}>
                                <span className="text-[rgba(146,64,14,0.60)] mt-1.5">&#8226;</span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* ── Footer ── */}
                      <div
                        className="flex items-center justify-between px-5 sm:px-6 py-3 text-[11px]"
                        style={{ background: '#FAFBFC', borderTop: '1px solid rgba(0,0,0,0.06)', color: '#6B7280' }}
                      >
                        <div><span className="font-bold text-[#0B1020]">TotalAssist</span> &middot; Diagnostic Report &middot; {dummyReport.sessionId}</div>
                        <div>Generated {dummyReport.date}</div>
                      </div>
                    </div>
                  </div>

                  {/* Subtle bottom padding for the white area */}
                  <div className="h-5" />
                </div>
              </div>
            </div>
          </AnimatedElement>
        </div>

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
