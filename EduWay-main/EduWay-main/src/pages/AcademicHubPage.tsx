import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Cpu,
  PlusCircle,
  Newspaper,
  Globe,
  MessageSquare,
  ChevronRight,
  ExternalLink,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Trash2,
  AlertCircle,
  FileText,
  ArrowRight,
} from 'lucide-react';
import {
  AcademicSubmission,
  HubType,
  SubmissionKind,
  SubjectDefinition,
} from '../types/academic';
import {
  GENERAL_HUB_SUBJECTS,
  NEWS_CATEGORIES,
  WEBSITE_CATEGORIES,
  COMMUNITY_SUBJECTS,
} from '../data/academicCatalog';
import {
  deleteAcademicSubmission,
  subscribeApprovedAcademicContent,
  subscribeMyAcademicSubmissions,
} from '../services/academicService';
import { useAuth } from '../context/AuthContext';
import { GeneralHubIllustration, SpecializedHubIllustration } from '../components/illustration/HubIllustrations';
import { HubBrowserView } from '../components/academic/HubBrowserView';
import { CourseDetailView } from '../components/academic/CourseDetailView';
import { AddingForms } from '../components/academic/AddingForms';
import { formatTimestamp, isGoogleDriveUrl, isPdfResourceUrl } from '../utils/resourceValidation';

type AcademicViewState =
  | { type: 'main' }
  | { type: 'hub'; hub: HubType; subject: SubjectDefinition | null }
  | { type: 'course'; course: AcademicSubmission; returnHub: HubType; returnSubject: SubjectDefinition | null }
  | { type: 'add'; actionType: SubmissionKind; defaultHub?: HubType; defaultSubjectId?: string };

interface AcademicHubPageProps {
  onSignInRequested: () => void;
}

export const AcademicHubPage: React.FC<AcademicHubPageProps> = ({ onSignInRequested }) => {
  const { currentUser, isOwner } = useAuth();
  const [view, setView] = useState<AcademicViewState>({ type: 'main' });

  const [approvedItems, setApprovedItems] = useState<AcademicSubmission[]>([]);
  const [mySubmissions, setMySubmissions] = useState<AcademicSubmission[]>([]);
  const [loadingApproved, setLoadingApproved] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    status: 'approved' | 'pending';
    message: string;
  } | null>(null);

  // Filters for News, Websites, Community on main view
  const [newsSearch, setNewsSearch] = useState('');
  const [newsCategory, setNewsCategory] = useState('All');
  const [websiteSearch, setWebsiteSearch] = useState('');
  const [websiteCategory, setWebsiteCategory] = useState('All');
  const [communitySearch, setCommunitySearch] = useState('');
  const [communityCategory, setCommunityCategory] = useState('All');
  const [expandedNewsId, setExpandedNewsId] = useState<string | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setLoadingApproved(true);
    setLoadError(null);
    const unsub = subscribeApprovedAcademicContent(
      (items) => {
        setApprovedItems(items);
        setLoadingApproved(false);
      },
      (err) => {
        setLoadError(err.message || 'Unable to load Academic Hub resources.');
        setLoadingApproved(false);
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setMySubmissions([]);
      return;
    }
    const unsub = subscribeMyAcademicSubmissions(
      currentUser.uid,
      (items) => setMySubmissions(items),
      () => {
        // Non-critical if user has no submissions yet
      }
    );
    return () => unsub();
  }, [currentUser]);

  const approvedCourses = approvedItems.filter((i) => i.submissionKind === 'course');
  const approvedNews = approvedItems.filter((i) => i.submissionKind === 'news');
  const approvedWebsites = approvedItems.filter((i) => i.submissionKind === 'website');
  const approvedCommunity = approvedItems.filter((i) => i.submissionKind === 'community');

  const generalCourseCount = approvedCourses.filter((c) => c.hub === 'general').length;
  const specializedCourseCount = approvedCourses.filter((c) => c.hub === 'specialized').length;

  const handleOpenAdd = (
    actionType: SubmissionKind,
    defaultHub?: HubType,
    defaultSubjectId?: string
  ) => {
    setFeedbackBanner(null);
    setView({ type: 'add', actionType, defaultHub, defaultSubjectId });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeletePublished = async (id: string) => {
    if (!isOwner) return;
    await deleteAcademicSubmission(id);
  };

  // Route 1: Course Details Page
  if (view.type === 'course') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CourseDetailView
          course={view.course}
          onBack={() => {
            setView({
              type: 'hub',
              hub: view.returnHub,
              subject: view.returnSubject,
            });
          }}
          onDeleted={() => {
            setView({
              type: 'hub',
              hub: view.returnHub,
              subject: view.returnSubject,
            });
          }}
        />
      </div>
    );
  }

  // Route 2: General Hub or Specialized Hub (and Subject Page)
  if (view.type === 'hub') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <HubBrowserView
          hub={view.hub}
          selectedSubject={view.subject}
          approvedCourses={approvedCourses}
          loading={loadingApproved}
          onBackToMain={() => setView({ type: 'main' })}
          onSwitchHub={(nextHub) => setView({ type: 'hub', hub: nextHub, subject: null })}
          onSelectSubject={(subject) => setView({ type: 'hub', hub: view.hub, subject })}
          onSelectCourse={(course) =>
            setView({
              type: 'course',
              course,
              returnHub: view.hub,
              returnSubject: view.subject,
            })
          }
          onAddCourseClick={(targetHub, targetSubjectId) =>
            handleOpenAdd('course', targetHub, targetSubjectId)
          }
        />
      </div>
    );
  }

  // Route 3: Adding / Contribute Submission Form
  if (view.type === 'add') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AddingForms
          actionType={view.actionType}
          defaultHub={view.defaultHub}
          defaultSubjectId={view.defaultSubjectId}
          onCancel={() => setView({ type: 'main' })}
          onSignInRequested={onSignInRequested}
          onSuccess={(status, submittedTitle) => {
            setView({ type: 'main' });
            setFeedbackBanner({
              status,
              message:
                status === 'approved'
                  ? `"${submittedTitle}" has been published immediately to Academic Hub.`
                  : `"${submittedTitle}" has been submitted with status "pending" and sent to the Eduway Owner for review.`,
            });
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
    );
  }

  // Filtered public sections
  const filteredNews = approvedNews.filter((item) => {
    const matchesCat = newsCategory === 'All' || item.category === newsCategory;
    const q = newsSearch.trim().toLowerCase();
    const matchesQ =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q);
    return matchesCat && matchesQ;
  });

  const filteredWebsites = approvedWebsites.filter((item) => {
    const matchesCat = websiteCategory === 'All' || item.category === websiteCategory;
    const q = websiteSearch.trim().toLowerCase();
    const matchesQ =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q);
    return matchesCat && matchesQ;
  });

  const filteredCommunity = approvedCommunity.filter((item) => {
    const matchesCat = communityCategory === 'All' || item.category === communityCategory;
    const q = communitySearch.trim().toLowerCase();
    const matchesQ =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q);
    return matchesCat && matchesQ;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-14 animate-fadeIn">
      {/* Submission Feedback Banner */}
      {feedbackBanner && (
        <div
          role="status"
          className={`p-4 rounded-2xl border flex items-start justify-between gap-4 ${
            feedbackBanner.status === 'approved'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
              : 'bg-[#EEF4FE] dark:bg-[#101A2C] border-[#DCE8FD] dark:border-[#1E2D48] text-[#0B0F17] dark:text-[#F8FAFC]'
          }`}
        >
          <div className="flex items-start gap-3 text-xs sm:text-sm">
            {feedbackBanner.status === 'approved' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <Clock className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
            )}
            <span>{feedbackBanner.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="text-xs font-semibold text-[#64748B] hover:text-[#0B0F17] dark:hover:text-[#F8FAFC] shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Load Error */}
      {loadError && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-[#DC2626]/10 border border-[#DC2626]/25 text-xs sm:text-sm text-[#DC2626] flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{loadError}</span>
        </div>
      )}

      {/* Academic Hub Page Intro */}
      <section className="space-y-3 max-w-3xl">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#DC2626]">
          Eduway Learning Center
        </div>
        <h1
          className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0B0F17] dark:text-[#F8FAFC] leading-[1.15]"
          style={{ textWrap: 'balance' }}
        >
          Academic Hub
        </h1>
        <p className="text-sm sm:text-base text-[#475569] dark:text-[#94A3B8] leading-relaxed">
          Explore structured curriculum across our two separated learning centers—General Hub and Specialized Hub—or contribute courses, academic news, websites, and community questions.
        </p>
      </section>

      {/* SECTION 1: TWO PRIMARY HUBS (GENERAL HUB & SPECIALIZED HUB) */}
      <section aria-labelledby="primary-hubs-heading" className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="primary-hubs-heading" className="text-xl sm:text-2xl font-bold text-[#0B0F17] dark:text-[#F8FAFC]">
              Curriculum Hubs
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8]">
              Foundational general education and specialized technology tracks are strictly separated.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* A. GENERAL HUB */}
          <div className="group flex flex-col justify-between bg-white dark:bg-[#131B28] border border-[#DCE8FD] dark:border-[#1E2D48] hover:border-[#0B0F17] dark:hover:border-[#DCE8FD] rounded-2xl p-6 sm:p-8 shadow-sm transition-all">
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#475569] dark:text-[#DCE8FD]">
                    <BookOpen className="w-3.5 h-3.5 text-[#DC2626]" aria-hidden="true" />
                    <span>Foundation Track</span>
                  </span>
                  <h3 className="text-2xl font-bold text-[#0B0F17] dark:text-[#F8FAFC]">
                    General Hub
                  </h3>
                </div>
                <span className="text-xs font-mono text-[#64748B] tabular-nums shrink-0">
                  {GENERAL_HUB_SUBJECTS.length} Subjects · {generalCourseCount} Courses
                </span>
              </div>

              <GeneralHubIllustration className="max-h-44" />

              <p className="text-sm text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                Dedicated to core academic subjects including Arabic, Math, English, Physics, Mechanics, Social Studies, Religious Education, and National Education.
              </p>

              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Subjects: {GENERAL_HUB_SUBJECTS.slice(0, 4).map((s) => s.name).join(' · ')} &amp; more
              </p>
            </div>

            <div className="pt-6 mt-6 border-t border-[#E2E8F0] dark:border-[#1F293D] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setView({ type: 'hub', hub: 'general', subject: null })}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-[#0B0F17] dark:text-[#0B0F17] bg-[#DCE8FD] hover:bg-[#C7DAFC] rounded-lg transition-colors"
              >
                <span>Open General Hub</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => handleOpenAdd('course', 'general')}
                className="text-xs font-semibold text-[#475569] dark:text-[#94A3B8] hover:text-[#DC2626] transition-colors"
              >
                + Add General Course
              </button>
            </div>
          </div>

          {/* B. SPECIALIZED HUB */}
          <div className="group flex flex-col justify-between bg-[#0B0F17] dark:bg-[#0E1420] text-[#F8FAFC] border border-[#1F293D] hover:border-[#DC2626] rounded-2xl p-6 sm:p-8 shadow-sm transition-all">
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#DC2626]">
                    <Cpu className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Computer Science Specialization</span>
                  </span>
                  <h3 className="text-2xl font-bold text-[#F8FAFC]">
                    Specialized Hub
                  </h3>
                </div>
                <span className="text-xs font-mono text-[#94A3B8] tabular-nums shrink-0">
                  Computer Science · {specializedCourseCount} {specializedCourseCount === 1 ? 'Course' : 'Courses'}
                </span>
              </div>

              <SpecializedHubIllustration className="max-h-44" />

              <p className="text-sm text-[#94A3B8] leading-relaxed">
                Dedicated to our unified Computer Science curriculum with approved courses, technical guides, and study resources.
              </p>

              <p className="text-xs text-[#94A3B8]">
                Specialization: Computer Science · Direct course directory
              </p>
            </div>

            <div className="pt-6 mt-6 border-t border-[#1F293D] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setView({ type: 'hub', hub: 'specialized', subject: null })}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-lg transition-colors shadow-sm"
              >
                <span>Open Specialized Hub</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => handleOpenAdd('course', 'specialized')}
                className="text-xs font-semibold text-[#94A3B8] hover:text-white transition-colors"
              >
                + Add Specialized Course
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: ADDING / CONTRIBUTE (VISUALLY SEPARATE SECTION WITH 4 ACTIONS) */}
      <section
        aria-labelledby="adding-section-heading"
        className="p-6 sm:p-8 rounded-2xl bg-[#F1F5F9] dark:bg-[#101622] border border-[#E2E8F0] dark:border-[#1F293D] space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#DC2626]">
              <PlusCircle className="w-4 h-4" aria-hidden="true" />
              <span>Adding &amp; Contribute</span>
            </div>
            <h2 id="adding-section-heading" className="text-xl sm:text-2xl font-bold text-[#0B0F17] dark:text-[#F8FAFC]">
              Submit Educational Content
            </h2>
            <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94A3B8]">
              {isOwner
                ? 'Signed in as Owner: your submissions are published directly.'
                : 'Member submissions enter Owner review with status "pending" before public publication.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              kind: 'course' as SubmissionKind,
              title: 'Add Course',
              desc: 'Submit a General or Specialized course with link or resource guide.',
              icon: BookOpen,
            },
            {
              kind: 'news' as SubmissionKind,
              title: 'Add News',
              desc: 'Share curriculum updates, competitions, or technology news.',
              icon: Newspaper,
            },
            {
              kind: 'website' as SubmissionKind,
              title: 'Add Website',
              desc: 'Recommend an educational simulator, docs portal, or tool.',
              icon: Globe,
            },
            {
              kind: 'community' as SubmissionKind,
              title: 'Ask Community',
              desc: 'Post an academic or technical question to the community.',
              icon: MessageSquare,
            },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.kind}
                type="button"
                onClick={() => handleOpenAdd(action.kind)}
                className="group text-left p-5 rounded-xl bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] hover:border-[#DC2626] transition-all flex flex-col justify-between gap-4 shadow-sm"
              >
                <div className="space-y-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#DC2626]/10 text-[#DC2626] flex items-center justify-center">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <h3 className="text-sm font-bold text-[#0B0F17] dark:text-[#F8FAFC] group-hover:text-[#DC2626] transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                    {action.desc}
                  </p>
                </div>

                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#DC2626]">
                  <span>Open Form</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Signed-in Member's Own Submission Status Tracker */}
      {currentUser && mySubmissions.length > 0 && (
        <section aria-labelledby="my-submissions-heading" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 id="my-submissions-heading" className="text-lg font-bold text-[#0B0F17] dark:text-[#F8FAFC]">
              Your Submitted Items ({mySubmissions.length})
            </h2>
            <span className="text-xs text-[#64748B]">Visible only to your account and the Owner</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mySubmissions.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] space-y-2"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="uppercase font-semibold text-[#64748B]">
                    {item.submissionKind}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 font-semibold capitalize ${
                      item.status === 'approved'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : item.status === 'rejected'
                        ? 'text-[#DC2626]'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {item.status === 'approved' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : item.status === 'rejected' ? (
                      <XCircle className="w-3.5 h-3.5" />
                    ) : (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                    <span>{item.status}</span>
                  </span>
                </div>
                <p className="text-sm font-bold text-[#0B0F17] dark:text-[#F8FAFC] truncate">
                  {item.title}
                </p>
                {item.decisionNote && (
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                    Review note: {item.decisionNote}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 3: ACADEMIC NEWS (APPROVED ONLY) */}
      <section aria-labelledby="news-section-heading" className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 id="news-section-heading" className="text-xl sm:text-2xl font-bold text-[#0B0F17] dark:text-[#F8FAFC]">
              Academic News
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8]">
              Verified announcements, research highlights, and cohort events.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search news..."
                value={newsSearch}
                onChange={(e) => setNewsSearch(e.target.value)}
                className="w-full sm:w-48 pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] focus:outline-none focus:border-[#DC2626]"
              />
            </div>

            <select
              aria-label="Filter news by category"
              value={newsCategory}
              onChange={(e) => setNewsCategory(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] text-[#0B0F17] dark:text-[#F8FAFC] focus:outline-none focus:border-[#DC2626]"
            >
              <option value="All">All Categories</option>
              {NEWS_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loadingApproved ? (
          <div className="p-8 text-center text-xs text-[#64748B]">Loading academic news...</div>
        ) : filteredNews.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] text-center space-y-2">
            <Newspaper className="w-7 h-7 text-[#64748B] mx-auto" aria-hidden="true" />
            <p className="text-sm font-semibold text-[#0B0F17] dark:text-[#F8FAFC]">
              No Approved News Articles Yet
            </p>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              Use &ldquo;Add News&rdquo; in the Adding section above to submit an announcement for publication.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredNews.map((news) => {
              const isExpanded = expandedNewsId === news.id;
              const isPdf = isPdfResourceUrl(news.fileUrl, news.fileType);
              return (
                <article
                  key={news.id}
                  className="flex flex-col justify-between bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] rounded-2xl overflow-hidden shadow-sm"
                >
                  {news.coverImageUrl && !brokenImages[news.id] && (
                    <img
                      src={news.coverImageUrl}
                      alt={news.title}
                      referrerPolicy="no-referrer"
                      onError={() => setBrokenImages((p) => ({ ...p, [news.id]: true }))}
                      className="w-full h-40 object-cover border-b border-[#E2E8F0] dark:border-[#1F293D]"
                    />
                  )}

                  <div className="p-5 space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B] dark:text-[#94A3B8]">
                      <span className="font-semibold text-[#DC2626]">{news.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{news.submitterName}</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatTimestamp(news.createdAt)}</span>
                    </div>

                    <h3 className="text-base font-bold text-[#0B0F17] dark:text-[#F8FAFC]">
                      {news.title}
                    </h3>

                    <p className="text-xs text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                      {news.description}
                    </p>

                    {news.content && isExpanded && (
                      <div className="pt-2 border-t border-[#E2E8F0] dark:border-[#1F293D] text-xs text-[#334155] dark:text-[#CBD5E1] leading-relaxed whitespace-pre-line">
                        {news.content}
                      </div>
                    )}
                  </div>

                  <div className="px-5 py-3.5 bg-[#F8FAFC] dark:bg-[#0B1019] border-t border-[#E2E8F0] dark:border-[#1F293D] flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-3">
                      {news.content && (
                        <button
                          type="button"
                          onClick={() => setExpandedNewsId(isExpanded ? null : news.id)}
                          className="font-semibold text-[#0B0F17] dark:text-[#F8FAFC] hover:text-[#DC2626]"
                        >
                          {isExpanded ? 'Show Less' : 'Read Summary'}
                        </button>
                      )}
                      {news.sourceUrl && (
                        <a
                          href={news.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-[#64748B] hover:text-[#DC2626]"
                        >
                          <span>Source</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {news.fileUrl && (
                        <a
                          href={news.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={
                            isGoogleDriveUrl(news.fileUrl)
                              ? 'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-lg transition-colors'
                              : 'inline-flex items-center gap-1 font-semibold text-[#DC2626] hover:underline'
                          }
                        >
                          <span>
                            {isGoogleDriveUrl(news.fileUrl)
                              ? 'View File'
                              : isPdf
                              ? 'Open PDF'
                              : 'Open Link'}
                          </span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => handleDeletePublished(news.id)}
                        aria-label={`Remove ${news.title}`}
                        className="text-[#64748B] hover:text-[#DC2626]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 4: USEFUL WEBSITES (APPROVED ONLY) */}
      <section aria-labelledby="websites-section-heading" className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 id="websites-section-heading" className="text-xl sm:text-2xl font-bold text-[#0B0F17] dark:text-[#F8FAFC]">
              Useful Educational Websites
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8]">
              Curated external documentation, simulators, and open courseware links.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search websites..."
                value={websiteSearch}
                onChange={(e) => setWebsiteSearch(e.target.value)}
                className="w-full sm:w-48 pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] focus:outline-none focus:border-[#DC2626]"
              />
            </div>

            <select
              aria-label="Filter websites by category"
              value={websiteCategory}
              onChange={(e) => setWebsiteCategory(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] text-[#0B0F17] dark:text-[#F8FAFC] focus:outline-none focus:border-[#DC2626]"
            >
              <option value="All">All Categories</option>
              {WEBSITE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loadingApproved ? (
          <div className="p-8 text-center text-xs text-[#64748B]">Loading useful websites...</div>
        ) : filteredWebsites.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] text-center space-y-2">
            <Globe className="w-7 h-7 text-[#64748B] mx-auto" aria-hidden="true" />
            <p className="text-sm font-semibold text-[#0B0F17] dark:text-[#F8FAFC]">
              No Approved Websites Yet
            </p>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              Use &ldquo;Add Website&rdquo; above to share an educational link with the academy.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredWebsites.map((site) => (
              <article
                key={site.id}
                className="flex flex-col justify-between bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] rounded-2xl overflow-hidden shadow-sm"
              >
                {site.coverImageUrl && !brokenImages[site.id] && (
                  <img
                    src={site.coverImageUrl}
                    alt={site.title}
                    referrerPolicy="no-referrer"
                    onError={() => setBrokenImages((p) => ({ ...p, [site.id]: true }))}
                    className="w-full h-36 object-cover border-b border-[#E2E8F0] dark:border-[#1F293D]"
                  />
                )}

                <div className="p-5 space-y-2.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B] dark:text-[#94A3B8]">
                    <span className="font-semibold text-[#DC2626]">{site.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>Added by {site.submitterName}</span>
                  </div>

                  <h3 className="text-base font-bold text-[#0B0F17] dark:text-[#F8FAFC]">
                    {site.title}
                  </h3>

                  <p className="text-xs text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                    {site.description}
                  </p>
                </div>

                <div className="px-5 py-3.5 bg-[#F8FAFC] dark:bg-[#0B1019] border-t border-[#E2E8F0] dark:border-[#1F293D] flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3">
                    {site.websiteUrl && (
                      <a
                        href={site.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-semibold text-[#DC2626] hover:underline"
                      >
                        <span>Open Link</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {site.fileUrl && site.fileUrl !== site.websiteUrl && (
                      <a
                        href={site.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={
                          isGoogleDriveUrl(site.fileUrl)
                            ? 'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-lg transition-colors'
                            : 'inline-flex items-center gap-1 font-semibold text-[#475569] dark:text-[#94A3B8] hover:text-[#DC2626]'
                        }
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{isGoogleDriveUrl(site.fileUrl) ? 'View File' : 'Resource'}</span>
                      </a>
                    )}
                  </div>

                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => handleDeletePublished(site.id)}
                      aria-label={`Remove ${site.title}`}
                      className="text-[#64748B] hover:text-[#DC2626]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 5: COMMUNITY Q&A (APPROVED ONLY) */}
      <section aria-labelledby="community-section-heading" className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 id="community-section-heading" className="text-xl sm:text-2xl font-bold text-[#0B0F17] dark:text-[#F8FAFC]">
              Community Questions
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8]">
              Approved peer questions across general and specialized disciplines.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search questions..."
                value={communitySearch}
                onChange={(e) => setCommunitySearch(e.target.value)}
                className="w-full sm:w-48 pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] focus:outline-none focus:border-[#DC2626]"
              />
            </div>

            <select
              aria-label="Filter community questions by subject"
              value={communityCategory}
              onChange={(e) => setCommunityCategory(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] text-[#0B0F17] dark:text-[#F8FAFC] focus:outline-none focus:border-[#DC2626]"
            >
              <option value="All">All Subjects</option>
              {COMMUNITY_SUBJECTS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loadingApproved ? (
          <div className="p-8 text-center text-xs text-[#64748B]">Loading community questions...</div>
        ) : filteredCommunity.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] text-center space-y-2">
            <MessageSquare className="w-7 h-7 text-[#64748B] mx-auto" aria-hidden="true" />
            <p className="text-sm font-semibold text-[#0B0F17] dark:text-[#F8FAFC]">
              No Approved Community Questions Yet
            </p>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              Use &ldquo;Ask Community&rdquo; above to post a question for peers and instructors.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredCommunity.map((question) => (
              <article
                key={question.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#64748B] dark:text-[#94A3B8]">
                    <span className="font-semibold text-[#DC2626]">{question.category}</span>
                    <span>
                      Asked by {question.submitterName} · {formatTimestamp(question.createdAt)}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#0B0F17] dark:text-[#F8FAFC]">
                    {question.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94A3B8] leading-relaxed whitespace-pre-line">
                    {question.description}
                  </p>
                </div>

                {(question.fileUrl || isOwner) && (
                  <div className="pt-3 border-t border-[#E2E8F0] dark:border-[#1F293D] flex items-center justify-between gap-3 text-xs">
                    {question.fileUrl ? (
                      <a
                        href={question.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={
                          isGoogleDriveUrl(question.fileUrl)
                            ? 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-lg transition-colors'
                            : 'inline-flex items-center gap-1.5 font-semibold text-[#DC2626] hover:underline'
                        }
                      >
                        <span>{isGoogleDriveUrl(question.fileUrl) ? 'View File' : 'Open Link'}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <span />
                    )}

                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => handleDeletePublished(question.id)}
                        aria-label={`Remove ${question.title}`}
                        className="text-[#64748B] hover:text-[#DC2626]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
