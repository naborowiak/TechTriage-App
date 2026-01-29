import React, { useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface SignUpProps {
  onStart: () => void;
  initialEmail?: string;
}

export const SignUp: React.FC<SignUpProps> = ({ onStart, initialEmail = '' }) => {
  const [email, setEmail] = useState(initialEmail);

  const benefits = [
    'No credit card required',
    'Full access for 14 days',
    'Cancel anytime'
  ];

  return (
    <section className="min-h-screen pt-[72px] bg-[#F9FAFB]">
      <div className="grid lg:grid-cols-2 min-h-[calc(100vh-72px)]">
        <div className="flex flex-col justify-center px-8 lg:px-16 py-12 bg-[#F9FAFB]">
          <div className="max-w-md">
            <h1 className="text-4xl lg:text-5xl font-black text-[#1F2937] leading-tight mb-6">
              TechTriage helps your home run smoothly
            </h1>
            <p className="text-xl text-gray-600 mb-10">
              Put TechTriage to work for you. No credit card required.
            </p>

            <div className="space-y-4 mb-10">
              <label className="block text-[#1F2937] font-bold text-sm mb-2">
                Work Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-lg text-lg focus:border-[#F97316] focus:outline-none transition-colors"
              />
              <button
                onClick={onStart}
                className="w-full bg-[#1F2937] hover:bg-[#374151] text-white font-bold text-lg py-4 rounded-full flex items-center justify-center gap-2 transition-colors"
              >
                Get Started Free <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-4">
              {benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-600">
                  <CheckCircle2 className="w-5 h-5 text-[#F97316]" />
                  <span className="font-medium">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="hidden lg:block relative overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ 
              backgroundImage: 'linear-gradient(135deg, #1F2937 0%, #374151 100%)'
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center p-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-[#F97316] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xl">TT</span>
                  </div>
                  <div>
                    <div className="text-white/60 text-sm">Hi there!</div>
                    <div className="text-white font-bold">How can I help you today?</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-white/30 transition-colors">
                    Speak to an expert
                  </button>
                  <button className="bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-white/30 transition-colors">
                    Book a demo
                  </button>
                </div>
              </div>
            </div>

            <div className="absolute bottom-8 left-8 right-8">
              <div className="bg-white rounded-xl p-4 shadow-xl">
                <div className="text-sm font-bold text-[#1F2937]">Ryan Godfrey</div>
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  Florida Electrical Solutions
                  <span className="inline-flex items-center gap-1 text-[#F97316]">
                    <span className="w-1.5 h-1.5 bg-[#F97316] rounded-full"></span>
                    Orange City, FL
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
