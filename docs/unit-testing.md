# Unit Testing

This project uses [Vitest](https://vitest.dev/) for unit testing. Vitest is a fast, next-generation test framework powered by Vite.

## Running Tests

To run all unit tests, use the following command:

```bash
pnpm test
```

To run a specific test file, you can use:

```bash
pnpm vitest run <path-to-test-file>
```

For example, to run the email template tests:

```bash
pnpm vitest run tests/emails/templates.test.ts
```

### Database Testing

For tests that require database interaction, we use an in-memory PostgreSQL database powered by `@electric-sql/pglite`. This allows for fast, isolated, and reliable tests without needing a separate database server.

The setup is configured in `tests/test-setup.ts` and automatically applied to all tests via `vitest.config.ts`. The in-memory database is automatically migrated with the latest schema before any tests are run.

You can interact with the database in your tests by importing the `dbTest` instance from `../test-setup`.

Here's an example of a database test:

```typescript
import { dbTest } from '../test-setup';
import { user } from '@/lib/db/schemas/auth-schema';
import { organization } from '@/lib/db/schemas/auth-schema';
import { describe, it, expect } from 'vitest';

describe('Database Tests', () => {
  it('should insert a user and an organization', async () => {
    await dbTest.insert(user).values({
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
    });

    await dbTest.insert(organization).values({
      name: 'Test Organization',
      id: '1',
    });

    const users = await dbTest.select().from(user);
    const allOrganizations = await dbTest.select().from(organization);

    expect(users).toHaveLength(1);
    expect(users[0].name).toBe('Test User');
    expect(allOrganizations).toHaveLength(1);
    expect(allOrganizations[0].name).toBe('Test Organization');
  });
});
```

## Writing Tests

Tests are located in a `tests/<area>` directory at the root of the project a `.test.ts` or `.spec.ts` suffix.

### Example Test Structure

Here's an example of how tests are structured for email templates:

```typescript
import { expect, test } from 'vitest';
import React from 'react';

import {
  renderEmailChangeConfirmationEmail,
  renderPasswordChangedEmail,
  renderPasswordResetEmail,
  renderTeamInvitationEmail,
  renderWelcomeSignupEmail,
} from '@/lib/emails/templates';
import type {
  EmailChangeConfirmationEmailProps,
  PasswordChangedEmailProps,
  PasswordResetEmailProps,
  TeamInvitationEmailProps,
  WelcomeSignupEmailProps,
} from '@/lib/types';

// Mock data for testing
const mockUser = {
  recipientName: 'John Doe',
  email: 'john@example.com',
  supportEmail: 'support@example.com',
};

const mockWelcomeProps: WelcomeSignupEmailProps = {
  ...mockUser,
  dashboardUrl: 'https://app.example.com/dashboard',
  teamName: 'Test Team',
};

test('renders welcome signup email', async () => {
  const result = await renderWelcomeSignupEmail(mockWelcomeProps);

  expect(result).toHaveProperty('html');
  expect(result).toHaveProperty('text');
  expect(result.html).toContain('Welcome to Test Team');
});
```

This project emphasizes:

- **Clear, descriptive test names:** Using `test('should do something', ...)` for readability.
- **`expect` assertions:** Utilizing Vitest's `expect` API for assertions.
- **Mock data:** Creating separate mock data to ensure tests are isolated and repeatable.
- **Asynchronous tests:** Using `async/await` when testing asynchronous functions.

### Best Practices

- **Test Isolation:** Each test should be independent and not rely on the state of other tests.
- **Meaningful Assertions:** Assert specific outcomes rather than just checking for truthiness.
- **Code Coverage:** Aim for good code coverage, especially for critical business logic.
- **Readability:** Write clear and concise tests that are easy to understand.
- **`*.test.ts` or `*.spec.ts`:** Use these file extensions for test files.

## Configuration

The Vitest configuration can be found in `vitest.config.ts`.
