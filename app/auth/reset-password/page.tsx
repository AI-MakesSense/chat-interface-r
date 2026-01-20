'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

/**
 * Reset Password Page
 *
 * Allows users to set a new password using a token from email.
 */

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') || '';

  return <ResetPasswordForm token={token} />;
}

function LoadingState() {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="py-12 flex flex-col items-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Suspense fallback={<LoadingState />}>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
