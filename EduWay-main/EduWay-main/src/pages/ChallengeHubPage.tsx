import React, { useEffect, useState } from 'react';
import {
  Target,
  Award,
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  ExternalLink,
  FolderOpen,
  Trash2,
  AlertCircle,
  Trophy,
  Eye,
  X,
  Check,
  LogIn,
  Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import {
  ResourceAttachmentField,
  ResourceAttachmentValue,
} from '../components/academic/ResourceAttachmentField';
import {
  isGoogleDriveUrl,
  validateGoogleDriveUrl,
  validateHttpUrl,
} from '../utils/resourceValidation';
import {
  ChallengeAnswer,
  ChallengeAttachmentFormat,
  ChallengeItem,
  ChallengeNotification,
  ChallengeWinner,
} from '../types/challenge';
import {
  deleteChallenge,
  formatChallengeDateTime,
  markChallengeNotificationRead,
  publishChallenge,
  reviewChallengeAnswerCorrect,
  reviewChallengeAnswerIncorrect,
  submitChallengeAnswer,
  subscribeAllChallengeAnswers,
  subscribeChallengeWinners,
  subscribePublishedChallenges,
  subscribeStudentChallengeAnswers,
  subscribeStudentChallengeNotifications,
} from '../services/challengeService';

interface ChallengeHubPageProps {
  onSignInRequested: () => void;
}

const INITIAL_ATTACHMENT: ResourceAttachmentValue = {
  resourceFormat: 'none',
  attachmentMode: 'none',
  fileUrl: '',
  fileType: 'link',
};

export const ChallengeHubPage: React.FC<ChallengeHubPageProps> = ({
  onSignInRequested,
}) => {
  const { currentUser, userProfile, isOwner } = useAuth();

  // Shared live Firestore collections
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [winners, setWinners] = useState<ChallengeWinner[]>([]);
  const [loadingChallenges, setLoadingChallenges] = useState(true);
  const [loadingWinners, setLoadingWinners] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Owner-only state
  const [challengeName, setChallengeName] = useState('');
  const [subject, setSubject] = useState('');
  const [question, setQuestion] = useState('');
  const [attachment, setAttachment] = useState<ResourceAttachmentValue>(INITIAL_ATTACHMENT);
  const [pointsInput, setPointsInput] = useState('50');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [publishing, setPublishing] = useState(false);
  const [ownerBanner, setOwnerBanner] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);

  const [allAnswers, setAllAnswers] = useState<ChallengeAnswer[]>([]);
  const [loadingAnswers, setLoadingAnswers] = useState(true);
  const [answerFilter, setAnswerFilter] = useState<'all' | 'pending' | 'correct' | 'incorrect'>('all');
  const [processingAnswerId, setProcessingAnswerId] = useState<string | null>(null);
  const [deletingChallengeId, setDeletingChallengeId] = useState<string | null>(null);
  const [inspectedAnswer, setInspectedAnswer] = useState<ChallengeAnswer | null>(null);

  // Student-only state
  const [myAnswers, setMyAnswers] = useState<ChallengeAnswer[]>([]);
  const [myNotifications, setMyNotifications] = useState<ChallengeNotification[]>([]);
  const [activeChallengeId, setActiveChallengeId] = useState<string | null>(null);
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [submittingAnswerId, setSubmittingAnswerId] = useState<string | null>(null);
  const [studentBanner, setStudentBanner] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);
  const [markingReadId, setMarkingReadId] = useState<string | null>(null);

  // Subscribe to published challenges & winners (all viewers)
  useEffect(() => {
    setLoadingChallenges(true);
    setLoadingWinners(true);
    setLoadError(null);

    const unsubChallenges = subscribePublishedChallenges(
      (items) => {
        setChallenges(items);
        setLoadingChallenges(false);
      },
      (err) => {
        setLoadError(err.message || 'Unable to load challenges.');
        setLoadingChallenges(false);
      }
    );

    const unsubWinners = subscribeChallengeWinners(
      (items) => {
        setWinners(items);
        setLoadingWinners(false);
      },
      () => {
        setLoadingWinners(false);
      }
    );

    return () => {
      unsubChallenges();
      unsubWinners();
    };
  }, []);

  // Role-scoped subscriptions
  useEffect(() => {
    if (isOwner && currentUser) {
      setLoadingAnswers(true);
      const unsubAll = subscribeAllChallengeAnswers(
        (items) => {
          setAllAnswers(items);
          setLoadingAnswers(false);
        },
        () => {
          setLoadingAnswers(false);
        }
      );
      return () => unsubAll();
    }

    if (!isOwner && currentUser) {
      const unsubMyAnswers = subscribeStudentChallengeAnswers(
        currentUser.uid,
        (items) => setMyAnswers(items),
        () => {}
      );
      const unsubMyNotifs = subscribeStudentChallengeNotifications(
        currentUser.uid,
        (items) => setMyNotifications(items),
        () => {}
      );
      return () => {
        unsubMyAnswers();
        unsubMyNotifs();
      };
    }

    setAllAnswers([]);
    setMyAnswers([]);
    setMyNotifications([]);
    setLoadingAnswers(false);
  }, [currentUser, isOwner]);

  const studentDisplayName =
    userProfile?.fullName ||
    userProfile?.nickname ||
    currentUser?.displayName ||
    currentUser?.email?.split('@')[0] ||
    'Eduway Student';

  // --- OWNER: Add Challenge Handler ---
  const validateOwnerChallengeForm = (): {
    valid: boolean;
    normalizedAttachmentUrl?: string;
    attachmentFormat: ChallengeAttachmentFormat;
    parsedPoints: number;
  } => {
    const errors: Record<string, string> = {};
    const trimmedTitle = challengeName.trim();
    const trimmedSubject = subject.trim();
    const trimmedQuestion = question.trim();
    const parsedPoints = Number(pointsInput);

    if (!trimmedTitle) {
      errors.challengeName = 'Challenge Name is required.';
    } else if (trimmedTitle.length < 2 || trimmedTitle.length > 150) {
      errors.challengeName = 'Challenge Name must be between 2 and 150 characters.';
    }

    if (!trimmedSubject) {
      errors.subject = 'Subject is required.';
    } else if (trimmedSubject.length > 80) {
      errors.subject = 'Subject must be 80 characters or fewer.';
    }

    if (!trimmedQuestion) {
      errors.question = 'Challenge Question is required.';
    } else if (trimmedQuestion.length < 5 || trimmedQuestion.length > 5000) {
      errors.question = 'Challenge Question must be between 5 and 5000 characters.';
    }

    if (
      !pointsInput.trim() ||
      Number.isNaN(parsedPoints) ||
      !Number.isInteger(parsedPoints) ||
      parsedPoints < 1 ||
      parsedPoints > 10000
    ) {
      errors.points = 'Enter a whole number of points between 1 and 10,000.';
    }

    let attachmentFormat: ChallengeAttachmentFormat = 'none';
    let normalizedAttachmentUrl: string | undefined;

    if (attachment.resourceFormat !== 'none') {
      if (attachment.attachmentMode === 'gdrive') {
        const gdriveRes = validateGoogleDriveUrl(attachment.fileUrl);
        if (!gdriveRes.valid) {
          errors.attachment = gdriveRes.error || 'Enter a valid Google Drive sharing link.';
        } else {
          attachmentFormat = 'gdrive';
          normalizedAttachmentUrl = gdriveRes.normalizedUrl;
        }
      } else {
        const linkRes = validateHttpUrl(attachment.fileUrl);
        if (!linkRes.valid) {
          errors.attachment = linkRes.error || 'Enter a valid HTTP/HTTPS link.';
        } else {
          attachmentFormat = 'link';
          normalizedAttachmentUrl = linkRes.normalizedUrl;
        }
      }
    }

    setFormErrors(errors);
    return {
      valid: Object.keys(errors).length === 0,
      normalizedAttachmentUrl,
      attachmentFormat,
      parsedPoints,
    };
  };

  const handlePublishChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !isOwner) return;
    setOwnerBanner(null);

    const check = validateOwnerChallengeForm();
    if (!check.valid) return;

    setPublishing(true);
    try {
      await publishChallenge({
        title: challengeName,
        subject,
        question,
        attachmentFormat: check.attachmentFormat,
        attachmentUrl: check.normalizedAttachmentUrl,
        points: check.parsedPoints,
        ownerId: currentUser.uid,
      });

      setChallengeName('');
      setSubject('');
      setQuestion('');
      setAttachment(INITIAL_ATTACHMENT);
      setPointsInput('50');
      setFormErrors({});
      setOwnerBanner({
        tone: 'success',
        message: 'Challenge published! It is now visible to students on Challenge Hub.',
      });
    } catch (err) {
      setOwnerBanner({
        tone: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Failed to publish challenge. Please verify your Owner session and try again.',
      });
    } finally {
      setPublishing(false);
    }
  };

  const handleDeleteChallenge = async (challengeId: string) => {
    if (!isOwner || deletingChallengeId) return;
    setDeletingChallengeId(challengeId);
    setOwnerBanner(null);
    try {
      await deleteChallenge(challengeId);
      setOwnerBanner({
        tone: 'success',
        message: 'Challenge removed from Challenge Hub.',
      });
    } catch (err) {
      setOwnerBanner({
        tone: 'error',
        message: err instanceof Error ? err.message : 'Unable to remove challenge.',
      });
    } finally {
      setDeletingChallengeId(null);
    }
  };

  // --- OWNER: Review Actions ---
  const handleMarkCorrect = async (answer: ChallengeAnswer) => {
    if (!isOwner || processingAnswerId || answer.status !== 'pending') return;
    setProcessingAnswerId(answer.id);
    setOwnerBanner(null);
    try {
      const awarded = await reviewChallengeAnswerCorrect(answer.id);
      if (inspectedAnswer?.id === answer.id) {
        setInspectedAnswer(null);
      }
      setOwnerBanner({
        tone: 'success',
        message: `Marked "${answer.studentName}"'s answer Correct. +${awarded} points added to their Profile, winner recorded, and notification sent.`,
      });
    } catch (err) {
      setOwnerBanner({
        tone: 'error',
        message: err instanceof Error ? err.message : 'Failed to mark submission correct.',
      });
    } finally {
      setProcessingAnswerId(null);
    }
  };

  const handleMarkIncorrect = async (answer: ChallengeAnswer) => {
    if (!isOwner || processingAnswerId || answer.status !== 'pending') return;
    setProcessingAnswerId(answer.id);
    setOwnerBanner(null);
    try {
      await reviewChallengeAnswerIncorrect(answer.id);
      if (inspectedAnswer?.id === answer.id) {
        setInspectedAnswer(null);
      }
      setOwnerBanner({
        tone: 'success',
        message: `Marked "${answer.studentName}"'s answer Incorrect. 0 points awarded and notification sent.`,
      });
    } catch (err) {
      setOwnerBanner({
        tone: 'error',
        message: err instanceof Error ? err.message : 'Failed to mark submission incorrect.',
      });
    } finally {
      setProcessingAnswerId(null);
    }
  };

  // --- STUDENT: Submit Answer ---
  const handleStudentSubmitAnswer = async (challenge: ChallengeItem) => {
    if (!currentUser) {
      onSignInRequested();
      return;
    }
    if (isOwner) return;

    const text = (answerDrafts[challenge.id] || '').trim();
    if (!text) {
      setStudentBanner({
        tone: 'error',
        message: 'Please write your answer before submitting.',
      });
      return;
    }
    if (text.length > 5000) {
      setStudentBanner({
        tone: 'error',
        message: 'Your answer must be 5,000 characters or fewer.',
      });
      return;
    }

    setSubmittingAnswerId(challenge.id);
    setStudentBanner(null);
    try {
      await submitChallengeAnswer({
        challenge,
        studentId: currentUser.uid,
        studentName: studentDisplayName,
        answerText: text,
      });
      setAnswerDrafts((prev) => ({ ...prev, [challenge.id]: '' }));
      setActiveChallengeId(null);
      setStudentBanner({
        tone: 'success',
        message: `Answer submitted for "${challenge.title}"! Status is Pending until reviewed by the Owner.`,
      });
    } catch (err) {
      setStudentBanner({
        tone: 'error',
        message: err instanceof Error ? err.message : 'Unable to submit your answer.',
      });
    } finally {
      setSubmittingAnswerId(null);
    }
  };

  const handleMarkNotificationRead = async (notifId: string) => {
    if (markingReadId) return;
    setMarkingReadId(notifId);
    try {
      await markChallengeNotificationRead(notifId);
    } finally {
      setMarkingReadId(null);
    }
  };

  // Derived counters
  const pendingAnswersCount = allAnswers.filter((a) => a.status === 'pending').length;
  const filteredOwnerAnswers =
    answerFilter === 'all'
      ? allAnswers
      : allAnswers.filter((a) => a.status === answerFilter);

  const unreadStudentNotifsCount = myNotifications.filter((n) => !n.isRead).length;
  const profilePoints = userProfile?.points ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Page Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E2E8F0] dark:border-[#1F293D] pb-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#DC2626]">
            {isOwner ? (
              <>
                <Shield className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Owner Challenge Management</span>
              </>
            ) : (
              <>
                <Target className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Eduway Challenge Hub</span>
              </>
            )}
            <span aria-hidden="true" className="text-[#CBD5E1] dark:text-[#334155]">·</span>
            <span className="text-[#64748B] dark:text-[#94A3B8]">
              {isOwner ? 'Publish & Review' : 'Compete & Earn Points'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0B0F17] dark:text-[#F8FAFC]">
            Challenge Hub
          </h1>
          <p className="text-sm text-[#475569] dark:text-[#94A3B8] leading-relaxed">
            {isOwner
              ? 'Publish challenges, inspect student answer notifications, award points manually, and track verified Challenge Winners.'
              : 'Solve published challenges, submit your answers for Owner review, earn Profile points, and view Challenge Winners.'}
          </p>
        </div>

        {/* Role-specific summary metrics (Zero-pill clean card strip) */}
        {isOwner ? (
          <div className="flex flex-wrap items-center gap-4 text-xs bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] rounded-xl px-4 py-3 shadow-sm">
            <div>
              <span className="text-[#64748B] dark:text-[#94A3B8] block">Published</span>
              <span className="text-base font-bold text-[#0B0F17] dark:text-[#F8FAFC]">
                {challenges.length}
              </span>
            </div>
            <span aria-hidden="true" className="h-7 w-px bg-[#E2E8F0] dark:bg-[#1F293D]" />
            <div>
              <span className="text-[#64748B] dark:text-[#94A3B8] block">Pending Review</span>
              <span className="text-base font-bold text-[#DC2626]">{pendingAnswersCount}</span>
            </div>
            <span aria-hidden="true" className="h-7 w-px bg-[#E2E8F0] dark:bg-[#1F293D]" />
            <div>
              <span className="text-[#64748B] dark:text-[#94A3B8] block">Winners</span>
              <span className="text-base font-bold text-[#0B0F17] dark:text-[#F8FAFC]">
                {winners.length}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4 text-xs bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] rounded-xl px-4 py-3 shadow-sm">
            <div>
              <span className="text-[#64748B] dark:text-[#94A3B8] block">Profile Points</span>
              <span className="text-base font-bold text-[#DC2626]">
                {currentUser ? `${profilePoints} pts` : 'Sign in'}
              </span>
            </div>
            <span aria-hidden="true" className="h-7 w-px bg-[#E2E8F0] dark:bg-[#1F293D]" />
            <div>
              <span className="text-[#64748B] dark:text-[#94A3B8] block">Notifications</span>
              <span className="text-base font-bold text-[#0B0F17] dark:text-[#F8FAFC]">
                {currentUser ? unreadStudentNotifsCount : 0} unread
              </span>
            </div>
            {!currentUser && (
              <>
                <span aria-hidden="true" className="h-7 w-px bg-[#E2E8F0] dark:bg-[#1F293D]" />
                <button
                  type="button"
                  onClick={onSignInRequested}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white font-semibold transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Sign In</span>
                </button>
              </>
            )}
          </div>
        )}
      </section>

      {loadError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-4 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/25 text-xs text-[#DC2626] dark:text-[#F87171]"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{loadError}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* OWNER INTERFACE (Visible ONLY to authenticated Owner)                  */}
      {/* ===================================================================== */}
      {isOwner ? (
        <div className="space-y-8">
          {ownerBanner && (
            <div
              role="status"
              className={`flex items-start justify-between gap-3 p-4 rounded-xl border text-xs font-medium ${
                ownerBanner.tone === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-400'
                  : 'bg-[#DC2626]/10 border-[#DC2626]/25 text-[#DC2626] dark:text-[#F87171]'
              }`}
            >
              <div className="flex items-start gap-2">
                {ownerBanner.tone === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                )}
                <span>{ownerBanner.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setOwnerBanner(null)}
                aria-label="Dismiss status message"
                className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* SECTION A: Add Challenge (ONLY the 5 specified fields) */}
          <section
            aria-labelledby="owner-add-challenge-heading"
            className="bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#DC2626]" aria-hidden="true" />

            <div className="mb-6 space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#DC2626]">
                Section A · Add Challenge
              </div>
              <h2
                id="owner-add-challenge-heading"
                className="text-lg sm:text-xl font-bold text-[#0B0F17] dark:text-[#F8FAFC]"
              >
                Create &amp; Publish Challenge
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                All published challenges become immediately available to students on Challenge Hub.
              </p>
            </div>

            <form onSubmit={handlePublishChallenge} noValidate className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. Challenge Name */}
                <Input
                  id="challenge-name-input"
                  label="Challenge Name"
                  required
                  placeholder="e.g. Binary Search Complexity Proof"
                  value={challengeName}
                  onChange={(e) => {
                    setChallengeName(e.target.value);
                    if (formErrors.challengeName) {
                      setFormErrors((prev) => ({ ...prev, challengeName: '' }));
                    }
                  }}
                  error={formErrors.challengeName}
                />

                {/* 2. Subject (Manual text field only — NO dropdown) */}
                <Input
                  id="challenge-subject-input"
                  label="Subject"
                  required
                  placeholder="e.g. Computer Science, Calculus, Physics..."
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    if (formErrors.subject) {
                      setFormErrors((prev) => ({ ...prev, subject: '' }));
                    }
                  }}
                  error={formErrors.subject}
                />
              </div>

              {/* 3. Challenge Question */}
              <div className="space-y-1.5">
                <label
                  htmlFor="challenge-question-input"
                  className="block text-xs font-semibold tracking-wide uppercase text-[#475569] dark:text-[#94A3B8]"
                >
                  Challenge Question <span className="text-[#DC2626]">*</span>
                </label>
                <textarea
                  id="challenge-question-input"
                  rows={4}
                  required
                  placeholder="Write the full challenge prompt, instructions, and expected deliverable..."
                  value={question}
                  onChange={(e) => {
                    setQuestion(e.target.value);
                    if (formErrors.question) {
                      setFormErrors((prev) => ({ ...prev, question: '' }));
                    }
                  }}
                  aria-invalid={Boolean(formErrors.question)}
                  className={`w-full bg-white dark:bg-[#0B1019] text-[#0B0F17] dark:text-[#F8FAFC] placeholder-[#94A3B8] dark:placeholder-[#475569] text-sm rounded-lg border p-3.5 transition-all outline-none ${
                    formErrors.question
                      ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20'
                      : 'border-[#E2E8F0] dark:border-[#1F293D] hover:border-[#CBD5E1] dark:hover:border-[#2D3D58] focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20'
                  }`}
                />
                {formErrors.question && (
                  <p role="alert" className="text-xs text-[#DC2626] font-medium flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{formErrors.question}</span>
                  </p>
                )}
              </div>

              {/* 4. Optional Attachment (Resource Link / Google Drive File Link / None) */}
              <ResourceAttachmentField
                label="Optional Attachment"
                required={false}
                value={attachment}
                onChange={(next) => {
                  setAttachment(next);
                  if (formErrors.attachment) {
                    setFormErrors((prev) => ({ ...prev, attachment: '' }));
                  }
                }}
                error={formErrors.attachment}
              />

              {/* 5. Points */}
              <div className="max-w-xs">
                <Input
                  id="challenge-points-input"
                  label="Points"
                  type="number"
                  min={1}
                  max={10000}
                  step={1}
                  required
                  placeholder="50"
                  hint="Whole number (1 – 10,000)"
                  value={pointsInput}
                  onChange={(e) => {
                    setPointsInput(e.target.value);
                    if (formErrors.points) {
                      setFormErrors((prev) => ({ ...prev, points: '' }));
                    }
                  }}
                  error={formErrors.points}
                />
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={publishing}
                  className="sm:w-auto px-6"
                >
                  {publishing ? 'Publishing Challenge...' : 'Publish Challenge'}
                </Button>
              </div>
            </form>

            {/* Compact Published Challenges Management List */}
            {challenges.length > 0 && (
              <div className="mt-8 pt-6 border-t border-[#E2E8F0] dark:border-[#1F293D] space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                  Active Published Challenges ({challenges.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {challenges.map((ch) => (
                    <div
                      key={ch.id}
                      className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#0B1019] border border-[#E2E8F0] dark:border-[#1F293D]"
                    >
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-bold text-[#0B0F17] dark:text-[#F8FAFC] truncate">
                          {ch.title}
                        </p>
                        <p className="text-xs text-[#64748B] dark:text-[#94A3B8] flex flex-wrap items-center gap-1.5">
                          <span>{ch.subject}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-[#DC2626]">{ch.points} pts</span>
                          <span aria-hidden="true">·</span>
                          <span>{formatChallengeDateTime(ch.createdAt)}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteChallenge(ch.id)}
                        disabled={deletingChallengeId === ch.id}
                        title="Delete challenge"
                        aria-label={`Delete ${ch.title}`}
                        className="p-1.5 rounded-lg text-[#64748B] hover:text-[#DC2626] hover:bg-[#DC2626]/10 transition-colors shrink-0 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* SECTION B: Answer Notifications and Review */}
          <section
            aria-labelledby="owner-review-heading"
            className="bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#DC2626]">
                  Section B · Answer Notifications and Review
                </div>
                <h2
                  id="owner-review-heading"
                  className="text-lg sm:text-xl font-bold text-[#0B0F17] dark:text-[#F8FAFC]"
                >
                  Student Submissions Queue
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  Inspect each submitted answer and manually mark it Correct or Incorrect.
                </p>
              </div>

              {/* Status Filter Tabs */}
              <div
                role="tablist"
                aria-label="Filter submissions by status"
                className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#F1F5F9] dark:bg-[#0B1019] border border-[#E2E8F0] dark:border-[#1F293D]"
              >
                {(['all', 'pending', 'correct', 'incorrect'] as const).map((tab) => {
                  const count =
                    tab === 'all'
                      ? allAnswers.length
                      : allAnswers.filter((a) => a.status === tab).length;
                  return (
                    <button
                      key={tab}
                      role="tab"
                      aria-selected={answerFilter === tab}
                      type="button"
                      onClick={() => setAnswerFilter(tab)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all whitespace-nowrap ${
                        answerFilter === tab
                          ? 'bg-white dark:bg-[#131B28] text-[#0B0F17] dark:text-[#F8FAFC] shadow-sm border border-[#E2E8F0] dark:border-[#2D3D58]'
                          : 'text-[#64748B] hover:text-[#0B0F17] dark:hover:text-[#F8FAFC]'
                      }`}
                    >
                      {tab} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {loadingAnswers ? (
              <div className="py-10 text-center text-xs text-[#64748B] dark:text-[#94A3B8]">
                Loading student answer submissions...
              </div>
            ) : filteredOwnerAnswers.length === 0 ? (
              <div className="py-10 text-center rounded-xl bg-[#F8FAFC] dark:bg-[#0B1019] border border-dashed border-[#CBD5E1] dark:border-[#1F293D]">
                <p className="text-sm font-semibold text-[#0B0F17] dark:text-[#F8FAFC]">
                  No {answerFilter === 'all' ? '' : `${answerFilter} `}answer submissions yet
                </p>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                  Student challenge answers will appear here immediately once submitted.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOwnerAnswers.map((answer) => {
                  const isPending = answer.status === 'pending';
                  const isBusy = processingAnswerId === answer.id;

                  return (
                    <article
                      key={answer.id}
                      className="p-5 rounded-xl bg-[#F8FAFC] dark:bg-[#0B1019] border border-[#E2E8F0] dark:border-[#1F293D] space-y-4 transition-colors"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
                            <span className="font-bold text-[#0B0F17] dark:text-[#F8FAFC] text-sm">
                              {answer.studentName}
                            </span>
                            <span aria-hidden="true" className="text-[#CBD5E1] dark:text-[#334155]">·</span>
                            <span className="font-semibold text-[#DC2626]">
                              {answer.challengeTitle}
                            </span>
                            <span aria-hidden="true" className="text-[#CBD5E1] dark:text-[#334155]">·</span>
                            <span className="text-[#64748B] dark:text-[#94A3B8]">
                              {answer.challengePoints} pts
                            </span>
                            <span aria-hidden="true" className="text-[#CBD5E1] dark:text-[#334155]">·</span>
                            <span className="text-[#64748B] dark:text-[#94A3B8]">
                              {formatChallengeDateTime(answer.createdAt)}
                            </span>
                          </div>

                          <div className="p-3.5 rounded-lg bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D]">
                            <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] mb-1">
                              Submitted Answer
                            </p>
                            <p className="text-sm text-[#0B0F17] dark:text-[#F8FAFC] whitespace-pre-wrap break-words line-clamp-3">
                              {answer.answerText}
                            </p>
                            {answer.answerText.length > 180 && (
                              <button
                                type="button"
                                onClick={() => setInspectedAnswer(answer)}
                                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#DC2626] hover:underline"
                              >
                                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Open Full Answer</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Status & Review Buttons */}
                        <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 shrink-0">
                          <div className="flex items-center gap-1.5 text-xs font-semibold">
                            {answer.status === 'pending' && (
                              <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Pending Review</span>
                              </span>
                            )}
                            {answer.status === 'correct' && (
                              <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>
                                  Correct (+{answer.awardedPoints ?? answer.challengePoints} pts)
                                </span>
                              </span>
                            )}
                            {answer.status === 'incorrect' && (
                              <span className="inline-flex items-center gap-1.5 text-[#DC2626] dark:text-[#F87171]">
                                <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Incorrect (0 pts)</span>
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setInspectedAnswer(answer)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#E2E8F0] dark:border-[#1F293D] bg-white dark:bg-[#131B28] text-[#475569] dark:text-[#94A3B8] hover:text-[#0B0F17] dark:hover:text-[#F8FAFC] transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>View</span>
                            </button>

                            {isPending && (
                              <>
                                <button
                                  type="button"
                                  disabled={Boolean(processingAnswerId)}
                                  onClick={() => handleMarkCorrect(answer)}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>{isBusy ? 'Processing...' : 'Correct'}</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={Boolean(processingAnswerId)}
                                  onClick={() => handleMarkIncorrect(answer)}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#DC2626] hover:bg-[#B91C1C] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>{isBusy ? 'Processing...' : 'Incorrect'}</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* SECTION C: Challenge Winners – Owner View */}
          <WinnersSection
            sectionLabel="Section C · Challenge Winners – Owner View"
            winners={winners}
            loading={loadingWinners}
          />
        </div>
      ) : (
        /* =================================================================== */
        /* STUDENT INTERFACE (Visible to students & signed-out visitors)        */
        /* =================================================================== */
        <div className="space-y-8">
          {studentBanner && (
            <div
              role="status"
              className={`flex items-start justify-between gap-3 p-4 rounded-xl border text-xs font-medium ${
                studentBanner.tone === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-400'
                  : 'bg-[#DC2626]/10 border-[#DC2626]/25 text-[#DC2626] dark:text-[#F87171]'
              }`}
            >
              <div className="flex items-start gap-2">
                {studentBanner.tone === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                )}
                <span>{studentBanner.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setStudentBanner(null)}
                aria-label="Dismiss status message"
                className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* SECTION A: Available Challenges */}
          <section aria-labelledby="student-challenges-heading" className="space-y-5">
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#DC2626]">
                Section A · Available Challenges
              </div>
              <h2
                id="student-challenges-heading"
                className="text-lg sm:text-xl font-bold text-[#0B0F17] dark:text-[#F8FAFC]"
              >
                Open Challenges
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Review each challenge prompt and submit your answer for Owner evaluation.
              </p>
            </div>

            {loadingChallenges ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[1, 2].map((n) => (
                  <div
                    key={n}
                    className="h-52 rounded-2xl bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] animate-pulse"
                  />
                ))}
              </div>
            ) : challenges.length === 0 ? (
              <div className="p-10 text-center rounded-2xl bg-white dark:bg-[#131B28] border border-dashed border-[#CBD5E1] dark:border-[#1F293D]">
                <Target className="w-8 h-8 text-[#DC2626]/60 mx-auto mb-2" aria-hidden="true" />
                <p className="text-sm font-semibold text-[#0B0F17] dark:text-[#F8FAFC]">
                  No challenges published yet
                </p>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                  New challenges published by the Owner will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {challenges.map((challenge) => {
                  const isFormOpen = activeChallengeId === challenge.id;
                  const previousSubmissions = myAnswers.filter(
                    (a) => a.challengeId === challenge.id
                  );
                  const hasAttachment =
                    challenge.attachmentFormat !== 'none' && Boolean(challenge.attachmentUrl);
                  const isDriveLink =
                    challenge.attachmentFormat === 'gdrive' ||
                    isGoogleDriveUrl(challenge.attachmentUrl);

                  return (
                    <article
                      key={challenge.id}
                      className="bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] rounded-2xl p-6 shadow-sm flex flex-col justify-between gap-5 relative overflow-hidden"
                    >
                      <div className="space-y-3">
                        {/* Metadata Strip (Zero-pill · separated) */}
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex flex-wrap items-center gap-2 font-semibold">
                            <span className="text-[#DC2626] uppercase tracking-wider">
                              {challenge.subject}
                            </span>
                            <span aria-hidden="true" className="text-[#CBD5E1] dark:text-[#334155]">·</span>
                            <span className="text-[#64748B] dark:text-[#94A3B8]">
                              {formatChallengeDateTime(challenge.createdAt)}
                            </span>
                          </div>
                          <span className="inline-flex items-center gap-1 font-bold text-[#0B0F17] dark:text-[#F8FAFC]">
                            <Award className="w-3.5 h-3.5 text-[#DC2626]" aria-hidden="true" />
                            <span>{challenge.points} pts</span>
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-[#0B0F17] dark:text-[#F8FAFC]">
                          {challenge.title}
                        </h3>

                        <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#0B1019] border border-[#E2E8F0] dark:border-[#1F293D]">
                          <p className="text-sm text-[#334155] dark:text-[#CBD5E1] whitespace-pre-wrap break-words leading-relaxed">
                            {challenge.question}
                          </p>
                        </div>

                        {/* Optional Attachment Button */}
                        {hasAttachment && challenge.attachmentUrl && (
                          <div>
                            <a
                              href={challenge.attachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#EEF4FE] dark:bg-[#101A2C] text-[#0B0F17] dark:text-[#F8FAFC] border border-[#DCE8FD] dark:border-[#1E2D48] hover:border-[#DC2626] transition-colors"
                            >
                              {isDriveLink ? (
                                <>
                                  <FolderOpen className="w-3.5 h-3.5 text-[#DC2626]" aria-hidden="true" />
                                  <span>View File</span>
                                </>
                              ) : (
                                <>
                                  <ExternalLink className="w-3.5 h-3.5 text-[#DC2626]" aria-hidden="true" />
                                  <span>Open Attachment</span>
                                </>
                              )}
                            </a>
                          </div>
                        )}

                        {/* Student's own submission statuses for this challenge */}
                        {currentUser && previousSubmissions.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            {previousSubmissions.map((sub) => (
                              <div
                                key={sub.id}
                                className="flex flex-wrap items-center justify-between gap-2 text-xs px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-[#0B1019] border border-[#E2E8F0] dark:border-[#1F293D]"
                              >
                                <span className="text-[#475569] dark:text-[#94A3B8]">
                                  Submitted {formatChallengeDateTime(sub.createdAt)}
                                </span>
                                {sub.status === 'pending' && (
                                  <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                                    <span>Pending Review</span>
                                  </span>
                                )}
                                {sub.status === 'correct' && (
                                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                                    <span>
                                      Correct (+{sub.awardedPoints ?? challenge.points} pts)
                                    </span>
                                  </span>
                                )}
                                {sub.status === 'incorrect' && (
                                  <span className="inline-flex items-center gap-1 font-semibold text-[#DC2626] dark:text-[#F87171]">
                                    <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                                    <span>Incorrect</span>
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Submit Answer Action / Form */}
                      <div className="pt-2 border-t border-[#E2E8F0] dark:border-[#1F293D]">
                        {!isFormOpen ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (!currentUser) {
                                onSignInRequested();
                                return;
                              }
                              setActiveChallengeId(challenge.id);
                              setStudentBanner(null);
                            }}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#DC2626] hover:bg-[#B91C1C] text-white transition-colors shadow-sm"
                          >
                            <Send className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>
                              {currentUser ? 'Submit Answer' : 'Sign In to Submit Answer'}
                            </span>
                          </button>
                        ) : (
                          <div className="space-y-3 pt-1">
                            <label
                              htmlFor={`answer-textarea-${challenge.id}`}
                              className="block text-xs font-semibold uppercase tracking-wide text-[#475569] dark:text-[#94A3B8]"
                            >
                              Your Answer for {challenge.title}
                            </label>
                            <textarea
                              id={`answer-textarea-${challenge.id}`}
                              rows={4}
                              placeholder="Write your complete solution clearly..."
                              value={answerDrafts[challenge.id] || ''}
                              onChange={(e) =>
                                setAnswerDrafts((prev) => ({
                                  ...prev,
                                  [challenge.id]: e.target.value,
                                }))
                              }
                              className="w-full bg-white dark:bg-[#0B1019] text-[#0B0F17] dark:text-[#F8FAFC] placeholder-[#94A3B8] dark:placeholder-[#475569] text-sm rounded-lg border border-[#E2E8F0] dark:border-[#1F293D] p-3 focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 outline-none"
                            />
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                disabled={submittingAnswerId === challenge.id}
                                onClick={() => handleStudentSubmitAnswer(challenge)}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-[#DC2626] hover:bg-[#B91C1C] text-white transition-colors disabled:opacity-50"
                              >
                                <Send className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>
                                  {submittingAnswerId === challenge.id
                                    ? 'Submitting...'
                                    : 'Send Answer'}
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveChallengeId(null)}
                                className="px-3.5 py-2 rounded-lg text-xs font-semibold text-[#64748B] hover:text-[#0B0F17] dark:hover:text-[#F8FAFC] border border-[#E2E8F0] dark:border-[#1F293D] transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* SECTION B: Student Notifications */}
          <section
            id="student-notifications"
            aria-labelledby="student-notifications-heading"
            className="bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] rounded-2xl p-6 sm:p-8 shadow-sm space-y-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#DC2626]">
                  Section B · Student Notifications
                </div>
                <h2
                  id="student-notifications-heading"
                  className="text-lg sm:text-xl font-bold text-[#0B0F17] dark:text-[#F8FAFC]"
                >
                  Your Challenge Review Alerts
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  Private notifications showing when the Owner reviews your submitted answers.
                </p>
              </div>
              {currentUser && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#475569] dark:text-[#94A3B8]">
                  <Bell className="w-4 h-4 text-[#DC2626]" aria-hidden="true" />
                  <span>{unreadStudentNotifsCount} unread</span>
                </div>
              )}
            </div>

            {!currentUser ? (
              <div className="p-6 rounded-xl bg-[#F8FAFC] dark:bg-[#0B1019] border border-[#E2E8F0] dark:border-[#1F293D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
                  Sign in with your Eduway student account to view your personal challenge review notifications and Profile points.
                </p>
                <button
                  type="button"
                  onClick={onSignInRequested}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#DC2626] hover:bg-[#B91C1C] text-white transition-colors shrink-0"
                >
                  <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Sign In</span>
                </button>
              </div>
            ) : myNotifications.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-[#F8FAFC] dark:bg-[#0B1019] border border-dashed border-[#CBD5E1] dark:border-[#1F293D]">
                <p className="text-sm font-semibold text-[#0B0F17] dark:text-[#F8FAFC]">
                  No notifications yet
                </p>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                  You will receive an alert here as soon as the Owner reviews one of your submitted answers.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {myNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      notif.isRead
                        ? 'bg-[#F8FAFC] dark:bg-[#0B1019] border-[#E2E8F0] dark:border-[#1F293D]'
                        : 'bg-[#EEF4FE]/60 dark:bg-[#101A2C] border-[#DCE8FD] dark:border-[#243B61]'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5 shrink-0">
                        {notif.outcome === 'correct' ? (
                          <CheckCircle2
                            className="w-4 h-4 text-emerald-600 dark:text-emerald-400"
                            aria-hidden="true"
                          />
                        ) : (
                          <XCircle
                            className="w-4 h-4 text-[#DC2626] dark:text-[#F87171]"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-[#0B0F17] dark:text-[#F8FAFC]">
                            {notif.title}
                          </p>
                          {notif.outcome === 'correct' && (
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              +{notif.pointsEarned} pts
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
                          {notif.message}
                        </p>
                        <p className="text-[11px] text-[#64748B] dark:text-[#64748B]">
                          {formatChallengeDateTime(notif.createdAt)}
                        </p>
                      </div>
                    </div>

                    {!notif.isRead && (
                      <button
                        type="button"
                        disabled={markingReadId === notif.id}
                        onClick={() => handleMarkNotificationRead(notif.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#E2E8F0] dark:border-[#1F293D] bg-white dark:bg-[#131B28] text-[#0B0F17] dark:text-[#F8FAFC] hover:border-[#DC2626] transition-colors shrink-0 disabled:opacity-50"
                      >
                        {markingReadId === notif.id ? 'Updating...' : 'Mark as read'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* SECTION C: Challenge Winners – Student View */}
          <WinnersSection
            sectionLabel="Section C · Challenge Winners – Student View"
            winners={winners}
            loading={loadingWinners}
          />
        </div>
      )}

      {/* Owner Full Answer Inspection Modal */}
      {inspectedAnswer && isOwner && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="inspected-answer-heading"
        >
          <div className="w-full max-w-2xl bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] rounded-2xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-[#E2E8F0] dark:border-[#1F293D] pb-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#DC2626]">
                  Student Answer Inspection
                </p>
                <h3
                  id="inspected-answer-heading"
                  className="text-lg font-bold text-[#0B0F17] dark:text-[#F8FAFC]"
                >
                  {inspectedAnswer.challengeTitle}
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  Submitted by <strong className="text-[#0B0F17] dark:text-[#F8FAFC]">{inspectedAnswer.studentName}</strong> ·{' '}
                  {formatChallengeDateTime(inspectedAnswer.createdAt)} ·{' '}
                  {inspectedAnswer.challengePoints} pts
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectedAnswer(null)}
                aria-label="Close inspection dialog"
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0B0F17] dark:hover:text-[#F8FAFC] hover:bg-[#F1F5F9] dark:hover:bg-[#1A2536]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#0B1019] border border-[#E2E8F0] dark:border-[#1F293D]">
              <p className="text-sm text-[#0B0F17] dark:text-[#F8FAFC] whitespace-pre-wrap break-words leading-relaxed">
                {inspectedAnswer.answerText}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setInspectedAnswer(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold border border-[#E2E8F0] dark:border-[#1F293D] text-[#475569] dark:text-[#94A3B8] hover:text-[#0B0F17] dark:hover:text-[#F8FAFC]"
              >
                Close
              </button>
              {inspectedAnswer.status === 'pending' && (
                <>
                  <button
                    type="button"
                    disabled={Boolean(processingAnswerId)}
                    onClick={() => handleMarkIncorrect(inspectedAnswer)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#DC2626] hover:bg-[#B91C1C] text-white disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Mark Incorrect</span>
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(processingAnswerId)}
                    onClick={() => handleMarkCorrect(inspectedAnswer)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Mark Correct (+{inspectedAnswer.challengePoints} pts)</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface WinnersSectionProps {
  sectionLabel: string;
  winners: ChallengeWinner[];
  loading: boolean;
}

const WinnersSection: React.FC<WinnersSectionProps> = ({
  sectionLabel,
  winners,
  loading,
}) => {
  return (
    <section
      aria-labelledby="challenge-winners-heading"
      className="bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] rounded-2xl p-6 sm:p-8 shadow-sm space-y-5"
    >
      <div className="space-y-1">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#DC2626]">
          {sectionLabel}
        </div>
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#DC2626]" aria-hidden="true" />
          <h2
            id="challenge-winners-heading"
            className="text-lg sm:text-xl font-bold text-[#0B0F17] dark:text-[#F8FAFC]"
          >
            Challenge Winners
          </h2>
        </div>
        <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
          Verified students whose challenge submissions were accepted by the Owner.
        </p>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-[#64748B] dark:text-[#94A3B8]">
          Loading verified Challenge Winners...
        </div>
      ) : winners.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-[#F8FAFC] dark:bg-[#0B1019] border border-dashed border-[#CBD5E1] dark:border-[#1F293D]">
          <p className="text-sm font-semibold text-[#0B0F17] dark:text-[#F8FAFC]">
            No Challenge Winners yet
          </p>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
            Winners appear here once student answers are reviewed and marked Correct.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] dark:border-[#1F293D] text-[11px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                <th className="py-3 pr-4">Student</th>
                <th className="py-3 pr-4">Challenge</th>
                <th className="py-3 pr-4">Points Earned</th>
                <th className="py-3">Date Accepted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#1F293D] text-sm">
              {winners.map((winner) => (
                <tr key={winner.id} className="hover:bg-[#F8FAFC] dark:hover:bg-[#0B1019]/60">
                  <td className="py-3.5 pr-4 font-bold text-[#0B0F17] dark:text-[#F8FAFC]">
                    {winner.studentName}
                  </td>
                  <td className="py-3.5 pr-4 text-[#334155] dark:text-[#CBD5E1]">
                    {winner.challengeTitle}
                  </td>
                  <td className="py-3.5 pr-4 font-bold text-emerald-600 dark:text-emerald-400">
                    +{winner.pointsEarned} pts
                  </td>
                  <td className="py-3.5 text-xs text-[#64748B] dark:text-[#94A3B8] whitespace-nowrap">
                    {formatChallengeDateTime(winner.acceptedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
