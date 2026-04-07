# Testing Documentation

Comprehensive test suite for the Phase 1 Authentication System.

## Overview

This test suite provides complete coverage for the authentication system, including:

- **Unit Tests**: Test individual utility functions in isolation
- **Integration Tests**: Test API endpoints with mocked database
- **Mocks**: Reusable database mocks for consistent testing

## Test Structure

```
tests/
├── setup.ts                          # Test environment configuration
├── mocks/
│   └── db.ts                        # Database mock utilities
├── unit/
│   └── auth/
│       ├── jwt.test.ts              # JWT utilities tests
│       ├── password.test.ts         # Password utilities tests
│       └── middleware.test.ts       # Auth middleware tests
└── integration/
    └── api/
        └── auth/
            ├── signup.test.ts       # Signup endpoint tests
            ├── login.test.ts        # Login endpoint tests
            ├── me.test.ts           # Get current user tests
            └── logout.test.ts       # Logout endpoint tests
```

## Installation

First, install the testing dependencies:

```bash
npm install
```

The following packages are required:
- `vitest` - Fast unit test framework
- `@vitest/ui` - Optional UI for test visualization
- `happy-dom` - DOM environment for tests

These are already added to `package.json` devDependencies.

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm test -- --watch
```

### Run Tests with UI

```bash
npm run test:ui
```

### Run Specific Test File

```bash
npm test jwt.test.ts
npm test signup.test.ts
```

### Run Tests by Pattern

```bash
npm test -- --grep "JWT"
npm test -- --grep "password"
npm test -- --grep "signup"
```

### Generate Coverage Report

```bash
npm run test:coverage
```

Coverage reports will be generated in `coverage/` directory.

## Test Coverage

### Unit Tests

#### JWT Utilities (`lib/auth/jwt.ts`)

- ✅ signJWT creates valid tokens
- ✅ signJWT includes iat and exp claims
- ✅ signJWT sets 7-day expiration
- ✅ verifyJWT validates correct tokens
- ✅ verifyJWT rejects invalid tokens
- ✅ verifyJWT rejects tampered tokens
- ✅ extractTokenFromCookie extracts from header
- ✅ extractTokenFromCookie handles multiple cookies
- ✅ extractTokenFromCookie returns null when missing

**Total: 25+ test cases**

#### Password Utilities (`lib/auth/password.ts`)

- ✅ hashPassword creates bcrypt hashes
- ✅ hashPassword rejects passwords < 8 chars
- ✅ hashPassword handles special characters
- ✅ verifyPassword accepts correct passwords
- ✅ verifyPassword rejects incorrect passwords
- ✅ verifyPassword is case-sensitive
- ✅ validatePasswordStrength requires 8+ chars
- ✅ validatePasswordStrength requires number
- ✅ validatePasswordStrength accepts valid passwords

**Total: 30+ test cases**

#### Auth Middleware (`lib/auth/middleware.ts`)

- ✅ requireAuth extracts JWT from cookies
- ✅ requireAuth validates token
- ✅ requireAuth throws on missing token
- ✅ requireAuth throws on invalid token
- ✅ optionalAuth returns null when no token
- ✅ optionalAuth doesn't throw errors
- ✅ createAuthCookie formats correctly
- ✅ createAuthCookie includes security flags
- ✅ clearAuthCookie sets Max-Age to 0

**Total: 25+ test cases**

### Integration Tests

#### POST /api/auth/signup

- ✅ Creates user with valid data
- ✅ Returns JWT token
- ✅ Sets auth cookie
- ✅ Rejects duplicate emails
- ✅ Validates email format
- ✅ Validates password strength
- ✅ Rejects password without number
- ✅ Handles optional name field
- ✅ Normalizes email to lowercase

**Total: 20+ test cases**

#### POST /api/auth/login

- ✅ Returns token for valid credentials
- ✅ Sets auth cookie
- ✅ Rejects incorrect password
- ✅ Rejects non-existent email
- ✅ Uses same error for security
- ✅ Validates email format
- ✅ Handles case-insensitive email
- ✅ Password is case-sensitive

**Total: 20+ test cases**

#### GET /api/auth/me

- ✅ Returns user data with valid token
- ✅ Excludes password hash
- ✅ Includes emailVerified status
- ✅ Rejects missing token
- ✅ Rejects invalid token
- ✅ Returns 404 for deleted users
- ✅ Handles UUID user IDs

**Total: 20+ test cases**

#### POST /api/auth/logout

- ✅ Returns success message
- ✅ Clears auth cookie
- ✅ Sets Max-Age to 0
- ✅ Works without authentication
- ✅ Works with invalid token
- ✅ Is idempotent
- ✅ Includes security flags

**Total: 15+ test cases**

## Environment Variables

Tests require the following environment variables (automatically set in `tests/setup.ts`):

```bash
JWT_SECRET=test-jwt-secret-key-that-is-at-least-32-characters-long-for-testing
DATABASE_URL=postgresql://test:test@localhost:5432/test_db
NODE_ENV=test
```

These are set automatically when tests run. For real testing with a database, set `TEST_DATABASE_URL` environment variable.

## Writing New Tests

### Unit Test Template

```typescript
import { describe, it, expect } from 'vitest';
import { yourFunction } from '@/path/to/module';

describe('Your Module', () => {
  describe('yourFunction', () => {
    it('should do something expected', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = yourFunction(input);

      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Integration Test Template

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/your-route/route';
import { NextRequest } from 'next/server';
import * as dbQueries from '@/lib/db/queries';

vi.mock('@/lib/db/queries');

describe('POST /api/your-route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle request', async () => {
    // Arrange
    vi.spyOn(dbQueries, 'someFunction').mockResolvedValue(mockData);
    const request = createRequest(data);

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data).toBeDefined();
  });
});
```

## Mocking Database

Use the provided database mocks in `tests/mocks/db.ts`:

```typescript
import { mockUser, resetDbMocks, setupDbMocksForSuccess } from '@/tests/mocks/db';
import * as dbQueries from '@/lib/db/queries';
import { vi } from 'vitest';

// Mock the module
vi.mock('@/lib/db/queries');

// In your test
beforeEach(() => {
  vi.clearAllMocks();
  resetDbMocks();
});

// Mock specific function
vi.spyOn(dbQueries, 'getUserByEmail').mockResolvedValue(mockUser);
```

## Best Practices

1. **Arrange-Act-Assert**: Structure tests clearly
2. **One assertion per test**: Keep tests focused
3. **Descriptive names**: Use clear test descriptions
4. **Mock external dependencies**: Keep unit tests isolated
5. **Test edge cases**: Cover error conditions
6. **Reset mocks**: Clear state between tests
7. **Use constants**: Define test data at the top

## Troubleshooting

### Tests fail with "JWT_SECRET not set"

Make sure `tests/setup.ts` is being loaded. Check `vitest.config.ts` has:

```typescript
setupFiles: ['./tests/setup.ts']
```

### Import errors with @/ alias

Check `vitest.config.ts` has the resolve alias configured:

```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './'),
  },
}
```

### Database mocks not working

Ensure you're using `vi.mock()` at the top of your test file:

```typescript
vi.mock('@/lib/db/queries');
```

### Cannot find module errors

Install all dependencies:

```bash
npm install
```

## CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Run tests
  run: npm test

- name: Generate coverage
  run: npm run test:coverage

- name: Upload coverage
  # Upload coverage reports to your coverage service
```

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [JWT Testing Guide](https://jwt.io/)

## Test Statistics

- **Total Test Files**: 7
- **Total Test Cases**: 150+
- **Code Coverage Target**: 80%+
- **Test Execution Time**: < 10 seconds

## Maintenance

Tests should be updated when:

1. Adding new authentication features
2. Changing API response formats
3. Modifying validation rules
4. Updating security requirements
5. Changing database schema

## Support

For questions or issues with tests:

1. Check test output for detailed error messages
2. Review this documentation
3. Check vitest documentation
4. Review existing test patterns in similar files

---

**Note**: All tests are designed to pass with the existing Phase 1 implementation. If tests fail, it indicates a regression or change in the codebase that needs attention.
