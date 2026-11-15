import React, { useState } from 'react';
import { EducationalIllustration } from '../components/illustration/EducationalIllustration';
import { SignUpForm } from '../components/auth/SignUpForm';
import { SuccessModal } from '../components/auth/SuccessModal';
import { Toast } from '../components/ui/Toast';
import { SignUpFormData } from '../types/auth';

interface SignUpPageProps {
  onSignInRequested?: () => void;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({
  onSignInRequested,
}) => {
  const [registeredData, setRegisteredData] = useState<SignUpFormData | null>(null);
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string } | null>(null);

  const handleFormSuccess = (data: SignUpFormData) => {
    setRegisteredData(data);
  };

  const handleSignInClick = () => {
    if (onSignInRequested) {
      onSignInRequested();
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-8 lg:py-14 px-4 sm:px-6 lg:px-8 transition-colors duration-250">
      <div className="w-full max-w-6xl mx-auto">
        {/* 2-Column Desktop Grid / 1-Column Mobile Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          
          {/* LEFT SIDE: Welcome Message, Motivational Subtitle & Educational Illustration */}
          <section
            aria-labelledby="hero-heading"
            className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6"
          >
            {/* Header & Subtitle */}
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-[#DC2626]">
                <span>Student Cohort Enrollment</span>
                <span aria-hidden="true">·</span>
                <span className="text-[#64748B] dark:text-[#94A3B8]">Eduway Platform</span>
              </div>

              <h1
                id="hero-heading"
                className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0B0F17] dark:text-[#F8FAFC] leading-[1.15]"
                style={{ textWrap: 'balance' }}
              >
                Start Your Journey in Modern{' '}
                <span className="text-[#DC2626]">
                  Technology Education
                </span>
              </h1>

              <p className="text-sm sm:text-base text-[#475569] dark:text-[#94A3B8] leading-relaxed max-w-lg">
                Join curious minds, master engineering fundamentals, and collaborate across specialized Eduway cohort classes designed for student innovators.
              </p>
            </div>

            {/* Educational Illustration */}
            <div className="w-full flex justify-center lg:justify-start pt-2">
              <div className="w-full max-w-[280px] sm:max-w-[340px] lg:max-w-[460px]">
                <EducationalIllustration />
              </div>
            </div>

            {/* Value Pillars (Zero-pill unboxed clean typography) */}
            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-xs text-[#64748B] dark:text-[#94A3B8]">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" aria-hidden="true" />
                <span>Hands-on Tech Labs</span>
              </span>
              <span aria-hidden="true" className="text-[#CBD5E1] dark:text-[#334155]">·</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#DCE8FD] border border-[#CBD5E1] dark:border-none" aria-hidden="true" />
                <span>Guided Class Mentorship</span>
              </span>
              <span aria-hidden="true" className="text-[#CBD5E1] dark:text-[#334155]">·</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" aria-hidden="true" />
                <span>Project-Driven Learning</span>
              </span>
            </div>
          </section>

          {/* RIGHT SIDE: Sign Up Form inside clean, elegant card */}
          <section
            aria-labelledby="signup-card-heading"
            className="lg:col-span-6 w-full max-w-lg mx-auto lg:max-w-none"
          >
            <div className="bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] rounded-2xl p-6 sm:p-8 shadow-sm dark:shadow-[0_12px_40px_rgba(0,0,0,0.55)] relative overflow-hidden backdrop-blur-sm transition-colors duration-250">
              {/* Elegant red accent hairline at top of card */}
              <div
                className="absolute top-0 left-0 right-0 h-1 bg-[#DC2626]"
                aria-hidden="true"
              />

              {/* Card Header */}
              <div className="mb-6 space-y-1">
                <h2
                  id="signup-card-heading"
                  className="text-xl sm:text-2xl font-bold tracking-tight text-[#0B0F17] dark:text-[#F8FAFC]"
                >
                  Create Student Account
                </h2>
                <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94A3B8]">
                  Enter your details to register for your Eduway class cohort.
                </p>
              </div>

              {/* The Sign Up Form */}
              <SignUpForm
                onSuccess={handleFormSuccess}
                onNavigateToSignIn={handleSignInClick}
              />
            </div>
          </section>
        </div>
      </div>

      {/* Success Modal Preview for verified registration */}
      {registeredData && (
        <SuccessModal
          data={registeredData}
          onEdit={() => setRegisteredData(null)}
          onReset={() => {
            setRegisteredData(null);
            setToastMessage({
              title: 'Form Reset',
              desc: 'Form is cleared and ready for new input.',
            });
          }}
        />
      )}

      {/* Toast Notification */}
      <Toast
        isOpen={Boolean(toastMessage)}
        message={toastMessage?.title || ''}
        subMessage={toastMessage?.desc}
        onClose={() => setToastMessage(null)}
      />
    </main>
  );
};
