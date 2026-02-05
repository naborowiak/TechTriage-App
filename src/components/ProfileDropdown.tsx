import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  LayoutDashboard,
  MessageSquare,
  History,
  Settings,
  CreditCard,
  LogOut,
  ChevronDown,
} from 'lucide-react';

interface User {
  id: string;
  username: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

type DashboardView = 'main' | 'history' | 'settings' | 'billing';

interface ProfileDropdownProps {
  user: User;
  onDashboardNavigate?: (view: DashboardView) => void;
  onOpenChat?: () => void;
  onLogout: () => void;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  user,
  onDashboardNavigate,
  onOpenChat,
  onLogout,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleMenuItemClick = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      action: () => onDashboardNavigate?.('main'),
    },
    {
      icon: MessageSquare,
      label: 'Scout AI',
      action: () => onOpenChat?.(),
    },
    {
      icon: History,
      label: 'Session History',
      action: () => onDashboardNavigate?.('history'),
    },
    {
      icon: Settings,
      label: 'Settings',
      action: () => onDashboardNavigate?.('settings'),
    },
    {
      icon: CreditCard,
      label: 'Billing',
      action: () => onDashboardNavigate?.('billing'),
    },
  ];

  const displayName = user.firstName || user.username || 'User';
  const displayEmail = user.email || '';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-light-200 dark:hover:bg-midnight-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-electric-indigo/60 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-midnight-900"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Avatar */}
        {user.profileImageUrl ? (
          <img
            src={user.profileImageUrl}
            alt={displayName}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-electric-indigo/40"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-scout-purple to-electric-indigo flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        )}

        {/* Name (hidden on smaller screens) */}
        <span className="text-text-secondary dark:text-gray-300 text-sm font-medium hidden xl:inline max-w-[120px] truncate">
          {displayName}
        </span>

        {/* Chevron */}
        <ChevronDown
          className={`w-4 h-4 text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-midnight-900 rounded-xl shadow-xl border border-light-300 dark:border-midnight-700 overflow-hidden z-50 animate-fade-in-up"
          role="menu"
        >
          {/* User Header */}
          <div className="px-4 py-3 border-b border-light-200 dark:border-midnight-700 bg-light-50 dark:bg-midnight-800/50">
            <div className="flex items-center gap-3">
              {user.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt={displayName}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-electric-indigo/40"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-scout-purple to-electric-indigo flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary dark:text-white truncate">
                  {displayName}
                </p>
                {displayEmail && (
                  <p className="text-xs text-text-muted truncate">
                    {displayEmail}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleMenuItemClick(item.action)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-text-secondary dark:text-gray-300 hover:bg-light-100 dark:hover:bg-midnight-800 hover:text-electric-indigo transition-colors"
                role="menuitem"
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Logout */}
          <div className="border-t border-light-200 dark:border-midnight-700 py-2">
            <button
              onClick={() => handleMenuItemClick(onLogout)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              role="menuitem"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
