import React, { useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Cpu,
  ExternalLink,
  Plus,
  Search,
  FileText,
  Video,
  Globe,
} from 'lucide-react';
import { AcademicSubmission, HubType, SubjectDefinition } from '../../types/academic';
import { getSubjectsByHub } from '../../data/academicCatalog';
import { GeneralHubIllustration, SpecializedHubIllustration } from '../illustration/HubIllustrations';
import { formatTimestamp, isGoogleDriveUrl, isPdfResourceUrl } from '../../utils/resourceValidation';
import { CourseCoverThumbnail } from './CourseCoverThumbnail';

interface HubBrowserViewProps {
  hub: HubType;
  selectedSubject: SubjectDefinition | null;
  approvedCourses: AcademicSubmission[];
  loading: boolean;
  onBackToMain: () => void;
  onSwitchHub: (hub: HubType) => void;
  onSelectSubject: (subject: SubjectDefinition | null) => void;
  onSelectCourse: (course: AcademicSubmission) => void;
  onAddCourseClick: (hub: HubType, subjectId?: string) => void;
}

export const HubBrowserView: React.FC<HubBrowserViewProps> = ({
  hub,
  selectedSubject,
  approvedCourses,
  loading,
  onBackToMain,
  onSwitchHub,
  onSelectSubject,
  onSelectCourse,
  onAddCourseClick,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [formatFilter, setFormatFilter] = useState<'all' | 'pdf' | 'video' | 'link'>('all');

  const subjects = getSubjectsByHub(hub);
  const hubCourses = approvedCourses.filter(
    (c) => c.submissionKind === 'course' && c.hub === hub
  );

  // Helper to render the reusable search/filter bar + course cards grid
  const renderCoursesDirectory = (
    courses: AcademicSubmission[],
    emptyTitle: string,
    emptyActionSubjectId?: string
  ) => {
    const filteredCourses = courses.filter((course) => {
      const q = searchTerm.trim().toLowerCase();
      const matchesQuery =
        !q ||
        course.title.toLowerCase().includes(q) ||
        course.description.toLowerCase().includes(q) ||
        (course.tags || []).some((t) => t.toLowerCase().includes(q));

      const matchesFormat =
        formatFilter === 'all' ||
        (formatFilter === 'pdf' && isPdfResourceUrl(course.fileUrl, course.fileType)) ||
        (formatFilter === 'video' && course.fileType === 'video') ||
        (formatFilter === 'link' && !isPdfResourceUrl(course.fileUrl, course.fileType) && course.fileType !== 'video');

      return matchesQuery && matchesFormat;
    });

    return (
      <>
        {/* Search & Format Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search courses or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-[#F8FAFC] dark:bg-[#0B1019] border border-[#E2E8F0] dark:border-[#1F293D] text-[#0B0F17] dark:text-[#F8FAFC] focus:outline-none focus:border-[#DC2626]"
            />
          </div>

          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#F1F5F9] dark:bg-[#0B1019]">
            {(['all', 'pdf', 'video', 'link'] as const).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setFormatFilter(fmt)}
                className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-colors ${
                  formatFilter === fmt
                    ? 'bg-white dark:bg-[#131B28] text-[#0B0F17] dark:text-[#F8FAFC] shadow-sm'
                    : 'text-[#64748B] hover:text-[#0B0F17] dark:hover:text-[#F8FAFC]'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        {/* Course Cards Grid */}
        {loading ? (
          <div className="p-12 text-center text-sm text-[#64748B]">
            Loading approved courses from Firestore...
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] space-y-3">
            <BookOpen className="w-8 h-8 text-[#64748B] mx-auto" aria-hidden="true" />
            <h3 className="text-base font-bold text-[#0B0F17] dark:text-[#F8FAFC]">
              {emptyTitle}
            </h3>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] max-w-md mx-auto">
              Approved courses submitted by the Owner or verified by the Owner will appear here automatically.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onAddCourseClick(hub, emptyActionSubjectId)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Add First Course</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCourses.map((course) => {
              const isPdf = isPdfResourceUrl(course.fileUrl, course.fileType);
              const isDriveFile = isGoogleDriveUrl(course.fileUrl);
              return (
                <article
                  key={course.id}
                  className="group flex flex-col justify-between bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] rounded-2xl overflow-hidden shadow-sm hover:border-[#DC2626]/50 transition-all"
                >
                  <div>
                    <button
                      type="button"
                      onClick={() => onSelectCourse(course)}
                      className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]"
                      aria-label={`View details for ${course.title}`}
                    >
                      <CourseCoverThumbnail
                        coverImageUrl={course.coverImageUrl}
                        title={course.title}
                        hub={course.hub || hub}
                        subtitle={
                          (course.hub || hub) === 'specialized'
                            ? 'Computer Science'
                            : selectedSubject?.shortCode || course.category
                        }
                      />
                    </button>

                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between gap-2 text-xs text-[#64748B] dark:text-[#94A3B8]">
                      <span className="inline-flex items-center gap-1 font-medium text-[#DC2626]">
                        {isPdf || isDriveFile ? (
                          <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                        ) : course.fileType === 'video' ? (
                          <Video className="w-3.5 h-3.5" aria-hidden="true" />
                        ) : (
                          <Globe className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                        <span>
                          {isDriveFile
                            ? 'Google Drive File'
                            : isPdf
                            ? 'PDF Guide'
                            : course.fileType === 'video'
                            ? 'Video'
                            : 'Web Resource'}
                        </span>
                      </span>
                      <span>{formatTimestamp(course.createdAt)}</span>
                    </div>

                    <h3 className="text-base font-bold text-[#0B0F17] dark:text-[#F8FAFC] leading-snug">
                      {course.title}
                    </h3>

                    <p className="text-xs text-[#475569] dark:text-[#94A3B8] line-clamp-3 leading-relaxed">
                      {course.description}
                    </p>

                    {course.tags && course.tags.length > 0 && (
                      <p className="text-[11px] text-[#64748B] truncate">
                        {course.tags.join(' · ')}
                      </p>
                    )}
                    </div>
                  </div>

                  <div className="px-5 py-3.5 bg-[#F8FAFC] dark:bg-[#0B1019] border-t border-[#E2E8F0] dark:border-[#1F293D] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectCourse(course)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B0F17] dark:text-[#F8FAFC] hover:text-[#DC2626] transition-colors"
                    >
                      <span>Course Details</span>
                      <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>

                    {course.fileUrl && (
                      <a
                        href={course.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={
                          isDriveFile
                            ? 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-lg transition-colors shadow-sm'
                            : 'inline-flex items-center gap-1 text-xs font-semibold text-[#DC2626] hover:underline'
                        }
                      >
                        <span>{isDriveFile ? 'View File' : 'Open Link'}</span>
                        <ExternalLink className="w-3 h-3" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </>
    );
  };

  // General Hub: Subject-specific courses view
  if (hub === 'general' && selectedSubject) {
    const subjectCourses = hubCourses.filter((c) => c.subject === selectedSubject.id);

    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Breadcrumb Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setFormatFilter('all');
              onSelectSubject(null);
            }}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#475569] dark:text-[#94A3B8] hover:text-[#DC2626] dark:hover:text-[#F8FAFC] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back to General Hub Subjects</span>
          </button>

          <button
            type="button"
            onClick={() => onAddCourseClick('general', selectedSubject.id)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Contribute Course to {selectedSubject.shortCode}</span>
          </button>
        </div>

        {/* Subject Banner */}
        <div className="p-6 sm:p-8 rounded-2xl border bg-[#EEF4FE] dark:bg-[#101A2C] border-[#DCE8FD] dark:border-[#1E2D48]">
          <div className="space-y-2 max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#DC2626]">
              General Hub · {selectedSubject.shortCode}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0B0F17] dark:text-[#F8FAFC]">
              {selectedSubject.name}
            </h1>
            <p className="text-sm leading-relaxed text-[#475569] dark:text-[#94A3B8]">
              {selectedSubject.description}
            </p>
            <p className="text-xs pt-1 text-[#64748B]">
              Focus areas: {selectedSubject.focusAreas.join(' · ')}
            </p>
          </div>
        </div>

        {renderCoursesDirectory(
          subjectCourses,
          `No Approved Courses in ${selectedSubject.name} Yet`,
          selectedSubject.id
        )}
      </div>
    );
  }

  // Specialized Hub: Directly display all approved Computer Science courses (no sub-specialization cards)
  if (hub === 'specialized') {
    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Top Bar: Back & Clear Hub Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBackToMain}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#475569] dark:text-[#94A3B8] hover:text-[#DC2626] dark:hover:text-[#F8FAFC] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back to Academic Hub</span>
          </button>

          {/* Separated Hub Switcher */}
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#F1F5F9] dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D]">
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setFormatFilter('all');
                onSwitchHub('general');
              }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap text-[#64748B] hover:text-[#0B0F17] dark:hover:text-[#F8FAFC]"
            >
              General Hub
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setFormatFilter('all');
                onSwitchHub('specialized');
              }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap bg-[#DC2626] text-white shadow-sm"
            >
              Specialized Hub
            </button>
          </div>
        </div>

        {/* Specialized Hub Hero Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center p-6 sm:p-8 rounded-2xl border bg-[#0B0F17] text-[#F8FAFC] border-[#DC2626]/35">
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#DC2626]">
              <Cpu className="w-4 h-4" aria-hidden="true" />
              <span>Computer Science Specialization</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#F8FAFC]">
              Specialized Hub
            </h1>
            <p className="text-sm sm:text-base leading-relaxed max-w-xl text-[#94A3B8]">
              Unified Computer Science curriculum featuring all approved technical courses, lecture materials, and study guides.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => onAddCourseClick('specialized')}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-lg transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Add Course to Specialized Hub</span>
              </button>
              <span className="text-xs tabular-nums text-[#94A3B8]">
                Computer Science · {hubCourses.length} {hubCourses.length === 1 ? 'Approved Course' : 'Approved Courses'}
              </span>
            </div>
          </div>

          <div className="lg:col-span-5">
            <SpecializedHubIllustration />
          </div>
        </div>

        {/* Computer Science Courses Heading */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-[#0B0F17] dark:text-[#F8FAFC]">
            Computer Science Courses
          </h2>
          <span className="text-xs text-[#64748B] tabular-nums">
            Showing {hubCourses.length} approved {hubCourses.length === 1 ? 'course' : 'courses'}
          </span>
        </div>

        {/* Direct Computer Science Course Cards */}
        {renderCoursesDirectory(
          hubCourses,
          'No Approved Computer Science Courses Yet'
        )}
      </div>
    );
  }

  // General Hub Landing: Subject Cards Grid
  const filteredSubjects = subjects.filter((s) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.shortCode.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.focusAreas.some((f) => f.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Bar: Back & Clear Hub Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToMain}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#475569] dark:text-[#94A3B8] hover:text-[#DC2626] dark:hover:text-[#F8FAFC] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to Academic Hub</span>
        </button>

        {/* Separated Hub Switcher */}
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#F1F5F9] dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D]">
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setFormatFilter('all');
              onSwitchHub('general');
            }}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap bg-white dark:bg-[#0B0F17] text-[#0B0F17] dark:text-[#F8FAFC] shadow-sm"
          >
            General Hub
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setFormatFilter('all');
              onSwitchHub('specialized');
            }}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap text-[#64748B] hover:text-[#0B0F17] dark:hover:text-[#F8FAFC]"
          >
            Specialized Hub
          </button>
        </div>
      </div>

      {/* Visually Distinct General Hub Hero Header */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center p-6 sm:p-8 rounded-2xl border bg-white dark:bg-[#131B28] border-[#DCE8FD] dark:border-[#1E2D48]">
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#DC2626]">
            <BookOpen className="w-4 h-4" aria-hidden="true" />
            <span>Foundational Curriculum Track</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#0B0F17] dark:text-[#F8FAFC]">
            General Hub
          </h1>
          <p className="text-sm sm:text-base leading-relaxed max-w-xl text-[#475569] dark:text-[#94A3B8]">
            Core academic subjects covering Arabic, Math, English, Physics, Mechanics, Social Studies, Religious Education, and National Education. Strictly separated from the Specialized Hub.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => onAddCourseClick('general')}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Add Course to General Hub</span>
            </button>
            <span className="text-xs tabular-nums text-[#64748B]">
              {subjects.length} Subjects · {hubCourses.length} Approved Courses
            </span>
          </div>
        </div>

        <div className="lg:col-span-5">
          <GeneralHubIllustration />
        </div>
      </div>

      {/* Subject Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-[#0B0F17] dark:text-[#F8FAFC]">
          General Academic Subjects
        </h2>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="text"
            placeholder="Filter subjects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] text-[#0B0F17] dark:text-[#F8FAFC] focus:outline-none focus:border-[#DC2626]"
          />
        </div>
      </div>

      {/* Subject Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSubjects.map((subject) => {
          const courseCount = hubCourses.filter((c) => c.subject === subject.id).length;
          return (
            <button
              key={subject.id}
              type="button"
              onClick={() => onSelectSubject(subject)}
              className="group text-left p-6 rounded-2xl border transition-all flex flex-col justify-between gap-4 bg-white dark:bg-[#131B28] border-[#E2E8F0] dark:border-[#1F293D] hover:border-[#0B0F17] dark:hover:border-[#DCE8FD]"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-semibold text-[#475569] dark:text-[#DCE8FD]">
                    {subject.shortCode}
                  </span>
                  <span className="text-[#64748B] tabular-nums">
                    {courseCount} {courseCount === 1 ? 'Course' : 'Courses'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#0B0F17] dark:text-[#F8FAFC] group-hover:text-[#DC2626] transition-colors">
                  {subject.name}
                </h3>

                <p className="text-xs text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                  {subject.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] dark:border-[#1F293D] flex items-center justify-between text-xs">
                <span className="text-[#64748B] truncate pr-2">
                  {subject.focusAreas.join(' · ')}
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-[#DC2626] shrink-0">
                  <span>Open</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
