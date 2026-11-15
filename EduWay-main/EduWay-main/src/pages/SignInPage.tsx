import React from 'react';
import { SignInIllustration } from '../components/illustration/SignInIllustration';
import { SignInForm } from '../components/auth/SignInForm';

interface SignInPageProps {
  onSignUpRequested?: () => void;
}

export const SignInPage: React.FC<SignInPageProps> = ({
  onSignUpRequested,
}) => {
  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-8 lg:py-14 px-4 sm:px-6 lg:px-8 transition-colors duration-250">
      <div className="w-full max-w-6xl mx-auto">
        {/* 2-Column Desktop Grid / 1-Column Mobile Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          
          {/* LEFT SIDE: Welcome Message, Subtitle & Educational Illustration */}
          <section
            aria-labelledby="signin-hero-heading"
            className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6"
          >
            {/* Header & Subtitle */}
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-[#DC2626]">
                <span>Student Portal Access</span>
                <span aria-hidden="true">·</span>
                <span className="text-[#64748B] dark:text-[#94A3B8]">Eduway Platform</span>
              </div>

              <h1
                id="signin-hero-heading"
                className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0B0F17] dark:text-[#F8FAFC] leading-[1.15]"
                style={{ textWrap: 'balance' }}
              >
                Welcome Back to{' '}
                <span className="text-[#DC2626]">
                  Eduway
                </span>
              </h1>

              <p className="text-sm sm:text-base text-[#475569] dark:text-[#94A3B8] leading-relaxed max-w-lg">
                Continue your learning journey. Access your cohort modules, track academic milestones, and collaborate with your technology peers.
              </p>
            </div>

            {/* Educational Illustration (Responsive sizing without human characters) */}
            <div className="w-full flex justify-center lg:justify-start pt-2">
              <div className="w-full max-w-[280px] sm:max-w-[340px] lg:max-w-[460px]">
                <SignInIllustration />
              </div>
            </div>

            {/* Value Pillars (Zero-pill clean typography) */}
            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-xs text-[#64748B] dark:text-[#94A3B8]">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" aria-hidden="true" />
                <span>Cohort Progress</span>
              </span>
              <span aria-hidden="true" className="text-[#CBD5E1] dark:text-[#334155]">·</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#DCE8FD] border border-[#CBD5E1] dark:border-none" aria-hidden="true" />
                <span>Class Modules</span>
              </span>
              <span aria-hidden="true" className="text-[#CBD5E1] dark:text-[#334155]">·</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" aria-hidden="true" />
                <span>Active Challenges</span>
              </span>
            </div>
          </section>

          {/* RIGHT SIDE: Sign In Form inside clean, elegant card */}
          <section
            aria-labelledby="signin-card-heading"
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
                  id="signin-card-heading"
                  className="text-xl sm:text-2xl font-bold tracking-tight text-[#0B0F17] dark:text-[#F8FAFC]"
                >
                  Student Sign In
                </h2>
                <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94A3B8]">
                  Enter your full name and password to access your account.
                </p>
              </div>

              {/* The Sign In Form */}
              <SignInForm
                onNavigateToSignUp={() => {
                  if (onSignUpRequested) {
                    onSignUpRequested();
                  }
                }}
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};
