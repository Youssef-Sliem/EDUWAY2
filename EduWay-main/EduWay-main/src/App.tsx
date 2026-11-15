/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TopNav } from './components/common/TopNav';
import { SignUpPage } from './pages/SignUpPage';
import { SignInPage } from './pages/SignInPage';
import { Toast } from './components/ui/Toast';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';

import { useAuth } from './context/AuthContext';
import { OwnerDashboard } from './components/owner/OwnerDashboard';
import { AcademicHubPage } from './pages/AcademicHubPage';
import { ChallengeHubPage } from './pages/ChallengeHubPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotificationsPage } from './pages/NotificationsPage';
import { StudentNotificationItem } from './types/notification';
import { subscribeStudentNotifications } from './services/studentNotificationService';

type AppPageRoute =
  | 'signin'
  | 'signup'
  | 'academic-hub'
  | 'challenge-hub'
  | 'profile'
  | 'notifications'
  | 'owner-dashboard';

function AppContent() {
  const [navNotice, setNavNotice] = useState<{ title: string; desc: string } | null>(null);
  const { currentUser, isOwner } = useAuth();
  const [studentNotifications, setStudentNotifications] = useState<StudentNotificationItem[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);

  // Initialize route from hash: 'signin', 'signup', 'academic-hub', or 'owner-dashboard'
  const [currentPage, setCurrentPage] = useState<AppPageRoute>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.hash === '#signup') return 'signup';
      if (window.location.hash === '#academic-hub') return 'academic-hub';
      if (window.location.hash === '#challenge-hub') return 'challenge-hub';
      if (window.location.hash === '#profile') return 'profile';
      if (window.location.hash === '#notifications') return 'notifications';
      if (window.location.hash === '#owner-dashboard') return 'owner-dashboard';
    }
    return 'signin';
  });

  // Listen for hash changes
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#signup') {
        setCurrentPage('signup');
      } else if (window.location.hash === '#signin') {
        setCurrentPage('signin');
      } else if (window.location.hash === '#academic-hub') {
        setCurrentPage('academic-hub');
      } else if (window.location.hash === '#challenge-hub') {
        setCurrentPage('challenge-hub');
      } else if (window.location.hash === '#profile') {
        setCurrentPage('profile');
      } else if (window.location.hash === '#notifications') {
        setCurrentPage('notifications');
      } else if (window.location.hash === '#owner-dashboard') {
        setCurrentPage('owner-dashboard');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Student-only live notification subscription (strictly disabled for Owner and signed-out users)
  useEffect(() => {
    if (!currentUser || isOwner) {
      setStudentNotifications([]);
      setLoadingNotifications(false);
      setNotificationsError(null);
      return;
    }

    setLoadingNotifications(true);
    setNotificationsError(null);
    const unsub = subscribeStudentNotifications(
      currentUser.uid,
      (items) => {
        setStudentNotifications(items);
        setLoadingNotifications(false);
      },
      (err) => {
        setNotificationsError(
          err.message || 'Could not load notifications in real time.'
        );
        setLoadingNotifications(false);
      }
    );

    return () => unsub();
  }, [currentUser, isOwner]);

  const studentUnreadCount = !isOwner
    ? studentNotifications.filter((item) => !item.isRead).length
    : 0;

  const navigateTo = (page: AppPageRoute) => {
    if (page === 'owner-dashboard' && !isOwner) {
      setNavNotice({
        title: 'Restricted Access',
        desc: 'The Owner Dashboard is exclusively accessible to the designated platform Owner account (UID: ZAzbViaemRbjyA4QpHsqOKjzhcu1).',
      });
      return;
    }
    setCurrentPage(page);
    if (typeof window !== 'undefined') {
      window.location.hash = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNavClick = (sectionName: string) => {
    if (sectionName === 'Academic Hub' || sectionName === 'Home') {
      navigateTo('academic-hub');
      return;
    }
    if (sectionName === 'Challenge Hub') {
      navigateTo('challenge-hub');
      return;
    }
    if (sectionName === 'Owner Dashboard') {
      navigateTo('owner-dashboard');
      return;
    }
    if (sectionName === 'Notifications') {
      if (isOwner) {
        navigateTo('owner-dashboard');
      } else {
        navigateTo('notifications');
      }
      return;
    }
    if (sectionName === 'Profile') {
      navigateTo('profile');
      return;
    }
    setNavNotice({
      title: `${sectionName} Page`,
      desc: `This scalable architecture is prepared for the ${sectionName} module in future development phases.`,
    });
  };

  const handleRegistrationClick = () => {
    if (
      currentPage === 'owner-dashboard' ||
      currentPage === 'academic-hub' ||
      currentPage === 'challenge-hub' ||
      currentPage === 'profile' ||
      currentPage === 'notifications'
    ) {
      navigateTo('signin');
      return;
    }
    const targetId = currentPage === 'signin' ? 'signin-card-heading' : 'signup-card-heading';
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B0F17] text-[#0B0F17] dark:text-[#F8FAFC] antialiased selection:bg-[#DC2626]/20 selection:text-[#DC2626] transition-colors duration-250">
      {/* 3-Zone Top Navigation Contract with Theme Toggle */}
      <TopNav
        onSignInClick={handleRegistrationClick}
        onNavClick={handleNavClick}
        onOpenOwnerDashboard={() => navigateTo('owner-dashboard')}
        activePage={currentPage}
        unreadNotificationsCount={studentUnreadCount}
      />

      {/* Main Content: Sign In, Sign Up, Academic Hub, Challenge Hub, Profile, Notifications, or Owner Dashboard */}
      <main className="flex-1">
        {currentPage === 'owner-dashboard' ? (
          <OwnerDashboard onBackToApp={() => navigateTo('academic-hub')} />
        ) : currentPage === 'academic-hub' ? (
          <AcademicHubPage onSignInRequested={() => navigateTo('signin')} />
        ) : currentPage === 'challenge-hub' ? (
          <ChallengeHubPage onSignInRequested={() => navigateTo('signin')} />
        ) : currentPage === 'profile' ? (
          <ProfilePage onSignInRequested={() => navigateTo('signin')} />
        ) : currentPage === 'notifications' ? (
          <NotificationsPage
            onSignInRequested={() => navigateTo('signin')}
            onNavigateToPage={(target) => navigateTo(target)}
            notifications={studentNotifications}
            loading={loadingNotifications}
            error={notificationsError}
          />
        ) : currentPage === 'signin' ? (
          <SignInPage onSignUpRequested={() => navigateTo('signup')} />
        ) : (
          <SignUpPage onSignInRequested={() => navigateTo('signin')} />
        )}
      </main>

      {/* Quiet, Clean Institutional Footer */}
      <footer className="border-t border-[#E2E8F0] dark:border-[#1F293D] py-6 px-4 sm:px-6 lg:px-8 text-center text-xs text-[#64748B] dark:text-[#64748B] bg-white dark:bg-[#0B0F17] transition-colors duration-250">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Eduway. Technology-focused educational platform.</p>
          <div className="flex items-center gap-4 text-[11px] text-[#475569] dark:text-[#94A3B8]">
            <a
              href="#privacy"
              onClick={(e) => {
                e.preventDefault();
                setNavNotice({
                  title: 'Privacy & Security',
                  desc: 'All student cohort records are securely handled under student data protection protocols.',
                });
              }}
              className="hover:text-[#DC2626] dark:hover:text-[#F8FAFC] transition-colors hover:underline"
            >
              Privacy Policy
            </a>
            <span aria-hidden="true" className="text-[#CBD5E1] dark:text-[#334155]">·</span>
            <a
              href="#terms"
              onClick={(e) => {
                e.preventDefault();
                setNavNotice({
                  title: 'Terms of Use',
                  desc: 'Educational terms of use for Eduway cohorts and curriculum access.',
                });
              }}
              className="hover:text-[#DC2626] dark:hover:text-[#F8FAFC] transition-colors hover:underline"
            >
              Academic Terms
            </a>
            <span aria-hidden="true" className="text-[#CBD5E1] dark:text-[#334155]">·</span>
            <span className="text-[#DC2626]">
              {currentPage === 'owner-dashboard'
                ? 'Owner Oversight'
                : currentPage === 'academic-hub'
                ? 'Academic Hub'
                : currentPage === 'challenge-hub'
                ? 'Challenge Hub'
                : currentPage === 'profile'
                ? 'Profile'
                : currentPage === 'notifications'
                ? 'Notifications'
                : currentPage === 'signin'
                ? 'Sign In'
                : 'Sign Up'}
            </span>
          </div>
        </div>
      </footer>

      {/* Navigation Feedback Toast */}
      <Toast
        isOpen={Boolean(navNotice)}
        message={navNotice?.title || ''}
        subMessage={navNotice?.desc}
        onClose={() => setNavNotice(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
