'use client';

/**
 * Signup Form Component
 *
 * Client-side registration form with comprehensive validation.
 * Uses React Hook Form for validation and Zustand for state management.
 *
 * Features:
 * - Email, password, and name validation
 * - Password strength requirements (min 8 chars, uppercase, lowercase, number)
 * - Password confirmation matching
 * - Loading states during registration
 * - Error message display
 * - Redirect to dashboard on success
 * - Link to login form
 */

import { useState } from 'react';
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

/**
 * Signup form validation schema
 *
 * Password requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
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
  /**
   * Redirect path after successful signup
   * @default '/dashboard'
   */
  redirectTo?: string;
  /**
   * Show link to login form
   * @default true
   */
  showLoginLink?: boolean;
  /**
   * Callback after successful signup
   */
  onSuccess?: () => void;
}

/**
 * Signup form component
 *
 * @example
 * <SignupForm redirectTo="/onboarding" />
 */
export function SignupForm({
  redirectTo = '/dashboard',
  showLoginLink = true,
  onSuccess,
}: SignupFormProps) {
  const router = useRouter();
  const signup = useAuthStore((state) => state.signup);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange', // Validate on change for immediate feedback
  });

  /**
   * Handle form submission
   */
  const onSubmit = async (data: SignupFormData) => {
    try {
      setError(null);

      // Call signup with name, email, password (exclude confirmPassword)
      await signup({
        email: data.email,
        password: data.password,
        name: data.name,
      });

      // Success callback
      onSuccess?.();

      // Redirect to dashboard
      router.push(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Get started with your free account today
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-muted-foreground text-sm">(optional)</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              autoComplete="name"
              disabled={isSubmitting}
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              disabled={isSubmitting}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a strong password"
              autoComplete="new-password"
              disabled={isSubmitting}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Must be at least 8 characters with uppercase, lowercase, and number
            </p>
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              autoComplete="new-password"
              disabled={isSubmitting}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Terms of Service */}
          <p className="text-xs text-muted-foreground">
            By signing up, you agree to our{' '}
            <a
              href="/legal/terms"
              target="_blank"
              className="text-primary hover:underline"
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href="/legal/privacy"
              target="_blank"
              className="text-primary hover:underline"
            >
              Privacy Policy
            </a>
            .
          </p>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </Button>

          {/* Login Link */}
          {showLoginLink && (
            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{' '}
              <a
                href="/auth/login"
                className="text-primary hover:underline font-medium"
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
