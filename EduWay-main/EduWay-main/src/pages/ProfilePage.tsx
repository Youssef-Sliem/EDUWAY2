import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Compass,
  Edit3,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Trophy,
  Users,
  X,
  Check,
  AlertCircle,
  Lock,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { ProfileAvatar } from '../components/profile/ProfileAvatar';
import {
  formatChallengeDateTime,
  subscribeStudentChallengeAnswers,
} from '../services/challengeService';
import { ChallengeAnswer } from '../types/challenge';
import { PublicStudentProfile } from '../types/profile';
import {
  MAX_SKILL_LENGTH,
  MAX_STUDENT_SKILLS,
  ensurePublicProfileMirrored,
  saveStudentSkills,
  subscribePublicStudentProfiles,
} from '../services/profileService';

interface ProfilePageProps {
  onSignInRequested: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onSignInRequested }) => {
  const { currentUser, userProfile, loading: authLoading, isOwner } = useAuth();

  // Sub-view state: 'my-profile' or 'explore-skills'
  const [subView, setSubView] = useState<'my-profile' | 'explore-skills'>('my-profile');

  // My Skills state
  const [newSkillInput, setNewSkillInput] = useState('');
  const [skillError, setSkillError] = useState<string | null>(null);
  const [savingSkills, setSavingSkills] = useState(false);
  const [editingSkillIndex, setEditingSkillIndex] = useState<number | null>(null);
  const [editingSkillValue, setEditingSkillValue] = useState('');

  // Feedback banner
  const [statusBanner, setStatusBanner] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);

  // Challenge Achievements (from Challenge Hub challengeAnswers)
  const [myAnswers, setMyAnswers] = useState<ChallengeAnswer[]>([]);
  const [loadingAnswers, setLoadingAnswers] = useState(true);

  // Explore Other Students' Skills
  const [publicProfiles, setPublicProfiles] = useState<PublicStudentProfile[]>([]);
  const [loadingPublicProfiles, setLoadingPublicProfiles] = useState(false);
  const [skillSearchQuery, setSkillSearchQuery] = useState('');

  const username = useMemo(() => {
    return (
      userProfile?.nickname ||
      userProfile?.fullName ||
      currentUser?.displayName ||
      currentUser?.email?.split('@')[0] ||
      'Eduway Student'
    );
  }, [userProfile, currentUser]);

  const currentSkills = useMemo(() => {
    return Array.isArray(userProfile?.skills) ? userProfile.skills : [];
  }, [userProfile?.skills]);

  const totalPoints = userProfile?.points ?? 0;

  // Sync existing profile photo/skills into publicProfiles if missing
  useEffect(() => {
    if (!currentUser || !userProfile) return;
    ensurePublicProfileMirrored({
      uid: currentUser.uid,
      username,
      fullNameFallback: userProfile.fullName || username,
      emailFallback: userProfile.email || currentUser.email || '',
      photoUrl: userProfile.photoUrl,
      skills: currentSkills,
    });
  }, [currentUser, userProfile, username, currentSkills]);

  // Subscribe to student's own challenge answers for Challenge Achievements
  useEffect(() => {
    if (!currentUser) {
      setMyAnswers([]);
      setLoadingAnswers(false);
      return;
    }
    setLoadingAnswers(true);
    const unsub = subscribeStudentChallengeAnswers(
      currentUser.uid,
      (items) => {
        setMyAnswers(items);
        setLoadingAnswers(false);
      },
      () => {
        setLoadingAnswers(false);
      }
    );
    return () => unsub();
  }, [currentUser]);

  // Subscribe to publicProfiles when signed in (for Explore Other Students' Skills)
  useEffect(() => {
    if (!currentUser) {
      setPublicProfiles([]);
      return;
    }
    setLoadingPublicProfiles(true);
    const unsub = subscribePublicStudentProfiles(
      (profiles) => {
        setPublicProfiles(profiles);
        setLoadingPublicProfiles(false);
      },
      () => {
        setLoadingPublicProfiles(false);
      }
    );
    return () => unsub();
  }, [currentUser]);

  // Strictly only Owner-approved Correct submissions qualify as Challenge Achievements
  const approvedAchievements = useMemo(() => {
    return myAnswers.filter(
      (answer) => answer.status === 'correct' && answer.pointsAwarded === true
    );
  }, [myAnswers]);

  // Real other students who have shared skills publicly
  const otherStudentsWithSkills = useMemo(() => {
    const queryLower = skillSearchQuery.trim().toLowerCase();
    return publicProfiles
      .filter((profile) => profile.id !== currentUser?.uid && profile.skills.length > 0)
      .filter((profile) => {
        if (!queryLower) return true;
        const matchesSkill = profile.skills.some((skill) =>
          skill.toLowerCase().includes(queryLower)
        );
        const matchesUsername = profile.username.toLowerCase().includes(queryLower);
        return matchesSkill || matchesUsername;
      });
  }, [publicProfiles, currentUser?.uid, skillSearchQuery]);

  // --- My Skills Handlers ---
  const persistSkills = async (nextSkills: string[], successMessage: string) => {
    if (!currentUser) return;
    setSavingSkills(true);
    setSkillError(null);
    setStatusBanner(null);
    try {
      await saveStudentSkills({
        uid: currentUser.uid,
        username,
        fullNameFallback: userProfile?.fullName || username,
        emailFallback: userProfile?.email || currentUser.email || '',
        photoUrl: userProfile?.photoUrl,
        skills: nextSkills,
      });
      setStatusBanner({
        tone: 'success',
        message: successMessage,
      });
    } catch (err) {
      setSkillError(err instanceof Error ? err.message : 'Failed to update skills.');
    } finally {
      setSavingSkills(false);
    }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || savingSkills) return;

    const clean = newSkillInput.trim().replace(/\s+/g, ' ');
    if (!clean) {
      setSkillError('Please enter a skill name.');
      return;
    }
    if (clean.length > MAX_SKILL_LENGTH) {
      setSkillError(`Skill name must be ${MAX_SKILL_LENGTH} characters or fewer.`);
      return;
    }
    if (currentSkills.length >= MAX_STUDENT_SKILLS) {
      setSkillError(`You can add up to ${MAX_STUDENT_SKILLS} skills to your profile.`);
      return;
    }
    if (currentSkills.some((s) => s.toLowerCase() === clean.toLowerCase())) {
      setSkillError(`"${clean}" is already listed in your skills.`);
      return;
    }

    const updated = [...currentSkills, clean];
    await persistSkills(updated, `Added "${clean}" to My Skills.`);
    setNewSkillInput('');
  };

  const handleStartEditSkill = (index: number, existingSkill: string) => {
    setEditingSkillIndex(index);
    setEditingSkillValue(existingSkill);
    setSkillError(null);
  };

  const handleSaveEditedSkill = async (index: number) => {
    if (!currentUser || savingSkills) return;
    const clean = editingSkillValue.trim().replace(/\s+/g, ' ');
    if (!clean) {
      setSkillError('Skill name cannot be empty.');
      return;
    }
    if (clean.length > MAX_SKILL_LENGTH) {
      setSkillError(`Skill name must be ${MAX_SKILL_LENGTH} characters or fewer.`);
      return;
    }
    const duplicate = currentSkills.some(
      (s, idx) => idx !== index && s.toLowerCase() === clean.toLowerCase()
    );
    if (duplicate) {
      setSkillError(`"${clean}" is already in your skills list.`);
      return;
    }

    const updated = currentSkills.map((s, idx) => (idx === index ? clean : s));
    await persistSkills(updated, `Updated skill to "${clean}".`);
    setEditingSkillIndex(null);
    setEditingSkillValue('');
  };

  const handleRemoveSkill = async (index: number) => {
    if (!currentUser || savingSkills) return;
    const removed = currentSkills[index];
    const updated = currentSkills.filter((_, idx) => idx !== index);
    if (editingSkillIndex === index) {
      setEditingSkillIndex(null);
      setEditingSkillValue('');
    }
    await persistSkills(updated, `Removed "${removed}" from My Skills.`);
  };

  // --- Auth Loading State ---
  if (authLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="h-44 rounded-2xl bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] animate-pulse" />
      </div>
    );
  }

  // --- Unauthenticated State ---
  if (!currentUser) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 animate-fadeIn">
        <div className="bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] rounded-2xl p-8 sm:p-10 shadow-sm text-center space-y-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#DC2626]" aria-hidden="true" />
          <div className="w-14 h-14 rounded-2xl bg-[#DC2626]/10 border border-[#DC2626]/20 text-[#DC2626] flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" aria-hidden="true" />
          </div>
          <div className="space-y-2 max-w-lg mx-auto">
            <h1 className="text-2xl font-bold text-[#0B0F17] dark:text-[#F8FAFC]">
              Student Profile
            </h1>
            <p className="text-sm text-[#475569] dark:text-[#94A3B8] leading-relaxed">
              Sign in with your Eduway account to customize your profile picture, manage your skills, track Challenge Hub points and achievements, and explore skills shared by other students.
            </p>
          </div>
          <div className="pt-2 flex justify-center">
            <Button
              type="button"
              variant="primary"
              onClick={onSignInRequested}
              className="sm:w-auto px-7"
            >
              Sign In to View Profile
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // DEDICATED VIEW: Explore Other Students' Skills
  // ===========================================================================
  if (subView === 'explore-skills') {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
        {/* Back & Header */}
        <div className="space-y-4 border-b border-[#E2E8F0] dark:border-[#1F293D] pb-6">
          <button
            type="button"
            onClick={() => setSubView('my-profile')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#475569] dark:text-[#94A3B8] hover:text-[#DC2626] dark:hover:text-[#F8FAFC] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back to My Profile</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#DC2626]">
                <Compass className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Peer Discovery</span>
                <span aria-hidden="true" className="text-[#CBD5E1] dark:text-[#334155]">·</span>
                <span className="text-[#64748B] dark:text-[#94A3B8]">Public Skills Directory</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0B0F17] dark:text-[#F8FAFC]">
                Explore Other Students&apos; Skills
              </h1>
              <p className="text-sm text-[#475569] dark:text-[#94A3B8] max-w-2xl">
                Browse publicly shared skills from fellow Eduway students or search for a specific ability such as Python or Graphic Design.
              </p>
            </div>

            <div className="text-xs bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] rounded-xl px-4 py-2.5 shadow-sm shrink-0">
              <span className="text-[#64748B] dark:text-[#94A3B8] block">Matching Students</span>
              <span className="text-base font-bold text-[#0B0F17] dark:text-[#F8FAFC]">
                {otherStudentsWithSkills.length}
              </span>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <section
          aria-label="Search other students' skills"
          className="bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] rounded-2xl p-4 sm:p-5 shadow-sm"
        >
          <div className="relative flex items-center">
            <Search
              className="w-4 h-4 text-[#64748B] absolute left-3.5 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={skillSearchQuery}
              onChange={(e) => setSkillSearchQuery(e.target.value)}
              placeholder="Search for a skill (e.g. Python, Graphic Design, React) or student username..."
              aria-label="Search skills or usernames"
              className="w-full bg-[#F8FAFC] dark:bg-[#0B1019] text-[#0B0F17] dark:text-[#F8FAFC] placeholder-[#94A3B8] dark:placeholder-[#475569] text-sm rounded-xl border border-[#E2E8F0] dark:border-[#1F293D] pl-10 pr-10 py-3 focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 outline-none transition-all"
            />
            {skillSearchQuery && (
              <button
                type="button"
                onClick={() => setSkillSearchQuery('')}
                aria-label="Clear search query"
                className="absolute right-3 p-1 rounded-lg text-[#64748B] hover:text-[#0B0F17] dark:hover:text-[#F8FAFC]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </section>

        {/* Directory Results */}
        {loadingPublicProfiles ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-44 rounded-2xl bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] animate-pulse"
              />
            ))}
          </div>
        ) : otherStudentsWithSkills.length === 0 ? (
          <div className="p-10 text-center rounded-2xl bg-white dark:bg-[#131B28] border border-dashed border-[#CBD5E1] dark:border-[#1F293D] space-y-2">
            <Users className="w-8 h-8 text-[#DC2626]/60 mx-auto" aria-hidden="true" />
            <p className="text-sm font-semibold text-[#0B0F17] dark:text-[#F8FAFC]">
              {skillSearchQuery.trim()
                ? `No students found matching "${skillSearchQuery.trim()}"`
                : 'No other students have shared skills yet'}
            </p>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] max-w-md mx-auto">
              {skillSearchQuery.trim()
                ? 'Try another skill keyword or clear your search to browse all publicly shared student profiles.'
                : 'When fellow students add skills to their Eduway profiles, they will appear here automatically.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {otherStudentsWithSkills.map((student) => {
              const queryLower = skillSearchQuery.trim().toLowerCase();
              return (
                <article
                  key={student.id}
                  className="bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] rounded-2xl p-5 shadow-sm flex flex-col gap-4 hover:border-[#CBD5E1] dark:hover:border-[#2D3D58] transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <ProfileAvatar
                      photoUrl={student.photoUrl}
                      username={student.username}
                      size="md"
                    />
                    <div className="min-w-0">
                      <h2 className="text-base font-bold text-[#0B0F17] dark:text-[#F8FAFC] truncate">
                        {student.username}
                      </h2>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                        {student.skills.length}{' '}
                        {student.skills.length === 1 ? 'shared skill' : 'shared skills'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {student.skills.map((skill, idx) => {
                      const isMatch =
                        Boolean(queryLower) && skill.toLowerCase().includes(queryLower);
                      return (
                        <span
                          key={`${student.id}-skill-${idx}`}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                            isMatch
                              ? 'bg-[#DC2626]/10 border-[#DC2626]/40 text-[#DC2626] dark:text-[#F87171]'
                              : 'bg-[#EEF4FE] dark:bg-[#101A2C] border-[#DCE8FD] dark:border-[#1E2D48] text-[#0B0F17] dark:text-[#DCE8FD]'
                          }`}
                        >
                          {skill}
                        </span>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ===========================================================================
  // MAIN VIEW: Student Profile Page
  // ===========================================================================
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Status Banner */}
      {statusBanner && (
        <div
          role="status"
          className={`flex items-start justify-between gap-3 p-4 rounded-xl border text-xs font-medium ${
            statusBanner.tone === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-400'
              : 'bg-[#DC2626]/10 border-[#DC2626]/25 text-[#DC2626] dark:text-[#F87171]'
          }`}
        >
          <div className="flex items-start gap-2">
            {statusBanner.tone === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            )}
            <span>{statusBanner.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            aria-label="Dismiss status message"
            className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. PROFILE HEADER */}
      <section
        aria-labelledby="profile-header-username"
        className="bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#DC2626]" aria-hidden="true" />

        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          {/* Large Circular Profile Avatar */}
          <div className="shrink-0">
            <ProfileAvatar
              photoUrl={userProfile?.photoUrl}
              username={username}
              size="xl"
              className="ring-4 ring-[#EEF4FE] dark:ring-[#101A2C] shadow-md"
            />
          </div>

          {/* Username & Clean Academic Identity */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs font-semibold uppercase tracking-wider text-[#DC2626]">
              <span>{isOwner ? 'Platform Owner Profile' : 'Student Profile'}</span>
              {userProfile?.classCohort && (
                <>
                  <span aria-hidden="true" className="text-[#CBD5E1] dark:text-[#334155]">·</span>
                  <span className="text-[#64748B] dark:text-[#94A3B8]">
                    {userProfile.classCohort}
                  </span>
                </>
              )}
              {userProfile?.academicYear && (
                <>
                  <span aria-hidden="true" className="text-[#CBD5E1] dark:text-[#334155]">·</span>
                  <span className="text-[#64748B] dark:text-[#94A3B8]">
                    {userProfile.academicYear}
                  </span>
                </>
              )}
            </div>

            <h1
              id="profile-header-username"
              className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#0B0F17] dark:text-[#F8FAFC]"
            >
              {username}
            </h1>

            {userProfile?.fullName && userProfile.fullName !== username && (
              <p className="text-sm text-[#475569] dark:text-[#94A3B8]">
                {userProfile.fullName}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* 2. MY POINTS + QUICK SUMMARY GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* MY POINTS SECTION */}
        <section
          aria-labelledby="my-points-heading"
          className="lg:col-span-5 bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col justify-between gap-5"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#DC2626]">
                <Award className="w-4 h-4" aria-hidden="true" />
                <span>Challenge Hub Score</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#DC2626]" aria-hidden="true" />
                <span>Verified Read-Only</span>
              </span>
            </div>

            <h2
              id="my-points-heading"
              className="text-xl font-bold text-[#0B0F17] dark:text-[#F8FAFC]"
            >
              My Points
            </h2>
          </div>

          <div className="p-5 rounded-2xl bg-[#EEF4FE] dark:bg-[#101A2C] border border-[#DCE8FD] dark:border-[#1E2D48] flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#475569] dark:text-[#94A3B8] block">
                Total Accumulated Points
              </span>
              <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#0B0F17] dark:text-[#F8FAFC] mt-1">
                {totalPoints}
                <span className="text-base font-bold text-[#DC2626] ml-1.5">pts</span>
              </div>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-[#131B28] border border-[#DCE8FD] dark:border-[#1E2D48] flex items-center justify-center text-[#DC2626] shrink-0 shadow-sm">
              <Trophy className="w-7 h-7" aria-hidden="true" />
            </div>
          </div>

          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
            Points are awarded automatically only when the Owner approves your Challenge Hub answers as Correct. Pending or incorrect submissions add 0 points.
          </p>
        </section>

        {/* 3. MY SKILLS SECTION */}
        <section
          aria-labelledby="my-skills-heading"
          className="lg:col-span-7 bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col justify-between gap-5"
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#DC2626]">
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Personal Capabilities</span>
                </div>
                <h2
                  id="my-skills-heading"
                  className="text-xl font-bold text-[#0B0F17] dark:text-[#F8FAFC]"
                >
                  My Skills
                </h2>
              </div>
              <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">
                {currentSkills.length} / {MAX_STUDENT_SKILLS} skills
              </span>
            </div>

            {/* Add Skill Form (Manual entry, NO fixed dropdown) */}
            <form onSubmit={handleAddSkill} noValidate className="flex flex-col sm:flex-row gap-2.5">
              <div className="flex-1">
                <input
                  type="text"
                  value={newSkillInput}
                  onChange={(e) => {
                    setNewSkillInput(e.target.value);
                    if (skillError) setSkillError(null);
                  }}
                  maxLength={MAX_SKILL_LENGTH}
                  placeholder="Type a skill (e.g. Python, Graphic Design, Public Speaking)..."
                  aria-label="Enter a skill name"
                  className="w-full bg-white dark:bg-[#0B1019] text-[#0B0F17] dark:text-[#F8FAFC] placeholder-[#94A3B8] dark:placeholder-[#475569] text-sm rounded-xl border border-[#E2E8F0] dark:border-[#1F293D] px-3.5 py-2.5 focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 outline-none transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={savingSkills}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#DC2626] hover:bg-[#B91C1C] text-white transition-colors shadow-sm shrink-0 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>{savingSkills ? 'Saving...' : 'Add Skill'}</span>
              </button>
            </form>

            {skillError && (
              <p
                role="alert"
                className="flex items-center gap-1.5 text-xs text-[#DC2626] font-medium"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{skillError}</span>
              </p>
            )}

            {/* Skills Tags / Cards */}
            {currentSkills.length === 0 ? (
              <div className="p-5 rounded-xl bg-[#F8FAFC] dark:bg-[#0B1019] border border-dashed border-[#CBD5E1] dark:border-[#1F293D] text-center">
                <p className="text-xs font-semibold text-[#0B0F17] dark:text-[#F8FAFC]">
                  No skills added yet
                </p>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                  Add your technical, creative, or academic skills above so peers can discover what you do best.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {currentSkills.map((skill, idx) => {
                  const isEditingThis = editingSkillIndex === idx;

                  if (isEditingThis) {
                    return (
                      <div
                        key={`edit-skill-${idx}`}
                        className="inline-flex items-center gap-1.5 p-1.5 rounded-xl bg-[#F8FAFC] dark:bg-[#0B1019] border border-[#DC2626]"
                      >
                        <input
                          type="text"
                          value={editingSkillValue}
                          onChange={(e) => setEditingSkillValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveEditedSkill(idx);
                            } else if (e.key === 'Escape') {
                              setEditingSkillIndex(null);
                              setEditingSkillValue('');
                            }
                          }}
                          maxLength={MAX_SKILL_LENGTH}
                          aria-label={`Edit skill ${skill}`}
                          autoFocus
                          className="w-36 sm:w-44 bg-white dark:bg-[#131B28] text-xs font-medium text-[#0B0F17] dark:text-[#F8FAFC] rounded-lg border border-[#E2E8F0] dark:border-[#1F293D] px-2.5 py-1 outline-none focus:border-[#DC2626]"
                        />
                        <button
                          type="button"
                          disabled={savingSkills}
                          onClick={() => handleSaveEditedSkill(idx)}
                          aria-label="Save edited skill"
                          className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSkillIndex(null);
                            setEditingSkillValue('');
                          }}
                          aria-label="Cancel editing skill"
                          className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0B0F17] dark:hover:text-[#F8FAFC]"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={`skill-${idx}-${skill}`}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#EEF4FE] dark:bg-[#101A2C] border border-[#DCE8FD] dark:border-[#1E2D48] text-xs font-semibold text-[#0B0F17] dark:text-[#F8FAFC]"
                    >
                      <span>{skill}</span>
                      <div className="flex items-center gap-1 pl-1 border-l border-[#CBD5E1] dark:border-[#243B61]">
                        <button
                          type="button"
                          disabled={savingSkills}
                          onClick={() => handleStartEditSkill(idx, skill)}
                          aria-label={`Edit skill ${skill}`}
                          title={`Edit ${skill}`}
                          className="p-1 rounded text-[#64748B] hover:text-[#0B0F17] dark:hover:text-[#F8FAFC] transition-colors disabled:opacity-50"
                        >
                          <Edit3 className="w-3 h-3" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          disabled={savingSkills}
                          onClick={() => handleRemoveSkill(idx)}
                          aria-label={`Remove skill ${skill}`}
                          title={`Remove ${skill}`}
                          className="p-1 rounded text-[#64748B] hover:text-[#DC2626] transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-3 h-3" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. PROMINENT EXPLORE OTHER STUDENTS' SKILLS BUTTON (Directly below My Skills) */}
          <div className="pt-4 border-t border-[#E2E8F0] dark:border-[#1F293D] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              Discover classmates with shared or complementary skills.
            </p>
            <button
              type="button"
              onClick={() => {
                setSkillSearchQuery('');
                setSubView('explore-skills');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#0B0F17] hover:bg-[#1E293B] dark:bg-[#DC2626] dark:hover:bg-[#B91C1C] text-white transition-colors shadow-sm shrink-0"
            >
              <Compass className="w-4 h-4" aria-hidden="true" />
              <span>Explore Other Students&apos; Skills</span>
            </button>
          </div>
        </section>
      </div>

      {/* 5. CHALLENGE ACHIEVEMENTS SECTION */}
      <section
        aria-labelledby="challenge-achievements-heading"
        className="bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] rounded-2xl p-6 sm:p-8 shadow-sm space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#DC2626]">
              <Trophy className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Verified Completions</span>
            </div>
            <h2
              id="challenge-achievements-heading"
              className="text-xl font-bold text-[#0B0F17] dark:text-[#F8FAFC]"
            >
              Challenge Achievements
            </h2>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              Challenges marked Correct and approved by the Owner in Challenge Hub.
            </p>
          </div>

          <div className="text-xs font-semibold text-[#475569] dark:text-[#94A3B8]">
            {approvedAchievements.length}{' '}
            {approvedAchievements.length === 1 ? 'achievement' : 'achievements'}
          </div>
        </div>

        {loadingAnswers ? (
          <div className="py-8 text-center text-xs text-[#64748B] dark:text-[#94A3B8]">
            Loading your Challenge Achievements...
          </div>
        ) : approvedAchievements.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-[#F8FAFC] dark:bg-[#0B1019] border border-dashed border-[#CBD5E1] dark:border-[#1F293D] space-y-1.5">
            <Award className="w-7 h-7 text-[#DC2626]/60 mx-auto" aria-hidden="true" />
            <p className="text-sm font-semibold text-[#0B0F17] dark:text-[#F8FAFC]">
              No Challenge Achievements yet
            </p>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] max-w-md mx-auto">
              Submit answers in Challenge Hub. Once the Owner marks your solution Correct, it will appear here alongside the points earned.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {approvedAchievements.map((achievement) => (
              <article
                key={achievement.id}
                className="p-5 rounded-xl bg-[#F8FAFC] dark:bg-[#0B1019] border border-[#E2E8F0] dark:border-[#1F293D] flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-semibold uppercase tracking-wider text-[#DC2626]">
                        {achievement.challengeSubject}
                      </span>
                      <span aria-hidden="true" className="text-[#CBD5E1] dark:text-[#334155]">·</span>
                      <span className="text-[#64748B] dark:text-[#94A3B8]">
                        Approved {formatChallengeDateTime(achievement.reviewedAt ?? achievement.updatedAt ?? achievement.createdAt)}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#0B0F17] dark:text-[#F8FAFC] break-words">
                      {achievement.challengeTitle}
                    </h3>
                  </div>

                  <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    <span>+{achievement.awardedPoints ?? achievement.challengePoints} pts</span>
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
