'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Ticket } from 'lucide-react';

const signupSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .optional(),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type SignupFormData = z.infer<typeof signupSchema>;

interface SignupFormProps {
  redirectTo?: string;
  showLoginLink?: boolean;
  onSuccess?: () => void;
  inviteCode?: string;
}

export function SignupForm({
  redirectTo = '/dashboard',
  showLoginLink = true,
  onSuccess,
  inviteCode,
}: SignupFormProps) {
  const router = useRouter();
  const signup = useAuthStore((state) => state.signup);
  const [error, setError] = useState<string | null>(null);
  const [invite, setInvite] = useState<{ valid: boolean; type?: string; email?: string } | null>(null);
  const [inviteLoading, setInviteLoading] = useState(!!inviteCode);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
  });

  // Validate invite code on mount
  useEffect(() => {
    if (!inviteCode) return;
    setInviteLoading(true);
    fetch(`/api/auth/validate-invite?code=${encodeURIComponent(inviteCode)}`)
      .then(res => res.json())
      .then(data => {
        if (data.valid) {
          setInvite(data);
          if (data.email) {
            setValue('email', data.email);
          }
        } else {
          setError('This invitation link is invalid or has expired.');
        }
      })
      .catch(() => {
        setError('Failed to validate invitation.');
      })
      .finally(() => setInviteLoading(false));
  }, [inviteCode, setValue]);

  const onSubmit = async (data: SignupFormData) => {
    try {
      setError(null);

      await signup({
        email: data.email,
        password: data.password,
        name: data.name,
        inviteCode: inviteCode || undefined,
      });

      onSuccess?.();
      router.push(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    }
  };

  if (inviteLoading) {
    return (
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 text-white">
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-zinc-400">Validating invitation...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 text-white">
      <CardHeader>
        <CardTitle className="text-white">Create an account</CardTitle>
        <CardDescription className="text-zinc-400">
          Get started with your free account today
        </CardDescription>
        {invite?.valid && (
          <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <Ticket className="h-4 w-4 text-indigo-400 shrink-0" />
            <span className="text-sm text-indigo-300">You&apos;ve been invited!</span>
          </div>
        )}
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-zinc-300">
              Name <span className="text-zinc-500 text-sm">(optional)</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              autoComplete="name"
              disabled={isSubmitting}
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-300">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              disabled={isSubmitting || (invite?.type === 'email' && !!invite.email)}
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 disabled:opacity-70"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-zinc-300">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a strong password"
              autoComplete="new-password"
              disabled={isSubmitting}
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
            <p className="text-xs text-zinc-500">
              Must be at least 8 characters with uppercase, lowercase, and number
            </p>
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-zinc-300">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              autoComplete="new-password"
              disabled={isSubmitting}
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Terms of Service */}
          <p className="text-xs text-zinc-500">
            By signing up, you agree to our{' '}
            <a
              href="/legal/terms"
              target="_blank"
              className="text-indigo-400 hover:underline"
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href="/legal/privacy"
              target="_blank"
              className="text-indigo-400 hover:underline"
            >
              Privacy Policy
            </a>
            .
          </p>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </Button>

          {showLoginLink && (
            <p className="text-sm text-center text-zinc-400">
              Already have an account?{' '}
              <a
                href="/auth/login"
                className="text-indigo-400 hover:underline font-medium"
              >
                Sign in
              </a>
            </p>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}

export default SignupForm;
