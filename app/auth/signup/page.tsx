/**
 * Signup Page
 *
 * Public registration page for new users.
 * Split-screen layout with live widget showcase.
 */

import { Metadata } from 'next';
import { SignupForm } from '@/components/auth/signup-form';
import { AuthLayout } from '@/components/auth/auth-layout';
import { BRAND_NAME } from '@/lib/brand';

export const metadata: Metadata = {
  title: `Create Account | ${BRAND_NAME}`,
  description: `Create your ${BRAND_NAME} account`,
};

export default function SignupPage() {
  return (
    <AuthLayout>
      <SignupForm />
    </AuthLayout>
  );
}
