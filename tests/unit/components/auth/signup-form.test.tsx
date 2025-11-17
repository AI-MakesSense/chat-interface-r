/**
 * Signup Form Component Tests
 *
 * Tests for the SignupForm component focusing on rendering and validation.
 * Using minimal mocking approach for maintainability and reliability.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignupForm } from '@/components/auth/signup-form';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  })),
}));

describe('SignupForm Component', () => {
  beforeEach(() => {
    // Clear mocks
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render signup form with all fields', () => {
      render(<SignupForm />);

      expect(screen.getByText('Create an account')).toBeInTheDocument();
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('should show password requirements hint', () => {
      render(<SignupForm />);
      
      expect(screen.getByText(/Must be at least 8 characters with uppercase, lowercase, and number/i)).toBeInTheDocument();
    });

    it('should show terms of service links', () => {
      render(<SignupForm />);
      
      expect(screen.getByRole('link', { name: /Terms of Service/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Privacy Policy/i })).toBeInTheDocument();
    });

    it('should have login link', () => {
      render(<SignupForm />);
      
      expect(screen.getByRole('link', { name: /Sign in/i })).toBeInTheDocument();
      expect(screen.getByText(/Already have an account\?/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show error for invalid email', async () => {
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

      expect(screen.getByText(/Invalid email address/i)).toBeInTheDocument();
    });

    it('should show error for password without uppercase', async () => {
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

      expect(screen.getByText(/Password must contain at least one uppercase letter/i)).toBeInTheDocument();
    });

    it('should show error for password without lowercase', async () => {
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

      expect(screen.getByText(/Password must contain at least one lowercase letter/i)).toBeInTheDocument();
    });

    it('should show error for password without number', async () => {
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

      expect(screen.getByText(/Password must contain at least one number/i)).toBeInTheDocument();
    });

    it('should show error for short password', async () => {
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

      expect(screen.getByText(/Password must be at least 8 characters/i)).toBeInTheDocument();
    });

    it('should show error for mismatched passwords', async () => {
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

      expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
    });

    it('should allow name to be optional', async () => {
      const user = userEvent.setup();
      render(<SignupForm />);

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      // Don't fill name field (it's optional)
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123');
      await user.type(confirmPasswordInput, 'Password123');
      
      // Should not show "Name is required" error
      expect(screen.queryByText(/Name is required/i)).not.toBeInTheDocument();
    });
  });
});
