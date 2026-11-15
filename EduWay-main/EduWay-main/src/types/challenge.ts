export type ChallengeAttachmentFormat = 'link' | 'gdrive' | 'none';

export type ChallengeAnswerStatus = 'pending' | 'correct' | 'incorrect';

export interface ChallengeItem {
  id: string;
  title: string;
  subject: string;
  question: string;
  attachmentFormat: ChallengeAttachmentFormat;
  attachmentUrl?: string;
  points: number;
  ownerId: string;
  status: 'published';
  createdAt?: { seconds: number; nanoseconds?: number } | Date | unknown;
  updatedAt?: { seconds: number; nanoseconds?: number } | Date | unknown;
}

export interface ChallengeAnswer {
  id: string;
  challengeId: string;
  challengeTitle: string;
  challengeSubject: string;
  challengePoints: number;
  studentId: string;
  studentName: string;
  answerText: string;
  status: ChallengeAnswerStatus;
  pointsAwarded: boolean;
  awardedPoints?: number;
  reviewedBy?: string;
  reviewedAt?: { seconds: number; nanoseconds?: number } | Date | unknown;
  createdAt?: { seconds: number; nanoseconds?: number } | Date | unknown;
  updatedAt?: { seconds: number; nanoseconds?: number } | Date | unknown;
}

export interface ChallengeNotification {
  id: string;
  userId: string;
  answerId: string;
  challengeId: string;
  challengeTitle: string;
  outcome: 'correct' | 'incorrect';
  pointsEarned: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt?: { seconds: number; nanoseconds?: number } | Date | unknown;
}

export interface ChallengeWinner {
  id: string;
  answerId: string;
  challengeId: string;
  challengeTitle: string;
  studentId: string;
  studentName: string;
  pointsEarned: number;
  acceptedAt?: { seconds: number; nanoseconds?: number } | Date | unknown;
}
