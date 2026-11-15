export interface SignUpFormData {
  fullName: string;
  nickname: string;
  password: string;
  confirmPassword: string;
  classCohort: string;
  academicYear: string;
}

export type FormErrors = Partial<Record<keyof SignUpFormData, string>>;

export interface SignInFormData {
  fullName: string;
  password: string;
}

export type SignInErrors = Partial<Record<keyof SignInFormData, string>>;

export interface SelectOption {
  value: string;
  label: string;
}

export const CLASS_OPTIONS: SelectOption[] = [
  { value: 'Wheeler 1', label: 'Wheeler 1' },
  { value: 'Wheeler 2', label: 'Wheeler 2' },
  { value: 'Wheeler 3', label: 'Wheeler 3' },
  { value: 'Wheeler 4', label: 'Wheeler 4' },
];

export const ACADEMIC_YEAR_OPTIONS: SelectOption[] = [
  { value: '2026 – 2027', label: '2026 – 2027 Academic Year' },
  { value: '2025 – 2026', label: '2025 – 2026 Academic Year' },
  { value: '2024 – 2025', label: '2024 – 2025 Academic Year' },
  { value: '2023 – 2024', label: '2023 – 2024 Academic Year' },
];
