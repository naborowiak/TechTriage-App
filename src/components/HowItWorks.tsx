import React from 'react';
import { Camera, Video, CheckCircle2, ArrowRight } from 'lucide-react';

interface HowItWorksProps {
  onStart: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onStart }) => {
  const steps = [
    {
      number: '01',
      title: 'Snap a Photo',
      description: 'Take a picture of the issue with your phone. Our AI instantly identifies the problem and assesses any safety concerns.',
      icon: <Camera className="w-8 h-8" />
    },
    {
      number: '02',
      title: 'Get Expert Guidance',
      description: 'Connect with a certified technician via live video. They see what you see and guide you through the fix step-by-step.',
      icon: <Video className="w-8 h-8" />
    },
    {
      number: '03',
      title: 'Problem Solved',
      description: 'Most issues are resolved in under 15 minutes. If you need a pro, we connect you with vetted local technicians.',
      icon: <CheckCircle2 className="w-8 h-8" />
    }
  ];

  return (
    <div className="pt-32 pb-20">
      <section className="py-20 bg-brand-900">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl lg:text-6xl font-black text-white mb-6">
            How TechTriage Works
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            From problem to solution in minutes. Here's how our AI-powered platform helps you fix home issues faster.
          </p>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="space-y-20">
            {steps.map((step, index) => (
              <div key={index} className={`flex flex-col md:flex-row gap-12 items-center ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                <div className="flex-1">
                  <div className="text-cta-500 font-black text-6xl mb-4">{step.number}</div>
                  <h2 className="text-3xl font-bold text-brand-900 mb-4">{step.title}</h2>
                  <p className="text-gray-500 text-lg leading-relaxed">{step.description}</p>
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="w-48 h-48 bg-cta-50 rounded-full flex items-center justify-center text-cta-500">
                    {step.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-brand-900 text-center">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-black text-white mb-6">Ready to get started?</h2>
          <p className="text-white/70 mb-8 max-w-xl mx-auto">
            Join thousands of homeowners who are saving time and money with TechTriage.
          </p>
          <button
            onClick={onStart}
            className="bg-cta-500 hover:bg-cta-600 text-white font-bold px-8 py-4 rounded-md transition-colors inline-flex items-center gap-2"
          >
            Start Free Trial <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>
    </div>
  );
};
