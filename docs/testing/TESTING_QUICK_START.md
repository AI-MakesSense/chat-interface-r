# Testing Quick Start Guide

## Installation & Setup

### 1. Install Dependencies

```bash
cd "C:\Projects\Chat Interfacer\n8n-widget-designer"
npm install
```

If npm install fails, try:
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 2. Verify Setup

Check that these files exist:
- ✅ `vitest.config.ts`
- ✅ `tests/setup.ts`
- ✅ `tests/README.md`

## Running Tests

### Run All Tests
```bash
npm test
```

### Watch Mode (Auto-rerun on changes)
```bash
npm test -- --watch
```

### Visual UI
```bash
npm run test:ui
```
Then open http://localhost:51204 in your browser

### Coverage Report
```bash
npm run test:coverage
```
Opens HTML report in `coverage/index.html`

### Run Specific Tests
```bash
# Run only JWT tests
npm test jwt.test.ts

# Run only signup tests
npm test signup.test.ts

# Run all auth tests
npm test auth
```

### Run by Pattern
```bash
# Run all password-related tests
npm test -- --grep "password"

# Run all validation tests
npm test -- --grep "validation"
```

## Expected Results

When you run `npm test`, you should see:

```
✓ tests/unit/auth/jwt.test.ts (25 tests)
✓ tests/unit/auth/password.test.ts (30 tests)
✓ tests/unit/auth/middleware.test.ts (25 tests)
✓ tests/integration/api/auth/signup.test.ts (20 tests)
✓ tests/integration/api/auth/login.test.ts (20 tests)
✓ tests/integration/api/auth/me.test.ts (20 tests)
✓ tests/integration/api/auth/logout.test.ts (15 tests)

Test Files  7 passed (7)
     Tests  155 passed (155)
  Start at  [timestamp]
  Duration  [< 10s]
```

## Test File Locations

```
tests/
├── unit/auth/
│   ├── jwt.test.ts           # JWT utility tests
│   ├── password.test.ts      # Password utility tests
│   └── middleware.test.ts    # Middleware tests
│
└── integration/api/auth/
    ├── signup.test.ts        # POST /api/auth/signup
    ├── login.test.ts         # POST /api/auth/login
    ├── me.test.ts            # GET /api/auth/me
    └── logout.test.ts        # POST /api/auth/logout
```

## Troubleshooting

### "Cannot find module" errors
```bash
npm install
```

### "JWT_SECRET not set" errors
This should be auto-configured. Check `tests/setup.ts` exists.

### Tests fail unexpectedly
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
npm test
```

### Import path errors (@/)
Verify `vitest.config.ts` has the alias configuration.

## Common Commands

| Command | Purpose |
|---------|---------|
| `npm test` | Run all tests once |
| `npm test -- --watch` | Run tests in watch mode |
| `npm run test:ui` | Open visual test UI |
| `npm run test:coverage` | Generate coverage report |
| `npm test jwt.test.ts` | Run specific test file |
| `npm test -- --grep "password"` | Run tests matching pattern |

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Run tests: `npm test`
3. ✅ Check coverage: `npm run test:coverage`
4. ✅ Read full docs: `tests/README.md`

## Documentation Files

- **TESTING_QUICK_START.md** (this file) - Quick reference
- **tests/README.md** - Comprehensive documentation
- **TEST_SUMMARY.md** - Detailed test coverage summary

## Support

For detailed information:
1. Read `tests/README.md` for comprehensive guide
2. Check `TEST_SUMMARY.md` for coverage details
3. Review test files for examples
4. Check Vitest docs: https://vitest.dev/

---

**Ready to test!** Run `npm test` to get started.
