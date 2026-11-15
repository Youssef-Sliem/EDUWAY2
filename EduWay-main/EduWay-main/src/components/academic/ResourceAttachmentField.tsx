import React, { useState } from 'react';
import {
  Link as LinkIcon,
  FolderOpen,
  ExternalLink,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { Input } from '../ui/Input';
import { ResourceFileType, ResourceFormat } from '../../types/academic';
import {
  validateGoogleDriveUrl,
  validateHttpUrl,
} from '../../utils/resourceValidation';

export type AttachmentMode = 'link' | 'gdrive' | 'none';

export interface ResourceAttachmentValue {
  resourceFormat: ResourceFormat;
  attachmentMode?: AttachmentMode;
  fileUrl: string;
  fileType: ResourceFileType;
}

interface ResourceAttachmentFieldProps {
  value: ResourceAttachmentValue;
  onChange: (next: ResourceAttachmentValue) => void;
  required?: boolean;
  label?: string;
  error?: string;
}

export const ResourceAttachmentField: React.FC<ResourceAttachmentFieldProps> = ({
  value,
  onChange,
  required = true,
  label = 'Educational Resource Attachment',
  error,
}) => {
  const [urlValidationError, setUrlValidationError] = useState<string | null>(null);

  const activeTab: AttachmentMode =
    value.resourceFormat === 'none'
      ? 'none'
      : value.attachmentMode === 'gdrive'
      ? 'gdrive'
      : 'link';

  const handleModeChange = (mode: AttachmentMode) => {
    setUrlValidationError(null);
    if (mode === 'none') {
      onChange({
        resourceFormat: 'none',
        attachmentMode: 'none',
        fileUrl: '',
        fileType: 'link',
      });
    } else if (mode === 'gdrive') {
      const existingCheck = value.fileUrl.trim() ? validateGoogleDriveUrl(value.fileUrl) : null;
      onChange({
        resourceFormat: 'link',
        attachmentMode: 'gdrive',
        fileUrl: existingCheck?.valid ? value.fileUrl : '',
        fileType: 'doc',
      });
    } else {
      onChange({
        resourceFormat: 'link',
        attachmentMode: 'link',
        fileUrl: value.fileUrl || '',
        fileType: value.fileType === 'doc' ? 'link' : value.fileType || 'link',
      });
    }
  };

  const handleUrlChange = (raw: string, mode: 'link' | 'gdrive') => {
    if (!raw.trim()) {
      setUrlValidationError(null);
      onChange({
        resourceFormat: 'link',
        attachmentMode: mode,
        fileUrl: raw,
        fileType: mode === 'gdrive' ? 'doc' : 'link',
      });
      return;
    }

    const res = mode === 'gdrive' ? validateGoogleDriveUrl(raw) : validateHttpUrl(raw);
    if (!res.valid) {
      setUrlValidationError(res.error || 'Invalid URL');
      onChange({
        resourceFormat: 'link',
        attachmentMode: mode,
        fileUrl: raw,
        fileType: mode === 'gdrive' ? 'doc' : 'link',
      });
    } else {
      setUrlValidationError(null);
      onChange({
        resourceFormat: 'link',
        attachmentMode: mode,
        fileUrl: raw,
        fileType: mode === 'gdrive' ? 'doc' : res.detectedType || 'link',
      });
    }
  };

  const linkCheck =
    activeTab === 'link' && value.fileUrl.trim() ? validateHttpUrl(value.fileUrl) : null;
  const gdriveCheck =
    activeTab === 'gdrive' && value.fileUrl.trim()
      ? validateGoogleDriveUrl(value.fileUrl)
      : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="block text-xs font-semibold tracking-wide uppercase text-[#475569] dark:text-[#94A3B8]">
          {label}
          {required && <span className="text-[#DC2626] ml-1">*</span>}
        </span>
        <span className="text-[11px] text-[#64748B]">
          {required ? 'Choose Resource Link or Google Drive File' : 'Optional attachment'}
        </span>
      </div>

      {/* Format Segmented Control */}
      <div
        role="group"
        aria-label="Resource attachment format"
        className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#F1F5F9] dark:bg-[#0B1019] border border-[#E2E8F0] dark:border-[#1F293D] w-full sm:w-fit"
      >
        <button
          type="button"
          onClick={() => handleModeChange('link')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'link'
              ? 'bg-white dark:bg-[#131B28] text-[#0B0F17] dark:text-[#F8FAFC] shadow-sm border border-[#E2E8F0] dark:border-[#2D3D58]'
              : 'text-[#64748B] hover:text-[#0B0F17] dark:hover:text-[#F8FAFC]'
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5 text-[#DC2626]" aria-hidden="true" />
          <span>Resource Link</span>
        </button>

        <button
          type="button"
          onClick={() => handleModeChange('gdrive')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'gdrive'
              ? 'bg-white dark:bg-[#131B28] text-[#0B0F17] dark:text-[#F8FAFC] shadow-sm border border-[#E2E8F0] dark:border-[#2D3D58]'
              : 'text-[#64748B] hover:text-[#0B0F17] dark:hover:text-[#F8FAFC]'
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5 text-[#DC2626]" aria-hidden="true" />
          <span>Google Drive File</span>
        </button>

        {!required && (
          <button
            type="button"
            onClick={() => handleModeChange('none')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'none'
                ? 'bg-white dark:bg-[#131B28] text-[#0B0F17] dark:text-[#F8FAFC] shadow-sm border border-[#E2E8F0] dark:border-[#2D3D58]'
                : 'text-[#64748B] hover:text-[#0B0F17] dark:hover:text-[#F8FAFC]'
            }`}
          >
            No Attachment
          </button>
        )}
      </div>

      {/* OPTION A: GENERAL RESOURCE LINK */}
      {activeTab === 'link' && (
        <div className="space-y-2.5 p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#0B1019] border border-[#E2E8F0] dark:border-[#1F293D]">
          <Input
            label="Resource URL (HTTP or HTTPS)"
            type="url"
            placeholder="https://example.edu/materials/lecture-notes.pdf"
            icon={<LinkIcon className="w-4 h-4" />}
            value={value.fileUrl}
            onChange={(e) => handleUrlChange(e.target.value, 'link')}
            error={urlValidationError || error}
            hint="Videos, PDFs, or educational websites"
            required={required}
          />

          {linkCheck?.valid && linkCheck.normalizedUrl && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>
                  Valid{' '}
                  {linkCheck.detectedType === 'pdf'
                    ? 'PDF link'
                    : linkCheck.detectedType === 'video'
                    ? 'video link'
                    : 'external web link'}
                </span>
              </div>
              <a
                href={linkCheck.normalizedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-[#DC2626] hover:underline"
              >
                <span>Test Open Link</span>
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* OPTION B: GOOGLE DRIVE FILE LINK */}
      {activeTab === 'gdrive' && (
        <div className="space-y-3 p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#0B1019] border border-[#E2E8F0] dark:border-[#1F293D]">
          <Input
            label="Google Drive File Link"
            type="url"
            placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
            icon={<FolderOpen className="w-4 h-4" />}
            value={value.fileUrl}
            onChange={(e) => handleUrlChange(e.target.value, 'gdrive')}
            error={urlValidationError || error}
            hint="Supports Google Drive files, folders, Docs, Sheets, and Slides sharing links"
            required={required}
          />

          {gdriveCheck?.valid && gdriveCheck.normalizedUrl && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Valid Google Drive sharing link</span>
              </div>
              <a
                href={gdriveCheck.normalizedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-[#DC2626] hover:underline"
              >
                <span>Test View File</span>
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </a>
            </div>
          )}

          <div
            role="note"
            className="p-3.5 rounded-xl bg-[#EEF4FE] dark:bg-[#101A2C] border border-[#DCE8FD] dark:border-[#1E2D48] space-y-1 text-xs"
          >
            <div className="flex items-center gap-2 font-semibold text-[#0B0F17] dark:text-[#F8FAFC]">
              <Info className="w-4 h-4 text-[#DC2626] shrink-0" aria-hidden="true" />
              <span>Google Drive Sharing Permissions Reminder</span>
            </div>
            <p className="text-[#475569] dark:text-[#94A3B8] leading-relaxed">
              Before submitting, ensure your Google Drive file&apos;s sharing access is set to{' '}
              <strong className="text-[#0B0F17] dark:text-[#F8FAFC]">
                &ldquo;Anyone with the link&rdquo; (Viewer)
              </strong>{' '}
              or explicitly shared with your intended viewers so students and the Owner can open it.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
