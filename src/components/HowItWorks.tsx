import React from 'react';
import { MessageSquare, Camera, Video, CheckCircle2, ArrowRight, Shield, Zap, Clock, Sparkles, Play, FileText, Radar } from 'lucide-react';
import { ScoutSignalIcon } from './Logo';

export const HowItWorks: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  const features = [
    {
      name: 'Scout Chat',
      tagline: 'Ask Anything',
      icon: MessageSquare,
      color: 'from-electric-indigo to-electric-cyan',
      bgColor: 'bg-electric-indigo/10',
      borderColor: 'border-electric-indigo/30',
      textColor: 'text-electric-indigo',
      description: 'AI-powered text support for instant answers to your tech questions. Describe your problem in plain English and get step-by-step solutions.',
      benefits: [
        'Instant responses 24/7',
        'No tech jargon required',
        'Remembers your devices & history',
      ],
      availability: 'All Plans',
      howItWorks: 'Type your question, get an answer. It\'s that simple.',
    },
    {
      name: 'Scout Snapshot',
      tagline: 'Show, Don\'t Tell',
      icon: Camera,
      color: 'from-scout-purple to-electric-indigo',
      bgColor: 'bg-scout-purple/10',
      borderColor: 'border-scout-purple/30',
      textColor: 'text-scout-purple',
      description: 'Upload a photo of error messages, blinking lights, or device screens. Scout\'s AI vision analyzes it instantly and tells you what\'s wrong.',
      benefits: [
        'Reads error codes & screens',
        'Identifies blinking light patterns',
        'No need to describe the problem',
      ],
      availability: 'All Plans',
      howItWorks: 'Snap a photo, upload it, get a diagnosis.',
    },
    {
      name: 'Scout Signal',
      tagline: 'Just Talk',
      icon: Radar,
      color: 'from-electric-cyan to-scout-glow',
      bgColor: 'bg-electric-cyan/10',
      borderColor: 'border-electric-cyan/30',
      textColor: 'text-electric-cyan',
      description: 'Voice-powered support for when typing isn\'t convenient. Talk to Scout like you would a real technician and get spoken guidance back.',
      benefits: [
        'Hands-free troubleshooting',
        'Natural conversation flow',
        'Perfect for complex setups',
      ],
      availability: 'Home & Pro',
      howItWorks: 'Press to talk, Scout listens and responds.',
    },
    {
      name: 'Video Diagnostic',
      tagline: 'Deep Analysis',
      icon: Video,
      color: 'from-scout-glow to-scout-purple',
      bgColor: 'bg-scout-glow/10',
      borderColor: 'border-scout-glow/30',
      textColor: 'text-scout-glow',
      description: 'Upload or record a video of your tech issue. Scout AI analyzes the footage and generates a comprehensive diagnostic report.',
      benefits: [
        'Detailed observation notes',
        'Root cause assessment',
        'Step-by-step action plan',
      ],
      availability: 'Home & Pro',
      howItWorks: 'Record your issue, get a full diagnostic report.',
    },
  ];

  const reportSections = [
    { icon: Sparkles, title: 'Status', desc: 'Issues detected or all clear' },
    { icon: FileText, title: 'Observation', desc: 'What Scout saw in the video' },
    { icon: Zap, title: 'Assessment', desc: 'Likely root cause of the issue' },
    { icon: CheckCircle2, title: 'Action Plan', desc: 'Step-by-step fix instructions' },
  ];

  return (
    <div className="pt-32 pb-20 bg-midnight-950 min-h-screen noise-texture">
      <div className="container mx-auto px-6">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 mb-6">
            <ScoutSignalIcon size={24} animate={true} />
            <span className="text-electric-indigo font-bold text-sm uppercase tracking-wider">How Scout Works</span>
          </div>
          <h1 className="text-5xl font-black text-white mb-6 tracking-tight">
            Four ways to fix your <span className="text-gradient-electric">tech</span>
          </h1>
          <p className="text-xl text-text-secondary font-medium">
            Chat, snap a photo, use your voice, or upload a video. Scout meets you where you are.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-24">
          {features.map((feature, i) => (
            <div
              key={i}
              className={`${feature.bgColor} ${feature.borderColor} border rounded-3xl p-8 relative overflow-hidden group hover:border-opacity-60 transition-all`}
            >
              {/* Background gradient orb */}
              <div className={`absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br ${feature.color} opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity`}></div>

              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg`}>
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{feature.name}</h3>
                      <p className={`text-sm font-medium ${feature.textColor}`}>{feature.tagline}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    feature.availability === 'All Plans'
                      ? 'bg-electric-cyan/20 text-electric-cyan'
                      : 'bg-scout-purple/20 text-scout-glow'
                  }`}>
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
                      <CheckCircle2 className={`w-4 h-4 ${feature.textColor} shrink-0`} />
                      <span className="text-text-secondary">{benefit}</span>
                    </li>
                  ))}
                </ul>

                {/* How it works */}
                <div className="bg-midnight-950/50 rounded-xl px-4 py-3 border border-midnight-700">
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">How it works</p>
                  <p className="text-sm text-white font-medium">{feature.howItWorks}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Video Diagnostic Deep Dive */}
        <div className="bg-midnight-900 rounded-[2rem] p-8 md:p-12 mb-24 border border-midnight-700 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-scout-purple/10 blur-[100px] rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-electric-indigo/10 blur-[100px] rounded-full"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-scout-glow to-scout-purple flex items-center justify-center">
                <Video className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Video Diagnostic Report</h2>
                <p className="text-text-secondary text-sm">What you get when Scout analyzes your video</p>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4 mb-8">
              {reportSections.map((section, i) => (
                <div key={i} className="bg-midnight-800/50 rounded-xl p-5 border border-midnight-700">
                  <section.icon className="w-6 h-6 text-scout-glow mb-3" />
                  <h4 className="text-white font-bold mb-1">{section.title}</h4>
                  <p className="text-text-muted text-xs">{section.desc}</p>
                </div>
              ))}
            </div>

            <div className="bg-midnight-950/80 rounded-xl p-6 border border-scout-purple/30">
              <div className="flex items-center gap-2 mb-4">
                <Play className="w-4 h-4 text-scout-glow" />
                <span className="text-scout-glow text-sm font-medium">Example Report Output</span>
              </div>
              <div className="space-y-4 text-sm">
                <div>
                  <span className="text-white font-bold">Status:</span>
                  <span className="text-red-400 ml-2">Issue Detected</span>
                </div>
                <div>
                  <span className="text-white font-bold">Observation:</span>
                  <span className="text-text-secondary ml-2">Router front panel shows solid red power LED with blinking amber internet indicator. Device appears to be in diagnostic mode based on LED pattern sequence.</span>
                </div>
                <div>
                  <span className="text-white font-bold">Assessment:</span>
                  <span className="text-text-secondary ml-2">ISP connection failure. Router is unable to authenticate with upstream provider. This is typically caused by a service outage or credential mismatch.</span>
                </div>
                <div>
                  <span className="text-white font-bold">Action Plan:</span>
                  <ol className="text-text-secondary ml-4 mt-1 list-decimal list-inside space-y-1">
                    <li>Power cycle the router (unplug for 30 seconds)</li>
                    <li>Check ISP status page for reported outages</li>
                    <li>If issue persists, contact ISP with error code E-AUTH-03</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Why Scout Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-24">
          <div className="text-center">
            <div className="w-16 h-16 bg-midnight-800 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-midnight-700">
              <Clock className="w-8 h-8 text-electric-indigo" />
            </div>
            <h4 className="text-xl font-bold text-white mb-3">Available 24/7</h4>
            <p className="text-text-secondary text-sm font-medium">No waiting on hold or scheduling appointments. Scout is ready whenever tech trouble strikes.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-midnight-800 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-midnight-700">
              <Shield className="w-8 h-8 text-electric-cyan" />
            </div>
            <h4 className="text-xl font-bold text-white mb-3">Remembers Everything</h4>
            <p className="text-text-secondary text-sm font-medium">Scout saves your device info and past issues. Never explain your setup twice or remember what worked last time.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-midnight-800 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-midnight-700">
              <Zap className="w-8 h-8 text-scout-purple" />
            </div>
            <h4 className="text-xl font-bold text-white mb-3">Actually Affordable</h4>
            <p className="text-text-secondary text-sm font-medium">Most issues solved in minutes for a fraction of a service call. Unlimited help with our memberships.</p>
          </div>
        </div>
      </div>

      {/* Full-width CTA Section */}
      <div className="bg-gradient-to-br from-scout-purple to-electric-indigo py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-electric-cyan rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-scout-glow rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <h3 className="text-3xl md:text-4xl font-black text-white mb-4">Ready to fix your tech?</h3>
          <p className="text-white/90 font-medium mb-8 max-w-xl mx-auto">Start with a free account. No credit card required.</p>
          <button
            onClick={onStart}
            className="bg-midnight-950 hover:bg-midnight-900 text-white font-bold py-4 px-12 rounded-full shadow-xl transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3 mx-auto"
          >
            Get Started Free <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
