import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { OWNER_UID } from '../config/owner';
import {
  AcademicSubmission,
  HubType,
  ResourceFileType,
  ResourceFormat,
  SubmissionKind,
  SubmissionStatus,
} from '../types/academic';

export interface CreateAcademicSubmissionInput {
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
}

/**
 * Submits a course, news item, website, or community question to Firestore `/submissions`.
 * - If created by the designated Owner (`OWNER_UID`), publishes immediately (`status: 'approved'`).
 * - If created by a regular member, enforces `status: 'pending'` and creates a single
 *   deterministic notification (`notifications/sub_${submissionId}`) for the Owner.
 */
export async function submitAcademicContent(
  input: CreateAcademicSubmissionInput
): Promise<{ id: string; status: SubmissionStatus }> {
  const isAuthoritativeOwner = input.submitterId === OWNER_UID;
  const initialStatus: SubmissionStatus = isAuthoritativeOwner ? 'approved' : 'pending';

  const submissionsCol = collection(db, 'submissions');
  const newSubmissionRef = doc(submissionsCol);
  const submissionId = newSubmissionRef.id;
  const submissionPath = `submissions/${submissionId}`;

  // Construct clean Firestore payload omitting undefined values
  const payload: Record<string, unknown> = {
    id: submissionId,
    submissionKind: input.submissionKind,
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category.trim(),
    resourceFormat: input.resourceFormat,
    submitterId: input.submitterId,
    submitterName: input.submitterName.trim() || 'Eduway Member',
    status: initialStatus,
    createdAt: serverTimestamp(),
  };

  if (input.content && input.content.trim()) {
    payload.content = input.content.trim();
  }
  if (input.hub) {
    payload.hub = input.hub;
  }
  if (input.subject) {
    payload.subject = input.subject;
  }
  if (input.coverImageUrl && input.coverImageUrl.trim()) {
    payload.coverImageUrl = input.coverImageUrl.trim();
  }
  if (input.tags && input.tags.length > 0) {
    payload.tags = input.tags.slice(0, 10);
  }
  if (input.websiteUrl && input.websiteUrl.trim()) {
    payload.websiteUrl = input.websiteUrl.trim();
  }
  if (input.sourceUrl && input.sourceUrl.trim()) {
    payload.sourceUrl = input.sourceUrl.trim();
  }
  if (input.fileUrl && input.fileUrl.trim()) {
    payload.fileUrl = input.fileUrl.trim();
  }
  if (input.fileType) {
    payload.fileType = input.fileType;
  }

  if (isAuthoritativeOwner) {
    payload.reviewedBy = OWNER_UID;
    payload.reviewedAt = serverTimestamp();
    payload.decisionNote = 'Published directly by Eduway Owner.';
  }

  try {
    await setDoc(newSubmissionRef, payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, submissionPath);
  }

  // Create Owner notification for member submissions using deterministic ID to prevent duplicates
  if (!isAuthoritativeOwner) {
    const notifId = `sub_${submissionId}`;
    const notifPath = `notifications/${notifId}`;
    const kindLabels: Record<SubmissionKind, string> = {
      course: 'Course',
      news: 'Academic News',
      website: 'Useful Website',
      community: 'Community Question',
    };
    const kindLabel = kindLabels[input.submissionKind];

    try {
      await setDoc(doc(db, 'notifications', notifId), {
        id: notifId,
        type: 'submission',
        submissionType: input.submissionKind,
        submitterName: input.submitterName.trim() || 'Eduway Member',
        submissionTitle: input.title.trim(),
        submissionStatus: 'pending',
        title: `New ${kindLabel} Submission: ${input.title.trim()}`,
        message: `${input.submitterName.trim() || 'A member'} submitted a ${kindLabel.toLowerCase()} in ${input.category} awaiting Owner approval.`,
        isRead: false,
        relatedId: submissionId,
        reviewPath: 'owner-dashboard:files',
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, notifPath);
    }
  }

  return { id: submissionId, status: initialStatus };
}

/**
 * Owner-only review decision for any Academic Hub submission.
 */
export async function reviewAcademicSubmission(
  submissionId: string,
  decision: 'approved' | 'rejected',
  decisionNote: string
): Promise<void> {
  const path = `submissions/${submissionId}`;
  let submitterId = '';
  let rawTitle = 'Untitled Submission';
  let submissionKind: SubmissionKind = 'course';

  try {
    const existingSnap = await getDoc(doc(db, 'submissions', submissionId));
    if (existingSnap.exists()) {
      const data = existingSnap.data();
      submitterId = typeof data.submitterId === 'string' ? data.submitterId : '';
      if (typeof data.title === 'string' && data.title.trim()) {
        rawTitle = data.title.trim().slice(0, 150);
      }
      if (
        data.submissionKind === 'course' ||
        data.submissionKind === 'news' ||
        data.submissionKind === 'website' ||
        data.submissionKind === 'community'
      ) {
        submissionKind = data.submissionKind;
      }
    }
  } catch {
    // Non-critical lookup failure; continue with submission update
  }

  try {
    await updateDoc(doc(db, 'submissions', submissionId), {
      status: decision,
      reviewedBy: OWNER_UID,
      reviewedAt: serverTimestamp(),
      decisionNote: decisionNote.trim(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }

  // Sync deterministic Owner notification status if it exists
  const notifId = `sub_${submissionId}`;
  try {
    await updateDoc(doc(db, 'notifications', notifId), {
      submissionStatus: decision,
      isRead: true,
    });
  } catch {
    // Notification may not exist for legacy or Owner-created records; ignore safely
  }

  // Notify the submitting student ONLY (never notify the Owner account)
  if (submitterId && submitterId !== OWNER_UID) {
    const kindLabels: Record<SubmissionKind, string> = {
      course: 'Course',
      news: 'Academic News',
      website: 'Useful Website',
      community: 'Community Question',
    };
    const kindLabel = kindLabels[submissionKind];
    const trimmedNote = decisionNote.trim();
    const title =
      decision === 'approved'
        ? `${kindLabel} Approved: ${rawTitle}`.slice(0, 200)
        : `${kindLabel} Declined: ${rawTitle}`.slice(0, 200);

    const message =
      decision === 'approved'
        ? `Your submitted ${kindLabel.toLowerCase()} "${rawTitle}" was approved and published in Academic Hub.${trimmedNote ? ` Owner note: ${trimmedNote}` : ''}`
        : `Your submitted ${kindLabel.toLowerCase()} "${rawTitle}" was declined.${trimmedNote ? ` Reason: ${trimmedNote}` : ' Please review feedback and adjust your submission if needed.'}`;

    const studentNotifId = `subrev_${submissionId}`;
    const studentNotifRef = doc(db, 'studentNotifications', studentNotifId);
    try {
      const existingStudentNotif = await getDoc(studentNotifRef);
      if (!existingStudentNotif.exists()) {
        await setDoc(studentNotifRef, {
          id: studentNotifId,
          userId: submitterId,
          category: 'submission',
          title,
          message: message.slice(0, 1000),
          itemTitle: rawTitle,
          decision,
          targetPage: 'academic-hub',
          relatedId: submissionId,
          isRead: false,
          createdAt: serverTimestamp(),
        });
      } else {
        await updateDoc(studentNotifRef, {
          title,
          message: message.slice(0, 1000),
          itemTitle: rawTitle,
          decision,
          isRead: false,
        });
      }
    } catch {
      // Non-critical student notification write; submission decision succeeded
    }
  }
}

/**
 * Owner-only delete action for managing published or rejected content.
 */
export async function deleteAcademicSubmission(submissionId: string): Promise<void> {
  const path = `submissions/${submissionId}`;
  try {
    await deleteDoc(doc(db, 'submissions', submissionId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

/**
 * Subscribes to all approved public Academic Hub items.
 * Explicitly queries `where('status', '==', 'approved')` to align with strict Firestore list rules.
 */
export function subscribeApprovedAcademicContent(
  onData: (items: AcademicSubmission[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, 'submissions'),
    where('status', '==', 'approved'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: AcademicSubmission[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          ...data,
          id: docSnap.id,
          submissionKind: (data.submissionKind as SubmissionKind) || 'course',
          resourceFormat: data.resourceFormat || (data.fileUrl ? 'link' : 'none'),
        } as AcademicSubmission);
      });
      onData(items);
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}

/**
 * Subscribes to the signed-in user's own submissions so they can track pending/approved/rejected status.
 */
export function subscribeMyAcademicSubmissions(
  uid: string,
  onData: (items: AcademicSubmission[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, 'submissions'),
    where('submitterId', '==', uid),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: AcademicSubmission[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          ...data,
          id: docSnap.id,
          submissionKind: (data.submissionKind as SubmissionKind) || 'course',
          resourceFormat: data.resourceFormat || (data.fileUrl ? 'link' : 'none'),
        } as AcademicSubmission);
      });
      onData(items);
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}
