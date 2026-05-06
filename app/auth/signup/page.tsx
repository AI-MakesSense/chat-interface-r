'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SignupForm } from '@/components/auth/signup-form';
import { AuthLayout } from '@/components/auth/auth-layout';

function SignupContent() {
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get('invite') || undefined;

  return (
    <AuthLayout>
      <SignupForm inviteCode={inviteCode} />
    </AuthLayout>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <AuthLayout>
        <div className="w-full max-w-md flex items-center justify-center py-12">
          <p className="text-zinc-400">Loading...</p>
        </div>
      </AuthLayout>
    }>
      <SignupContent />
    </Suspense>
  );
}
