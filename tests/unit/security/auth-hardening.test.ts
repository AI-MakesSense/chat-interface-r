/**
 * @jest-environment node
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

jest.mock('@/lib/security/rate-limit', () => ({
  checkRateLimit: jest.fn(),
}));

jest.mock('@/lib/db/queries', () => ({
  getUserByEmail: jest.fn(),
  createUser: jest.fn(),
}));

jest.mock('@/lib/auth/password', () => ({
  verifyPassword: jest.fn(),
  hashPassword: jest.fn(),
  validatePasswordStrength: jest.fn(),
}));

jest.mock('@/lib/auth/jwt', () => ({
  signJWT: jest.fn().mockResolvedValue('jwt-token'),
}));

jest.mock('@/lib/auth/guard', () => ({
  createAuthCookie: jest.fn().mockReturnValue(
    'auth-token=jwt-token; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800'
  ),
}));

const { POST: loginPOST } = require('@/app/api/auth/login/route');
const { POST: signupPOST } = require('@/app/api/auth/signup/route');
const { checkRateLimit } = require('@/lib/security/rate-limit');
const { getUserByEmail, createUser } = require('@/lib/db/queries');
const { verifyPassword, hashPassword, validatePasswordStrength } = require('@/lib/auth/password');

describe('Auth Security Hardening', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    checkRateLimit.mockReturnValue({ allowed: true, remaining: 10 });
  });

  it('login response is cookie-only (no token field)', async () => {
    getUserByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: 'hashed-password',
    });
    verifyPassword.mockResolvedValue(true);

    const request = new NextRequest('https://chat-interface-r.vercel.app/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '198.51.100.42',
      },
      body: JSON.stringify({ email: 'test@example.com', password: 'Password123' }),
    });

    const response = await loginPOST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user).toBeDefined();
    expect(data.token).toBeUndefined();
    expect(response.headers.get('Set-Cookie')).toContain('auth-token=');
  });

  it('signup response is cookie-only (no token field)', async () => {
    getUserByEmail.mockResolvedValue(null);
    validatePasswordStrength.mockReturnValue(null);
    hashPassword.mockResolvedValue('hashed-password');
    createUser.mockResolvedValue({
      id: 'user-2',
      email: 'new@example.com',
      name: 'New User',
    });

    const request = new NextRequest('https://chat-interface-r.vercel.app/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '198.51.100.42',
      },
      body: JSON.stringify({
        email: 'new@example.com',
        password: 'Password123',
        name: 'New User',
      }),
    });

    const response = await signupPOST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.user).toBeDefined();
    expect(data.token).toBeUndefined();
    expect(response.headers.get('Set-Cookie')).toContain('auth-token=');
  });

  it('returns 429 when login IP rate limit is exceeded', async () => {
    checkRateLimit.mockReturnValueOnce({
      allowed: false,
      retryAfter: 120,
      remaining: 0,
    });

    const request = new NextRequest('https://chat-interface-r.vercel.app/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '198.51.100.42',
      },
      body: JSON.stringify({ email: 'test@example.com', password: 'Password123' }),
    });

    const response = await loginPOST(request);
    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('120');
  });

  it('returns 429 when signup email rate limit is exceeded', async () => {
    checkRateLimit
      .mockReturnValueOnce({ allowed: true, remaining: 10 })
      .mockReturnValueOnce({ allowed: false, retryAfter: 300, remaining: 0 });

    const request = new NextRequest('https://chat-interface-r.vercel.app/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '198.51.100.42',
      },
      body: JSON.stringify({
        email: 'new@example.com',
        password: 'Password123',
      }),
    });

    const response = await signupPOST(request);
    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('300');
  });
});
