import React, { useState } from 'react';
import { Menu, X, Bell, User, BookOpen, Target, LogIn, Sun, Moon, Shield } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export interface TopNavProps {
  onSignInClick: () => void;
  onNavClick?: (item: string) => void;
  onOpenOwnerDashboard?: () => void;
  activePage?:
    | 'signin'
    | 'signup'
    | 'academic-hub'
    | 'challenge-hub'
    | 'profile'
    | 'notifications'
    | 'owner-dashboard';
  unreadNotificationsCount?: number;
}

export const TopNav: React.FC<TopNavProps> = ({
  onSignInClick,
  onNavClick,
  onOpenOwnerDashboard,
  activePage,
  unreadNotificationsCount = 0,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { isOwner } = useAuth();

  // Exact required order:
  // 1. Academic Hub
  // 2. Challenge Hub
  // 3. Profile
  // 4. Notifications
  // 5. Registration (Sign In / Sign Up)
  const navItems = [
    { name: 'Academic Hub', href: '#academic-hub', icon: BookOpen },
    { name: 'Challenge Hub', href: '#challenge-hub', icon: Target },
    { name: 'Profile', href: '#profile', icon: User },
    { name: 'Notifications', href: '#notifications', icon: Bell },
  ];

  const handleItemClick = (e: React.MouseEvent, itemName: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    if (onNavClick) {
      onNavClick(itemName);
    }
  };

  const handleRegistrationClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    const formCard = document.getElementById('signin-card-heading') || document.getElementById('signup-card-heading');
    if (formCard) {
      formCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    onSignInClick();
  };

  return (
    <header className="w-full border-b border-[#E2E8F0] dark:border-[#1F293D] bg-white/95 dark:bg-[#0B0F17]/95 backdrop-blur-md sticky top-0 z-40 transition-colors duration-250">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand wordmark */}
        <a
          href="/"
          className="whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] rounded-lg"
          aria-label="Eduway Home"
          onClick={(e) => {
            e.preventDefault();
            setIsMobileMenuOpen(false);
            if (onNavClick) onNavClick('Home');
          }}
        >
          <BrandLogo size="md" />
        </a>

        {/* Desktop Navigation: items in exact required order */}
        <nav
          className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-medium text-[#475569] dark:text-[#94A3B8]"
          aria-label="Primary Platform Navigation"
        >
          {/* 1. Academic Hub */}
          <a
            href="#academic-hub"
            onClick={(e) => handleItemClick(e, 'Academic Hub')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] rounded ${
              activePage === 'academic-hub'
                ? 'text-[#DC2626] font-semibold underline'
                : 'hover:text-[#DC2626] dark:hover:text-[#F8FAFC]'
            }`}
          >
            Academic Hub
          </a>

          {/* 2. Challenge Hub */}
          <a
            href="#challenge-hub"
            onClick={(e) => handleItemClick(e, 'Challenge Hub')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] rounded ${
              activePage === 'challenge-hub'
                ? 'text-[#DC2626] font-semibold underline'
                : 'hover:text-[#DC2626] dark:hover:text-[#F8FAFC]'
            }`}
          >
            Challenge Hub
          </a>

          {/* 3. Profile */}
          <a
            href="#profile"
            onClick={(e) => handleItemClick(e, 'Profile')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] rounded ${
              activePage === 'profile'
                ? 'text-[#DC2626] font-semibold underline'
                : 'hover:text-[#DC2626] dark:hover:text-[#F8FAFC]'
            }`}
          >
            Profile
          </a>

          {/* 4. Notifications */}
          <a
            href="#notifications"
            onClick={(e) => handleItemClick(e, 'Notifications')}
            className={`inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] rounded ${
              activePage === 'notifications'
                ? 'text-[#DC2626] font-semibold underline'
                : 'hover:text-[#DC2626] dark:hover:text-[#F8FAFC]'
            }`}
          >
            <span>Notifications</span>
            {!isOwner && unreadNotificationsCount > 0 && (
              <span
                aria-label={`${unreadNotificationsCount} unread notifications`}
                className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-[#DC2626] text-white text-[11px] font-bold tabular-nums leading-none"
              >
                {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
              </span>
            )}
          </a>

          {/* Owner-Only Navigation Item */}
          {isOwner && (
            <a
              href="#owner-dashboard"
              onClick={(e) => {
                e.preventDefault();
                setIsMobileMenuOpen(false);
                if (onOpenOwnerDashboard) {
                  onOpenOwnerDashboard();
                } else if (onNavClick) {
                  onNavClick('Owner Dashboard');
                }
              }}
              className="flex items-center gap-1.5 font-semibold text-[#DC2626] dark:text-[#F87171] hover:text-[#B91C1C] dark:hover:text-white transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] rounded px-1"
            >
              <Shield className="w-4 h-4 text-[#DC2626] dark:text-[#F87171]" aria-hidden="true" />
              <span>Owner Dashboard</span>
            </a>
          )}

          {/* 5. Registration (Sign In / Sign Up) */}
          <button
            type="button"
            onClick={handleRegistrationClick}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] border border-[#DC2626] rounded-lg transition-all shadow-sm shadow-[#DC2626]/20 hover:shadow-md hover:shadow-[#DC2626]/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] whitespace-nowrap shrink-0"
          >
            Registration (Sign In / Sign Up)
          </button>
        </nav>

        {/* Right side controls: Theme Toggle & Mobile Menu Toggle */}
        <div className="flex items-center gap-2">
          {/* Functional Light Mode / Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 text-[#475569] dark:text-[#94A3B8] hover:text-[#DC2626] dark:hover:text-[#F8FAFC] hover:bg-[#F1F5F9] dark:hover:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-[#DCE8FD]" aria-hidden="true" />
            ) : (
              <Moon className="w-4 h-4 text-[#475569]" aria-hidden="true" />
            )}
          </button>

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-[#475569] dark:text-[#94A3B8] hover:text-[#DC2626] dark:hover:text-[#F8FAFC] hover:bg-[#F1F5F9] dark:hover:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]"
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown: All 5 items in exact order */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E2E8F0] dark:border-[#1F293D] bg-white dark:bg-[#0B0F17] px-4 pt-3 pb-5 space-y-1.5 shadow-xl animate-fadeIn transition-colors duration-200">
          {/* 1. Academic Hub */}
          <a
            href="#academic-hub"
            onClick={(e) => handleItemClick(e, 'Academic Hub')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              activePage === 'academic-hub'
                ? 'font-semibold text-[#DC2626] bg-[#DC2626]/10'
                : 'font-medium text-[#475569] dark:text-[#94A3B8] hover:text-[#DC2626] dark:hover:text-[#F8FAFC] hover:bg-[#F8FAFC] dark:hover:bg-[#131B28]'
            }`}
          >
            <BookOpen className="w-4 h-4 text-[#DC2626] shrink-0" aria-hidden="true" />
            <span>Academic Hub</span>
          </a>

          {/* 2. Challenge Hub */}
          <a
            href="#challenge-hub"
            onClick={(e) => handleItemClick(e, 'Challenge Hub')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              activePage === 'challenge-hub'
                ? 'font-semibold text-[#DC2626] bg-[#DC2626]/10'
                : 'font-medium text-[#475569] dark:text-[#94A3B8] hover:text-[#DC2626] dark:hover:text-[#F8FAFC] hover:bg-[#F8FAFC] dark:hover:bg-[#131B28]'
            }`}
          >
            <Target className="w-4 h-4 text-[#DC2626] shrink-0" aria-hidden="true" />
            <span>Challenge Hub</span>
          </a>

          {/* 3. Profile */}
          <a
            href="#profile"
            onClick={(e) => handleItemClick(e, 'Profile')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              activePage === 'profile'
                ? 'font-semibold text-[#DC2626] bg-[#DC2626]/10'
                : 'font-medium text-[#475569] dark:text-[#94A3B8] hover:text-[#DC2626] dark:hover:text-[#F8FAFC] hover:bg-[#F8FAFC] dark:hover:bg-[#131B28]'
            }`}
          >
            <User className="w-4 h-4 text-[#DC2626] shrink-0" aria-hidden="true" />
            <span>Profile</span>
          </a>

          {/* 4. Notifications */}
          <a
            href="#notifications"
            onClick={(e) => handleItemClick(e, 'Notifications')}
            className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              activePage === 'notifications'
                ? 'font-semibold text-[#DC2626] bg-[#DC2626]/10'
                : 'font-medium text-[#475569] dark:text-[#94A3B8] hover:text-[#DC2626] dark:hover:text-[#F8FAFC] hover:bg-[#F8FAFC] dark:hover:bg-[#131B28]'
            }`}
          >
            <span className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-[#DC2626] shrink-0" aria-hidden="true" />
              <span>Notifications</span>
            </span>
            {!isOwner && unreadNotificationsCount > 0 && (
              <span
                aria-label={`${unreadNotificationsCount} unread notifications`}
                className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-[#DC2626] text-white text-[11px] font-bold tabular-nums leading-none"
              >
                {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
              </span>
            )}
          </a>

          {/* Owner Dashboard for mobile */}
          {isOwner && (
            <a
              href="#owner-dashboard"
              onClick={(e) => {
                e.preventDefault();
                setIsMobileMenuOpen(false);
                if (onOpenOwnerDashboard) {
                  onOpenOwnerDashboard();
                } else if (onNavClick) {
                  onNavClick('Owner Dashboard');
                }
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-[#DC2626] dark:text-[#F87171] bg-[#DC2626]/10 border border-[#DC2626]/20 transition-colors"
            >
              <Shield className="w-4 h-4 text-[#DC2626] dark:text-[#F87171] shrink-0" aria-hidden="true" />
              <span>Owner Dashboard</span>
            </a>
          )}

          {/* 5. Registration (Sign In / Sign Up) */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleRegistrationClick}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] border border-[#DC2626] transition-colors shadow-sm"
            >
              <LogIn className="w-4 h-4 text-white shrink-0" aria-hidden="true" />
              <span>Registration (Sign In / Sign Up)</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
