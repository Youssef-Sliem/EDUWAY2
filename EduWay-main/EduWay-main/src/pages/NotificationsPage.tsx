import React, { useMemo, useState } from 'react';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  CheckCircle2,
  XCircle,
  Award,
  BookOpen,
  Target,
  User,
  ArrowRight,
  LogIn,
  Shield,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import {
  StudentNotificationItem,
  StudentNotificationTargetPage,
} from '../types/notification';
import {
  formatStudentNotificationDateTime,
  markAllStudentNotificationsAsRead,
  markStudentNotificationAsRead,
} from '../services/studentNotificationService';

interface NotificationsPageProps {
  onSignInRequested: () => void;
  onNavigateToPage: (
    target: StudentNotificationTargetPage | 'owner-dashboard'
  ) => void;
  notifications: StudentNotificationItem[];
  loading: boolean;
  error: string | null;
}

type NotificationFilter = 'all' | 'unread' | 'submission' | 'challenge' | 'points';

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  onSignInRequested,
  onNavigateToPage,
  notifications,
  loading,
  error,
}) => {
  const { currentUser, isOwner } = useAuth();
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    switch (filter) {
      case 'unread':
        return notifications.filter((item) => !item.isRead);
      case 'submission':
        return notifications.filter((item) => item.category === 'submission');
      case 'challenge':
        return notifications.filter((item) => item.category === 'challenge');
      case 'points':
        return notifications.filter(
          (item) => item.category === 'points' || item.category === 'achievement'
        );
      default:
        return notifications;
    }
  }, [notifications, filter]);

  const filterCounts = useMemo(
    () => ({
      all: notifications.length,
      unread: unreadCount,
      submission: notifications.filter((i) => i.category === 'submission').length,
      challenge: notifications.filter((i) => i.category === 'challenge').length,
      points: notifications.filter(
        (i) => i.category === 'points' || i.category === 'achievement'
      ).length,
    }),
    [notifications, unreadCount]
  );

  const handleMarkOneRead = async (item: StudentNotificationItem) => {
    if (item.isRead || busyId === item.id) return;
    setActionError(null);
    setBusyId(item.id);
    try {
      await markStudentNotificationAsRead(item);
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : 'Could not mark this notification as read. Please try again.'
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0 || markingAll) return;
    setActionError(null);
    setMarkingAll(true);
    try {
      await markAllStudentNotificationsAsRead(notifications);
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : 'Could not mark all notifications as read. Please try again.'
      );
    } finally {
      setMarkingAll(false);
    }
  };

  const handleOpenNotificationTarget = async (item: StudentNotificationItem) => {
    if (!item.isRead) {
      try {
        await markStudentNotificationAsRead(item);
      } catch {
        // Still allow navigation even if read state sync hits a transient network error
      }
    }
    onNavigateToPage(item.targetPage);
  };

  const getCategoryLabel = (item: StudentNotificationItem): string => {
    if (item.category === 'submission') return 'Submission Decision';
    if (item.category === 'challenge') return 'Challenge Hub';
    if (item.category === 'achievement') return 'Achievement Unlocked';
    return 'Points & Achievement';
  };

  const getTargetLabel = (target: StudentNotificationTargetPage): string => {
    if (target === 'academic-hub') return 'Open Academic Hub';
    if (target === 'challenge-hub') return 'Open Challenge Hub';
    return 'View in Profile';
  };

  const getCategoryIcon = (item: StudentNotificationItem) => {
    if (item.category === 'submission') {
      return <BookOpen className="w-4 h-4 text-[#0284C7]" aria-hidden="true" />;
    }
    if (item.category === 'challenge') {
      return <Target className="w-4 h-4 text-[#DC2626]" aria-hidden="true" />;
    }
    if (item.category === 'points' || item.category === 'achievement') {
      return <Award className="w-4 h-4 text-[#D97706]" aria-hidden="true" />;
    }
    return <User className="w-4 h-4 text-[#475569]" aria-hidden="true" />;
  };

  // Unauthenticated view
  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <section className="bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] rounded-2xl p-8 sm:p-10 text-center space-y-5 shadow-sm">
          <div className="w-12 h-12 mx-auto rounded-xl bg-[#EEF4FE] dark:bg-[#0B1019] border border-[#DCE8FD] dark:border-[#1F293D] flex items-center justify-center">
            <Bell className="w-6 h-6 text-[#DC2626]" aria-hidden="true" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h1 className="text-2xl font-bold text-[#0B0F17] dark:text-[#F8FAFC]">
              Student Notifications
            </h1>
            <p className="text-sm text-[#475569] dark:text-[#94A3B8]">
              Sign in with your student account to view updates on approved or declined courses and resources, Challenge Hub reviews, and earned points.
            </p>
          </div>
          <div className="pt-1">
            <Button
              type="button"
              onClick={onSignInRequested}
              className="inline-flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" aria-hidden="true" />
              <span>Sign In to View Notifications</span>
            </Button>
          </div>
        </section>
      </div>
    );
  }

  // Owner restriction guard: Owner manages everything in Owner Dashboard and receives zero student notifications
  if (isOwner) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <section className="bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] rounded-2xl p-8 sm:p-10 text-center space-y-5 shadow-sm">
          <div className="w-12 h-12 mx-auto rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-[#DC2626]" aria-hidden="true" />
          </div>
          <div className="space-y-2 max-w-lg mx-auto">
            <h1 className="text-2xl font-bold text-[#0B0F17] dark:text-[#F8FAFC]">
              Student-Only Notification Center
            </h1>
            <p className="text-sm text-[#475569] dark:text-[#94A3B8]">
              This Notification Center is exclusively for Eduway students. As the platform Owner, all pending submissions, requests, and oversight alerts are managed in the Owner Dashboard.
            </p>
          </div>
          <div className="pt-1">
            <Button
              type="button"
              onClick={() => onNavigateToPage('owner-dashboard')}
              className="inline-flex items-center gap-2"
            >
              <Shield className="w-4 h-4" aria-hidden="true" />
              <span>Go to Owner Dashboard</span>
            </Button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      {/* Header Container */}
      <section className="bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-medium text-[#64748B] dark:text-[#94A3B8] tabular-nums">
              <Bell className="w-3.5 h-3.5 text-[#DC2626]" aria-hidden="true" />
              <span>Student Activity</span>
              <span aria-hidden="true">·</span>
              <span>{notifications.length} total</span>
              <span aria-hidden="true">·</span>
              <span
                className={
                  unreadCount > 0
                    ? 'font-semibold text-[#DC2626]'
                    : 'text-[#64748B] dark:text-[#94A3B8]'
                }
              >
                {unreadCount} unread
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0B0F17] dark:text-[#F8FAFC]">
              Notifications
            </h1>
            <p className="text-sm text-[#475569] dark:text-[#94A3B8]">
              Stay informed on your submission approvals, Challenge Hub answer reviews, points earned, and unlocked achievements.
            </p>
          </div>

          <div className="shrink-0">
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0 || markingAll}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold border border-[#E2E8F0] dark:border-[#1F293D] bg-[#F8FAFC] dark:bg-[#0B1019] text-[#0B0F17] dark:text-[#F8FAFC] hover:border-[#DC2626] hover:text-[#DC2626] dark:hover:text-[#F87171] disabled:opacity-50 disabled:pointer-events-none transition-colors whitespace-nowrap shrink-0"
            >
              <CheckCheck className="w-4 h-4" aria-hidden="true" />
              <span>{markingAll ? 'Marking All Read...' : 'Mark All as Read'}</span>
            </button>
          </div>
        </div>

        {/* Interactive Category Filter Bar */}
        <div
          role="tablist"
          aria-label="Filter notifications by category"
          className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#F1F5F9] dark:bg-[#0B1019] border border-[#E2E8F0] dark:border-[#1F293D]"
        >
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'unread', label: 'Unread' },
              { id: 'submission', label: 'Submissions' },
              { id: 'challenge', label: 'Challenges' },
              { id: 'points', label: 'Points & Achievements' },
            ] as const
          ).map((tab) => {
            const isSelected = filter === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isSelected}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap tabular-nums ${
                  isSelected
                    ? 'bg-white dark:bg-[#131B28] text-[#0B0F17] dark:text-[#F8FAFC] shadow-sm border border-[#E2E8F0] dark:border-[#2D3D58]'
                    : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0B0F17] dark:hover:text-[#F8FAFC]'
                }`}
              >
                {tab.label} ({filterCounts[tab.id]})
              </button>
            );
          })}
        </div>
      </section>

      {/* Error Alert */}
      {(error || actionError) && (
        <div
          role="alert"
          className="flex items-start gap-3 p-4 rounded-xl bg-[#FEF2F2] dark:bg-[#2A1215] border border-[#FECACA] dark:border-[#7F1D1D] text-xs sm:text-sm text-[#B91C1C] dark:text-[#FCA5A5]"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{actionError || error}</span>
        </div>
      )}

      {/* Feed Content */}
      {loading ? (
        <div className="bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] rounded-2xl p-10 text-center text-sm text-[#64748B] dark:text-[#94A3B8]">
          Loading your notifications...
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-white dark:bg-[#131B28] border border-dashed border-[#CBD5E1] dark:border-[#1F293D] rounded-2xl p-10 sm:p-12 text-center space-y-3">
          <div className="w-11 h-11 mx-auto rounded-xl bg-[#F1F5F9] dark:bg-[#0B1019] border border-[#E2E8F0] dark:border-[#1F293D] flex items-center justify-center">
            <BellOff className="w-5 h-5 text-[#64748B]" aria-hidden="true" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="text-base font-bold text-[#0B0F17] dark:text-[#F8FAFC]">
              {filter === 'all'
                ? 'No notifications yet'
                : filter === 'unread'
                ? 'No unread notifications'
                : 'No notifications in this category'}
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8]">
              {filter === 'all'
                ? 'Updates will appear here automatically whenever your submissions are reviewed, challenge answers are graded, or points and achievements are awarded.'
                : filter === 'unread'
                ? 'You have read all of your notifications. Select All to review your activity history.'
                : 'Switch to All to see notifications from other platform activities.'}
            </p>
          </div>
          {filter !== 'all' && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className="text-xs font-semibold text-[#DC2626] hover:underline"
              >
                Show all notifications
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3" aria-label="Notifications list">
          {filteredNotifications.map((item) => {
            const isUnread = !item.isRead;
            const isBusy = busyId === item.id;

            return (
              <article
                key={`${item.sourceCollection}-${item.id}`}
                className={`rounded-2xl border p-5 sm:p-6 transition-colors ${
                  isUnread
                    ? 'bg-[#EEF4FE]/75 dark:bg-[#162235] border-[#BFD4FA] dark:border-[#2C446B] shadow-sm'
                    : 'bg-white dark:bg-[#131B28] border-[#E2E8F0] dark:border-[#1F293D]'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Clickable Primary Notification Body */}
                  <button
                    type="button"
                    onClick={() => handleOpenNotificationTarget(item)}
                    className="flex items-start gap-3.5 text-left flex-1 min-w-0 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] rounded-lg"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        isUnread
                          ? 'bg-white dark:bg-[#0B1019] border-[#BFD4FA] dark:border-[#2C446B]'
                          : 'bg-[#F8FAFC] dark:bg-[#0B1019] border-[#E2E8F0] dark:border-[#1F293D]'
                      }`}
                    >
                      {getCategoryIcon(item)}
                    </div>

                    <div className="space-y-1.5 min-w-0 flex-1">
                      {/* Clean unboxed metadata row */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#64748B] dark:text-[#94A3B8]">
                        <span className="font-semibold text-[#0B0F17] dark:text-[#F8FAFC]">
                          {getCategoryLabel(item)}
                        </span>

                        {item.decision && (
                          <>
                            <span aria-hidden="true">·</span>
                            {item.decision === 'approved' ||
                            item.decision === 'correct' ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-[#059669] dark:text-[#34D399]">
                                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                                {item.decision === 'approved' ? 'Approved' : 'Correct'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-semibold text-[#DC2626] dark:text-[#F87171]">
                                <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                                {item.decision === 'rejected' ? 'Declined' : 'Incorrect'}
                              </span>
                            )}
                          </>
                        )}

                        {item.itemTitle && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="truncate max-w-[220px] sm:max-w-xs font-medium text-[#475569] dark:text-[#CBD5E1]">
                              {item.itemTitle}
                            </span>
                          </>
                        )}

                        <span aria-hidden="true">·</span>
                        <span>{formatStudentNotificationDateTime(item.createdAt)}</span>

                        <span aria-hidden="true">·</span>
                        <span
                          className={
                            isUnread
                              ? 'font-bold text-[#DC2626] dark:text-[#F87171]'
                              : 'text-[#64748B] dark:text-[#94A3B8]'
                          }
                        >
                          {isUnread ? 'Unread' : 'Read'}
                        </span>
                      </div>

                      <h2
                        className={`text-sm sm:text-base leading-snug group-hover:text-[#DC2626] dark:group-hover:text-[#F87171] transition-colors ${
                          isUnread
                            ? 'font-bold text-[#0B0F17] dark:text-[#F8FAFC]'
                            : 'font-semibold text-[#0B0F17] dark:text-[#E2E8F0]'
                        }`}
                      >
                        {item.title}
                      </h2>

                      <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94A3B8] leading-relaxed break-words">
                        {item.message}
                      </p>

                      {typeof item.pointsEarned === 'number' &&
                        item.pointsEarned > 0 && (
                          <div className="pt-0.5 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#D97706] dark:text-[#FBBF24] tabular-nums">
                            <Award className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            <span>+{item.pointsEarned} points earned</span>
                            {typeof item.totalPoints === 'number' && (
                              <>
                                <span
                                  aria-hidden="true"
                                  className="text-[#CBD5E1] dark:text-[#334155]"
                                >
                                  ·
                                </span>
                                <span className="text-[#0B0F17] dark:text-[#F8FAFC]">
                                  Current balance: {item.totalPoints} points
                                </span>
                              </>
                            )}
                          </div>
                        )}
                    </div>
                  </button>

                  {/* Action Controls */}
                  <div className="flex flex-wrap md:flex-col items-center md:items-end justify-end gap-2 shrink-0 pt-1 md:pt-0">
                    <button
                      type="button"
                      onClick={() => handleOpenNotificationTarget(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#DC2626] dark:text-[#F87171] bg-[#DC2626]/10 hover:bg-[#DC2626]/15 transition-colors whitespace-nowrap shrink-0"
                    >
                      <span>{getTargetLabel(item.targetPage)}</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>

                    {isUnread && (
                      <button
                        type="button"
                        onClick={() => handleMarkOneRead(item)}
                        disabled={isBusy}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#E2E8F0] dark:border-[#1F293D] bg-white dark:bg-[#0B1019] text-[#475569] dark:text-[#CBD5E1] hover:border-[#0B0F17] dark:hover:border-[#94A3B8] hover:text-[#0B0F17] dark:hover:text-[#F8FAFC] disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
                      >
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{isBusy ? 'Saving...' : 'Mark as read'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
