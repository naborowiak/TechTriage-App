import React, { useState, useEffect } from 'react';
import { MessageSquare, Camera, Video, Clock, User, ChevronRight, Sparkles, Shield, History, Settings, LogOut, Menu, AlertTriangle, CreditCard } from 'lucide-react';
import { Logo } from './Logo';
import { getTrialStatus } from '../services/trialService';

interface DashboardProps {
  user: {
    id?: string;
    firstName: string;
    lastName?: string;
    email: string;
  };
  onStartChat: () => void;
  onUploadImage: () => void;
  onStartVideo: () => void;
  onLogout: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onOpenBilling?: () => void;
  onBackToDashboard?: () => void;
  activeView?: 'main' | 'history' | 'settings' | 'billing';
  children?: React.ReactNode;
  onUpdateUser?: (user: { firstName: string; lastName?: string; email: string }) => void;
}

interface TrialInfo {
  isActive: boolean;
  remainingHours?: number;
  remainingMinutes?: number;
}

const ActionCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonText: string;
  onClick: () => void;
  highlight?: boolean;
}> = ({ icon, title, description, buttonText, onClick, highlight }) => (
  <div className={`bg-white rounded-2xl p-6 border-2 transition-all hover:shadow-lg hover:-translate-y-1 ${
    highlight ? 'border-[#F97316] shadow-lg shadow-orange-100' : 'border-gray-100'
  }`}>
    <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${
      highlight ? 'bg-[#F97316] text-white' : 'bg-gray-100 text-[#1F2937]'
    }`}>
      {icon}
    </div>
    <h3 className="text-xl font-bold text-[#1F2937] mb-2">{title}</h3>
    <p className="text-gray-500 mb-4 leading-relaxed">{description}</p>
    <button
      onClick={onClick}
      className={`w-full py-3 px-4 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all ${
        highlight
          ? 'bg-[#F97316] hover:bg-[#EA580C] text-white'
          : 'bg-[#1F2937] hover:bg-[#374151] text-white'
      }`}
    >
      {buttonText}
      <ChevronRight className="w-4 h-4" />
    </button>
  </div>
);

const QuickTip: React.FC<{ tip: string }> = ({ tip }) => (
  <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-xl border border-orange-100">
    <Sparkles className="w-5 h-5 text-[#F97316] shrink-0 mt-0.5" />
    <p className="text-sm text-[#1F2937]">{tip}</p>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  onStartChat,
  onUploadImage,
  onStartVideo,
  onLogout,
  onOpenHistory,
  onOpenSettings,
  onOpenBilling,
  onBackToDashboard,
  activeView = 'main',
  children,
  onUpdateUser: _onUpdateUser
}) => {
  const [trialInfo, setTrialInfo] = useState<TrialInfo>({ isActive: false });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };

  useEffect(() => {
    const fetchTrialStatus = async () => {
      const status = await getTrialStatus(user.email);
      setTrialInfo({
        isActive: status.isActive,
        remainingHours: status.remainingHours,
        remainingMinutes: status.remainingMinutes
      });
    };

    fetchTrialStatus();

    // Update trial status every minute
    const interval = setInterval(fetchTrialStatus, 60000);
    return () => clearInterval(interval);
  }, [user.email]);

  const tips = [
    "For the best results, make sure your photos are well-lit and show the entire device or error message.",
    "Our AI can read error codes and model numbers - just show them clearly in your image!",
    "Live video sessions let our specialists see exactly what you're dealing with in real-time.",
    "Not sure what's wrong? Just describe it - our AI is trained to understand everyday language."
  ];

  const [currentTip] = useState(() => tips[Math.floor(Math.random() * tips.length)]);

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-[#1F2937] z-50 transform transition-transform lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6 border-b border-white/10">
          <Logo variant="light" />
        </div>

        <nav className="p-4 space-y-1">
          <button
            onClick={() => { setSidebarOpen(false); if (activeView !== 'main' && onBackToDashboard) onBackToDashboard(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeView === 'main' ? 'bg-white/10 text-white font-medium' : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <User className="w-5 h-5" />
            Dashboard
          </button>
          <button
            onClick={() => { setSidebarOpen(false); onStartChat(); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            Chat Support
          </button>
          <button
            onClick={() => { setSidebarOpen(false); onOpenHistory(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeView === 'history' ? 'bg-white/10 text-white font-medium' : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <History className="w-5 h-5" />
            Session History
          </button>
          <button
            onClick={() => { setSidebarOpen(false); onOpenSettings(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeView === 'settings' ? 'bg-white/10 text-white font-medium' : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Settings className="w-5 h-5" />
            Settings
          </button>
          {onOpenBilling && (
            <button
              onClick={() => { setSidebarOpen(false); onOpenBilling(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeView === 'billing' ? 'bg-white/10 text-white font-medium' : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              Billing
            </button>
          )}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <Menu className="w-6 h-6 text-[#1F2937]" />
              </button>
              <div className="lg:hidden">
                <Logo variant="dark" />
              </div>
            </div>

            {/* Trial banner */}
            {trialInfo.isActive && (
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-full border border-orange-200">
                <Clock className="w-4 h-4 text-[#F97316]" />
                <span className="text-sm font-medium text-[#1F2937]">
                  Trial: {trialInfo.remainingHours}h {trialInfo.remainingMinutes}m remaining
                </span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <div className="text-sm font-medium text-[#1F2937]">{user.firstName} {user.lastName}</div>
                <div className="text-xs text-gray-500">{user.email}</div>
              </div>
              <div className="w-10 h-10 bg-[#F97316] rounded-full flex items-center justify-center text-white font-bold">
                {user.firstName.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Main content area - show children if provided, otherwise dashboard content */}
        {children ? (
          <div className="p-6 lg:p-8">{children}</div>
        ) : (
          <div className="p-6 lg:p-8 max-w-6xl mx-auto">
            {/* Welcome section */}
            <div className="mb-8">
              <h1 className="text-3xl lg:text-4xl font-black text-[#1F2937] mb-2">
                Welcome, {user.firstName}!
              </h1>
              <p className="text-lg text-gray-500">
                How can we help you today? Choose an option below to get started.
              </p>
            </div>

            {/* Trial banner (mobile) */}
            {trialInfo.isActive && (
              <div className="sm:hidden flex items-center gap-2 px-4 py-3 mb-6 bg-orange-50 rounded-xl border border-orange-200">
                <Clock className="w-5 h-5 text-[#F97316]" />
                <span className="text-sm font-medium text-[#1F2937]">
                  Free Trial: {trialInfo.remainingHours}h {trialInfo.remainingMinutes}m remaining
                </span>
              </div>
            )}

            {/* Main action cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <ActionCard
                icon={<MessageSquare className="w-7 h-7" />}
                title="Chat with AI"
                description="Describe your issue in plain English and get instant guidance from our AI assistant."
                buttonText="Start Chatting"
                onClick={onStartChat}
                highlight
              />
              <ActionCard
                icon={<Camera className="w-7 h-7" />}
                title="Upload a Photo"
                description="Take a picture of the problem - error codes, devices, anything. We'll analyze it instantly."
                buttonText="Upload Image"
                onClick={onUploadImage}
              />
              <ActionCard
                icon={<Video className="w-7 h-7" />}
                title="Live Video Session"
                description="Show us in real-time what's happening. Perfect for complex issues that need hands-on guidance."
                buttonText="Start Video"
                onClick={onStartVideo}
              />
            </div>

            {/* Quick tip */}
            <div className="mb-8">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Quick Tip</h2>
              <QuickTip tip={currentTip} />
            </div>

            {/* How it works reminder */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h2 className="text-lg font-bold text-[#1F2937] mb-4">How TechTriage Works</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#F97316] rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                    1
                  </div>
                  <div>
                    <div className="font-semibold text-[#1F2937]">Describe or Show</div>
                    <div className="text-sm text-gray-500">Tell us what's wrong or upload a photo</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#F97316] rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                    2
                  </div>
                  <div>
                    <div className="font-semibold text-[#1F2937]">Get Diagnosis</div>
                    <div className="text-sm text-gray-500">Our AI analyzes and identifies the issue</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#F97316] rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                    3
                  </div>
                  <div>
                    <div className="font-semibold text-[#1F2937]">Fix It</div>
                    <div className="text-sm text-gray-500">Follow our step-by-step guidance</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Safety note */}
            <div className="mt-6 flex items-center gap-3 text-sm text-gray-500">
              <Shield className="w-5 h-5 text-[#F97316]" />
              <span>Your data is encrypted and never shared. We prioritize your privacy and safety.</span>
            </div>
          </div>
        )}
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-[#F97316]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1F2937]">Sign Out?</h3>
                <p className="text-sm text-gray-500">Are you sure you want to sign out?</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Your session history and settings will be saved for when you return.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl font-semibold text-[#1F2937] hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 px-4 py-3 bg-[#F97316] text-white rounded-xl font-semibold hover:bg-[#EA580C] transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
