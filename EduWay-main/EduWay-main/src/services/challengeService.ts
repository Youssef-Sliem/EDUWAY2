import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { OWNER_UID } from '../config/owner';
import {
  ChallengeAnswer,
  ChallengeAttachmentFormat,
  ChallengeItem,
  ChallengeNotification,
  ChallengeWinner,
} from '../types/challenge';

export interface PublishChallengeInput {
  title: string;
  subject: string;
  question: string;
  attachmentFormat: ChallengeAttachmentFormat;
  attachmentUrl?: string;
  points: number;
  ownerId: string;
}

export interface SubmitChallengeAnswerInput {
  challenge: ChallengeItem;
  studentId: string;
  studentName: string;
  answerText: string;
}

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

export function formatChallengeDateTime(value: unknown): string {
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
 * Owner-only: Publish a new Challenge Hub challenge.
 */
export async function publishChallenge(input: PublishChallengeInput): Promise<string> {
  if (input.ownerId !== OWNER_UID) {
    throw new Error('Only the designated Platform Owner can publish challenges.');
  }

  const challengesCol = collection(db, 'challenges');
  const newChallengeRef = doc(challengesCol);
  const challengeId = newChallengeRef.id;
  const challengePath = `challenges/${challengeId}`;

  const payload: Record<string, unknown> = {
    id: challengeId,
    title: input.title.trim(),
    subject: input.subject.trim(),
    question: input.question.trim(),
    attachmentFormat: input.attachmentFormat,
    points: Math.round(input.points),
    ownerId: OWNER_UID,
    status: 'published',
    createdAt: serverTimestamp(),
  };

  if (input.attachmentFormat !== 'none' && input.attachmentUrl?.trim()) {
    payload.attachmentUrl = input.attachmentUrl.trim();
  }

  try {
    await setDoc(newChallengeRef, payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, challengePath);
  }

  return challengeId;
}

/**
 * Owner-only: Delete a published challenge.
 */
export async function deleteChallenge(challengeId: string): Promise<void> {
  const path = `challenges/${challengeId}`;
  try {
    await deleteDoc(doc(db, 'challenges', challengeId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

/**
 * Student-only: Submit an answer to a published challenge with forced `status: 'pending'`.
 */
export async function submitChallengeAnswer(
  input: SubmitChallengeAnswerInput
): Promise<string> {
  if (input.studentId === OWNER_UID) {
    throw new Error('The Owner account cannot submit student challenge answers.');
  }

  const answersCol = collection(db, 'challengeAnswers');
  const newAnswerRef = doc(answersCol);
  const answerId = newAnswerRef.id;
  const answerPath = `challengeAnswers/${answerId}`;

  const payload = {
    id: answerId,
    challengeId: input.challenge.id,
    challengeTitle: input.challenge.title.trim(),
    challengeSubject: input.challenge.subject.trim(),
    challengePoints: Math.round(input.challenge.points),
    studentId: input.studentId,
    studentName: input.studentName.trim() || 'Eduway Student',
    answerText: input.answerText.trim(),
    status: 'pending',
    pointsAwarded: false,
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(newAnswerRef, payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, answerPath);
  }

  return answerId;
}

/**
 * Owner-only atomic review: Mark a pending student answer as Correct.
 * Uses Firestore runTransaction to:
 *  1) Verify submission is still pending and not yet awarded.
 *  2) Read authoritative points from the Challenge document.
 *  3) Increment the student's Profile points (`users/{studentId}.points`).
 *  4) Create a verified ChallengeWinner entry.
 *  5) Send a student-scoped ChallengeNotification.
 */
export async function reviewChallengeAnswerCorrect(answerId: string): Promise<number> {
  const answerRef = doc(db, 'challengeAnswers', answerId);
  const answerPath = `challengeAnswers/${answerId}`;

  try {
    const awarded = await runTransaction(db, async (tx) => {
      const answerSnap = await tx.get(answerRef);
      if (!answerSnap.exists()) {
        throw new Error('This answer submission no longer exists.');
      }

      const answer = answerSnap.data() as ChallengeAnswer;
      if (answer.status !== 'pending' || answer.pointsAwarded === true) {
        throw new Error('This submission has already been reviewed and cannot be awarded again.');
      }

      const challengeRef = doc(db, 'challenges', answer.challengeId);
      const userRef = doc(db, 'users', answer.studentId);

      // All reads must occur before any writes in Firestore transactions
      const [challengeSnap, userSnap] = await Promise.all([
        tx.get(challengeRef),
        tx.get(userRef),
      ]);

      const authoritativePoints = challengeSnap.exists()
        ? Math.max(1, Math.round(Number(challengeSnap.data().points || answer.challengePoints)))
        : Math.max(1, Math.round(Number(answer.challengePoints)));

      const currentProfilePoints = userSnap.exists()
        ? Math.max(0, Math.round(Number(userSnap.data().points ?? 0)))
        : 0;
      const updatedProfilePoints = currentProfilePoints + authoritativePoints;

      tx.update(answerRef, {
        status: 'correct',
        pointsAwarded: true,
        awardedPoints: authoritativePoints,
        reviewedBy: OWNER_UID,
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (userSnap.exists()) {
        tx.update(userRef, {
          points: updatedProfilePoints,
          updatedAt: serverTimestamp(),
        });
      } else {
        tx.set(userRef, {
          id: answer.studentId,
          fullName: answer.studentName.trim() || 'Eduway Student',
          nickname: (answer.studentName.trim().split(' ')[0] || 'Student').slice(0, 50),
          classCohort: 'Eduway Student',
          academicYear: '2026 – 2027',
          email: '',
          points: updatedProfilePoints,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      const winnerRef = doc(db, 'challengeWinners', answerId);
      tx.set(winnerRef, {
        id: answerId,
        answerId,
        challengeId: answer.challengeId,
        challengeTitle: answer.challengeTitle,
        studentId: answer.studentId,
        studentName: answer.studentName,
        pointsEarned: authoritativePoints,
        acceptedAt: serverTimestamp(),
      });

      const notifId = `ans_${answerId}`;
      const notifRef = doc(db, 'challengeNotifications', notifId);
      tx.set(notifRef, {
        id: notifId,
        userId: answer.studentId,
        answerId,
        challengeId: answer.challengeId,
        challengeTitle: answer.challengeTitle,
        outcome: 'correct',
        pointsEarned: authoritativePoints,
        title: `Challenge Accepted: ${answer.challengeTitle}`,
        message: `Your submitted answer for "${answer.challengeTitle}" was marked Correct by the Owner. You earned +${authoritativePoints} points!`,
        isRead: false,
        createdAt: serverTimestamp(),
      });

      if (answer.studentId && answer.studentId !== OWNER_UID) {
        const chalNotifId = `chal_${answerId}`;
        const chalNotifRef = doc(db, 'studentNotifications', chalNotifId);
        tx.set(chalNotifRef, {
          id: chalNotifId,
          userId: answer.studentId,
          category: 'challenge',
          title: `Challenge Answer Correct: ${answer.challengeTitle}`.slice(0, 200),
          message: `Your submitted answer for "${answer.challengeTitle}" was marked Correct. You earned ${authoritativePoints} points!`.slice(
            0,
            1000
          ),
          itemTitle: answer.challengeTitle.slice(0, 150),
          decision: 'correct',
          pointsEarned: authoritativePoints,
          totalPoints: updatedProfilePoints,
          targetPage: 'challenge-hub',
          relatedId: answer.challengeId,
          isRead: false,
          createdAt: serverTimestamp(),
        });

        const ptsNotifId = `pts_${answerId}`;
        const ptsNotifRef = doc(db, 'studentNotifications', ptsNotifId);
        tx.set(ptsNotifRef, {
          id: ptsNotifId,
          userId: answer.studentId,
          category: 'points',
          title: `Points & Achievement Unlocked: +${authoritativePoints} pts`.slice(0, 200),
          message: `You earned ${authoritativePoints} points! Your current balance is ${updatedProfilePoints} points — unlocked Challenge Achievement: "${answer.challengeTitle}".`.slice(
            0,
            1000
          ),
          itemTitle: answer.challengeTitle.slice(0, 150),
          decision: 'correct',
          pointsEarned: authoritativePoints,
          totalPoints: updatedProfilePoints,
          targetPage: 'profile',
          relatedId: answer.challengeId,
          isRead: false,
          createdAt: serverTimestamp(),
        });
      }

      return authoritativePoints;
    });

    return awarded;
  } catch (err) {
    if (err instanceof Error && err.message.includes('already been reviewed')) {
      throw err;
    }
    if (err instanceof Error && err.message.includes('no longer exists')) {
      throw err;
    }
    handleFirestoreError(err, OperationType.UPDATE, answerPath);
  }
}

/**
 * Owner-only atomic review: Mark a pending student answer as Incorrect.
 * Awards 0 points, creates no winner record, and notifies the submitting student.
 */
export async function reviewChallengeAnswerIncorrect(answerId: string): Promise<void> {
  const answerRef = doc(db, 'challengeAnswers', answerId);
  const answerPath = `challengeAnswers/${answerId}`;

  try {
    await runTransaction(db, async (tx) => {
      const answerSnap = await tx.get(answerRef);
      if (!answerSnap.exists()) {
        throw new Error('This answer submission no longer exists.');
      }

      const answer = answerSnap.data() as ChallengeAnswer;
      if (answer.status !== 'pending') {
        throw new Error('This submission has already been reviewed.');
      }

      tx.update(answerRef, {
        status: 'incorrect',
        pointsAwarded: false,
        awardedPoints: 0,
        reviewedBy: OWNER_UID,
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const notifId = `ans_${answerId}`;
      const notifRef = doc(db, 'challengeNotifications', notifId);
      tx.set(notifRef, {
        id: notifId,
        userId: answer.studentId,
        answerId,
        challengeId: answer.challengeId,
        challengeTitle: answer.challengeTitle,
        outcome: 'incorrect',
        pointsEarned: 0,
        title: `Challenge Review: ${answer.challengeTitle}`,
        message: `Your submitted answer for "${answer.challengeTitle}" was reviewed as Incorrect. 0 points were awarded.`,
        isRead: false,
        createdAt: serverTimestamp(),
      });

      if (answer.studentId && answer.studentId !== OWNER_UID) {
        const chalNotifId = `chal_${answerId}`;
        const chalNotifRef = doc(db, 'studentNotifications', chalNotifId);
        tx.set(chalNotifRef, {
          id: chalNotifId,
          userId: answer.studentId,
          category: 'challenge',
          title: `Challenge Answer Reviewed: ${answer.challengeTitle}`.slice(0, 200),
          message: `Your submitted answer for "${answer.challengeTitle}" was reviewed as Incorrect. 0 points were awarded. Keep trying the upcoming challenges!`.slice(
            0,
            1000
          ),
          itemTitle: answer.challengeTitle.slice(0, 150),
          decision: 'incorrect',
          pointsEarned: 0,
          targetPage: 'challenge-hub',
          relatedId: answer.challengeId,
          isRead: false,
          createdAt: serverTimestamp(),
        });
      }
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes('already been reviewed')) {
      throw err;
    }
    if (err instanceof Error && err.message.includes('no longer exists')) {
      throw err;
    }
    handleFirestoreError(err, OperationType.UPDATE, answerPath);
  }
}

/**
 * Marks a student-scoped challenge notification as read.
 */
export async function markChallengeNotificationRead(notificationId: string): Promise<void> {
  const path = `challengeNotifications/${notificationId}`;
  try {
    await updateDoc(doc(db, 'challengeNotifications', notificationId), {
      isRead: true,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

/**
 * Subscribe to all published Challenge Hub challenges.
 */
export function subscribePublishedChallenges(
  onData: (items: ChallengeItem[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, 'challenges'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const items: ChallengeItem[] = [];
      snap.forEach((docSnap) => {
        items.push({ ...docSnap.data(), id: docSnap.id } as ChallengeItem);
      });
      onData(items);
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}

/**
 * Owner-only: Subscribe to all student challenge answer submissions.
 */
export function subscribeAllChallengeAnswers(
  onData: (items: ChallengeAnswer[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, 'challengeAnswers'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const items: ChallengeAnswer[] = [];
      snap.forEach((docSnap) => {
        items.push({ ...docSnap.data(), id: docSnap.id } as ChallengeAnswer);
      });
      onData(items);
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}

/**
 * Student-only: Subscribe to the authenticated student's own submitted answers.
 * Sorted client-side to avoid requiring a composite index.
 */
export function subscribeStudentChallengeAnswers(
  studentId: string,
  onData: (items: ChallengeAnswer[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, 'challengeAnswers'),
    where('studentId', '==', studentId)
  );
  return onSnapshot(
    q,
    (snap) => {
      const items: ChallengeAnswer[] = [];
      snap.forEach((docSnap) => {
        items.push({ ...docSnap.data(), id: docSnap.id } as ChallengeAnswer);
      });
      items.sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt));
      onData(items);
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}

/**
 * Student-only: Subscribe to the authenticated student's own challenge notifications.
 * Sorted client-side to avoid requiring a composite index.
 */
export function subscribeStudentChallengeNotifications(
  studentId: string,
  onData: (items: ChallengeNotification[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, 'challengeNotifications'),
    where('userId', '==', studentId)
  );
  return onSnapshot(
    q,
    (snap) => {
      const items: ChallengeNotification[] = [];
      snap.forEach((docSnap) => {
        items.push({ ...docSnap.data(), id: docSnap.id } as ChallengeNotification);
      });
      items.sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt));
      onData(items);
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}

/**
 * Subscribe to verified Challenge Hub winners.
 */
export function subscribeChallengeWinners(
  onData: (items: ChallengeWinner[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, 'challengeWinners'), orderBy('acceptedAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const items: ChallengeWinner[] = [];
      snap.forEach((docSnap) => {
        items.push({ ...docSnap.data(), id: docSnap.id } as ChallengeWinner);
      });
      onData(items);
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}
