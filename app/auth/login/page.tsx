/**
 * Login Page
 *
 * Public authentication page for user login.
 * Displays the LoginForm component in a centered layout.
 */

import { Metadata } from 'next';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = {
  title: 'Sign In | N8n Widget Designer',
  description: 'Sign in to your N8n Widget Designer account',
};

/**
 * Login page component
 *
 * Renders the login form in a centered container with branding.
 */
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-4">
      <div className="w-full max-w-md">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            N8n Widget Designer
          </h1>
          <p className="text-muted-foreground mt-2">
            Embeddable chat widgets for N8n workflows
          </p>
        </div>

        {/* Login Form */}
        <LoginForm />
      </div>
    </div>
  );
}
