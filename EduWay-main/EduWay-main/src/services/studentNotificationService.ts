import {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  updateDoc,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { OWNER_UID } from '../config/owner';
import { ChallengeNotification } from '../types/challenge';
import { StudentNotificationItem } from '../types/notification';

function getTimestampMillis(value: unknown): number {
  if (!value) return 0;
  if (typeof value === 'object' && value !== null && 'seconds' in value) {
    return Number((value as { seconds: number }).seconds) * 1000;
  }
  if (value instanceof Date) {
    return value.getTime();
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export function formatStudentNotificationDateTime(value: unknown): string {
  if (!value) return 'Just now';
  try {
    const millis = getTimestampMillis(value);
    if (!millis) return 'Just now';
    return new Date(millis).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return 'Recent';
  }
}

/**
 * Student-only real-time notification subscription.
 * Strictly returns an empty list if unauthenticated or if the active user is the Owner.
 * Merges `/studentNotifications` and legacy `/challengeNotifications` without composite indexes
 * and sorts client-side newest first.
 */
export function subscribeStudentNotifications(
  uid: string,
  onData: (items: StudentNotificationItem[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (!uid || uid === OWNER_UID) {
    onData([]);
    return () => {};
  }

  let primaryItems: StudentNotificationItem[] = [];
  let legacyItems: ChallengeNotification[] = [];

  const emitMerged = () => {
    const coveredChallengeAnswerIds = new Set<string>();
    for (const item of primaryItems) {
      if (item.id.startsWith('chal_')) {
        coveredChallengeAnswerIds.add(item.id.slice(5));
      }
    }

    const mappedLegacy: StudentNotificationItem[] = [];
    for (const item of legacyItems) {
      const answerId =
        item.answerId || (item.id.startsWith('ans_') ? item.id.slice(4) : item.id);
      if (coveredChallengeAnswerIds.has(answerId)) {
        continue;
      }
      mappedLegacy.push({
        id: item.id,
        userId: item.userId,
        category: 'challenge',
        title: item.title,
        message: item.message,
        itemTitle: item.challengeTitle,
        decision: item.outcome,
        pointsEarned: item.pointsEarned,
        targetPage: 'challenge-hub',
        relatedId: item.challengeId,
        isRead: Boolean(item.isRead),
        createdAt: item.createdAt,
        sourceCollection: 'challengeNotifications',
      });
    }

    const merged = [...primaryItems, ...mappedLegacy].sort(
      (a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt)
    );
    onData(merged);
  };

  const primaryQuery = query(
    collection(db, 'studentNotifications'),
    where('userId', '==', uid)
  );
  const legacyQuery = query(
    collection(db, 'challengeNotifications'),
    where('userId', '==', uid)
  );

  const unsubPrimary = onSnapshot(
    primaryQuery,
    (snap) => {
      const next: StudentNotificationItem[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        next.push({
          ...data,
          id: docSnap.id,
          isRead: Boolean(data.isRead),
          sourceCollection: 'studentNotifications',
        } as StudentNotificationItem);
      });
      primaryItems = next;
      emitMerged();
    },
    (err) => {
      if (onError) onError(err);
    }
  );

  const unsubLegacy = onSnapshot(
    legacyQuery,
    (snap) => {
      const next: ChallengeNotification[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        next.push({
          ...data,
          id: docSnap.id,
        } as ChallengeNotification);
      });
      legacyItems = next;
      emitMerged();
    },
    (err) => {
      if (onError) onError(err);
    }
  );

  return () => {
    unsubPrimary();
    unsubLegacy();
  };
}

/**
 * Marks a single student notification as read in its backing collection.
 */
export async function markStudentNotificationAsRead(
  item: Pick<StudentNotificationItem, 'id' | 'sourceCollection' | 'isRead'>
): Promise<void> {
  if (item.isRead) return;
  const path = `${item.sourceCollection}/${item.id}`;
  try {
    await updateDoc(doc(db, item.sourceCollection, item.id), {
      isRead: true,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

/**
 * Marks all unread notifications for the signed-in student as read using chunked batches.
 */
export async function markAllStudentNotificationsAsRead(
  items: StudentNotificationItem[]
): Promise<void> {
  const unread = items.filter((item) => !item.isRead);
  if (unread.length === 0) return;

  const CHUNK_SIZE = 450;
  for (let i = 0; i < unread.length; i += CHUNK_SIZE) {
    const slice = unread.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    for (const item of slice) {
      batch.update(doc(db, item.sourceCollection, item.id), {
        isRead: true,
      });
    }
    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'studentNotifications/batch');
    }
  }
}
