import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { SignUpFormData } from '../types/auth';
import { isOwnerUser } from '../config/owner';

export interface StudentProfile {
  id: string;
  fullName: string;
  nickname: string;
  classCohort: string;
  academicYear: string;
  email: string;
  points?: number;
  photoUrl?: string;
  skills?: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: StudentProfile | null;
  loading: boolean;
  signUp: (data: SignUpFormData) => Promise<StudentProfile>;
  signIn: (fullNameOrEmail: string, password: string) => Promise<FirebaseUser>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<FirebaseUser>;
  isOwner: boolean;
  toStudentEmail: (name: string) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function toStudentEmail(name: string): string {
  const clean = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');
  return `${clean || 'student'}@eduway.academy`;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user profile from Firestore
  const fetchUserProfile = async (uid: string): Promise<StudentProfile | null> => {
    const docPath = `users/${uid}`;
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        const data = snap.data() as StudentProfile;
        setUserProfile(data);
        return data;
      }
      return null;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, docPath);
    }
  };

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      setCurrentUser(user);

      if (user) {
        const docRef = doc(db, 'users', user.uid);
        unsubProfile = onSnapshot(
          docRef,
          (snap) => {
            if (snap.exists()) {
              setUserProfile(snap.data() as StudentProfile);
            } else {
              setUserProfile(null);
            }
            setLoading(false);
          },
          () => {
            setLoading(false);
          }
        );
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      if (unsubProfile) {
        unsubProfile();
      }
      unsubscribeAuth();
    };
  }, []);

  const signUp = async (data: SignUpFormData): Promise<StudentProfile> => {
    const email = toStudentEmail(data.fullName);
    
    // 1. Create Firebase Auth user with Email & Password
    const cred = await createUserWithEmailAndPassword(auth, email, data.password);
    const user = cred.user;

    // Update Firebase Auth profile display name
    try {
      await updateProfile(user, { displayName: data.nickname || data.fullName });
    } catch {
      // Non-critical profile name sync
    }

    // 2. Persist student profile in Cloud Firestore
    const studentData: StudentProfile = {
      id: user.uid,
      fullName: data.fullName.trim(),
      nickname: data.nickname.trim(),
      classCohort: data.classCohort,
      academicYear: data.academicYear,
      email: email,
      points: 0,
      skills: [],
    };

    const docPath = `users/${user.uid}`;
    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...studentData,
        createdAt: serverTimestamp(),
      });
      await setDoc(doc(db, 'publicProfiles', user.uid), {
        id: user.uid,
        username: studentData.nickname || studentData.fullName,
        skills: [],
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, docPath);
    }

    setUserProfile(studentData);
    return studentData;
  };

  const signIn = async (fullNameOrEmail: string, password: string): Promise<FirebaseUser> => {
    const email = fullNameOrEmail.includes('@')
      ? fullNameOrEmail.trim()
      : toStudentEmail(fullNameOrEmail);

    const cred = await signInWithEmailAndPassword(auth, email, password);
    await fetchUserProfile(cred.user.uid);
    return cred.user;
  };

  const signInWithGoogle = async (): Promise<FirebaseUser> => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const existing = await fetchUserProfile(cred.user.uid);
    if (!existing) {
      const display = (cred.user.displayName || cred.user.email?.split('@')[0] || 'Eduway Student').trim();
      const safeName = display.length >= 2 ? display.slice(0, 100) : 'Eduway Student';
      const safeNick = safeName.split(' ')[0].slice(0, 50) || 'Student';
      const photo =
        cred.user.photoURL && /^https?:\/\//i.test(cred.user.photoURL)
          ? cred.user.photoURL.slice(0, 2000)
          : undefined;
      const defaultProfile: StudentProfile = {
        id: cred.user.uid,
        fullName: safeName,
        nickname: safeNick,
        classCohort: 'Eduway Cohort',
        academicYear: '2026 – 2027',
        email: (cred.user.email || '').slice(0, 120),
        points: 0,
        skills: [],
        ...(photo ? { photoUrl: photo } : {}),
      };
      try {
        await setDoc(doc(db, 'users', cred.user.uid), {
          ...defaultProfile,
          createdAt: serverTimestamp(),
        });
        await setDoc(doc(db, 'publicProfiles', cred.user.uid), {
          id: cred.user.uid,
          username: defaultProfile.nickname || defaultProfile.fullName,
          ...(photo ? { photoUrl: photo } : {}),
          skills: [],
          updatedAt: serverTimestamp(),
        });
        setUserProfile(defaultProfile);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${cred.user.uid}`);
      }
    }
    return cred.user;
  };

  const signOut = async (): Promise<void> => {
    await firebaseSignOut(auth);
    setUserProfile(null);
  };

  const isOwner = isOwnerUser(currentUser?.uid);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        signUp,
        signIn,
        signOut,
        signInWithGoogle,
        isOwner,
        toStudentEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
