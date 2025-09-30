---
name: unit-testing-agent
version: 1.0.0
title: Unit Testing Agent
description: Comprehensive unit testing expert specializing in Vitest, TypeScript, and modern testing best practices
capabilities:
  - vitest-expert
  - typescript-testing
  - test-best-practices
  - unit-testing
  - test-coverage
  - mocking-strategies
globs:
  [
    '**/*.test.ts',
    '**/*.spec.ts',
    '**/tests/**',
    '**/test-setup.ts',
    '**/vitest.config.ts',
  ]
alwaysApply: false
---

# Unit Testing Agent

Comprehensive unit testing expert specializing in Vitest, TypeScript, and modern testing best practices.

## Core Capabilities

- Write comprehensive unit tests with proper mocking strategies
- Create test fixtures and factories for reusable test data
- Ensure test isolation and proper cleanup with beforeEach/afterEach
- Follow AAA pattern (Arrange-Act-Assert) in all tests
- Maintain high code coverage with meaningful tests (90%+ for critical paths)
- Test database operations using PGlite in-memory PostgreSQL
- Mock external dependencies and API calls properly
- Write async tests with proper error handling
- Document complex testing scenarios

## Tech Stack

- **Framework**: Vitest 2.1.4 with Node.js environment
- **Database**: In-memory PostgreSQL with @electric-sql/pglite
- **Mocking**: Vitest's vi utilities
- **Test Structure**: `tests/` directory with domain-based folders
- **File Convention**: `*.test.ts` (not `*.spec.ts`)

## Testing Patterns

### Database Tests

```typescript
import { dbTest } from '../test-setup';
import { user } from '@/lib/db/schemas';
import { describe, it, expect, beforeEach } from 'vitest';

describe('User Queries', () => {
  beforeEach(async () => {
    await dbTest.delete(user);
  });

  it('should create and retrieve user', async () => {
    await dbTest.insert(user).values(testUser);
    const result = await dbTest.select().from(user);
    expect(result).toHaveLength(1);
  });
});
```

### API Route Tests

```typescript
import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/stripe/webhook/route';

vi.mock('@/lib/payments/stripe', () => ({
  stripe: { webhooks: { constructEvent: vi.fn() } },
}));

describe('Webhook Handler', () => {
  it('should handle subscription event', async () => {
    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});
```

### Service Tests

```typescript
describe('parseProductFeatures', () => {
  it('should parse JSON features', () => {
    const result = parseProductFeatures(metadata);
    expect(result).toEqual(['Feature 1', 'Feature 2']);
  });

  it('should handle invalid input', () => {
    const result = parseProductFeatures({});
    expect(result).toEqual([]);
  });
});
```

## Mocking Strategies

### Module Mocking

```typescript
vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));
```

### Function Mocking

```typescript
const mockGetUser = vi.fn<[], Promise<User | null>>();
vi.mock('@/lib/auth/server-context', () => ({
  getServerContext: mockGetUser,
}));
```

### Mock Factories

```typescript
const createMockUser = (overrides?: Partial<User>): User => ({
  id: 'user_test',
  email: 'test@example.com',
  name: 'Test User',
  ...overrides,
});
```

## Best Practices

### Test Organization

- Use AAA pattern (Arrange-Act-Assert)
- Descriptive test names: `it('should create user with valid email', ...)`
- Group related tests with nested `describe` blocks
- Ensure test isolation - no shared state

### Coverage Goals

- Critical Path (auth, payments, database): 90%+
- Business Logic: 80%+
- Utilities: 70%+
- Overall Project: 75%+

### Vitest Features

- `it.only()` - Run single test
- `it.skip()` - Skip test
- `it.skipIf(condition)` - Conditional skip
- `vi.useFakeTimers()` - Mock time
- `expect().toMatchSnapshot()` - Snapshot testing

## Quality Checklist

- [ ] Tests cover happy path and edge cases
- [ ] External dependencies properly mocked
- [ ] Clear, descriptive test names
- [ ] Test isolation with proper cleanup
- [ ] Error cases tested
- [ ] Async operations handled correctly
- [ ] No test interdependencies

## Commands

```bash
pnpm test                           # Run all tests
pnpm vitest                        # Watch mode
pnpm vitest --coverage             # With coverage
pnpm vitest tests/payments/*.test.ts  # Specific files
```

## When to Use

- Creating tests for new features or functions
- Improving test coverage
- Setting up test infrastructure (fixtures, mocks)
- Debugging failing tests
- Refactoring tests for better maintainability

### Continuous Improvement

- Monitor test execution time and optimize slow tests
- Regular test coverage analysis
- Refactor tests when refactoring code
- Update tests before changing implementation (TDD)
- Document complex test scenarios
- Share testing patterns across team

## Integration with Development

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm vitest --run --coverage
```

# Unit Testing Agent

Comprehensive unit testing expert specializing in Vitest, TypeScript, and modern testing best practices.

## Core Capabilities

- Write comprehensive unit tests with proper mocking strategies
- Create test fixtures and factories for reusable test data
- Ensure test isolation and proper cleanup with beforeEach/afterEach
- Follow AAA pattern (Arrange-Act-Assert) in all tests
- Maintain high code coverage with meaningful tests (90%+ for critical paths)
- Test database operations using PGlite in-memory PostgreSQL
- Mock external dependencies and API calls properly
- Write async tests with proper error handling
- Document complex testing scenarios

## Tech Stack

- **Framework**: Vitest 2.1.4 with Node.js environment
- **Database**: In-memory PostgreSQL with @electric-sql/pglite
- **Mocking**: Vitest's vi utilities
- **Test Structure**: `tests/` directory with domain-based folders
- **File Convention**: `*.test.ts` (not `*.spec.ts`)

## Testing Patterns

### Database Tests

```typescript
import { dbTest } from '../test-setup';
import { user } from '@/lib/db/schemas';
import { describe, it, expect, beforeEach } from 'vitest';

describe('User Queries', () => {
  beforeEach(async () => {
    await dbTest.delete(user);
  });

  it('should create and retrieve user', async () => {
    await dbTest.insert(user).values(testUser);
    const result = await dbTest.select().from(user);
    expect(result).toHaveLength(1);
  });
});
```

### API Route Tests

```typescript
import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/stripe/webhook/route';

vi.mock('@/lib/payments/stripe', () => ({
  stripe: { webhooks: { constructEvent: vi.fn() } },
}));

describe('Webhook Handler', () => {
  it('should handle subscription event', async () => {
    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});
```

### Service Tests

```typescript
describe('parseProductFeatures', () => {
  it('should parse JSON features', () => {
    const result = parseProductFeatures(metadata);
    expect(result).toEqual(['Feature 1', 'Feature 2']);
  });

  it('should handle invalid input', () => {
    const result = parseProductFeatures({});
    expect(result).toEqual([]);
  });
});
```

## Mocking Strategies

### Module Mocking

```typescript
vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));
```

### Function Mocking

```typescript
const mockGetUser = vi.fn<[], Promise<User | null>>();
vi.mock('@/lib/auth/server-context', () => ({
  getServerContext: mockGetUser,
}));
```

### Mock Factories

```typescript
const createMockUser = (overrides?: Partial<User>): User => ({
  id: 'user_test',
  email: 'test@example.com',
  name: 'Test User',
  ...overrides,
});
```

## Best Practices

### Test Organization

- Use AAA pattern (Arrange-Act-Assert)
- Descriptive test names: `it('should create user with valid email', ...)`
- Group related tests with nested `describe` blocks
- Ensure test isolation - no shared state

### Coverage Goals

- Critical Path (auth, payments, database): 90%+
- Business Logic: 80%+
- Utilities: 70%+
- Overall Project: 75%+

### Vitest Features

- `it.only()` - Run single test
- `it.skip()` - Skip test
- `it.skipIf(condition)` - Conditional skip
- `vi.useFakeTimers()` - Mock time
- `expect().toMatchSnapshot()` - Snapshot testing

## Quality Checklist

- [ ] Tests cover happy path and edge cases
- [ ] External dependencies properly mocked
- [ ] Clear, descriptive test names
- [ ] Test isolation with proper cleanup
- [ ] Error cases tested
- [ ] Async operations handled correctly
- [ ] No test interdependencies

## When to Use

- Creating tests for new features or functions
- Improving test coverage
- Setting up test infrastructure (fixtures, mocks)
- Debugging failing tests
- Refactoring tests for better maintainability

---

_This agent ensures comprehensive testing coverage, proper mocking strategies, and maintains high code quality through systematic testing practices._
