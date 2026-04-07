/**
 * Login Form Component Tests (RED Phase)
 *
 * Tests for login form component.
 * These tests should FAIL initially as they expose missing functionality or bugs.
 *
 * Test Coverage:
 * - Form validation (email, password)
 * - Submit with valid credentials
 * - Error display
 * - Redirect on success
 * - Loading states
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/components/auth/login-form';
import { useAuthStore } from '@/stores/auth-store';
import { server } from '../../../mocks/server';
import { http, HttpResponse } from 'msw';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

describe('LoginForm Component', () => {
  beforeEach(() => {
    // Clear store
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });

    // Clear mocks
    vi.clearAllMocks();
    mockPush.mockClear();
  });

  describe('Rendering', () => {
    it('should fail - should render login form with all fields', () => {
      // WHY THIS SHOULD FAIL: Need to verify all form elements render
      render(<LoginForm />);

      expect(screen.getByText('Welcome back')).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    });

    it('should fail - should hide signup link when showSignupLink is false', () => {
      // WHY THIS SHOULD FAIL: Need to verify conditional rendering
      render(<LoginForm showSignupLink={false} />);

      expect(screen.queryByText(/don't have an account/i)).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should fail - should show error for invalid email', async () => {
      // WHY THIS SHOULD FAIL: Need to verify email validation
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'invalid-email');
      await user.type(passwordInput, 'Password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
      });
    });

    it('should fail - should show error for empty email', async () => {
      // WHY THIS SHOULD FAIL: Need to verify required field validation
      const user = userEvent.setup();
      render(<LoginForm />);

      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(passwordInput, 'Password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    it('should fail - should show error for empty password', async () => {
      // WHY THIS SHOULD FAIL: Need to verify required field validation
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it('should fail - should show error for short password', async () => {
      // WHY THIS SHOULD FAIL: Need to verify password length validation
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'short');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should fail - should submit form with valid credentials', async () => {
      // WHY THIS SHOULD FAIL: Need to verify successful login flow
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should fail - should show loading state during submission', async () => {
      // WHY THIS SHOULD FAIL: Need to verify loading state
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123');

      // Start submission
      await user.click(submitButton);

      // Check for loading state (button text changes or disabled state)
      await waitFor(() => {
        expect(screen.getByText(/signing in/i)).toBeInTheDocument();
      });
    });

    it('should fail - should disable form during submission', async () => {
      // WHY THIS SHOULD FAIL: Need to verify form is disabled during submit
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123');

      // Start submission
      const clickPromise = user.click(submitButton);

      // Inputs should be disabled
      await waitFor(() => {
        expect(emailInput).toBeDisabled();
        expect(passwordInput).toBeDisabled();
        expect(submitButton).toBeDisabled();
      });

      await clickPromise;
    });
  });

  describe('Error Handling', () => {
    it('should fail - should display error for invalid credentials', async () => {
      // WHY THIS SHOULD FAIL: Need to verify error display
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'wrong@example.com');
      await user.type(passwordInput, 'WrongPassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });

    it('should fail - should display error from API', async () => {
      // WHY THIS SHOULD FAIL: Need to verify API error display
      const user = userEvent.setup();

      // Mock API error
      server.use(
        http.post('/api/auth/login', () => {
          return HttpResponse.json(
            { error: 'Account locked' },
            { status: 403 }
          );
        })
      );

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/account locked/i)).toBeInTheDocument();
      });
    });

    it('should fail - should not redirect on error', async () => {
      // WHY THIS SHOULD FAIL: Need to verify no redirect on error
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'wrong@example.com');
      await user.type(passwordInput, 'WrongPassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Custom Redirect', () => {
    it('should fail - should redirect to custom path on success', async () => {
      // WHY THIS SHOULD FAIL: Need to verify custom redirect
      const user = userEvent.setup();
      render(<LoginForm redirectTo="/custom-path" />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/custom-path');
      });
    });
  });

  describe('Success Callback', () => {
    it('should fail - should call onSuccess callback', async () => {
      // WHY THIS SHOULD FAIL: Need to verify callback is called
      const user = userEvent.setup();
      const onSuccess = vi.fn();

      render(<LoginForm onSuccess={onSuccess} />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it('should fail - should not call onSuccess on error', async () => {
      // WHY THIS SHOULD FAIL: Need to verify callback not called on error
      const user = userEvent.setup();
      const onSuccess = vi.fn();

      render(<LoginForm onSuccess={onSuccess} />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'wrong@example.com');
      await user.type(passwordInput, 'WrongPassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });

      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  describe('Links', () => {
    it('should fail - should have forgot password link', () => {
      // WHY THIS SHOULD FAIL: Need to verify forgot password link exists
      render(<LoginForm />);

      const forgotPasswordLink = screen.getByText(/forgot password/i);
      expect(forgotPasswordLink).toBeInTheDocument();
      expect(forgotPasswordLink).toHaveAttribute('href', '/auth/forgot-password');
    });

    it('should fail - should have signup link', () => {
      // WHY THIS SHOULD FAIL: Need to verify signup link exists
      render(<LoginForm />);

      const signupLink = screen.getByText(/sign up/i);
      expect(signupLink).toBeInTheDocument();
      expect(signupLink).toHaveAttribute('href', '/auth/signup');
    });
  });
});
