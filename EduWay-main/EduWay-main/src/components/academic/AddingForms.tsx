import React, { useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Newspaper,
  Globe,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Tag,
  Image as ImageIcon,
  Shield,
  Clock,
  Lock,
} from 'lucide-react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { ResourceAttachmentField, ResourceAttachmentValue } from './ResourceAttachmentField';
import {
  COMMUNITY_SUBJECTS,
  NEWS_CATEGORIES,
  SPECIALIZED_SUBJECT_ID,
  SPECIALIZED_SUBJECT_NAME,
  WEBSITE_CATEGORIES,
  getSubjectsByHub,
} from '../../data/academicCatalog';
import { HubType, SubmissionKind } from '../../types/academic';
import { submitAcademicContent } from '../../services/academicService';
import { useAuth } from '../../context/AuthContext';
import {
  validateGoogleDriveUrl,
  validateHttpUrl,
} from '../../utils/resourceValidation';

interface AddingFormsProps {
  actionType: SubmissionKind;
  defaultHub?: HubType;
  defaultSubjectId?: string;
  onCancel: () => void;
  onSuccess: (status: 'approved' | 'pending', title: string) => void;
  onSignInRequested: () => void;
}

export const AddingForms: React.FC<AddingFormsProps> = ({
  actionType,
  defaultHub = 'general',
  defaultSubjectId = '',
  onCancel,
  onSuccess,
  onSignInRequested,
}) => {
  const { currentUser, userProfile, isOwner } = useAuth();

  // Shared form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [hub, setHub] = useState<HubType>(defaultHub);
  const [subjectId, setSubjectId] = useState(defaultSubjectId);
  const [category, setCategory] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [tagsRaw, setTagsRaw] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');

  const [attachment, setAttachment] = useState<ResourceAttachmentValue>({
    resourceFormat: actionType === 'course' ? 'link' : 'none',
    attachmentMode: actionType === 'course' ? 'link' : 'none',
    fileUrl: '',
    fileType: 'link',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hubSubjects = getSubjectsByHub(hub);
  const publicSubmitterName =
    userProfile?.nickname ||
    userProfile?.fullName ||
    currentUser?.displayName ||
    'Eduway Member';

  const actionMeta: Record<
    SubmissionKind,
    { heading: string; subtitle: string; icon: React.ReactNode }
  > = {
    course: {
      heading: 'Add Course',
      subtitle: 'Contribute a structured course or learning module to General Hub or Specialized Hub.',
      icon: <BookOpen className="w-5 h-5 text-[#DC2626]" aria-hidden="true" />,
    },
    news: {
      heading: 'Add News',
      subtitle: 'Share verified technology news, academic announcements, or curriculum updates.',
      icon: <Newspaper className="w-5 h-5 text-[#DC2626]" aria-hidden="true" />,
    },
    website: {
      heading: 'Add Website',
      subtitle: 'Suggest an authoritative educational simulator, documentation portal, or research site.',
      icon: <Globe className="w-5 h-5 text-[#DC2626]" aria-hidden="true" />,
    },
    community: {
      heading: 'Ask Community',
      subtitle: 'Post a thoughtful academic or engineering question for peer discussion and guidance.',
      icon: <MessageSquare className="w-5 h-5 text-[#DC2626]" aria-hidden="true" />,
    },
  };

  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] shadow-sm space-y-5 text-center">
        <div className="w-12 h-12 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/20 text-[#DC2626] flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" aria-hidden="true" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-[#0B0F17] dark:text-[#F8FAFC]">
            Sign In Required to Contribute
          </h2>
          <p className="text-sm text-[#475569] dark:text-[#94A3B8]">
            Please sign in with your Eduway account to submit courses, news, websites, or community questions.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onSignInRequested}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-lg transition-colors"
          >
            Go to Sign In
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-[#475569] dark:text-[#94A3B8] hover:text-[#0B0F17] dark:hover:text-[#F8FAFC] border border-[#E2E8F0] dark:border-[#1F293D] rounded-lg transition-colors"
          >
            Back to Academic Hub
          </button>
        </div>
      </div>
    );
  }

  const handleHubChange = (newHub: HubType) => {
    setHub(newHub);
    setSubjectId('');
    setFieldErrors((prev) => ({ ...prev, subjectId: '' }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!title.trim() || title.trim().length < 2) {
      errors.title = 'Please enter a descriptive title (at least 2 characters).';
    } else if (title.trim().length > 150) {
      errors.title = 'Title must be 150 characters or fewer.';
    }

    if (!description.trim() || description.trim().length < 5) {
      errors.description = 'Please provide a clear description (at least 5 characters).';
    }

    if (coverImageUrl.trim()) {
      const imgCheck = validateHttpUrl(coverImageUrl);
      if (!imgCheck.valid) {
        errors.coverImageUrl = imgCheck.error || 'Cover image URL must be a valid HTTP/HTTPS link.';
      }
    }

    if (actionType === 'course') {
      if (hub === 'general' && !subjectId) {
        errors.subjectId = 'Please select a subject within General Hub.';
      }
      if (attachment.resourceFormat === 'none') {
        errors.attachment = 'Courses require a resource link or supported document.';
      }
    }

    if (actionType === 'news') {
      if (!category) errors.category = 'Please select a news category.';
      if (!content.trim() || content.trim().length < 10) {
        errors.content = 'Please write the news summary or article content (at least 10 characters).';
      }
      if (sourceUrl.trim()) {
        const srcCheck = validateHttpUrl(sourceUrl);
        if (!srcCheck.valid) {
          errors.sourceUrl = srcCheck.error || 'Source link must be a valid HTTP/HTTPS URL.';
        }
      }
    }

    if (actionType === 'website') {
      if (!category) errors.category = 'Please select a website category.';
      const siteCheck = validateHttpUrl(websiteUrl);
      if (!siteCheck.valid) {
        errors.websiteUrl = siteCheck.error || 'A valid HTTP or HTTPS website URL is required.';
      }
    }

    if (actionType === 'community') {
      if (!category) errors.category = 'Please select a subject or category for your question.';
    }

    // Validate attachment option consistently across all forms
    if (attachment.resourceFormat === 'link') {
      if (attachment.attachmentMode === 'gdrive') {
        const driveCheck = validateGoogleDriveUrl(attachment.fileUrl);
        if (!driveCheck.valid) {
          errors.attachment =
            driveCheck.error || 'Please enter a valid Google Drive file sharing link.';
        }
      } else {
        const linkCheck = validateHttpUrl(attachment.fileUrl);
        if (!linkCheck.valid) {
          errors.attachment = linkCheck.error || 'Please enter a valid HTTP or HTTPS link.';
        }
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const selectedSubject =
        hub === 'general' ? hubSubjects.find((s) => s.id === subjectId) : undefined;
      const parsedTags = tagsRaw
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
        .slice(0, 10);

      const resolvedCourseSubject =
        hub === 'specialized' ? SPECIALIZED_SUBJECT_ID : subjectId;

      const resolvedCategory =
        actionType === 'course'
          ? hub === 'specialized'
            ? SPECIALIZED_SUBJECT_NAME
            : selectedSubject?.name || subjectId
          : category;

      const resolvedFileUrl =
        attachment.resourceFormat === 'link'
          ? attachment.attachmentMode === 'gdrive'
            ? validateGoogleDriveUrl(attachment.fileUrl).normalizedUrl || attachment.fileUrl.trim()
            : validateHttpUrl(attachment.fileUrl).normalizedUrl || attachment.fileUrl.trim()
          : actionType === 'website'
          ? validateHttpUrl(websiteUrl).normalizedUrl || websiteUrl.trim()
          : '';

      const normalizedCoverImageUrl = coverImageUrl.trim()
        ? validateHttpUrl(coverImageUrl).normalizedUrl || coverImageUrl.trim()
        : undefined;

      const result = await submitAcademicContent({
        submissionKind: actionType,
        title,
        description,
        content: actionType === 'news' ? content : undefined,
        hub: actionType === 'course' ? hub : undefined,
        subject: actionType === 'course' ? resolvedCourseSubject : undefined,
        category: resolvedCategory,
        coverImageUrl: normalizedCoverImageUrl,
        tags: actionType === 'course' ? parsedTags : undefined,
        websiteUrl:
          actionType === 'website'
            ? validateHttpUrl(websiteUrl).normalizedUrl || websiteUrl.trim()
            : undefined,
        sourceUrl:
          actionType === 'news' && sourceUrl.trim()
            ? validateHttpUrl(sourceUrl).normalizedUrl || sourceUrl.trim()
            : undefined,
        resourceFormat: attachment.resourceFormat,
        fileUrl: resolvedFileUrl || undefined,
        fileType: attachment.resourceFormat === 'link' ? attachment.fileType : 'link',
        submitterId: currentUser.uid,
        submitterName: publicSubmitterName,
      });

      onSuccess(result.status as 'approved' | 'pending', title.trim());
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Failed to submit content. Please verify your network connection and permissions.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const meta = actionMeta[actionType];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex items-center gap-2 text-xs font-semibold text-[#475569] dark:text-[#94A3B8] hover:text-[#DC2626] dark:hover:text-[#F8FAFC] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        <span>Back to Academic Hub</span>
      </button>

      <div className="bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#DC2626]" aria-hidden="true" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#E2E8F0] dark:border-[#1F293D]">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/20 shrink-0">
              {meta.icon}
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-[#0B0F17] dark:text-[#F8FAFC]">
                {meta.heading}
              </h2>
              <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94A3B8]">
                {meta.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold shrink-0">
            {isOwner ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                <Shield className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Owner Direct Publish</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[#475569] dark:text-[#94A3B8]">
                <Clock className="w-3.5 h-3.5 text-[#DC2626]" aria-hidden="true" />
                <span>Pending Owner Review</span>
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Title */}
          <Input
            label={
              actionType === 'course'
                ? 'Course Title'
                : actionType === 'news'
                ? 'News Title'
                : actionType === 'website'
                ? 'Website Name'
                : 'Question Title'
            }
            required
            placeholder={
              actionType === 'course'
                ? 'e.g. Linear Algebra for Machine Learning'
                : actionType === 'news'
                ? 'e.g. Spring Robotics Hackathon Registration Open'
                : actionType === 'website'
                ? 'e.g. MIT OpenCourseWare'
                : 'e.g. How do pull-up resistors prevent floating inputs on GPIO pins?'
            }
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setFieldErrors((p) => ({ ...p, title: '' }));
            }}
            error={fieldErrors.title}
          />

          {/* Course Hub + Subject Separation */}
          {actionType === 'course' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="block text-xs font-semibold tracking-wide uppercase text-[#475569] dark:text-[#94A3B8]">
                  Hub Selection <span className="text-[#DC2626]">*</span>
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleHubChange('general')}
                    className={`py-2.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                      hub === 'general'
                        ? 'bg-[#EEF4FE] dark:bg-[#101A2C] text-[#0B0F17] dark:text-[#F8FAFC] border-[#0B0F17] dark:border-[#DCE8FD]'
                        : 'bg-white dark:bg-[#0B1019] text-[#64748B] border-[#E2E8F0] dark:border-[#1F293D]'
                    }`}
                  >
                    General Hub
                  </button>
                  <button
                    type="button"
                    onClick={() => handleHubChange('specialized')}
                    className={`py-2.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                      hub === 'specialized'
                        ? 'bg-[#DC2626]/10 text-[#DC2626] dark:text-[#F87171] border-[#DC2626]'
                        : 'bg-white dark:bg-[#0B1019] text-[#64748B] border-[#E2E8F0] dark:border-[#1F293D]'
                    }`}
                  >
                    Specialized Hub
                  </button>
                </div>
              </div>

              {hub === 'general' ? (
                <Select
                  label="General Subject"
                  required
                  placeholder="Select subject"
                  value={subjectId}
                  onChange={(e) => {
                    setSubjectId(e.target.value);
                    setFieldErrors((p) => ({ ...p, subjectId: '' }));
                  }}
                  options={hubSubjects.map((s) => ({ value: s.id, label: s.name }))}
                  error={fieldErrors.subjectId}
                />
              ) : (
                <div className="space-y-1.5">
                  <span className="block text-xs font-semibold tracking-wide uppercase text-[#475569] dark:text-[#94A3B8]">
                    Specialization
                  </span>
                  <div className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] dark:border-[#1F293D] bg-[#F8FAFC] dark:bg-[#0B1019] text-sm font-semibold text-[#0B0F17] dark:text-[#F8FAFC]">
                    {SPECIALIZED_SUBJECT_NAME}
                  </div>
                  <p className="text-[11px] text-[#64748B]">
                    Added directly to Specialized Hub ({SPECIALIZED_SUBJECT_NAME}).
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Category Select for News, Website, Community */}
          {actionType === 'news' && (
            <Select
              label="News Category"
              required
              placeholder="Choose news category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setFieldErrors((p) => ({ ...p, category: '' }));
              }}
              options={NEWS_CATEGORIES.map((c) => ({ value: c, label: c }))}
              error={fieldErrors.category}
            />
          )}

          {actionType === 'website' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Website URL"
                type="url"
                required
                icon={<Globe className="w-4 h-4" />}
                placeholder="https://ocw.mit.edu"
                value={websiteUrl}
                onChange={(e) => {
                  setWebsiteUrl(e.target.value);
                  setFieldErrors((p) => ({ ...p, websiteUrl: '' }));
                }}
                error={fieldErrors.websiteUrl}
              />
              <Select
                label="Website Category"
                required
                placeholder="Choose category"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setFieldErrors((p) => ({ ...p, category: '' }));
                }}
                options={WEBSITE_CATEGORIES.map((c) => ({ value: c, label: c }))}
                error={fieldErrors.category}
              />
            </div>
          )}

          {actionType === 'community' && (
            <Select
              label="Subject or Category"
              required
              placeholder="Select relevant subject area"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setFieldErrors((p) => ({ ...p, category: '' }));
              }}
              options={COMMUNITY_SUBJECTS.map((c) => ({ value: c, label: c }))}
              error={fieldErrors.category}
            />
          )}

          {/* Description / Details */}
          <div className="space-y-1.5">
            <label
              htmlFor="adding-description"
              className="block text-xs font-semibold tracking-wide uppercase text-[#475569] dark:text-[#94A3B8]"
            >
              {actionType === 'news'
                ? 'Short Description'
                : actionType === 'community'
                ? 'Question Details'
                : 'Description'}{' '}
              <span className="text-[#DC2626]">*</span>
            </label>
            <textarea
              id="adding-description"
              rows={actionType === 'community' ? 4 : 3}
              placeholder={
                actionType === 'community'
                  ? 'Describe what you tried, relevant equations or code context, and where you need help...'
                  : 'Provide a concise overview for students...'
              }
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setFieldErrors((p) => ({ ...p, description: '' }));
              }}
              className={`w-full bg-white dark:bg-[#0B1019] text-[#0B0F17] dark:text-[#F8FAFC] placeholder-[#94A3B8] dark:placeholder-[#475569] text-sm rounded-lg border px-3.5 py-2.5 outline-none transition-all ${
                fieldErrors.description
                  ? 'border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20'
                  : 'border-[#E2E8F0] dark:border-[#1F293D] focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20'
              }`}
            />
            {fieldErrors.description && (
              <p className="flex items-center gap-1.5 text-xs text-[#DC2626] font-medium" role="alert">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.description}</span>
              </p>
            )}
          </div>

          {/* News Full Content */}
          {actionType === 'news' && (
            <div className="space-y-1.5">
              <label
                htmlFor="news-content"
                className="block text-xs font-semibold tracking-wide uppercase text-[#475569] dark:text-[#94A3B8]"
              >
                News Content / Full Summary <span className="text-[#DC2626]">*</span>
              </label>
              <textarea
                id="news-content"
                rows={4}
                placeholder="Write the full announcement, key dates, or research highlights..."
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setFieldErrors((p) => ({ ...p, content: '' }));
                }}
                className={`w-full bg-white dark:bg-[#0B1019] text-[#0B0F17] dark:text-[#F8FAFC] placeholder-[#94A3B8] dark:placeholder-[#475569] text-sm rounded-lg border px-3.5 py-2.5 outline-none transition-all ${
                  fieldErrors.content
                    ? 'border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20'
                    : 'border-[#E2E8F0] dark:border-[#1F293D] focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20'
                }`}
              />
              {fieldErrors.content && (
                <p className="flex items-center gap-1.5 text-xs text-[#DC2626] font-medium" role="alert">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.content}</span>
                </p>
              )}
            </div>
          )}

          {/* Tags for Course */}
          {actionType === 'course' && (
            <Input
              label="Tags"
              icon={<Tag className="w-4 h-4" />}
              placeholder="e.g. calculus, vectors, beginner (comma-separated)"
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
              hint="Up to 10 comma-separated tags"
            />
          )}

          {/* Optional Cover Image URL & Source Link */}
          {actionType !== 'community' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={actionType === 'course' ? 'Course Cover Image URL' : 'Cover Image URL'}
                type="url"
                icon={<ImageIcon className="w-4 h-4" />}
                placeholder="https://example.edu/cover.png"
                value={coverImageUrl}
                onChange={(e) => {
                  setCoverImageUrl(e.target.value);
                  setFieldErrors((p) => ({ ...p, coverImageUrl: '' }));
                }}
                hint={
                  actionType === 'course'
                    ? 'Optional · HTTPS image URL (16:9 thumbnail)'
                    : 'Optional'
                }
                error={fieldErrors.coverImageUrl}
              />

              {actionType === 'news' && (
                <Input
                  label="Source Link"
                  type="url"
                  icon={<Globe className="w-4 h-4" />}
                  placeholder="https://ieee.org/article"
                  value={sourceUrl}
                  onChange={(e) => {
                    setSourceUrl(e.target.value);
                    setFieldErrors((p) => ({ ...p, sourceUrl: '' }));
                  }}
                  hint="Optional"
                  error={fieldErrors.sourceUrl}
                />
              )}
            </div>
          )}

          {/* Consistent Resource Format Selector */}
          <ResourceAttachmentField
            value={attachment}
            onChange={(next) => {
              setAttachment(next);
              setFieldErrors((p) => ({ ...p, attachment: '' }));
            }}
            required={actionType === 'course'}
            label={
              actionType === 'website'
                ? 'Additional Educational Resource Attachment'
                : actionType === 'community'
                ? 'Optional Attachment'
                : 'Resource Format & Attachment'
            }
            error={fieldErrors.attachment}
          />

          {/* Public attribution preview */}
          <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#0B1019] border border-[#E2E8F0] dark:border-[#1F293D] flex flex-wrap items-center justify-between gap-2 text-xs text-[#64748B] dark:text-[#94A3B8]">
            <span>
              Public attribution: <strong className="text-[#0B0F17] dark:text-[#F8FAFC]">{publicSubmitterName}</strong>
            </span>
            <span>Private account email &amp; cohort details remain hidden</span>
          </div>

          {submitError && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/25 text-xs text-[#DC2626] flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-[#475569] dark:text-[#94A3B8] hover:text-[#0B0F17] dark:hover:text-[#F8FAFC] border border-[#E2E8F0] dark:border-[#1F293D] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <div className="w-full sm:w-auto sm:min-w-[210px]">
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  <span>
                    {isOwner ? 'Publish Immediately' : 'Submit for Owner Approval'}
                  </span>
                </span>
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
