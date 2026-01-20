'use client';

import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

/**
 * Forgot Password Page
 *
 * Allows users to request a password reset email.
 */
export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <ForgotPasswordForm />
    </div>
  );
}
