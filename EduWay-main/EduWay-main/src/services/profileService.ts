import {
  collection,
  doc,
  getDoc,
  deleteField,
  writeBatch,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { PublicStudentProfile } from '../types/profile';

export const MAX_STUDENT_SKILLS = 30;
export const MAX_SKILL_LENGTH = 60;

export function normalizeSkillsList(skills: string[]): string[] {
  const seen = new Set<string>();
  const cleaned: string[] = [];

  for (const raw of skills) {
    const trimmed = raw.trim().replace(/\s+/g, ' ');
    if (!trimmed || trimmed.length > MAX_SKILL_LENGTH) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push(trimmed);
    if (cleaned.length >= MAX_STUDENT_SKILLS) break;
  }

  return cleaned;
}

interface SyncProfileParams {
  uid: string;
  username: string;
  fullNameFallback: string;
  emailFallback: string;
  photoUrl?: string;
  skills: string[];
}

async function syncUserAndPublicProfile(params: SyncProfileParams): Promise<void> {
  const userRef = doc(db, 'users', params.uid);
  const publicRef = doc(db, 'publicProfiles', params.uid);
  const path = `users/${params.uid}`;

  const cleanUsername = (params.username.trim() || params.fullNameFallback.trim() || 'Eduway Student').slice(0, 100);
  const cleanPhoto = params.photoUrl?.trim() ? params.photoUrl.trim() : undefined;
  const cleanSkills = normalizeSkillsList(params.skills);

  try {
    const userSnap = await getDoc(userRef);
    const batch = writeBatch(db);

    if (userSnap.exists()) {
      batch.update(userRef, {
        photoUrl: cleanPhoto ? cleanPhoto : deleteField(),
        skills: cleanSkills,
        updatedAt: serverTimestamp(),
      });
    } else {
      const safeFullName =
        params.fullNameFallback.trim().length >= 2
          ? params.fullNameFallback.trim().slice(0, 100)
          : cleanUsername.length >= 2
          ? cleanUsername
          : 'Eduway Student';
      const safeNick = cleanUsername.slice(0, 50) || 'Student';
      batch.set(userRef, {
        id: params.uid,
        fullName: safeFullName,
        nickname: safeNick,
        classCohort: 'Eduway Cohort',
        academicYear: '2026 – 2027',
        email: params.emailFallback.slice(0, 120),
        points: 0,
        skills: cleanSkills,
        ...(cleanPhoto ? { photoUrl: cleanPhoto } : {}),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    batch.set(publicRef, {
      id: params.uid,
      username: cleanUsername,
      ...(cleanPhoto ? { photoUrl: cleanPhoto } : {}),
      skills: cleanSkills,
      updatedAt: serverTimestamp(),
    });

    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveStudentProfilePhoto(
  params: SyncProfileParams
): Promise<void> {
  await syncUserAndPublicProfile(params);
}

export async function saveStudentSkills(
  params: SyncProfileParams
): Promise<void> {
  await syncUserAndPublicProfile(params);
}

/**
 * Ensures an existing student with skills or photo is mirrored in `publicProfiles`
 * if they were created before `publicProfiles` existed.
 */
export async function ensurePublicProfileMirrored(
  params: SyncProfileParams
): Promise<void> {
  const publicRef = doc(db, 'publicProfiles', params.uid);
  try {
    const snap = await getDoc(publicRef);
    if (!snap.exists() && (params.skills.length > 0 || params.photoUrl)) {
      await syncUserAndPublicProfile(params);
    }
  } catch {
    // Non-critical background sync
  }
}

/**
 * Subscribe to all publicly shared student skill profiles (no PII fields).
 */
export function subscribePublicStudentProfiles(
  onData: (profiles: PublicStudentProfile[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, 'publicProfiles'), orderBy('updatedAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const profiles: PublicStudentProfile[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        profiles.push({
          id: docSnap.id,
          username: String(data.username || 'Eduway Student'),
          photoUrl: typeof data.photoUrl === 'string' ? data.photoUrl : undefined,
          skills: Array.isArray(data.skills)
            ? data.skills.filter((s): s is string => typeof s === 'string')
            : [],
          updatedAt: data.updatedAt,
        });
      });
      onData(profiles);
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}
