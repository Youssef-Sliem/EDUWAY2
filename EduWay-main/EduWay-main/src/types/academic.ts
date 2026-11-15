export type HubType = 'general' | 'specialized';

export type SubmissionKind = 'course' | 'news' | 'website' | 'community';

export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export type ResourceFormat = 'link' | 'document' | 'none';

export type ResourceFileType = 'link' | 'pdf' | 'video' | 'doc';

export interface SubjectDefinition {
  id: string;
  hub: HubType;
  name: string;
  shortCode: string;
  description: string;
  focusAreas: string[];
  accentTone: 'blue' | 'red';
}

export interface AcademicSubmission {
  id: string;
  submissionKind: SubmissionKind;
  title: string;
  description: string;
  content?: string;
  hub?: HubType;
  subject?: string;
  category: string;
  coverImageUrl?: string;
  tags?: string[];
  websiteUrl?: string;
  sourceUrl?: string;
  resourceFormat: ResourceFormat;
  fileUrl?: string;
  fileType?: ResourceFileType;
  submitterId: string;
  submitterName: string;
  status: SubmissionStatus;
  reviewedBy?: string;
  reviewedAt?: { seconds: number; nanoseconds?: number } | Date | unknown;
  decisionNote?: string;
  createdAt?: { seconds: number; nanoseconds?: number } | Date | unknown;
  updatedAt?: { seconds: number; nanoseconds?: number } | Date | unknown;
}

export interface OwnerNotification {
  id: string;
  type: 'submission' | 'request' | 'system';
  submissionType?: SubmissionKind;
  submitterName?: string;
  submissionTitle?: string;
  submissionStatus?: SubmissionStatus;
  title: string;
  message: string;
  isRead: boolean;
  relatedId?: string;
  reviewPath?: string;
  createdAt?: { seconds: number; nanoseconds?: number } | Date | unknown;
}
