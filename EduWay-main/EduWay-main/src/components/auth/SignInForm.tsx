import React, { useState } from 'react';
import { User, Lock, ShieldCheck, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { SignInFormData, SignInErrors } from '../../types/auth';
import { useAuth } from '../../context/AuthContext';

interface SignInFormProps {
  onNavigateToSignUp: () => void;
}

const INITIAL_SIGN_IN_DATA: SignInFormData = {
  fullName: '',
  password: '',
};

export const SignInForm: React.FC<SignInFormProps> = ({
  onNavigateToSignUp,
}) => {
  const { signIn, signInWithGoogle, currentUser, userProfile, signOut, isOwner } = useAuth();
  const [formData, setFormData] = useState<SignInFormData>(INITIAL_SIGN_IN_DATA);
  const [errors, setErrors] = useState<SignInErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsGoogleSubmitting(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error.code === 'auth/popup-closed-by-user') {
        // user cancelled popup
      } else {
        setAuthError(error.message || 'Google sign in failed. Please try again.');
      }
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  // Validation: Full Name and Password are both required
  const validate = (data: SignInFormData): SignInErrors => {
    const newErrors: SignInErrors = {};

    if (!data.fullName.trim()) {
      newErrors.fullName = 'Please enter your Full Name to sign in';
    } else if (data.fullName.trim().length < 2) {
      newErrors.fullName = 'Full Name must be at least 2 characters';
    }

    if (!data.password) {
      newErrors.password = 'Please enter your password';
    }

    return newErrors;
  };

  const handleChange = (field: keyof SignInFormData, value: string) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    setAuthError(null);

    if (hasAttemptedSubmit) {
      const fieldErrors = validate(updated);
      setErrors(fieldErrors);
    } else if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);
    setAuthError(null);

    const validationErrors = validate(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      const firstErrorField = Object.keys(validationErrors)[0];
      const el = document.getElementById(`input-${firstErrorField.toLowerCase()}`);
      if (el) {
        el.focus();
      }
      return;
    }

    setIsSubmitting(true);
    try {
      await signIn(formData.fullName, formData.password);
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/wrong-password'
      ) {
        setAuthError('Incorrect name or password. Please verify your details or sign up.');
      } else if (error.code === 'auth/too-many-requests') {
        setAuthError('Access temporarily restricted due to many failed attempts. Try again in a few minutes.');
      } else if (error.code === 'auth/network-request-failed') {
        setAuthError('Network error connecting to Firebase. Please check your internet connection.');
      } else {
        setAuthError(error.message || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // If user is already authenticated with real Firebase session
  if (currentUser) {
    return (
      <div className="space-y-5 text-left animate-fadeIn">
        <div className={`p-4 rounded-xl border space-y-2 ${
          isOwner
            ? 'bg-[#DC2626]/10 border-[#DC2626]/30'
            : 'bg-[#DC2626]/10 border-[#DC2626]/20'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#DC2626] dark:text-[#F87171] uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              <span>{isOwner ? 'Authoritative Owner Session' : 'Active Student Session'}</span>
            </div>
            {isOwner && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DC2626] text-white tracking-wider">
                OWNER
              </span>
            )}
          </div>
          <p className="text-sm font-bold text-[#0B0F17] dark:text-[#F8FAFC]">
            {userProfile?.fullName || currentUser.displayName || currentUser.email || 'Eduway User'}
          </p>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
            {isOwner ? (
              'Designated Platform Owner with full administrative privileges.'
            ) : (
              <>
                Enrolled in <span className="font-semibold text-[#DC2626]">{userProfile?.classCohort || 'Eduway Cohort'}</span> ({userProfile?.academicYear || 'Current Year'}) ·{' '}
                <span className="font-semibold text-[#0B0F17] dark:text-[#F8FAFC]">
                  {userProfile?.points ?? 0} Challenge Points
                </span>
              </>
            )}
          </p>
          <p className="text-[11px] text-[#64748B] dark:text-[#64748B] font-mono break-all pt-1">
            UID: {currentUser.uid}
          </p>
        </div>

        {isOwner && (
          <a
            href="#owner-dashboard"
            onClick={(e) => {
              e.preventDefault();
              window.location.hash = 'owner-dashboard';
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-lg shadow-sm transition-colors"
          >
            Go to Owner Dashboard
          </a>
        )}

        <Button
          type="button"
          variant="secondary"
          onClick={() => signOut()}
          className="w-full flex items-center justify-center gap-2 text-xs"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-4 text-left"
      aria-label="Student Sign In Form"
    >
      {/* 1. Full Name (Login Identifier) */}
      <Input
        id="input-fullname"
        label="Full Name"
        required
        icon={<User className="w-4 h-4" />}
        placeholder="e.g. Eleanor Vance"
        value={formData.fullName}
        onChange={(e) => handleChange('fullName', e.target.value)}
        error={errors.fullName}
        autoComplete="name"
        hint="Your registered full name"
      />

      {/* 2. Password */}
      <Input
        id="input-password"
        label="Password"
        isPassword
        required
        icon={<Lock className="w-4 h-4" />}
        placeholder="Enter your password"
        value={formData.password}
        onChange={(e) => handleChange('password', e.target.value)}
        error={errors.password}
        autoComplete="current-password"
      />

      {/* Firebase Authentication Error Alert */}
      {authError && (
        <div
          className="flex items-start gap-2 text-xs text-[#DC2626] dark:text-[#F87171] bg-[#DC2626]/10 border border-[#DC2626]/20 p-3 rounded-lg animate-fadeIn"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span className="leading-snug">{authError}</span>
        </div>
      )}

      {/* 4. Main Button: Sign In */}
      <div className="pt-2 space-y-2">
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
        >
          Sign In
        </Button>

        <div className="relative py-2 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E2E8F0] dark:border-[#1F293D]" />
          </div>
          <span className="relative bg-white dark:bg-[#111827] px-3 text-[11px] uppercase tracking-wider text-[#94A3B8]">
            or
          </span>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isGoogleSubmitting}
          className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 text-xs font-semibold text-[#0B0F17] dark:text-[#F8FAFC] bg-white dark:bg-[#131B28] hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#1F293D] rounded-lg transition-all shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{isGoogleSubmitting ? 'Signing in with Google...' : 'Sign in with Google'}</span>
        </button>
      </div>

      {/* 5. Additional Elements: Link to Sign Up & Privacy Note */}
      <div className="pt-2 text-center space-y-3">
        <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onNavigateToSignUp}
            className="font-semibold text-[#DC2626] hover:text-[#B91C1C] hover:underline transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] rounded px-1"
          >
            Sign Up
          </button>
        </p>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#64748B] dark:text-[#64748B]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#DC2626]/80 shrink-0" aria-hidden="true" />
          <span>Your information is kept secure with Cloud Firestore.</span>
        </div>
      </div>
    </form>
  );
};
