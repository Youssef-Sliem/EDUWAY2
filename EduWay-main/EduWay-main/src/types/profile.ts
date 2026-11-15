export interface PublicStudentProfile {
  id: string;
  username: string;
  photoUrl?: string;
  skills: string[];
  updatedAt?: { seconds: number; nanoseconds?: number } | Date | unknown;
}
