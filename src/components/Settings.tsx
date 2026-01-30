import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Bell, Shield, Trash2, Mail, Phone, Save, CheckCircle } from 'lucide-react';

interface SettingsProps {
  onBack: () => void;
  user: {
    firstName: string;
    lastName?: string;
    email: string;
  };
  onUpdateUser: (user: { firstName: string; lastName?: string; email: string }) => void;
}

export const Settings: React.FC<SettingsProps> = ({ onBack, user, onUpdateUser }) => {
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName || '');
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [sessionGuideEmails, setSessionGuideEmails] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    try {
      const settings = localStorage.getItem('techtriage_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setPhone(parsed.phone || '');
        setEmailNotifications(parsed.emailNotifications ?? true);
        setSessionGuideEmails(parsed.sessionGuideEmails ?? true);
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  }, []);

  const handleSave = () => {
    // Save user info
    const updatedUser = { firstName, lastName, email };
    onUpdateUser(updatedUser);
    localStorage.setItem('techtriage_user', JSON.stringify(updatedUser));

    // Save settings
    localStorage.setItem('techtriage_settings', JSON.stringify({
      phone,
      emailNotifications,
      sessionGuideEmails
    }));

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to delete all session history? This cannot be undone.')) {
      localStorage.removeItem('tech_triage_sessions');
      window.dispatchEvent(new Event('session_saved'));
      alert('Session history cleared successfully.');
    }
  };

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This will remove all your data and cannot be undone.')) {
      // In a real app, this would call an API to delete the account
      localStorage.removeItem('techtriage_user');
      localStorage.removeItem('techtriage_trial');
      localStorage.removeItem('techtriage_settings');
      localStorage.removeItem('tech_triage_sessions');
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#1F2937]" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#1F2937]">Settings</h1>
            <p className="text-sm text-gray-500">Manage your account and preferences</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-6 lg:p-8 space-y-6">
        {/* Profile Section */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#F97316] rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-[#1F2937]">Profile Information</h2>
                <p className="text-sm text-gray-500">Update your personal details</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1F2937] mb-2">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#F97316] focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1F2937] mb-2">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#F97316] focus:outline-none transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1F2937] mb-2">
                <Mail className="w-4 h-4 inline mr-1" /> Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#F97316] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1F2937] mb-2">
                <Phone className="w-4 h-4 inline mr-1" /> Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#F97316] focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-[#1F2937]">Notifications</h2>
                <p className="text-sm text-gray-500">Manage how we contact you</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium text-[#1F2937]">Email Notifications</div>
                <div className="text-sm text-gray-500">Receive updates about your support sessions</div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F97316]"></div>
              </div>
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium text-[#1F2937]">Session Guide Emails</div>
                <div className="text-sm text-gray-500">Automatically receive PDF guides after live sessions</div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={sessionGuideEmails}
                  onChange={(e) => setSessionGuideEmails(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F97316]"></div>
              </div>
            </label>
          </div>
        </div>

        {/* Privacy & Data Section */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-[#1F2937]">Privacy & Data</h2>
                <p className="text-sm text-gray-500">Manage your data and privacy settings</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <button
              onClick={handleClearHistory}
              className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-red-300 hover:bg-red-50 transition-colors group"
            >
              <div className="text-left">
                <div className="font-medium text-[#1F2937] group-hover:text-red-600">Clear Session History</div>
                <div className="text-sm text-gray-500">Delete all saved support sessions</div>
              </div>
              <Trash2 className="w-5 h-5 text-gray-400 group-hover:text-red-500" />
            </button>
            <button
              onClick={handleDeleteAccount}
              className="w-full flex items-center justify-between p-4 border-2 border-red-200 rounded-xl hover:border-red-400 hover:bg-red-50 transition-colors text-red-600"
            >
              <div className="text-left">
                <div className="font-medium">Delete Account</div>
                <div className="text-sm text-red-400">Permanently delete your account and all data</div>
              </div>
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full bg-[#F97316] hover:bg-[#EA580C] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          {saved ? (
            <>
              <CheckCircle className="w-5 h-5" /> Saved!
            </>
          ) : (
            <>
              <Save className="w-5 h-5" /> Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
};
