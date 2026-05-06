/**
 * Login Page
 *
 * Public authentication page for user login.
 * Split-screen layout with live widget showcase.
 */

import { Metadata } from 'next';
import { LoginForm } from '@/components/auth/login-form';
import { AuthLayout } from '@/components/auth/auth-layout';
import { BRAND_NAME } from '@/lib/brand';

export const metadata: Metadata = {
  title: `Sign In | ${BRAND_NAME}`,
  description: `Sign in to your ${BRAND_NAME} account`,
};

export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}
