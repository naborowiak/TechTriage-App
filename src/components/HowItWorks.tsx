import React from 'react';
import { Camera, Video, CheckCircle2, ArrowRight, Shield, Smartphone, PenTool as Tool, Search, HeartPulse, MessageSquare } from 'lucide-react';

export const HowItWorks: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  const steps = [
    {
      icon: <MessageSquare className="w-8 h-8 text-[#F97316]" />,
      title: "1. Tell Us What's Wrong",
      description: "Just describe it like you would to a friend. \"My Wi-Fi keeps dropping\" or \"There's a weird error on my TV.\" No tech jargon needed.",
      accent: "bg-orange-50",
      image: "/images/step-photo.jpg"
    },
    {
      icon: <Camera className="w-8 h-8 text-blue-500" />,
      title: "2. Show Us (Optional)",
      description: "Snap a photo of that blinking light or confusing error message. Our AI analyzes it instantly and often knows exactly what's wrong.",
      accent: "bg-blue-50",
      image: "/images/step-ai.jpg"
    },
    {
      icon: <Video className="w-8 h-8 text-purple-500" />,
      title: "3. Get Real Help",
      description: "Chat with AI for quick fixes, or hop on a video call with a real human who'll walk you through it step-by-step. We're here to help.",
      accent: "bg-purple-50",
      image: "/images/video-support.jpg"
    },
    {
      icon: <CheckCircle2 className="w-8 h-8 text-[#F97316]" />,
      title: "4. Back to Normal",
      description: "Problem solved. We'll save what we learned so next time it's even faster—and so you never have to explain the same issue twice.",
      accent: "bg-orange-50",
      image: "/images/step-fix.jpg"
    }
  ];

  return (
    <div className="pt-32 pb-20 bg-white min-h-screen">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h1 className="text-5xl font-black text-brand-900 mb-6 tracking-tight">
            How <span className="text-cta-500">TechTriage</span> actually works
          </h1>
          <p className="text-xl text-gray-500 font-medium">
            No confusing phone trees. No waiting on hold. Just real help from people (and AI) who get it.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8 mb-32 relative">
          <div className="hidden md:block absolute top-1/4 left-0 right-0 h-0.5 bg-gray-100 -z-10"></div>

          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center group">
              <div className="w-full h-40 rounded-2xl overflow-hidden mb-6 shadow-lg">
                <img src={step.image} alt={step.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className={`${step.accent} w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300 border border-white -mt-10 relative z-10`}>
                {step.icon}
              </div>
              <h3 className="text-xl font-bold text-[#1F2937] mb-3">{step.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed font-medium">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-brand-900 rounded-[3rem] p-8 md:p-16 text-white mb-32 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cta-500/20 blur-[100px] rounded-full"></div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-black mb-4 text-center">The Best of Both Worlds</h2>
            <p className="text-white/60 text-center mb-12 max-w-2xl mx-auto">AI that's actually helpful + real humans who actually care. Because sometimes you need instant answers, and sometimes you need someone to talk you through it.</p>
            <div className="grid md:grid-cols-2 gap-12">
              <div className="bg-white/5 backdrop-blur-md rounded-3xl p-10 border border-white/10">
                <div className="flex items-center gap-4 mb-6">
                  <Smartphone className="w-10 h-10 text-cta-500" />
                  <h4 className="text-2xl font-bold">Smart AI Assistant</h4>
                </div>
                <ul className="space-y-4 text-white/70">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cta-500 shrink-0 mt-1" />
                    <span>Recognizes error codes and blinking lights instantly</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cta-500 shrink-0 mt-1" />
                    <span>Available 24/7 for quick questions and common fixes</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cta-500 shrink-0 mt-1" />
                    <span>Explains things in plain English, not tech speak</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-3xl p-10 border border-white/10">
                <div className="flex items-center gap-4 mb-6">
                  <HeartPulse className="w-10 h-10 text-blue-400" />
                  <h4 className="text-2xl font-bold">Real Human Experts</h4>
                </div>
                <ul className="space-y-4 text-white/70">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-1" />
                    <span>Patient, friendly people who take the time to explain</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-1" />
                    <span>Walk you through tricky stuff via video call</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-1" />
                    <span>Know when something's a quick fix vs. needs a pro</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-12 mb-32">
          <div className="text-center">
             <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-brand-900" />
             </div>
             <h4 className="text-xl font-bold text-brand-900 mb-3">We Remember</h4>
             <p className="text-gray-500 text-sm font-medium">Every issue you've had, every fix we've done—it's all saved. So you never have to explain your setup twice or remember what worked last time.</p>
          </div>
          <div className="text-center">
             <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8 text-brand-900" />
             </div>
             <h4 className="text-xl font-bold text-brand-900 mb-3">Skip the Runaround</h4>
             <p className="text-gray-500 text-sm font-medium">If you do need someone onsite, they'll know exactly what's wrong before they arrive. No more paying someone $100 just to diagnose the obvious.</p>
          </div>
          <div className="text-center">
             <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Tool className="w-8 h-8 text-brand-900" />
             </div>
             <h4 className="text-xl font-bold text-brand-900 mb-3">Actually Affordable</h4>
             <p className="text-gray-500 text-sm font-medium">Most issues are solved in minutes for a fraction of a service call. And our memberships mean unlimited help whenever you need it.</p>
          </div>
        </div>

        <div className="bg-cta-50 rounded-[2rem] p-12 text-center border-2 border-cta-100">
           <h3 className="text-3xl font-black text-brand-900 mb-4">Enough with the tech headaches</h3>
           <p className="text-gray-600 font-medium mb-8 max-w-xl mx-auto">Your first session is free. See what it's like to get help that actually helps.</p>
           <button
             onClick={onStart}
             className="bg-cta-500 hover:bg-cta-600 text-white font-bold py-4 px-12 rounded-full shadow-xl shadow-cta-500/20 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3 mx-auto"
           >
             Get Started Free <ArrowRight className="w-5 h-5" />
           </button>
        </div>
      </div>
    </div>
  );
};
