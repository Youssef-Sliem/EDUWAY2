import React from 'react';
import {
  CheckCircle2,
  User,
  Tag,
  GraduationCap,
  Calendar,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { SignUpFormData } from '../../types/auth';
import { Button } from '../ui/Button';

interface SuccessModalProps {
  data: SignUpFormData;
  onEdit: () => void;
  onReset: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  data,
  onEdit,
  onReset,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="w-full max-w-md bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] rounded-2xl p-6 sm:p-7 shadow-2xl space-y-5 text-left transition-colors duration-200">
        {/* Header with checkmark */}
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/20 flex items-center justify-center shrink-0 text-[#DC2626]">
            <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <h2
              id="modal-title"
              className="text-lg font-bold text-[#0B0F17] dark:text-[#F8FAFC] tracking-tight"
            >
              Account Prepared
            </h2>
            <p className="text-xs text-[#475569] dark:text-[#94A3B8] mt-0.5">
              Welcome, <span className="text-[#DC2626] font-semibold">{data.nickname}</span>! Your student registration details have been validated.
            </p>
          </div>
        </div>

        {/* Student Profile Card Preview */}
        <div className="bg-[#F8FAFC] dark:bg-[#0B1019] border border-[#E2E8F0] dark:border-[#1F293D] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0] dark:border-[#1F293D] text-xs font-semibold text-[#475569] dark:text-[#94A3B8] uppercase tracking-wider">
            <span>Student Dossier</span>
            <span className="text-[#DC2626] flex items-center gap-1 font-medium">
              <Sparkles className="w-3 h-3" /> Ready for enrollment
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <span className="text-[#64748B] flex items-center gap-1">
                <User className="w-3 h-3" /> Full Name
              </span>
              <p className="font-medium text-[#0B0F17] dark:text-[#F8FAFC] truncate">{data.fullName}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[#64748B] flex items-center gap-1">
                <Tag className="w-3 h-3" /> Nickname
              </span>
              <p className="font-medium text-[#0B0F17] dark:text-[#F8FAFC] truncate">{data.nickname}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[#64748B] flex items-center gap-1">
                <GraduationCap className="w-3 h-3" /> Cohort Class
              </span>
              <p className="font-semibold text-[#DC2626]">{data.classCohort}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[#64748B] flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Academic Year
              </span>
              <p className="font-medium text-[#0B0F17] dark:text-[#F8FAFC]">{data.academicYear}</p>
            </div>
          </div>
        </div>

        {/* Architecture Note */}
        <div className="text-[11px] text-[#64748B] bg-[#F1F5F9] dark:bg-[#0B0F17] border border-[#E2E8F0] dark:border-[#1F293D] rounded-lg p-3 leading-relaxed">
          <strong className="text-[#0B0F17] dark:text-[#94A3B8]">Cloud Sync Status:</strong> Real-time Cloud Firestore synchronization confirmed. Student credentials saved securely under Firebase Authentication.
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            type="button"
            variant="secondary"
            onClick={onEdit}
            className="flex-1"
          >
            Edit Information
          </Button>

          <button
            type="button"
            onClick={onReset}
            className="px-3.5 py-2.5 text-xs font-medium text-[#475569] dark:text-[#94A3B8] hover:text-[#DC2626] dark:hover:text-[#F8FAFC] bg-[#F8FAFC] dark:bg-[#0B1019] hover:bg-[#F1F5F9] dark:hover:bg-[#1A2536] border border-[#E2E8F0] dark:border-[#1F293D] rounded-lg transition-colors flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]"
            title="Start over with empty form"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};
