/**
 * Signup Form Component Tests (RED Phase)
 *
 * Tests for signup form component.
 * These tests should FAIL initially as they expose missing functionality or bugs.
 *
 * Test Coverage:
 * - Password strength validation
 * - Confirm password match
 * - Submit success
 * - Error handling
 * - Loading states
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignupForm } from '@/components/auth/signup-form';
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

describe('SignupForm Component', () => {
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
    it('should fail - should render signup form with all fields', () => {
      // WHY THIS SHOULD FAIL: Need to verify all form elements render
      render(<SignupForm />);

      expect(screen.getByText('Create an account')).toBeInTheDocument();
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
      expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
    });

    it('should fail - should show password requirements hint', () => {
      // WHY THIS SHOULD FAIL: Need to verify hint text exists
      render(<SignupForm />);

      expect(screen.getByText(/must be at least 8 characters with uppercase, lowercase, and number/i)).toBeInTheDocument();
    });

    it('should fail - should show terms of service links', () => {
      // WHY THIS SHOULD FAIL: Need to verify legal links exist
      render(<SignupForm />);

      const termsLink = screen.getByText(/terms of service/i);
      const privacyLink = screen.getByText(/privacy policy/i);

      expect(termsLink).toBeInTheDocument();
      expect(termsLink).toHaveAttribute('href', '/legal/terms');

      expect(privacyLink).toBeInTheDocument();
      expect(privacyLink).toHaveAttribute('href', '/legal/privacy');
    });

    it('should fail - should hide login link when showLoginLink is false', () => {
      // WHY THIS SHOULD FAIL: Need to verify conditional rendering
      render(<SignupForm showLoginLink={false} />);

      expect(screen.queryByText(/already have an account/i)).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should fail - should show error for invalid email', async () => {
      // WHY THIS SHOULD FAIL: Need to verify email validation
      const user = userEvent.setup();
      render(<SignupForm />);

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, 'invalid-email');
      await user.type(passwordInput, 'Password123');
      await user.type(confirmPasswordInput, 'Password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
      });
    });

    it('should fail - should show error for password without uppercase', async () => {
      // WHY THIS SHOULD FAIL: Need to verify password strength validation
      const user = userEvent.setup();
      render(<SignupForm />);

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123'); // No uppercase
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must contain at least one uppercase letter/i)).toBeInTheDocument();
      });
    });

    it('should fail - should show error for password without lowercase', async () => {
      // WHY THIS SHOULD FAIL: Need to verify password strength validation
      const user = userEvent.setup();
      render(<SignupForm />);

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'PASSWORD123'); // No lowercase
      await user.type(confirmPasswordInput, 'PASSWORD123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must contain at least one lowercase letter/i)).toBeInTheDocument();
      });
    });

    it('should fail - should show error for password without number', async () => {
      // WHY THIS SHOULD FAIL: Need to verify password strength validation
      const user = userEvent.setup();
      render(<SignupForm />);

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'PasswordOnly'); // No number
      await user.type(confirmPasswordInput, 'PasswordOnly');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must contain at least one number/i)).toBeInTheDocument();
      });
    });

    it('should fail - should show error for short password', async () => {
      // WHY THIS SHOULD FAIL: Need to verify password length validation
      const user = userEvent.setup();
      render(<SignupForm />);

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Pass1'); // Too short
      await user.type(confirmPasswordInput, 'Pass1');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('should fail - should show error for mismatched passwords', async () => {
      // WHY THIS SHOULD FAIL: Need to verify password match validation
      const user = userEvent.setup();
      render(<SignupForm />);

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123');
      await user.type(confirmPasswordInput, 'DifferentPassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });

    it('should fail - name should be optional', async () => {
      // WHY THIS SHOULD FAIL: Need to verify name is not required
      const user = userEvent.setup();
      render(<SignupForm />);

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      // Don't fill in name
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123');
      await user.type(confirmPasswordInput, 'Password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Form Submission', () => {
    it('should fail - should submit form with valid data', async () => {
      // WHY THIS SHOULD FAIL: Need to verify successful signup flow
      const user = userEvent.setup();
      render(<SignupForm />);

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'new@example.com');
      await user.type(passwordInput, 'Password123');
      await user.type(confirmPasswordInput, 'Password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should fail - should show loading state during submission', async () => {
      // WHY THIS SHOULD FAIL: Need to verify loading state
      const user = userEvent.setup();
      render(<SignupForm />);

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, 'new@example.com');
      await user.type(passwordInput, 'Password123');
      await user.type(confirmPasswordInput, 'Password123');

      // Start submission
      await user.click(submitButton);

      // Check for loading state
      await waitFor(() => {
        expect(screen.getByText(/creating account/i)).toBeInTheDocument();
      });
    });

    it('should fail - should disable form during submission', async () => {
      // WHY THIS SHOULD FAIL: Need to verify form is disabled during submit
      const user = userEvent.setup();
      render(<SignupForm />);

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, 'new@example.com');
      await user.type(passwordInput, 'Password123');
      await user.type(confirmPasswordInput, 'Password123');

      // Start submission
      const clickPromise = user.click(submitButton);

      // Inputs should be disabled
      await waitFor(() => {
        expect(emailInput).toBeDisabled();
        expect(passwordInput).toBeDisabled();
        expect(confirmPasswordInput).toBeDisabled();
        expect(submitButton).toBeDisabled();
      });

      await clickPromise;
    });
  });

  describe('Error Handling', () => {
    it('should fail - should display error for existing email', async () => {
      // WHY THIS SHOULD FAIL: Need to verify duplicate email error display
      const user = userEvent.setup();
      render(<SignupForm />);

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, 'existing@example.com');
      await user.type(passwordInput, 'Password123');
      await user.type(confirmPasswordInput, 'Password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
      });
    });

    it('should fail - should display error from API', async () => {
      // WHY THIS SHOULD FAIL: Need to verify API error display
      const user = userEvent.setup();

      // Mock API error
      server.use(
        http.post('/api/auth/signup', () => {
          return HttpResponse.json(
            { error: 'Service unavailable' },
            { status: 503 }
          );
        })
      );

      render(<SignupForm />);

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, 'new@example.com');
      await user.type(passwordInput, 'Password123');
      await user.type(confirmPasswordInput, 'Password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/service unavailable/i)).toBeInTheDocument();
      });
    });

    it('should fail - should not redirect on error', async () => {
      // WHY THIS SHOULD FAIL: Need to verify no redirect on error
      const user = userEvent.setup();
      render(<SignupForm />);

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, 'existing@example.com');
      await user.type(passwordInput, 'Password123');
      await user.type(confirmPasswordInput, 'Password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
      });

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Custom Redirect', () => {
    it('should fail - should redirect to custom path on success', async () => {
      // WHY THIS SHOULD FAIL: Need to verify custom redirect
      const user = userEvent.setup();
      render(<SignupForm redirectTo="/onboarding" />);

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, 'new@example.com');
      await user.type(passwordInput, 'Password123');
      await user.type(confirmPasswordInput, 'Password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/onboarding');
      });
    });
  });

  describe('Success Callback', () => {
    it('should fail - should call onSuccess callback', async () => {
      // WHY THIS SHOULD FAIL: Need to verify callback is called
      const user = userEvent.setup();
      const onSuccess = vi.fn();

      render(<SignupForm onSuccess={onSuccess} />);

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, 'new@example.com');
      await user.type(passwordInput, 'Password123');
      await user.type(confirmPasswordInput, 'Password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it('should fail - should not call onSuccess on error', async () => {
      // WHY THIS SHOULD FAIL: Need to verify callback not called on error
      const user = userEvent.setup();
      const onSuccess = vi.fn();

      render(<SignupForm onSuccess={onSuccess} />);

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, 'existing@example.com');
      await user.type(passwordInput, 'Password123');
      await user.type(confirmPasswordInput, 'Password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
      });

      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  describe('Links', () => {
    it('should fail - should have login link', () => {
      // WHY THIS SHOULD FAIL: Need to verify login link exists
      render(<SignupForm />);

      const loginLink = screen.getByText(/sign in/i);
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/auth/login');
    });
  });
});
