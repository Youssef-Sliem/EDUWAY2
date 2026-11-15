import React, { useState } from 'react';
import {
  User,
  Tag,
  Lock,
  KeyRound,
  GraduationCap,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import {
  SignUpFormData,
  FormErrors,
  CLASS_OPTIONS,
  ACADEMIC_YEAR_OPTIONS,
} from '../../types/auth';
import { useAuth } from '../../context/AuthContext';

interface SignUpFormProps {
  onSuccess: (data: SignUpFormData) => void;
  onNavigateToSignIn: () => void;
}

const INITIAL_FORM_DATA: SignUpFormData = {
  fullName: '',
  nickname: '',
  password: '',
  confirmPassword: '',
  classCohort: '',
  academicYear: '',
};

export const SignUpForm: React.FC<SignUpFormProps> = ({
  onSuccess,
  onNavigateToSignIn,
}) => {
  const { signUp } = useAuth();
  const [formData, setFormData] = useState<SignUpFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Validation function
  const validate = (data: SignUpFormData): FormErrors => {
    const newErrors: FormErrors = {};

    // 1. Full Name
    if (!data.fullName.trim()) {
      newErrors.fullName = 'Full Name is required';
    } else if (data.fullName.trim().length < 2) {
      newErrors.fullName = 'Full Name must be at least 2 characters';
    }

    // 2. Nickname
    if (!data.nickname.trim()) {
      newErrors.nickname = 'Nickname is required';
    }

    // 3. Password
    if (!data.password) {
      newErrors.password = 'Password is required';
    } else if (data.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    // 4. Confirm Password
    if (!data.confirmPassword) {
      newErrors.confirmPassword = 'Confirm Password is required';
    } else if (data.password && data.confirmPassword !== data.password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // 5. Class Cohort
    if (!data.classCohort) {
      newErrors.classCohort = 'Please select a class cohort';
    }

    // 6. Academic Year
    if (!data.academicYear) {
      newErrors.academicYear = 'Please select an academic year';
    }

    return newErrors;
  };

  const handleChange = (field: keyof SignUpFormData, value: string) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    setAuthError(null);

    // Live validation if the user has already attempted submission
    if (hasAttemptedSubmit) {
      const fieldErrors = validate(updated);
      setErrors(fieldErrors);
    } else if (errors[field]) {
      // Clear single field error when user starts correcting it
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
      const el = document.getElementById(
        firstErrorField.startsWith('class') || firstErrorField.startsWith('academic')
          ? `select-${firstErrorField.toLowerCase()}`
          : `input-${firstErrorField.toLowerCase()}`
      );
      if (el) {
        el.focus();
      }
      return;
    }

    setIsSubmitting(true);
    try {
      await signUp(formData);
      onSuccess(formData);
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error.code === 'auth/email-already-in-use') {
        setAuthError('An account with this student name already exists. Please sign in instead.');
      } else if (error.code === 'auth/weak-password') {
        setAuthError('Password is too weak. Please use at least 8 characters with numbers or symbols.');
      } else if (error.code === 'auth/network-request-failed') {
        setAuthError('Network error connecting to Firebase. Please check your internet connection.');
      } else {
        setAuthError(error.message || 'Registration failed. Please check your details and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Password matching helper text
  const passwordsMatch =
    Boolean(formData.password) &&
    Boolean(formData.confirmPassword) &&
    formData.password === formData.confirmPassword;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-4 text-left"
      aria-label="Student Sign Up Form"
    >
      {/* 1. Full Name */}
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
      />

      {/* 2. Nickname */}
      <Input
        id="input-nickname"
        label="Nickname"
        required
        icon={<Tag className="w-4 h-4" />}
        placeholder="e.g. Ellie"
        value={formData.nickname}
        onChange={(e) => handleChange('nickname', e.target.value)}
        error={errors.nickname}
        autoComplete="nickname"
        hint="Used in cohort discussions"
      />

      {/* 3. Password */}
      <Input
        id="input-password"
        label="Password"
        isPassword
        required
        icon={<Lock className="w-4 h-4" />}
        placeholder="Create a secure password"
        value={formData.password}
        onChange={(e) => handleChange('password', e.target.value)}
        error={errors.password}
        autoComplete="new-password"
        hint="Min. 8 characters"
      />

      {/* 4. Confirm Password */}
      <div className="relative">
        <Input
          id="input-confirmpassword"
          label="Confirm Password"
          isPassword
          required
          icon={<KeyRound className="w-4 h-4" />}
          placeholder="Re-enter your password"
          value={formData.confirmPassword}
          onChange={(e) => handleChange('confirmPassword', e.target.value)}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />
        {passwordsMatch && !errors.confirmPassword && (
          <div className="flex items-center gap-1.5 text-xs text-[#DC2626] dark:text-[#F87171] mt-1.5 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Passwords match</span>
          </div>
        )}
      </div>

      {/* 5. Class (Dropdown) */}
      <Select
        id="select-classcohort"
        label="Class"
        required
        icon={<GraduationCap className="w-4 h-4" />}
        placeholder="Select your class cohort"
        options={CLASS_OPTIONS}
        value={formData.classCohort}
        onChange={(e) => handleChange('classCohort', e.target.value)}
        error={errors.classCohort}
      />

      {/* 6. Academic Year (Dropdown) */}
      <Select
        id="select-academicyear"
        label="Academic Year"
        required
        icon={<Calendar className="w-4 h-4" />}
        placeholder="Select academic year"
        options={ACADEMIC_YEAR_OPTIONS}
        value={formData.academicYear}
        onChange={(e) => handleChange('academicYear', e.target.value)}
        error={errors.academicYear}
      />

      {/* Firebase Registration Error Alert */}
      {authError && (
        <div
          className="flex items-start gap-2 text-xs text-[#DC2626] dark:text-[#F87171] bg-[#DC2626]/10 border border-[#DC2626]/20 p-3 rounded-lg animate-fadeIn"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span className="leading-snug">{authError}</span>
        </div>
      )}

      {/* 5. Main Button: Create Account */}
      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
        >
          Create Account
        </Button>
      </div>

      {/* 6. Additional Elements: Sign In Link & Privacy Note */}
      <div className="pt-2 text-center space-y-3">
        <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onNavigateToSignIn}
            className="font-semibold text-[#DC2626] hover:text-[#B91C1C] hover:underline transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] rounded px-1"
          >
            Sign In
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
