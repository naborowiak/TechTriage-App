import React from 'react';
import { Camera, Video, CheckCircle2, ArrowRight, Zap, Shield, Smartphone, PenTool as Tool, Search, HeartPulse } from 'lucide-react';

export const HowItWorks: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  const steps = [
    {
      icon: <Camera className="w-8 h-8 text-[#F97316]" />,
      title: "1. Capture the Issue",
      description: "Snap a photo or short video of the problem. Our AI instantly identifies the device and potential failure points.",
      accent: "bg-orange-50",
      image: "/images/step-photo.jpg"
    },
    {
      icon: <Zap className="w-8 h-8 text-blue-500" />,
      title: "2. Get Instant Triage",
      description: "Our AI provides an immediate safety assessment and diagnostic report. Many common issues are solved right here.",
      accent: "bg-blue-50",
      image: "/images/step-ai.jpg"
    },
    {
      icon: <Video className="w-8 h-8 text-purple-500" />,
      title: "3. Video with an Expert",
      description: "Need more help? Connect with a certified technician in seconds. They guide your hands via live video.",
      accent: "bg-purple-50",
      image: "/images/video-support.jpg"
    },
    {
      icon: <CheckCircle2 className="w-8 h-8 text-[#F97316]" />,
      title: "4. Resolve & Archive",
      description: "Get the fix confirmed. A detailed diagnostic report and repair history are saved to your home's digital twin.",
      accent: "bg-orange-50",
      image: "/images/step-fix.jpg"
    }
  ];

  return (
    <div className="pt-32 pb-20 bg-white min-h-screen">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h1 className="text-5xl font-black text-brand-900 mb-6 tracking-tight">
            How <span className="text-cta-500">TechTriage</span> works
          </h1>
          <p className="text-xl text-gray-500 font-medium">
            We've combined advanced computer vision with world-class human expertise to make home maintenance effortless.
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
            <h2 className="text-3xl md:text-4xl font-black mb-12 text-center">AI + Human: The Perfect Pair</h2>
            <div className="grid md:grid-cols-2 gap-12">
              <div className="bg-white/5 backdrop-blur-md rounded-3xl p-10 border border-white/10">
                <div className="flex items-center gap-4 mb-6">
                  <Smartphone className="w-10 h-10 text-cta-500" />
                  <h4 className="text-2xl font-bold">The AI Agent</h4>
                </div>
                <ul className="space-y-4 text-white/70">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cta-500 shrink-0 mt-1" />
                    <span>Identifies model numbers and error codes in milliseconds</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cta-500 shrink-0 mt-1" />
                    <span>Performs real-time safety checks for gas and electricity</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cta-500 shrink-0 mt-1" />
                    <span>Generates instant step-by-step DIY guides</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-3xl p-10 border border-white/10">
                <div className="flex items-center gap-4 mb-6">
                  <HeartPulse className="w-10 h-10 text-blue-400" />
                  <h4 className="text-2xl font-bold">The Live Expert</h4>
                </div>
                <ul className="space-y-4 text-white/70">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-1" />
                    <span>Provides nuanced mechanical judgment for complex repairs</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-1" />
                    <span>Offers emotional reassurance during home emergencies</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-1" />
                    <span>Confirms if a part truly needs replacement</span>
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
             <h4 className="text-xl font-bold text-brand-900 mb-3">Home Health Archive</h4>
             <p className="text-gray-500 text-sm font-medium">Every fix is logged. Building a digital history of your home increases resale value and simplifies future repairs.</p>
          </div>
          <div className="text-center">
             <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8 text-brand-900" />
             </div>
             <h4 className="text-xl font-bold text-brand-900 mb-3">Pre-Call Diagnostics</h4>
             <p className="text-gray-500 text-sm font-medium">If you DO need an on-site pro, we send them your TechTriage report so they arrive with the right parts ready.</p>
          </div>
          <div className="text-center">
             <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Tool className="w-8 h-8 text-brand-900" />
             </div>
             <h4 className="text-xl font-bold text-brand-900 mb-3">Parts Procurement</h4>
             <p className="text-gray-500 text-sm font-medium">Our AI identifies specific replacement parts and gives you the exact SKUs to order with one click.</p>
          </div>
        </div>

        <div className="bg-cta-50 rounded-[2rem] p-12 text-center border-2 border-cta-100">
           <h3 className="text-3xl font-black text-brand-900 mb-4">Ready to fix it?</h3>
           <p className="text-gray-600 font-medium mb-8 max-w-xl mx-auto">Join the new era of home ownership. Diagnoses start instantly and your first triage is on us.</p>
           <button 
             onClick={onStart}
             className="bg-cta-500 hover:bg-cta-600 text-white font-bold py-4 px-12 rounded-full shadow-xl shadow-cta-500/20 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3 mx-auto"
           >
             Start Your First Triage <ArrowRight className="w-5 h-5" />
           </button>
        </div>
      </div>
    </div>
  );
};
