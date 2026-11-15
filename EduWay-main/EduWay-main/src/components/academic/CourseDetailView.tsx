import React, { useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  ExternalLink,
  FileText,
  Trash2,
  Eye,
  EyeOff,
  Video,
  Globe,
} from 'lucide-react';
import { AcademicSubmission } from '../../types/academic';
import { findSubjectById } from '../../data/academicCatalog';
import { formatTimestamp, isGoogleDriveUrl, isPdfResourceUrl } from '../../utils/resourceValidation';
import { useAuth } from '../../context/AuthContext';
import { deleteAcademicSubmission } from '../../services/academicService';

interface CourseDetailViewProps {
  course: AcademicSubmission;
  onBack: () => void;
  onDeleted?: () => void;
}

export const CourseDetailView: React.FC<CourseDetailViewProps> = ({
  course,
  onBack,
  onDeleted,
}) => {
  const { isOwner } = useAuth();
  const [imageError, setImageError] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const subject = findSubjectById(course.subject);
  const resourceUrl = course.fileUrl || course.websiteUrl;
  const isPdf = isPdfResourceUrl(resourceUrl, course.fileType);
  const isDriveFile = isGoogleDriveUrl(resourceUrl);

  const handleDelete = async () => {
    if (!isOwner) return;
    setIsDeleting(true);
    try {
      await deleteAcademicSubmission(course.id);
      if (onDeleted) onDeleted();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Breadcrumb & Back */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#475569] dark:text-[#94A3B8] hover:text-[#DC2626] dark:hover:text-[#F8FAFC] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>
            Back to{' '}
            {course.hub === 'specialized'
              ? 'Computer Science Courses'
              : subject
              ? subject.name
              : 'Courses'}
          </span>
        </button>

        <div className="flex items-center gap-2 text-xs text-[#64748B] dark:text-[#94A3B8]">
          <span>{course.hub === 'specialized' ? 'Specialized Hub' : 'General Hub'}</span>
          <span aria-hidden="true">/</span>
          <span>
            {course.hub === 'specialized'
              ? 'Computer Science'
              : subject?.name || course.category}
          </span>
        </div>
      </div>

      {/* Main Course Article Container */}
      <article className="bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] rounded-2xl overflow-hidden shadow-sm">
        {/* Cover Image or Clean Vector Fallback */}
        {(() => {
          const trimmedCover = course.coverImageUrl?.trim();
          if (trimmedCover && !imageError) {
            return (
              <div className="w-full aspect-video max-h-[380px] bg-[#F1F5F9] dark:bg-[#0B1019] border-b border-[#E2E8F0] dark:border-[#1F293D] relative overflow-hidden">
                <img
                  src={trimmedCover}
                  alt={course.title}
                  referrerPolicy="no-referrer"
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover"
                />
              </div>
            );
          }
          return (
            <div
              className={`w-full h-36 sm:h-44 flex items-center justify-between px-6 sm:px-10 border-b border-[#E2E8F0] dark:border-[#1F293D] ${
                course.hub === 'specialized'
                  ? 'bg-[#0B0F17] text-[#F8FAFC]'
                  : 'bg-[#EEF4FE] dark:bg-[#101A2C] text-[#0B0F17] dark:text-[#F8FAFC]'
              }`}
            >
              <div className="space-y-1 max-w-xl">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#DC2626]">
                  {course.hub === 'specialized'
                    ? 'CS · SPECIALIZED HUB'
                    : subject?.shortCode || 'GENERAL TRACK'}
                </span>
                <p className="text-sm opacity-80">
                  {course.hub === 'specialized'
                    ? 'Computer Science'
                    : subject?.name || course.category}
                </p>
              </div>
              <BookOpen
                className={`w-12 h-12 shrink-0 ${
                  course.hub === 'specialized' ? 'text-[#DC2626]' : 'text-[#0B0F17]/30 dark:text-[#DCE8FD]/40'
                }`}
                aria-hidden="true"
              />
            </div>
          );
        })()}

        <div className="p-6 sm:p-8 space-y-6">
          {/* Header & Unboxed Metadata */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B] dark:text-[#94A3B8]">
              <span className="font-semibold text-[#DC2626]">
                {course.hub === 'specialized' ? 'Specialized Hub' : 'General Hub'}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {course.hub === 'specialized'
                  ? 'Computer Science'
                  : subject?.name || course.category}
              </span>
              <span aria-hidden="true">·</span>
              <span>By {course.submitterName}</span>
              <span aria-hidden="true">·</span>
              <span>{formatTimestamp(course.createdAt)}</span>
            </div>

            <h1
              className="text-2xl sm:text-3xl font-bold text-[#0B0F17] dark:text-[#F8FAFC] leading-tight"
              style={{ textWrap: 'balance' }}
            >
              {course.title}
            </h1>

            {course.tags && course.tags.length > 0 && (
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Topics: {course.tags.join(' · ')}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="pt-2 border-t border-[#E2E8F0] dark:border-[#1F293D] space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#475569] dark:text-[#94A3B8]">
              Course Overview
            </h2>
            <p className="text-sm sm:text-base text-[#334155] dark:text-[#CBD5E1] leading-relaxed whitespace-pre-line">
              {course.description}
            </p>
          </div>

          {/* Resource Action Bar */}
          {resourceUrl && (
            <div className="p-5 rounded-xl bg-[#F8FAFC] dark:bg-[#0B1019] border border-[#E2E8F0] dark:border-[#1F293D] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2.5 rounded-lg bg-[#DC2626]/10 text-[#DC2626] shrink-0">
                    {isPdf || isDriveFile ? (
                      <FileText className="w-5 h-5" aria-hidden="true" />
                    ) : course.fileType === 'video' ? (
                      <Video className="w-5 h-5" aria-hidden="true" />
                    ) : (
                      <Globe className="w-5 h-5" aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#0B0F17] dark:text-[#F8FAFC]">
                      {isDriveFile
                        ? 'Google Drive File'
                        : isPdf
                        ? 'PDF Course Document'
                        : course.fileType === 'video'
                        ? 'Video Learning Resource'
                        : 'External Course Resource'}
                    </p>
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8] truncate max-w-md">
                      {resourceUrl}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {isPdf && (
                    <button
                      type="button"
                      onClick={() => setShowPdfPreview(!showPdfPreview)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0B0F17] dark:text-[#F8FAFC] bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] hover:border-[#DC2626] rounded-lg transition-colors"
                    >
                      {showPdfPreview ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Hide PDF Viewer</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>View PDF</span>
                        </>
                      )}
                    </button>
                  )}

                  <a
                    href={resourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-lg transition-colors shadow-sm"
                  >
                    <span>{isDriveFile ? 'View File' : 'Open Link'}</span>
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                </div>
              </div>

              {/* Embedded Direct PDF Viewer */}
              {isPdf && showPdfPreview && (
                <div className="space-y-2 pt-2 border-t border-[#E2E8F0] dark:border-[#1F293D]">
                  <iframe
                    src={resourceUrl}
                    title={`PDF Preview: ${course.title}`}
                    className="w-full h-[520px] rounded-lg border border-[#E2E8F0] dark:border-[#1F293D] bg-white"
                  />
                  <p className="text-[11px] text-[#64748B]">
                    If the remote host blocks inline PDF embedding, use the &ldquo;Open Link&rdquo; button above to open the PDF directly in a new tab.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Owner Content Management Action */}
          {isOwner && (
            <div className="pt-4 border-t border-[#E2E8F0] dark:border-[#1F293D] flex items-center justify-between gap-3">
              <span className="text-xs text-[#64748B]">Owner Management Controls</span>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#DC2626] hover:bg-[#DC2626]/10 border border-[#DC2626]/25 rounded-lg transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isDeleting ? 'Removing...' : 'Remove Course'}</span>
              </button>
            </div>
          )}
        </div>
      </article>
    </div>
  );
};
