export type StudentNotificationCategory =
  | 'submission'
  | 'challenge'
  | 'points'
  | 'achievement';

export type StudentNotificationTargetPage =
  | 'academic-hub'
  | 'challenge-hub'
  | 'profile';

export type StudentNotificationDecision =
  | 'approved'
  | 'rejected'
  | 'correct'
  | 'incorrect';

export interface StudentNotificationItem {
  id: string;
  userId: string;
  category: StudentNotificationCategory;
  title: string;
  message: string;
  itemTitle?: string;
  decision?: StudentNotificationDecision;
  pointsEarned?: number;
  totalPoints?: number;
  targetPage: StudentNotificationTargetPage;
  relatedId?: string;
  isRead: boolean;
  createdAt?: unknown;
  sourceCollection: 'studentNotifications' | 'challengeNotifications';
}
