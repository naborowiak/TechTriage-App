import { useState, memo } from 'react';
import { Eye, EyeOff, AlertCircle, Shield, Zap, Clock } from 'lucide-react';
import { Logo } from './Logo';
import { PageView } from '../types';

interface LoginProps {
  onNavigate: (view: PageView) => void;
  onLogin?: (user: { id?: string; firstName: string; lastName?: string; email: string }) => void;
}

export const Login = memo<LoginProps>(function Login({ onNavigate, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = () => {
    window.location.href = '/auth/google';
  };

  const handleLogin = async () => {
    setError(null);

    // Basic validation
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsLoading(true);

    try {
      // Call login API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Invalid email or password.');
        setIsLoading(false);
        return;
      }

      // Login successful
      const user = {
        id: data.user.id,
        firstName: data.user.firstName || email.split('@')[0],
        lastName: data.user.lastName || '',
        email: data.user.email,
      };

      // Store in localStorage for persistence
      localStorage.setItem('techtriage_user', JSON.stringify(user));

      if (onLogin) {
        onLogin(user);
      } else {
        onNavigate(PageView.DASHBOARD);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoClick = () => {
    onNavigate(PageView.HOME);
  };

  return (
    <section className="min-h-screen bg-white">
      <div className="grid lg:grid-cols-2 min-h-screen">
        <div className="flex flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <div className="flex justify-center mb-10">
              <button
                onClick={handleLogoClick}
                className="focus:outline-none hover:opacity-80 transition-opacity"
              >
                <Logo variant="dark" className="scale-125" />
              </button>
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

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full bg-[#F97316] hover:bg-[#EA580C] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-xl py-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Logging in...
                  </>
                ) : (
                  'Log In'
                )}
              </button>

              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-gray-400 text-sm">OR</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

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

        <div className="hidden lg:flex items-center justify-center bg-gradient-to-br from-[#1F2937] to-[#374151] p-12">
          <div className="max-w-md text-white">
            <h3 className="text-3xl font-black mb-6 leading-tight">
              Welcome back to smarter home tech support
            </h3>
            <p className="text-white/70 text-lg leading-relaxed mb-8">
              Your personalized support dashboard is just a login away. Pick up where you left off or start a new session.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-4 bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                <div className="w-10 h-10 bg-[#F97316] rounded-lg flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-bold text-white">Session History</div>
                  <div className="text-white/60 text-sm">Access all your past sessions and guides anytime</div>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                <div className="w-10 h-10 bg-[#F97316] rounded-lg flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-bold text-white">Instant Support</div>
                  <div className="text-white/60 text-sm">Get help in seconds with AI-powered diagnostics</div>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                <div className="w-10 h-10 bg-[#F97316] rounded-lg flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-bold text-white">Secure & Private</div>
                  <div className="text-white/60 text-sm">Your data is encrypted and never shared</div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-[#F97316] flex items-center justify-center text-white text-xs font-bold border-2 border-[#1F2937]">J</div>
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold border-2 border-[#1F2937]">M</div>
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold border-2 border-[#1F2937]">S</div>
                </div>
                <div className="text-white/60 text-sm">
                  <span className="text-white font-semibold">10,000+</span> homeowners helped this month
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});
