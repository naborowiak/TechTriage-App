import React, { useState, useEffect } from 'react';
import { X, Settings, User, Bell, CreditCard, Package, Shield, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { SettingsProfileSection, SettingsNotificationsSection, SettingsPrivacySection } from './Settings';
import { BillingManagement } from './BillingManagement';
import { HomeInventory } from './HomeInventory';

export type SettingsTab = 'general' | 'account' | 'notifications' | 'billing' | 'inventory' | 'privacy';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: SettingsTab;
  user: {
    id?: string;
    firstName: string;
    lastName?: string;
    email: string;
  };
  onUpdateUser: (user: { firstName: string; lastName?: string; email: string }) => void;
  onLogout: () => void;
}

const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: 'general', label: 'General', icon: <Settings className="w-4 h-4" /> },
  { id: 'account', label: 'Account', icon: <User className="w-4 h-4" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
  { id: 'billing', label: 'Billing', icon: <CreditCard className="w-4 h-4" /> },
  { id: 'inventory', label: 'Home Inventory', icon: <Package className="w-4 h-4" /> },
  { id: 'privacy', label: 'Data & Privacy', icon: <Shield className="w-4 h-4" /> },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'general',
  user,
  onUpdateUser,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const { theme, toggleTheme } = useTheme();

  // Reset to initialTab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div>
            <h2 className="text-lg font-bold text-text-primary dark:text-white mb-6">General</h2>
            <div className="space-y-6">
              {/* Appearance */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-midnight-700">
                <div>
                  <div className="font-medium text-text-primary dark:text-white">Appearance</div>
                  <div className="text-sm text-text-muted">Choose your preferred theme</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { if (theme === 'dark') toggleTheme(); }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      theme === 'light'
                        ? 'bg-electric-indigo/10 text-electric-indigo border border-electric-indigo/30'
                        : 'text-text-muted hover:text-text-primary dark:hover:text-white hover:bg-light-100 dark:hover:bg-midnight-700'
                    }`}
                  >
                    <Sun className="w-4 h-4" /> Light
                  </button>
                  <button
                    onClick={() => { if (theme === 'light') toggleTheme(); }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      theme === 'dark'
                        ? 'bg-electric-indigo/10 text-electric-indigo border border-electric-indigo/30'
                        : 'text-text-muted hover:text-text-primary dark:hover:text-white hover:bg-light-100 dark:hover:bg-midnight-700'
                    }`}
                  >
                    <Moon className="w-4 h-4" /> Dark
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'account':
        return (
          <div>
            <h2 className="text-lg font-bold text-text-primary dark:text-white mb-6">Account</h2>
            <SettingsProfileSection user={user} onUpdateUser={onUpdateUser} />
          </div>
        );

      case 'notifications':
        return (
          <div>
            <h2 className="text-lg font-bold text-text-primary dark:text-white mb-6">Notifications</h2>
            <SettingsNotificationsSection />
          </div>
        );

      case 'billing':
        return (
          <div>
            <h2 className="text-lg font-bold text-text-primary dark:text-white mb-6">Billing</h2>
            {user.id ? (
              <BillingManagement userId={user.id} />
            ) : (
              <p className="text-text-muted text-sm">Please log in to manage billing.</p>
            )}
          </div>
        );

      case 'inventory':
        return (
          <div>
            <h2 className="text-lg font-bold text-text-primary dark:text-white mb-6">Home Inventory</h2>
            <HomeInventory embedded />
          </div>
        );

      case 'privacy':
        return (
          <div>
            <h2 className="text-lg font-bold text-text-primary dark:text-white mb-6">Data & Privacy</h2>
            <SettingsPrivacySection />
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full md:max-w-3xl md:mx-4 h-[92vh] md:h-auto md:max-h-[85vh] bg-white dark:bg-midnight-900 rounded-t-2xl md:rounded-2xl border border-light-300 dark:border-midnight-700 shadow-2xl overflow-hidden flex flex-col animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-light-200 dark:border-midnight-700 shrink-0">
          <h1 className="text-lg font-bold text-text-primary dark:text-white">Settings</h1>
          <button
            onClick={onClose}
            className="p-2 hover:bg-light-100 dark:hover:bg-midnight-800 rounded-lg text-text-muted hover:text-text-primary dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile: horizontal tab pills */}
        <div className="md:hidden px-4 py-2 border-b border-light-200 dark:border-midnight-700 shrink-0 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-electric-indigo/10 text-electric-indigo'
                    : 'text-text-muted hover:text-text-primary dark:hover:text-white hover:bg-light-100 dark:hover:bg-midnight-800'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Desktop: vertical tab sidebar */}
          <div className="hidden md:flex flex-col w-52 border-r border-light-200 dark:border-midnight-700 bg-light-50 dark:bg-midnight-800/50 py-3 shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-light-200 dark:bg-midnight-700 text-text-primary dark:text-white'
                    : 'text-text-muted hover:text-text-primary dark:hover:text-white hover:bg-light-100 dark:hover:bg-midnight-800'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content panel */}
          <div className="flex-1 overflow-y-auto p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};
