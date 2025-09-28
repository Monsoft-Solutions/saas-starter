# BetterAuth Migration Implementation Plan

**Date:** September 26, 2025
**Project:** SaaS Starter - Complete JWT to BetterAuth Migration
**Next.js Version:** 15.4.0-canary.47 with App Router
**Database:** PostgreSQL with Drizzle ORM

## Executive Summary

This plan outlines the complete replacement of the current JWT-based authentication system with BetterAuth in a Next.js 15 SaaS starter application. BetterAuth is a modern, TypeScript-first authentication framework that provides better developer experience, built-in social providers, and seamless integration with existing database schemas.

The migration will replace all JWT functionality while maintaining existing team relationships, invitation systems, Stripe integration, and activity logging. Since this is a template application, we can safely replace the user table schema with BetterAuth's schema while preserving foreign key relationships.

## Technical Analysis

### Current State Assessment

- **Authentication System:** Custom JWT with `jose` package and HTTP-only cookies
- **Database:** PostgreSQL with Drizzle ORM
- **User Management:** Custom user table with fields: id, name, email, passwordHash, role, createdAt, updatedAt, deletedAt
- **Dependencies to Remove:** `jose`, `bcryptjs` packages
- **Current Auth Files:**
  - `lib/auth/session.ts` (JWT management)
  - `lib/auth/middleware.ts` (Server Actions helpers)
  - `middleware.ts` (Route protection)
  - `lib/db/queries.ts` (User queries)

### Target Architecture

- **BetterAuth Integration:** Replace JWT with BetterAuth session management
- **Social Providers:** Google and Facebook OAuth
- **Database Schema:** BetterAuth-compatible user/session tables
- **Middleware:** BetterAuth-based route protection
- **Server Actions:** Updated helpers for BetterAuth integration

## Dependencies & Prerequisites

### Package Installation

```bash
# Install BetterAuth and remove old dependencies
npm install better-auth@latest
npm uninstall jose bcryptjs @types/bcryptjs

# Add social provider dependencies (automatically installed with better-auth)
# Google and Facebook providers are included in better-auth core
```

### Environment Variables Required

```env
# BetterAuth Core
BETTER_AUTH_SECRET=your_random_secret_key_32_chars
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Facebook OAuth
FACEBOOK_CLIENT_ID=your_facebook_app_id
FACEBOOK_CLIENT_SECRET=your_facebook_app_secret

# Database (existing)
DATABASE_URL=your_postgresql_connection_string
```

### External Service Setup

1. **Google Cloud Console:** OAuth 2.0 credentials with redirect URI `http://localhost:3000/api/auth/callback/google`
2. **Facebook Developer Portal:** App with redirect URI `http://localhost:3000/api/auth/callback/facebook`

## Architecture Overview

### BetterAuth Configuration Pattern

```typescript
// lib/auth.ts
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  emailAndPassword: { enabled: true },
  socialProviders: {
    google: { clientId: '...', clientSecret: '...' },
    facebook: { clientId: '...', clientSecret: '...' },
  },
  plugins: [nextCookies()],
});
```

### Database Schema Strategy

- **Replace:** Current `users` table with BetterAuth schema
- **Preserve:** All foreign key relationships (teamMembers, invitations, activityLogs)
- **Add:** BetterAuth `session` and `account` tables for social auth
- **Migration:** Drop/recreate user table with compatible ID strategy

### Middleware Architecture

- **Replace:** JWT verification with BetterAuth session checking
- **Preserve:** Dashboard route protection patterns
- **Enhance:** Better session management with automatic refresh

## Implementation Phases

### Phase 1: Environment and Dependencies Setup

**Objective:** Prepare the project for BetterAuth integration
**Estimated Effort:** 2 hours
**Complexity:** Low

**Tasks:**

1. Install BetterAuth package and remove JWT dependencies
2. Set up environment variables for BetterAuth and social providers
3. Configure Google and Facebook OAuth applications
4. Update `.env.example` with new required variables

**Deliverables:**

- Updated `package.json` with BetterAuth dependencies
- Configured environment variables
- OAuth provider applications ready

**Validation Criteria:**

- BetterAuth package installed successfully
- OAuth redirect URIs configured correctly
- Environment variables properly set

### Phase 2: Database Schema Migration

**Objective:** Replace user table with BetterAuth-compatible schema
**Estimated Effort:** 4 hours
**Complexity:** Medium

**Tasks:**

1. Generate BetterAuth schema using `npx @better-auth/cli generate`
2. Create migration to drop existing users table and foreign key constraints
3. Create new BetterAuth user, session, and account tables
4. Update foreign key references in teamMembers, invitations, and activityLogs
5. Run migration and verify schema integrity

**Deliverables:**

- New database schema with BetterAuth tables
- Updated Drizzle schema definitions
- Migration scripts for safe deployment

**Validation Criteria:**

- All foreign key relationships maintained
- BetterAuth tables created successfully
- No data corruption in related tables

**Risk Mitigation:**

- Backup database before migration
- Test migration on development environment first
- Rollback script prepared

### Phase 3: Core BetterAuth Configuration

**Objective:** Set up BetterAuth with email/password and social providers
**Estimated Effort:** 3 hours
**Complexity:** Medium

**Tasks:**

1. Create `lib/auth.ts` with BetterAuth configuration
2. Set up Drizzle adapter with proper schema mapping
3. Configure email/password authentication
4. Configure Google and Facebook OAuth providers
5. Create API route handler at `app/api/auth/[...all]/route.ts`

**Deliverables:**

- Fully configured BetterAuth instance
- API routes for authentication endpoints
- Working email/password authentication

**Validation Criteria:**

- BetterAuth endpoints respond correctly
- Email/password signup/signin working
- Social provider configuration valid

### Phase 4: Client-Side Integration

**Objective:** Set up BetterAuth client for frontend interactions
**Estimated Effort:** 2 hours
**Complexity:** Low

**Tasks:**

1. Create `lib/auth-client.ts` with BetterAuth React client
2. Replace existing auth context/hooks with BetterAuth client
3. Update authentication forms to use BetterAuth methods
4. Add social login buttons and handlers

**Deliverables:**

- BetterAuth client configuration
- Updated authentication components
- Social login UI components

**Validation Criteria:**

- Client authentication methods working
- Social login buttons functional
- Authentication state management working

### Phase 5: Middleware and Route Protection Update

**Objective:** Replace JWT middleware with BetterAuth session management
**Estimated Effort:** 3 hours
**Complexity:** Medium

**Tasks:**

1. Update `middleware.ts` to use BetterAuth session verification
2. Remove JWT token verification and refresh logic
3. Implement BetterAuth-based route protection
4. Test protected route access and redirects

**Deliverables:**

- Updated middleware with BetterAuth integration
- Preserved dashboard route protection
- Improved session management

**Validation Criteria:**

- Protected routes redirect unauthenticated users
- Authenticated users can access dashboard
- Session persistence working correctly

### Phase 6: Server Actions Integration

**Objective:** Update validation helpers to work with BetterAuth
**Estimated Effort:** 4 hours
**Complexity:** Medium

**Tasks:**

1. Update `lib/auth/middleware.ts` validation helpers
2. Replace `getUser()` function to use BetterAuth sessions
3. Update `validatedActionWithUser()` and `withTeam()` helpers
4. Modify `lib/db/queries.ts` to work with new user schema
5. Test all Server Actions with new authentication

**Deliverables:**

- Updated Server Action helpers
- BetterAuth-compatible user queries
- Preserved existing functionality patterns

**Validation Criteria:**

- All Server Actions work with BetterAuth
- Team operations function correctly
- User context properly passed to actions

### Phase 7: Activity Logging and User Management

**Objective:** Integrate BetterAuth with existing activity logging system
**Estimated Effort:** 3 hours
**Complexity:** Medium

**Tasks:**

1. Update activity logging to work with BetterAuth user IDs
2. Modify user-related operations (profile updates, etc.)
3. Update invitation system to work with new user schema
4. Test user lifecycle operations

**Deliverables:**

- Working activity logging with BetterAuth
- Updated user management operations
- Functional invitation system

**Validation Criteria:**

- Activity logs created correctly
- User profile operations working
- Invitation system functional

### Phase 8: Testing and Cleanup

**Objective:** Comprehensive testing and removal of legacy code
**Estimated Effort:** 4 hours
**Complexity:** Medium

**Tasks:**

1. Remove legacy JWT authentication files
2. Clean up unused imports and dependencies
3. Comprehensive testing of all authentication flows
4. Test social provider authentication end-to-end
5. Verify team operations and Stripe integration still work
6. Update documentation and types

**Deliverables:**

- Clean codebase without legacy auth code
- Comprehensive test coverage
- Updated documentation

**Validation Criteria:**

- All authentication flows working
- No broken imports or dependencies
- Social providers functioning correctly
- Team and Stripe operations preserved

## Folder Structure

### New Files to Create

```
lib/
├── auth.ts                 # BetterAuth configuration
├── auth-client.ts          # BetterAuth React client
└── db/
    └── migrations/         # New migration files
        ├── 001_drop_users_table.sql
        ├── 002_create_betterauth_schema.sql
        └── 003_update_foreign_keys.sql

app/
└── api/
    └── auth/
        └── [...all]/
            └── route.ts    # BetterAuth API handler
```

### Files to Update

```
lib/
├── auth/
│   └── middleware.ts       # Update helpers for BetterAuth
├── db/
│   ├── schema.ts          # New BetterAuth-compatible schema
│   └── queries.ts         # Updated user queries
└── middleware.ts          # BetterAuth session verification

app/
└── (auth pages)           # Update to use BetterAuth client
```

### Files to Remove

```
lib/
└── auth/
    └── session.ts         # JWT session management (remove)
```

## Configuration Changes

### Package.json Updates

```json
{
  "dependencies": {
    "better-auth": "^1.2.7"
    // Remove: "jose", "bcryptjs", "@types/bcryptjs"
  }
}
```

### Environment Variables (.env.example)

```env
# BetterAuth Configuration
BETTER_AUTH_SECRET=generate_with_openssl_rand_hex_32
BETTER_AUTH_URL=http://localhost:3000

# Social Authentication
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_CLIENT_ID=your_facebook_app_id
FACEBOOK_CLIENT_SECRET=your_facebook_app_secret

# Database (existing)
DATABASE_URL=postgresql://...
```

### Drizzle Configuration Updates

```typescript
// drizzle.config.ts - no changes needed
// BetterAuth adapter integrates with existing Drizzle setup
```

## Risk Assessment

### High-Risk Areas

1. **Database Migration:** Risk of foreign key constraint violations
   - **Mitigation:** Thorough testing on development environment, backup strategy
2. **User ID Changes:** BetterAuth uses different ID strategy (string vs number)
   - **Mitigation:** Update all foreign key references, test data integrity
3. **Session Management:** Different session handling could break existing flows
   - **Mitigation:** Preserve existing UX patterns, gradual migration

### Medium-Risk Areas

1. **Social Provider Setup:** OAuth configuration errors
   - **Mitigation:** Follow official documentation, test with multiple accounts
2. **Middleware Compatibility:** Route protection changes
   - **Mitigation:** Maintain existing protection patterns, comprehensive testing

### Low-Risk Areas

1. **Package Dependencies:** Well-established BetterAuth package
2. **Documentation:** Comprehensive official documentation available

## Success Metrics

### Functional Requirements

- [ ] Email/password authentication working
- [ ] Google OAuth authentication working
- [ ] Facebook OAuth authentication working
- [ ] Dashboard route protection preserved
- [ ] Team operations functional
- [ ] Invitation system working
- [ ] Activity logging preserved
- [ ] Stripe integration unaffected

### Performance Metrics

- [ ] Authentication response time < 500ms
- [ ] Database query performance maintained
- [ ] No increase in bundle size > 10%

### Security Requirements

- [ ] Session security equivalent or better than JWT
- [ ] Social provider tokens properly managed
- [ ] No sensitive data exposure
- [ ] CSRF protection maintained

### Developer Experience

- [ ] TypeScript support complete
- [ ] Error handling improved
- [ ] Code complexity reduced
- [ ] Documentation updated

## Migration Timeline

**Total Estimated Time:** 25 hours over 2-3 weeks

**Week 1:**

- Phase 1: Environment setup (Day 1)
- Phase 2: Database migration (Day 2-3)
- Phase 3: Core BetterAuth setup (Day 4)

**Week 2:**

- Phase 4: Client integration (Day 1)
- Phase 5: Middleware updates (Day 2)
- Phase 6: Server Actions (Day 3-4)

**Week 3:**

- Phase 7: Activity logging (Day 1)
- Phase 8: Testing and cleanup (Day 2-3)

## Alternative Approaches

### Option 1: Gradual Migration (Not Recommended)

Keep both systems running parallel and gradually migrate features.
**Trade-offs:** More complex, higher maintenance burden, potential security issues.

### Option 2: Custom Social Integration (Not Recommended)

Use BetterAuth for core auth but implement social providers manually.
**Trade-offs:** More development time, custom maintenance required, fewer benefits.

### Option 3: Keep JWT, Add Social (Not Recommended)

Keep existing JWT system and add social providers separately.
**Trade-offs:** Technical debt remains, inconsistent auth patterns, complex maintenance.

## Post-Migration Considerations

### Monitoring

- Set up authentication metrics and error tracking
- Monitor social provider authentication success rates
- Track session management performance

### Future Enhancements

- Consider adding additional social providers (GitHub, Apple)
- Implement magic link authentication
- Add passkey/WebAuthn support (BetterAuth plugin available)
- Consider multi-factor authentication

### Documentation Updates

- Update developer documentation
- Create social provider setup guides
- Document new authentication patterns for team

This comprehensive plan ensures a smooth migration from JWT to BetterAuth while preserving all existing functionality and adding modern social authentication capabilities.
