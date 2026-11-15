import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  addDoc,
} from 'firebase/firestore';
import {
  Shield,
  Users,
  FileText,
  Inbox,
  Bell,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  ExternalLink,
  ChevronRight,
  Filter,
  RefreshCw,
  AlertTriangle,
  Lock,
  ArrowLeft,
  Check,
  Trash2,
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { OWNER_UID } from '../../config/owner';
import {
  deleteAcademicSubmission,
  reviewAcademicSubmission,
} from '../../services/academicService';
import { formatTimestamp, isGoogleDriveUrl } from '../../utils/resourceValidation';
import { findSubjectById } from '../../data/academicCatalog';

export interface OwnerDashboardProps {
  onBackToApp: () => void;
}

type DashboardTab = 'overview' | 'files' | 'requests' | 'notifications' | 'members' | 'settings';

interface SubmissionDoc {
  id: string;
  submissionKind?: 'course' | 'news' | 'website' | 'community';
  title: string;
  description: string;
  content?: string;
  hub?: 'general' | 'specialized';
  subject?: string;
  category: string;
  coverImageUrl?: string;
  tags?: string[];
  websiteUrl?: string;
  sourceUrl?: string;
  resourceFormat?: 'link' | 'document' | 'none';
  submitterId: string;
  submitterName: string;
  fileUrl?: string;
  fileType?: 'link' | 'pdf' | 'video' | 'doc';
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: unknown;
  decisionNote?: string;
  createdAt: unknown;
}

interface MemberRequestDoc {
  id: string;
  userId: string;
  userName: string;
  type: string;
  subject: string;
  details: string;
  status: 'pending' | 'accepted' | 'rejected';
  decisionNote?: string;
  reviewedAt?: unknown;
  reviewedBy?: string;
  createdAt: unknown;
}

interface NotificationDoc {
  id: string;
  type: 'submission' | 'request' | 'system';
  submissionType?: 'course' | 'news' | 'website' | 'community';
  submitterName?: string;
  submissionTitle?: string;
  submissionStatus?: 'pending' | 'approved' | 'rejected';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: unknown;
  relatedId?: string;
  reviewPath?: string;
}

interface MemberUserDoc {
  id: string;
  fullName: string;
  nickname: string;
  classCohort: string;
  academicYear: string;
  email: string;
  createdAt?: { seconds: number } | string | unknown;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ onBackToApp }) => {
  const { currentUser, isOwner, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

  // Real data state
  const [submissions, setSubmissions] = useState<SubmissionDoc[]>([]);
  const [requests, setRequests] = useState<MemberRequestDoc[]>([]);
  const [notifications, setNotifications] = useState<NotificationDoc[]>([]);
  const [members, setMembers] = useState<MemberUserDoc[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingData, setLoadingData] = useState(true);

  // Filters & Search
  const [fileStatusFilter, setFileStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [requestStatusFilter, setRequestStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [reviewNote, setReviewNote] = useState<{ [docId: string]: string }>({});
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [highlightedSubmissionId, setHighlightedSubmissionId] = useState<string | null>(null);

  // Sound/Display settings
  const [compactView, setCompactView] = useState(false);
  const [alertBanner, setAlertBanner] = useState<string | null>(null);

  // Security Verification Guard
  const isAuthorized = isOwner && currentUser?.uid === OWNER_UID;

  // Real-time Firestore Listeners
  useEffect(() => {
    if (!isAuthorized) return;

    // 1. Submissions listener
    const submissionsPath = 'submissions';
    const subQuery = query(collection(db, submissionsPath), orderBy('createdAt', 'desc'));
    const unsubSubmissions = onSnapshot(
      subQuery,
      (snap) => {
        const items: SubmissionDoc[] = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() } as SubmissionDoc));
        setSubmissions(items);
        setLoadingData(false);
      },
      (err) => {
        // If collection does not exist yet or empty, fail gracefully
        console.warn('Submissions listener note:', err.message);
        setLoadingData(false);
      }
    );

    // 2. Member Requests listener
    const requestsPath = 'requests';
    const reqQuery = query(collection(db, requestsPath), orderBy('createdAt', 'desc'));
    const unsubRequests = onSnapshot(
      reqQuery,
      (snap) => {
        const items: MemberRequestDoc[] = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() } as MemberRequestDoc));
        setRequests(items);
      },
      (err) => {
        console.warn('Requests listener note:', err.message);
      }
    );

    // 3. Notifications listener
    const notifsPath = 'notifications';
    const notifQuery = query(collection(db, notifsPath), orderBy('createdAt', 'desc'));
    const unsubNotifs = onSnapshot(
      notifQuery,
      (snap) => {
        const items: NotificationDoc[] = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() } as NotificationDoc));
        setNotifications(items);
      },
      (err) => {
        console.warn('Notifications listener note:', err.message);
      }
    );

    // 4. Registered Members listener (/users)
    const usersPath = 'users';
    const usersQuery = query(collection(db, usersPath), orderBy('createdAt', 'desc'));
    const unsubUsers = onSnapshot(
      usersQuery,
      (snap) => {
        const items: MemberUserDoc[] = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() } as MemberUserDoc));
        setMembers(items);
        setLoadingMembers(false);
      },
      (err) => {
        console.warn('Users listener note:', err.message);
        setLoadingMembers(false);
      }
    );

    return () => {
      unsubSubmissions();
      unsubRequests();
      unsubNotifs();
      unsubUsers();
    };
  }, [isAuthorized]);

  // Action handlers: Submissions (no duplicate notifications)
  const handleReviewSubmission = async (submissionId: string, newStatus: 'approved' | 'rejected') => {
    if (!isAuthorized) return;
    setProcessingId(submissionId);
    const note = reviewNote[submissionId] || '';

    try {
      await reviewAcademicSubmission(submissionId, newStatus, note);
      setAlertBanner(
        newStatus === 'approved'
          ? 'Submission approved and published to Academic Hub.'
          : 'Submission marked as rejected and kept unpublished.'
      );
      setTimeout(() => setAlertBanner(null), 4000);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteSubmission = async (submissionId: string) => {
    if (!isAuthorized) return;
    setProcessingId(submissionId);
    try {
      await deleteAcademicSubmission(submissionId);
      setAlertBanner('Submission removed from Firestore.');
      setTimeout(() => setAlertBanner(null), 3000);
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenNotificationReview = async (notif: NotificationDoc) => {
    if (!notif.isRead) {
      await handleMarkNotificationRead(notif.id);
    }
    if (notif.relatedId) {
      setFileStatusFilter('all');
      setHighlightedSubmissionId(notif.relatedId);
      setActiveTab('files');
      setTimeout(() => {
        const el = document.getElementById(`submission-card-${notif.relatedId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };

  // Action handlers: Requests
  const handleReviewRequest = async (requestId: string, newStatus: 'accepted' | 'rejected') => {
    if (!isAuthorized) return;
    setProcessingId(requestId);
    const note = reviewNote[requestId] || '';
    const path = `requests/${requestId}`;

    try {
      await updateDoc(doc(db, 'requests', requestId), {
        status: newStatus,
        reviewedBy: OWNER_UID,
        reviewedAt: serverTimestamp(),
        decisionNote: note,
      });

      // Audit notification
      await addDoc(collection(db, 'notifications'), {
        type: 'request',
        title: `Request ${newStatus.toUpperCase()}: ${requests.find((r) => r.id === requestId)?.subject || 'Request'}`,
        message: `Owner decision: ${newStatus}. Note: ${note || 'Processed.'}`,
        isRead: false,
        createdAt: serverTimestamp(),
        relatedId: requestId,
      });

      setAlertBanner(`Request successfully marked as ${newStatus}.`);
      setTimeout(() => setAlertBanner(null), 4000);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    } finally {
      setProcessingId(null);
    }
  };

  // Action handlers: Notifications
  const handleMarkNotificationRead = async (notifId: string) => {
    const path = `notifications/${notifId}`;
    try {
      await updateDoc(doc(db, 'notifications', notifId), {
        isRead: true,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    for (const n of unread) {
      const path = `notifications/${n.id}`;
      try {
        await updateDoc(doc(db, 'notifications', n.id), { isRead: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    }
    setAlertBanner('All notifications marked as read.');
    setTimeout(() => setAlertBanner(null), 3000);
  };

  // Calculated Metrics
  const totalMembers = members.length;
  const pendingSubmissions = submissions.filter((s) => s.status === 'pending').length;
  const approvedSubmissions = submissions.filter((s) => s.status === 'approved').length;
  const rejectedSubmissions = submissions.filter((s) => s.status === 'rejected').length;
  const pendingRequests = requests.filter((r) => r.status === 'pending').length;
  const unreadNotifications = notifications.filter((n) => !n.isRead).length;

  // Filtered lists
  const filteredSubmissions = submissions.filter((s) => {
    if (fileStatusFilter === 'all') return true;
    return s.status === fileStatusFilter;
  });

  const filteredRequests = requests.filter((r) => {
    if (requestStatusFilter === 'all') return true;
    return r.status === requestStatusFilter;
  });

  const filteredMembers = members.filter((m) => {
    if (!memberSearchQuery.trim()) return true;
    const q = memberSearchQuery.toLowerCase();
    return (
      m.fullName?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.nickname?.toLowerCase().includes(q) ||
      m.classCohort?.toLowerCase().includes(q)
    );
  });

  // Guard: If not authoritative owner, display Access Restricted screen
  if (!isAuthorized) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full p-8 rounded-2xl bg-white dark:bg-[#111827] border border-[#DC2626]/30 shadow-xl space-y-5 animate-fadeIn">
          <div className="w-14 h-14 rounded-2xl bg-[#DC2626]/10 border border-[#DC2626]/30 text-[#DC2626] flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-[#0B0F17] dark:text-[#F8FAFC]">
              Owner Access Only
            </h1>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
              This administrative dashboard is strictly restricted to the designated Eduway Owner account.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#0B0F17] border border-[#E2E8F0] dark:border-[#1F293D] text-[11px] font-mono text-[#64748B] dark:text-[#94A3B8] text-left">
            <div>Current UID: {currentUser?.uid || 'Not signed in'}</div>
            <div>Authorized UID: {OWNER_UID}</div>
          </div>
          <button
            type="button"
            onClick={onBackToApp}
            className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-lg transition-colors shadow-sm"
          >
            Return to Student Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0] dark:border-[#1F293D]">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/30 text-[#DC2626]">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-[#0B0F17] dark:text-[#F8FAFC] tracking-tight">
                  Owner Dashboard
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DC2626] text-white uppercase tracking-wider">
                  Authoritative
                </span>
              </div>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Eduway Technology Academy Administrative & Oversight Center
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToApp}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#0B0F17] dark:text-[#F8FAFC] bg-white dark:bg-[#131B28] hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#1F293D] rounded-lg transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Eduway</span>
          </button>
          <button
            type="button"
            onClick={() => signOut()}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#DC2626] hover:bg-[#DC2626]/10 border border-[#DC2626]/20 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {alertBanner && (
        <div className="p-3.5 rounded-xl bg-[#36C9B5]/10 border border-[#36C9B5]/30 text-[#0B0F17] dark:text-[#F8FAFC] text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#36C9B5]" />
            <span>{alertBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setAlertBanner(null)}
            className="text-xs text-[#64748B] hover:text-[#0B0F17] dark:hover:text-[#F8FAFC]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-[#E2E8F0] dark:border-[#1F293D]">
        {[
          { key: 'overview', label: 'Overview', icon: RefreshCw },
          { key: 'files', label: 'File Management', icon: FileText, count: pendingSubmissions },
          { key: 'requests', label: 'Request Management', icon: Inbox, count: pendingRequests },
          { key: 'notifications', label: 'Notifications', icon: Bell, count: unreadNotifications },
          { key: 'members', label: 'Member Management', icon: Users, count: totalMembers },
          { key: 'settings', label: 'Settings', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as DashboardTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#DC2626] text-white shadow-sm shadow-[#DC2626]/20'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0B0F17] dark:hover:text-[#F8FAFC] hover:bg-[#F1F5F9] dark:hover:bg-[#131B28]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-white text-[#DC2626]' : 'bg-[#DC2626] text-white'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1F293D] shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-[#94A3B8]">
                <span>Registered Members</span>
                <Users className="w-4 h-4 text-[#648CFF]" />
              </div>
              <div className="text-2xl font-black text-[#0B0F17] dark:text-[#F8FAFC]">
                {loadingMembers ? '...' : totalMembers}
              </div>
              <div className="text-[11px] text-[#64748B]">Enrolled students</div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1F293D] shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-[#94A3B8]">
                <span>Pending Submissions</span>
                <Clock className="w-4 h-4 text-[#F59E0B]" />
              </div>
              <div className="text-2xl font-black text-[#F59E0B]">
                {loadingData ? '...' : pendingSubmissions}
              </div>
              <div className="text-[11px] text-[#64748B]">Awaiting your review</div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1F293D] shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-[#94A3B8]">
                <span>Pending Requests</span>
                <Inbox className="w-4 h-4 text-[#36C9B5]" />
              </div>
              <div className="text-2xl font-black text-[#36C9B5]">
                {loadingData ? '...' : pendingRequests}
              </div>
              <div className="text-[11px] text-[#64748B]">Member inquiries</div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1F293D] shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-[#94A3B8]">
                <span>Approved Files</span>
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-emerald-500">
                {approvedSubmissions}
              </div>
              <div className="text-[11px] text-[#64748B]">Published to curriculum</div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1F293D] shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-[#94A3B8]">
                <span>Rejected Files</span>
                <XCircle className="w-4 h-4 text-[#DC2626]" />
              </div>
              <div className="text-2xl font-black text-[#DC2626]">
                {rejectedSubmissions}
              </div>
              <div className="text-[11px] text-[#64748B]">Action required by author</div>
            </div>
          </div>

          {/* Quick Actions & Recent Activity Split */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1F293D] shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-[#0B0F17] dark:text-[#F8FAFC] uppercase tracking-wider">
                Quick Administrative Actions
              </h2>
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setFileStatusFilter('pending');
                    setActiveTab('files');
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#131B28] hover:bg-[#DC2626]/10 border border-[#E2E8F0] dark:border-[#1F293D] transition-colors text-xs font-medium text-left"
                >
                  <span className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-[#DC2626]" />
                    Review Pending Submissions
                  </span>
                  <span className="font-bold text-[#DC2626]">{pendingSubmissions}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRequestStatusFilter('pending');
                    setActiveTab('requests');
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#131B28] hover:bg-[#36C9B5]/10 border border-[#E2E8F0] dark:border-[#1F293D] transition-colors text-xs font-medium text-left"
                >
                  <span className="flex items-center gap-2.5">
                    <Inbox className="w-4 h-4 text-[#36C9B5]" />
                    Inspect Member Inquiries
                  </span>
                  <span className="font-bold text-[#36C9B5]">{pendingRequests}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('members')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#131B28] hover:bg-[#648CFF]/10 border border-[#E2E8F0] dark:border-[#1F293D] transition-colors text-xs font-medium text-left"
                >
                  <span className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-[#648CFF]" />
                    Inspect Member Roster
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#64748B]" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('notifications')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#131B28] hover:bg-[#F59E0B]/10 border border-[#E2E8F0] dark:border-[#1F293D] transition-colors text-xs font-medium text-left"
                >
                  <span className="flex items-center gap-2.5">
                    <Bell className="w-4 h-4 text-[#F59E0B]" />
                    Unread Notifications
                  </span>
                  <span className="font-bold text-[#F59E0B]">{unreadNotifications}</span>
                </button>
              </div>
            </div>

            {/* Recent Notifications / Activity Log */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1F293D] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#0B0F17] dark:text-[#F8FAFC] uppercase tracking-wider">
                  Recent Platform Activity
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('notifications')}
                  className="text-xs font-semibold text-[#DC2626] hover:underline"
                >
                  View All Activity
                </button>
              </div>

              {notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#64748B] dark:text-[#94A3B8] border border-dashed border-[#E2E8F0] dark:border-[#1F293D] rounded-xl">
                  No recent activities logged yet. Activity appears as students submit files or make requests.
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.slice(0, 5).map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
                        notif.isRead
                          ? 'bg-[#F8FAFC] dark:bg-[#131B28] border-[#E2E8F0] dark:border-[#1F293D]'
                          : 'bg-[#DC2626]/5 border-[#DC2626]/20'
                      }`}
                    >
                      <div className="p-1.5 rounded-lg bg-white dark:bg-[#0B0F17] text-[#DC2626] shrink-0">
                        {notif.type === 'submission' ? (
                          <FileText className="w-4 h-4" />
                        ) : notif.type === 'request' ? (
                          <Inbox className="w-4 h-4" />
                        ) : (
                          <Bell className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-[#0B0F17] dark:text-[#F8FAFC] truncate">
                            {notif.title}
                          </p>
                          {!notif.isRead && (
                            <span className="w-2 h-2 rounded-full bg-[#DC2626] shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FILE MANAGEMENT */}
      {activeTab === 'files' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1F293D]">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#64748B]" />
              <span className="text-xs font-bold text-[#0B0F17] dark:text-[#F8FAFC]">
                Filter Status:
              </span>
              {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFileStatusFilter(status)}
                  className={`px-3 py-1 text-xs rounded-lg font-semibold capitalize transition-all ${
                    fileStatusFilter === status
                      ? 'bg-[#DC2626] text-white shadow-sm'
                      : 'text-[#64748B] hover:text-[#0B0F17] dark:hover:text-[#F8FAFC]'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="text-xs text-[#64748B]">
              Showing <span className="font-bold text-[#0B0F17] dark:text-[#F8FAFC]">{filteredSubmissions.length}</span> submissions
            </div>
          </div>

          {filteredSubmissions.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1F293D] space-y-3">
              <FileText className="w-8 h-8 text-[#64748B] mx-auto" />
              <h3 className="text-sm font-bold text-[#0B0F17] dark:text-[#F8FAFC]">
                No Submissions Found
              </h3>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                {fileStatusFilter === 'all'
                  ? 'There are currently no student files submitted for review.'
                  : `There are no submissions with status "${fileStatusFilter}".`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredSubmissions.map((file) => {
                const subjectInfo = findSubjectById(file.subject);
                const primaryLink = file.fileUrl || file.websiteUrl;
                const isHighlighted = highlightedSubmissionId === file.id;
                return (
                  <div
                    key={file.id}
                    id={`submission-card-${file.id}`}
                    className={`p-5 rounded-2xl bg-white dark:bg-[#111827] border shadow-sm space-y-4 transition-all ${
                      isHighlighted
                        ? 'border-[#DC2626] ring-2 ring-[#DC2626]/20'
                        : 'border-[#E2E8F0] dark:border-[#1F293D]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-semibold uppercase text-[#DC2626]">
                            {file.submissionKind || 'submission'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold capitalize text-[#475569] dark:text-[#94A3B8]">
                            Status: {file.status}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="text-[#64748B]">
                            {file.hub ? `${file.hub === 'general' ? 'General Hub' : 'Specialized Hub'} / ` : ''}
                            {file.hub === 'specialized'
                              ? 'Computer Science'
                              : subjectInfo?.name || file.category || 'Curriculum'}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-[#0B0F17] dark:text-[#F8FAFC]">
                          {file.title}
                        </h3>
                        <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                          Submitted by <span className="font-semibold text-[#0B0F17] dark:text-[#F8FAFC]">{file.submitterName || 'Student'}</span> · {formatTimestamp(file.createdAt)} · UID: {file.submitterId}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {primaryLink && (
                          <a
                            href={primaryLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#DC2626] hover:bg-[#DC2626]/10 rounded-lg transition-colors border border-[#DC2626]/25"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>{isGoogleDriveUrl(primaryLink) ? 'View File' : 'Open Link'}</span>
                          </a>
                        )}
                        {file.sourceUrl && (
                          <a
                            href={file.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#475569] dark:text-[#94A3B8] hover:text-[#DC2626] rounded-lg transition-colors border border-[#E2E8F0] dark:border-[#1F293D]"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Source</span>
                          </a>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-[#475569] dark:text-[#CBD5E1] bg-[#F8FAFC] dark:bg-[#131B28] p-3 rounded-xl border border-[#E2E8F0] dark:border-[#1F293D] whitespace-pre-line">
                      {file.description || 'No additional submission notes provided.'}
                    </p>

                    {file.content && (
                      <p className="text-xs text-[#475569] dark:text-[#CBD5E1] p-3 rounded-xl border border-[#E2E8F0] dark:border-[#1F293D] whitespace-pre-line">
                        {file.content}
                      </p>
                    )}

                    {file.tags && file.tags.length > 0 && (
                      <p className="text-xs text-[#64748B]">
                        Tags: {file.tags.join(' · ')}
                      </p>
                    )}

                    {file.decisionNote && (
                      <div className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                        <span className="font-semibold">Review Decision Note:</span> {file.decisionNote}
                      </div>
                    )}

                    {/* Owner Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#E2E8F0] dark:border-[#1F293D]">
                      <input
                        type="text"
                        placeholder="Add review feedback note (optional)..."
                        value={reviewNote[file.id] || ''}
                        onChange={(e) => setReviewNote({ ...reviewNote, [file.id]: e.target.value })}
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-[#F8FAFC] dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                      />

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={processingId === file.id || file.status === 'approved'}
                          onClick={() => handleReviewSubmission(file.id, 'approved')}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-all shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>

                        <button
                          type="button"
                          disabled={processingId === file.id || file.status === 'rejected'}
                          onClick={() => handleReviewSubmission(file.id, 'rejected')}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-50 rounded-lg transition-all shadow-sm"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>

                        <button
                          type="button"
                          disabled={processingId === file.id}
                          onClick={() => handleDeleteSubmission(file.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#64748B] hover:text-[#DC2626] border border-[#E2E8F0] dark:border-[#1F293D] rounded-lg transition-colors"
                          title="Delete submission"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REQUEST MANAGEMENT */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1F293D]">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#64748B]" />
              <span className="text-xs font-bold text-[#0B0F17] dark:text-[#F8FAFC]">
                Filter Requests:
              </span>
              {(['all', 'pending', 'accepted', 'rejected'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setRequestStatusFilter(status)}
                  className={`px-3 py-1 text-xs rounded-lg font-semibold capitalize transition-all ${
                    requestStatusFilter === status
                      ? 'bg-[#DC2626] text-white shadow-sm'
                      : 'text-[#64748B] hover:text-[#0B0F17] dark:hover:text-[#F8FAFC]'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="text-xs text-[#64748B]">
              Showing <span className="font-bold text-[#0B0F17] dark:text-[#F8FAFC]">{filteredRequests.length}</span> requests
            </div>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1F293D] space-y-3">
              <Inbox className="w-8 h-8 text-[#64748B] mx-auto" />
              <h3 className="text-sm font-bold text-[#0B0F17] dark:text-[#F8FAFC]">
                No Member Requests
              </h3>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                {requestStatusFilter === 'all'
                  ? 'There are currently no member requests or inquiries in the system.'
                  : `There are no requests with status "${requestStatusFilter}".`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1F293D] shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-[#0B0F17] dark:text-[#F8FAFC]">
                          {req.subject}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            req.status === 'accepted'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : req.status === 'rejected'
                              ? 'bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20'
                              : 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20'
                          }`}
                        >
                          {req.status}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#36C9B5]/10 text-[#36C9B5]">
                          {req.type || 'General'}
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                        From <span className="font-semibold text-[#0B0F17] dark:text-[#F8FAFC]">{req.userName || 'Member'}</span> (UID: {req.userId})
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-[#475569] dark:text-[#CBD5E1] bg-[#F8FAFC] dark:bg-[#131B28] p-3 rounded-xl border border-[#E2E8F0] dark:border-[#1F293D]">
                    {req.details || 'No additional details provided with this request.'}
                  </p>

                  {req.decisionNote && (
                    <div className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                      <span className="font-semibold">Decision Note:</span> {req.decisionNote}
                    </div>
                  )}

                  {/* Owner Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#E2E8F0] dark:border-[#1F293D]">
                    <input
                      type="text"
                      placeholder="Add decision or explanation note (optional)..."
                      value={reviewNote[req.id] || ''}
                      onChange={(e) => setReviewNote({ ...reviewNote, [req.id]: e.target.value })}
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-[#F8FAFC] dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                    />

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={processingId === req.id || req.status === 'accepted'}
                        onClick={() => handleReviewRequest(req.id, 'accepted')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-all shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept</span>
                      </button>

                      <button
                        type="button"
                        disabled={processingId === req.id || req.status === 'rejected'}
                        onClick={() => handleReviewRequest(req.id, 'rejected')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-50 rounded-lg transition-all shadow-sm"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: NOTIFICATIONS CENTER */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1F293D]">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#DC2626]" />
              <span className="text-xs font-bold text-[#0B0F17] dark:text-[#F8FAFC]">
                Owner Notifications Center ({unreadNotifications} Unread)
              </span>
            </div>

            {unreadNotifications > 0 && (
              <button
                type="button"
                onClick={handleMarkAllNotificationsRead}
                className="px-3 py-1.5 text-xs font-semibold text-[#DC2626] hover:bg-[#DC2626]/10 rounded-lg transition-colors border border-[#DC2626]/20"
              >
                Mark All as Read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1F293D] space-y-3">
              <Bell className="w-8 h-8 text-[#64748B] mx-auto" />
              <h3 className="text-sm font-bold text-[#0B0F17] dark:text-[#F8FAFC]">
                No Notifications
              </h3>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                You have no active alerts or notifications right now.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                    notif.isRead
                      ? 'bg-white dark:bg-[#111827] border-[#E2E8F0] dark:border-[#1F293D]'
                      : 'bg-[#DC2626]/5 border-[#DC2626]/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-[#F8FAFC] dark:bg-[#131B28] text-[#DC2626] shrink-0 mt-0.5">
                      {notif.type === 'submission' ? (
                        <FileText className="w-4 h-4" />
                      ) : notif.type === 'request' ? (
                        <Inbox className="w-4 h-4" />
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {notif.submissionType && (
                          <>
                            <span className="font-semibold uppercase text-[#DC2626]">
                              {notif.submissionType}
                            </span>
                            <span aria-hidden="true">·</span>
                          </>
                        )}
                        {notif.submitterName && (
                          <>
                            <span className="font-medium text-[#0B0F17] dark:text-[#F8FAFC]">
                              {notif.submitterName}
                            </span>
                            <span aria-hidden="true">·</span>
                          </>
                        )}
                        <span className="text-[#64748B]">
                          {formatTimestamp(notif.createdAt)}
                        </span>
                        {notif.submissionStatus && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="capitalize font-semibold text-[#475569] dark:text-[#94A3B8]">
                              Status: {notif.submissionStatus}
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-[#0B0F17] dark:text-[#F8FAFC]">
                        {notif.submissionTitle || notif.title}
                      </p>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                        {notif.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {notif.relatedId && (
                      <button
                        type="button"
                        onClick={() => handleOpenNotificationReview(notif)}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-lg transition-colors whitespace-nowrap"
                      >
                        Review Submission
                      </button>
                    )}

                    {!notif.isRead && (
                      <button
                        type="button"
                        onClick={() => handleMarkNotificationRead(notif.id)}
                        className="px-2.5 py-1.5 text-[11px] font-semibold text-[#64748B] hover:text-[#DC2626] hover:bg-[#DC2626]/10 rounded-lg transition-colors whitespace-nowrap"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: MEMBER MANAGEMENT */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1F293D]">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search registered members by name, cohort, or email..."
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#F8FAFC] dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
              />
            </div>

            <div className="text-xs text-[#64748B]">
              Total Registered: <span className="font-bold text-[#0B0F17] dark:text-[#F8FAFC]">{totalMembers}</span>
            </div>
          </div>

          {loadingMembers ? (
            <div className="p-12 text-center text-xs text-[#64748B]">
              Loading registered member records from Firestore...
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1F293D] space-y-3">
              <Users className="w-8 h-8 text-[#64748B] mx-auto" />
              <h3 className="text-sm font-bold text-[#0B0F17] dark:text-[#F8FAFC]">
                No Members Matching Search
              </h3>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Try adjusting your search query.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[#E2E8F0] dark:border-[#1F293D] bg-white dark:bg-[#111827] shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] dark:bg-[#131B28] border-b border-[#E2E8F0] dark:border-[#1F293D] text-[#64748B] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Member Name</th>
                    <th className="py-3 px-4">Nickname</th>
                    <th className="py-3 px-4">Cohort</th>
                    <th className="py-3 px-4">Academic Year</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Firebase UID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#1F293D]">
                  {filteredMembers.map((member) => (
                    <tr
                      key={member.id}
                      className="hover:bg-[#F8FAFC] dark:hover:bg-[#131B28] transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-[#0B0F17] dark:text-[#F8FAFC]">
                        {member.fullName}
                      </td>
                      <td className="py-3.5 px-4 text-[#64748B] dark:text-[#94A3B8]">
                        {member.nickname || '—'}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#DC2626]">
                        {member.classCohort || 'Standard'}
                      </td>
                      <td className="py-3.5 px-4 text-[#64748B] dark:text-[#94A3B8]">
                        {member.academicYear || 'Current'}
                      </td>
                      <td className="py-3.5 px-4 text-[#64748B] dark:text-[#94A3B8] font-mono text-[11px]">
                        {member.email}
                      </td>
                      <td className="py-3.5 px-4 text-[#64748B] dark:text-[#94A3B8] font-mono text-[10px] break-all max-w-[150px]">
                        {member.id}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1F293D] shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-[#0B0F17] dark:text-[#F8FAFC] uppercase tracking-wider">
              Authoritative Owner Account Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] space-y-1">
                <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  Configured Owner UID
                </span>
                <p className="text-xs font-mono font-bold text-[#DC2626] break-all">
                  {OWNER_UID}
                </p>
                <p className="text-[11px] text-[#64748B]">
                  Hard-pinned in application config & enforced in Firestore security rules.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] space-y-1">
                <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  Current Session UID
                </span>
                <p className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 break-all">
                  {currentUser?.uid}
                </p>
                <p className="text-[11px] text-[#64748B]">
                  Authenticated via Firebase Auth ({currentUser?.email || 'Google Account'})
                </p>
              </div>
            </div>
          </div>

          {/* Database Configuration Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1F293D] shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-[#0B0F17] dark:text-[#F8FAFC] uppercase tracking-wider">
              Firebase Project Configuration
            </h2>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#131B28]">
                <span className="text-[#64748B]">Project ID</span>
                <span className="font-mono font-bold text-[#0B0F17] dark:text-[#F8FAFC]">eduway-4fd4e</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#131B28]">
                <span className="text-[#64748B]">Firestore Database ID</span>
                <span className="font-mono font-bold text-[#0B0F17] dark:text-[#F8FAFC] text-[11px]">
                  ai-studio-wheelertechacade-c3bdd361-ae1b-45b8-9e86-17be68616378
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#131B28]">
                <span className="text-[#64748B]">Pricing Plan</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  Spark Plan (100% Free Tier, No Paid Services)
                </span>
              </div>
            </div>
          </div>

          {/* Dashboard Display Preferences */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1F293D] shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-[#0B0F17] dark:text-[#F8FAFC] uppercase tracking-wider">
              Dashboard Display Preferences
            </h2>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#0B0F17] dark:text-[#F8FAFC]">
                  Compact Table View
                </p>
                <p className="text-[11px] text-[#64748B]">
                  Reduce vertical row height for dense records review.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCompactView(!compactView)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  compactView ? 'bg-[#DC2626]' : 'bg-[#CBD5E1] dark:bg-[#334155]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    compactView ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
