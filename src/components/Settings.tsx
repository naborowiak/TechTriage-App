import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Bell, Shield, Trash2, Mail, Phone, Save, CheckCircle } from 'lucide-react';

interface SettingsProps {
  onBack?: () => void;
  user: {
    firstName: string;
    lastName?: string;
    email: string;
  };
  onUpdateUser: (user: { firstName: string; lastName?: string; email: string }) => void;
  embedded?: boolean;
}

export const Settings: React.FC<SettingsProps> = ({ onBack, user, onUpdateUser, embedded = false }) => {
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
      const settings = localStorage.getItem('totalassist_settings');
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
    localStorage.setItem('totalassist_user', JSON.stringify(updatedUser));

    // Save settings
    localStorage.setItem('totalassist_settings', JSON.stringify({
      phone,
      emailNotifications,
      sessionGuideEmails
    }));

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to delete all session history? This cannot be undone.')) {
      localStorage.removeItem('totalassist_sessions');
      window.dispatchEvent(new Event('session_saved'));
      alert('Session history cleared successfully.');
    }
  };

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This will remove all your data and cannot be undone.')) {
      // In a real app, this would call an API to delete the account
      localStorage.removeItem('totalassist_user');
      localStorage.removeItem('totalassist_trial');
      localStorage.removeItem('totalassist_settings');
      localStorage.removeItem('totalassist_sessions');
      window.location.href = '/';
    }
  };

  const content = (
    <div className="space-y-6">
        {/* Profile Section */}
        <div className="bg-white dark:bg-midnight-800 rounded-2xl border border-gray-100 dark:border-midnight-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-midnight-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-electric-indigo rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-text-primary dark:text-white">Profile Information</h2>
                <p className="text-sm text-text-muted">Update your personal details</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary dark:text-white mb-2">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-midnight-600 rounded-xl bg-white dark:bg-midnight-900 text-text-primary dark:text-white focus:border-electric-indigo focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary dark:text-white mb-2">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-midnight-600 rounded-xl bg-white dark:bg-midnight-900 text-text-primary dark:text-white focus:border-electric-indigo focus:outline-none transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-white mb-2">
                <Mail className="w-4 h-4 inline mr-1" /> Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-midnight-600 rounded-xl bg-white dark:bg-midnight-900 text-text-primary dark:text-white focus:border-electric-indigo focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-white mb-2">
                <Phone className="w-4 h-4 inline mr-1" /> Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-midnight-600 rounded-xl bg-white dark:bg-midnight-900 text-text-primary dark:text-white placeholder:text-text-muted focus:border-electric-indigo focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-white dark:bg-midnight-800 rounded-2xl border border-gray-100 dark:border-midnight-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-midnight-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-electric-cyan rounded-xl flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-text-primary dark:text-white">Notifications</h2>
                <p className="text-sm text-text-muted">Manage how we contact you</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium text-text-primary dark:text-white">Email Notifications</div>
                <div className="text-sm text-text-muted">Receive updates about your support sessions</div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-midnight-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-electric-indigo"></div>
              </div>
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium text-text-primary dark:text-white">Session Guide Emails</div>
                <div className="text-sm text-text-muted">Automatically receive PDF guides after live sessions</div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={sessionGuideEmails}
                  onChange={(e) => setSessionGuideEmails(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-midnight-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-electric-indigo"></div>
              </div>
            </label>
          </div>
        </div>

        {/* Privacy & Data Section */}
        <div className="bg-white dark:bg-midnight-800 rounded-2xl border border-gray-100 dark:border-midnight-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-midnight-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-text-primary dark:text-white">Privacy & Data</h2>
                <p className="text-sm text-text-muted">Manage your data and privacy settings</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <button
              onClick={handleClearHistory}
              className="w-full flex items-center justify-between p-4 border-2 border-gray-200 dark:border-midnight-600 rounded-xl hover:border-red-300 dark:hover:border-red-500/50 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors group"
            >
              <div className="text-left">
                <div className="font-medium text-text-primary dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400">Clear Session History</div>
                <div className="text-sm text-text-muted">Delete all saved support sessions</div>
              </div>
              <Trash2 className="w-5 h-5 text-gray-400 dark:text-midnight-500 group-hover:text-red-500 dark:group-hover:text-red-400" />
            </button>
            <button
              onClick={handleDeleteAccount}
              className="w-full flex items-center justify-between p-4 border-2 border-red-200 dark:border-red-500/30 rounded-xl hover:border-red-400 dark:hover:border-red-500/50 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-red-600 dark:text-red-400"
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
          className="w-full bg-gradient-to-r from-electric-indigo to-scout-purple hover:from-electric-indigo/90 hover:to-scout-purple/90 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
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
  );

  // If embedded, just return the content
  if (embedded) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary dark:text-white">Settings</h1>
          <p className="text-sm text-text-muted">Manage your account and preferences</p>
        </div>
        {content}
      </div>
    );
  }

  // Full page mode with header
  return (
    <div className="min-h-screen bg-light-100 dark:bg-midnight-950 transition-colors">
      <header className="bg-white dark:bg-midnight-900 border-b border-gray-200 dark:border-midnight-700 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-midnight-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-text-primary dark:text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-text-primary dark:text-white">Settings</h1>
            <p className="text-sm text-text-muted">Manage your account and preferences</p>
          </div>
        </div>
      </header>
      <div className="max-w-3xl mx-auto p-6 lg:p-8">
        {content}
      </div>
    </div>
  );
};
