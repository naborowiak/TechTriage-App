import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Logo } from './Logo';
import { PageView } from '../types';

interface LoginProps {
  onNavigate: (view: PageView) => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleLogin = () => {
    window.location.href = '/api/login';
  };

  return (
    <section className="min-h-screen pt-[72px] bg-white">
      <div className="grid lg:grid-cols-2 min-h-[calc(100vh-72px)]">
        <div className="flex flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <div className="flex justify-center mb-10">
              <Logo variant="dark" className="scale-125" />
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-gray-600 text-sm mb-2">
                  Email address*
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-lg text-lg focus:border-[#F97316] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-gray-600 text-sm mb-2">
                  Password*
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
              </div>

              <button className="text-[#F97316] font-medium hover:underline text-left">
                Forgot password?
              </button>

              <button className="w-full bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xl py-4 rounded-lg transition-colors">
                Log In
              </button>

              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-gray-400 text-sm">OR</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-3 px-4 py-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="font-medium text-[#1F2937]">Log In With Google</span>
                </button>

                <button className="w-full flex items-center justify-center gap-3 px-4 py-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="text-[#0077C5] font-bold text-sm">intuit</span>
                  <span className="font-medium text-[#1F2937]">Log In With Intuit</span>
                </button>

                <button className="w-full flex items-center justify-center gap-3 px-4 py-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="black">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <span className="font-medium text-[#1F2937]">Log In With Apple</span>
                </button>
              </div>

              <div className="text-center pt-6">
                <button 
                  onClick={() => onNavigate(PageView.SIGNUP)}
                  className="text-[#F97316] font-medium hover:underline"
                >
                  Sign up
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex items-center justify-center bg-[#F9FAFB] p-12">
          <div className="max-w-md">
            <div className="bg-[#1F2937] rounded-xl overflow-hidden mb-6">
              <div className="p-4 text-white text-center">
                <div className="text-xs font-bold uppercase opacity-60 mb-1">March 4, 2026</div>
                <div className="text-2xl font-black">TECHTRIAGE SUMMIT</div>
                <div className="text-sm opacity-80">FREE ONLINE EVENT</div>
              </div>
              <div className="bg-gradient-to-r from-[#F97316] to-[#EA580C] h-2"></div>
            </div>
            
            <h3 className="text-3xl font-black text-[#1F2937] mb-4">
              Make your first million or your next
            </h3>
            <p className="text-gray-600 text-lg leading-relaxed">
              Join over 30,000 service pros for a day of learning built for blue collar. Get expert advice and walk away with the next steps you need to grow your business with confidence.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
