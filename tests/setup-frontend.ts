/**
 * Frontend Test Setup
 *
 * Configures testing environment for React components.
 * Sets up @testing-library/jest-dom matchers and MSW for API mocking.
 *
 * This file is loaded by vitest before running frontend tests.
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { server } from './mocks/server';

/**
 * Start MSW server before all tests
 * Intercepts network requests during tests
 */
beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'warn', // Warn on unhandled requests
  });
});

/**
 * Reset handlers and cleanup after each test
 * Ensures test isolation
 */
afterEach(() => {
  server.resetHandlers();
  cleanup(); // Cleanup React Testing Library
});

/**
 * Stop MSW server after all tests
 */
afterAll(() => {
  server.close();
});

/**
 * Mock Next.js router
 * Required for components that use useRouter
 */
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

/**
 * Mock window.matchMedia
 * Required for components that use responsive design
 */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

/**
 * Mock localStorage
 */
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

/**
 * Mock postMessage for iframe communication
 */
Object.defineProperty(window, 'postMessage', {
  writable: true,
  value: vi.fn(),
});
