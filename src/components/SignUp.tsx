import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Eye, EyeOff, Wifi, Tv, Cpu, Home, Thermometer, Lock, ChevronDown, AlertCircle } from 'lucide-react';
import { Logo } from './Logo';
import { checkTrialEligibility, startTrial } from '../services/trialService';

interface SignUpProps {
  onStart: () => void;
  initialEmail?: string;
  onSpeakToExpert?: () => void;
  onComplete?: (user: { id?: string; firstName: string; lastName?: string; email: string }) => void;
}

type OnboardingStep = 'credentials' | 'profile' | 'home' | 'needs' | 'complete';

interface FormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  homeType: string;
  homeSize: string;
  techComfort: string;
  householdSize: string;
  primaryIssues: string[];
  howHeard: string;
}

const ProgressBar: React.FC<{ step: number; totalSteps: number }> = ({ step, totalSteps }) => {
  const progress = (step / totalSteps) * 100;
  return (
    <div className="w-full max-w-md mb-8">
      <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#F97316] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

// Static data moved outside component
const homeTypes = [
  'Single Family Home',
  'Townhouse',
  'Condo/Apartment',
  'Multi-Family Home',
  'Other'
];

const techComfortLevels = [
  { value: 'beginner', label: 'Beginner', desc: 'I need step-by-step guidance' },
  { value: 'intermediate', label: 'Intermediate', desc: 'I can follow along with some help' },
  { value: 'advanced', label: 'Advanced', desc: 'I just need quick answers' },
];

const householdSizes = ['Just me', '2 people', '3-4 people', '5+ people'];

const issueTypes = [
  { value: 'wifi', label: 'Wi-Fi & Internet', icon: Wifi },
  { value: 'tv', label: 'TV & Streaming', icon: Tv },
  { value: 'computer', label: 'Computers & Devices', icon: Cpu },
  { value: 'smarthome', label: 'Smart Home', icon: Home },
  { value: 'hvac', label: 'HVAC & Thermostats', icon: Thermometer },
  { value: 'security', label: 'Accounts & Security', icon: Lock },
];

const howHeardOptions = [
  'Google Search',
  'Social Media',
  'Friend or Family',
  'Online Ad',
  'News Article',
  'Podcast',
  'Other'
];

const benefits = [
  { title: 'AI-powered diagnostics', desc: 'Get instant answers from our smart troubleshooting system' },
  { title: 'Photo & video analysis', desc: 'Just show us the problem — no technical explanations needed' },
  { title: 'Live expert support', desc: 'Connect with real specialists when you need hands-on help' },
  { title: '24/7 availability', desc: 'Get support whenever you need it, day or night' },
];

const features = [
  { icon: '🤖', label: 'AI-Powered Diagnostics' },
  { icon: '📸', label: 'Photo & Video Analysis' },
  { icon: '👨‍💻', label: 'Expert Support On-Demand' },
];

export const SignUp: React.FC<SignUpProps> = ({ onStart, initialEmail = '', onSpeakToExpert, onComplete }) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('credentials');
  const [showPassword, setShowPassword] = useState(false);
  const [trialError, setTrialError] = useState<string | null>(null);
  const [isCheckingTrial, setIsCheckingTrial] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: initialEmail,
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    homeType: '',
    homeSize: '',
    techComfort: '',
    householdSize: '',
    primaryIssues: [],
    howHeard: '',
  });

  const updateFormData = (field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleIssue = (issue: string) => {
    setFormData(prev => ({
      ...prev,
      primaryIssues: prev.primaryIssues.includes(issue)
        ? prev.primaryIssues.filter(i => i !== issue)
        : [...prev.primaryIssues, issue]
    }));
  };

  const nextStep = async () => {
    const steps: OnboardingStep[] = ['credentials', 'profile', 'home', 'needs', 'complete'];
    const currentIndex = steps.indexOf(currentStep);

    if (currentStep === 'credentials') {
      setIsCheckingTrial(true);
      setTrialError(null);

      try {
        const eligibility = await checkTrialEligibility(formData.email);

        if (!eligibility.eligible) {
          setTrialError(eligibility.message || 'You have already used your free trial.');
          setIsCheckingTrial(false);
          return;
        }

        const trialResult = await startTrial(formData.email);
        if (!trialResult.success) {
          setTrialError(trialResult.error || 'Unable to start trial.');
          setIsCheckingTrial(false);
          return;
        }
      } catch (error) {
        console.error('Trial check error:', error);
      }

      setIsCheckingTrial(false);
    }

    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handleComplete = async () => {
    console.log('Onboarding complete:', formData);

    try {
      // Register user in database
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          homeType: formData.homeType,
          techComfort: formData.techComfort,
          householdSize: formData.householdSize,
          primaryIssues: formData.primaryIssues,
          howHeard: formData.howHeard,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error('Registration failed:', data.error);
        // Still proceed with local data if API fails
      }

      if (onComplete) {
        onComplete({
          id: data.user?.id,
          firstName: formData.firstName,
          lastName: formData.lastName || undefined,
          email: formData.email
        });
      } else {
        onStart();
      }
    } catch (error) {
      console.error('Registration error:', error);
      // Fallback to local completion
      if (onComplete) {
        onComplete({
          firstName: formData.firstName,
          lastName: formData.lastName || undefined,
          email: formData.email
        });
      } else {
        onStart();
      }
    }
  };

  // Right panel component (doesn't need form state, so it's safe as a nested component)
  const RightPanel = () => (
    <div className="hidden lg:flex flex-col justify-center p-12 relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(/hero-image-large.jpg)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#1F2937]/90 via-[#1F2937]/85 to-[#1F2937]/80"></div>
      </div>

      <div className="relative z-10 max-w-md mx-auto text-white">
        <div className="mb-8">
          <div className="text-sm font-bold uppercase tracking-wider text-[#F97316] mb-2">
            Why TechTriage?
          </div>
          <h2 className="text-4xl font-black leading-tight">
            Get tech help{' '}
            <span className="text-[#F97316]">instantly</span>
            {' '}— no waiting, no runaround
          </h2>
        </div>

        <p className="text-white/80 text-lg mb-8">
          Skip the expensive service calls. Our AI-powered support helps you fix issues yourself or know exactly what needs professional attention.
        </p>

        <div className="space-y-4 mb-8">
          {features.map((feature, i) => (
            <div key={i} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
              <span className="text-2xl">{feature.icon}</span>
              <span className="text-white font-medium">{feature.label}</span>
            </div>
          ))}
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#F97316] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">TT</span>
            </div>
            <div>
              <div className="text-white/60 text-xs">Hi there!</div>
              <div className="text-white font-semibold text-sm">How can I help you today?</div>
            </div>
          </div>
          <button
            onClick={onSpeakToExpert}
            className="w-full bg-white/20 hover:bg-white/30 text-white px-4 py-3 rounded-full text-sm font-medium transition-colors"
          >
            Speak to an expert
          </button>
        </div>
      </div>
    </div>
  );

  // Complete step has its own layout
  if (currentStep === 'complete') {
    return (
      <section className="min-h-screen pt-[72px] bg-white">
        <div className="grid lg:grid-cols-2 min-h-[calc(100vh-72px)]">
          <div className="flex flex-col justify-center px-8 lg:px-16 py-12 bg-white">
            <div className="max-w-md mx-auto w-full">
              <ProgressBar step={5} totalSteps={5} />

              <h1 className="text-3xl lg:text-4xl font-black text-[#1F2937] leading-tight mb-4">
                We'd love to know...
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                How did you hear about TechTriage? Your feedback helps us improve and reach more homeowners like you. Thanks for sharing!
              </p>

              <div className="space-y-5">
                <div className="relative">
                  <select
                    value={formData.howHeard}
                    onChange={(e) => updateFormData('howHeard', e.target.value)}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-lg text-lg focus:border-[#F97316] focus:outline-none transition-colors appearance-none bg-white"
                  >
                    <option value="">How did you find out about TechTriage?</option>
                    {howHeardOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>

                <button
                  onClick={handleComplete}
                  className="w-full bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-lg py-4 rounded-full flex items-center justify-center gap-2 transition-colors mt-6"
                >
                  Get Started <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex flex-col justify-center p-12 bg-gradient-to-br from-[#1F2937] to-[#374151] text-white">
            <div className="max-w-md mx-auto">
              <h2 className="text-3xl font-black mb-8">
                We're here to help your home run smoothly
              </h2>

              <div className="space-y-6">
                {benefits.map((benefit, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <CheckCircle2 className="w-6 h-6 text-[#F97316] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-lg">{benefit.title}</div>
                      <div className="text-white/70">{benefit.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen pt-[72px] bg-white">
      <div className="grid lg:grid-cols-2 min-h-[calc(100vh-72px)]">
        {/* Left side - Form content */}
        <div className="flex flex-col justify-center px-8 lg:px-16 py-12 bg-white">
          <div className="max-w-md mx-auto w-full">

            {/* Step 1: Credentials */}
            {currentStep === 'credentials' && (
              <>
                <div className="flex justify-center mb-8">
                  <Logo variant="dark" />
                </div>

                <h1 className="text-3xl lg:text-4xl font-black text-[#1F2937] leading-tight mb-4 text-center">
                  Start your free trial
                </h1>
                <p className="text-lg text-gray-600 mb-8 text-center">
                  Get instant access to AI-powered tech support for your home.
                </p>

                <div className="space-y-5">
                  <div>
                    <label className="block text-[#1F2937] font-medium text-sm mb-2">
                      Email address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData('email', e.target.value)}
                      placeholder="Enter your email"
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-lg text-lg focus:border-[#F97316] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[#1F2937] font-medium text-sm mb-2">
                      Create a password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => updateFormData('password', e.target.value)}
                        placeholder="Create a secure password"
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-lg text-lg focus:border-[#F97316] focus:outline-none transition-colors pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Must be at least 8 characters</p>
                  </div>

                  {trialError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-red-700 font-medium text-sm">{trialError}</p>
                        <p className="text-red-600 text-xs mt-1">Please use a different email or contact support.</p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={nextStep}
                    disabled={!formData.email || formData.password.length < 8 || isCheckingTrial}
                    className="w-full bg-[#1F2937] hover:bg-[#374151] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-lg py-4 rounded-full flex items-center justify-center gap-2 transition-colors mt-6"
                  >
                    {isCheckingTrial ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Checking...
                      </>
                    ) : (
                      <>
                        Continue <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-4 my-6">
                    <div className="flex-1 h-px bg-gray-200"></div>
                    <span className="text-gray-400 text-sm">OR</span>
                    <div className="flex-1 h-px bg-gray-200"></div>
                  </div>

                  <button
                    onClick={() => window.location.href = '/auth/google'}
                    className="w-full flex items-center justify-center gap-3 px-4 py-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="font-medium text-[#1F2937]">Continue with Google</span>
                  </button>
                </div>

                <p className="text-sm text-gray-500 text-center mt-8">
                  By signing up, you agree to our{' '}
                  <a href="#" className="text-[#F97316] hover:underline">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-[#F97316] hover:underline">Privacy Policy</a>
                </p>
              </>
            )}

            {/* Step 2: Profile */}
            {currentStep === 'profile' && (
              <>
                <ProgressBar step={2} totalSteps={5} />

                <h1 className="text-3xl lg:text-4xl font-black text-[#1F2937] leading-tight mb-4">
                  Your free trial is now active
                </h1>
                <p className="text-lg text-gray-600 mb-8">
                  We'll use your name and number to set up your account and ensure you get support when you need it.
                </p>

                <div className="space-y-5">
                  <div>
                    <label className="block text-[#1F2937] font-medium text-sm mb-2">
                      First name
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => updateFormData('firstName', e.target.value)}
                      placeholder="Enter your first name"
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-lg text-lg focus:border-[#F97316] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[#1F2937] font-medium text-sm mb-2">
                      Last name
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => updateFormData('lastName', e.target.value)}
                      placeholder="Enter your last name"
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-lg text-lg focus:border-[#F97316] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[#1F2937] font-medium text-sm mb-2">
                      Phone number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateFormData('phone', e.target.value)}
                      placeholder="(555) 123-4567"
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-lg text-lg focus:border-[#F97316] focus:outline-none transition-colors"
                    />
                  </div>

                  <button
                    onClick={nextStep}
                    disabled={!formData.firstName}
                    className="w-full bg-[#1F2937] hover:bg-[#374151] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-lg py-4 rounded-full flex items-center justify-center gap-2 transition-colors mt-6"
                  >
                    Next <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}

            {/* Step 3: Home Info */}
            {currentStep === 'home' && (
              <>
                <ProgressBar step={3} totalSteps={5} />

                <h1 className="text-3xl lg:text-4xl font-black text-[#1F2937] leading-tight mb-4">
                  Tell us about your home
                </h1>
                <p className="text-lg text-gray-600 mb-8">
                  This helps us personalize your support experience and recommend the right solutions.
                </p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[#1F2937] font-medium text-sm mb-2">
                      Home type
                    </label>
                    <div className="relative">
                      <select
                        value={formData.homeType}
                        onChange={(e) => updateFormData('homeType', e.target.value)}
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-lg text-lg focus:border-[#F97316] focus:outline-none transition-colors appearance-none bg-white"
                      >
                        <option value="">Select your home type</option>
                        {homeTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#1F2937] font-medium text-sm mb-3">
                      How comfortable are you with technology?
                    </label>
                    <div className="space-y-3">
                      {techComfortLevels.map(level => (
                        <button
                          key={level.value}
                          type="button"
                          onClick={() => updateFormData('techComfort', level.value)}
                          className={`w-full px-4 py-4 border-2 rounded-lg text-left transition-all ${
                            formData.techComfort === level.value
                              ? 'border-[#F97316] bg-orange-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-semibold text-[#1F2937]">{level.label}</div>
                          <div className="text-sm text-gray-500">{level.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={nextStep}
                    className="w-full bg-[#1F2937] hover:bg-[#374151] text-white font-bold text-lg py-4 rounded-full flex items-center justify-center gap-2 transition-colors mt-6"
                  >
                    Next <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}

            {/* Step 4: Needs Assessment */}
            {currentStep === 'needs' && (
              <>
                <ProgressBar step={4} totalSteps={5} />

                <h1 className="text-3xl lg:text-4xl font-black text-[#1F2937] leading-tight mb-4">
                  Your household at a glance
                </h1>
                <p className="text-lg text-gray-600 mb-8">
                  We use this information to suggest the right tools and support options for your needs.
                </p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[#1F2937] font-medium text-sm mb-3">
                      How many people live in your household?
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {householdSizes.map(size => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => updateFormData('householdSize', size)}
                          className={`px-4 py-2 border-2 rounded-full text-sm font-medium transition-all ${
                            formData.householdSize === size
                              ? 'border-[#F97316] bg-orange-50 text-[#F97316]'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#1F2937] font-medium text-sm mb-3">
                      What types of tech issues do you typically face? (Select all that apply)
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {issueTypes.map(issue => {
                        const Icon = issue.icon;
                        const isSelected = formData.primaryIssues.includes(issue.value);
                        return (
                          <button
                            key={issue.value}
                            type="button"
                            onClick={() => toggleIssue(issue.value)}
                            className={`p-4 border-2 rounded-lg text-left transition-all ${
                              isSelected
                                ? 'border-[#F97316] bg-orange-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-[#F97316]' : 'text-gray-400'}`} />
                            <div className={`text-sm font-medium ${isSelected ? 'text-[#F97316]' : 'text-gray-700'}`}>
                              {issue.label}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={nextStep}
                    className="w-full bg-[#1F2937] hover:bg-[#374151] text-white font-bold text-lg py-4 rounded-full flex items-center justify-center gap-2 transition-colors mt-6"
                  >
                    Next <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right side panel */}
        <RightPanel />
      </div>
    </section>
  );
};
