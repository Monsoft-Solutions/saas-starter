# Implementation Plan: Migration to Better-Auth Organization Plugin

- **Date:** 2025-09-27
- **Author:** AI Assistant

## 1. Executive Summary

This document outlines the implementation plan for migrating our current custom team management system to the official Better-Auth Organization Plugin. The goal is to leverage the robust, pre-built functionality of the Better-Auth ecosystem for handling organizations, memberships, and invitations. This will reduce our maintenance overhead, improve security, and align our application with the best practices of our authentication provider. We will maintain all existing functionality, including Stripe integration for team-based subscriptions.

## 2. Technical Analysis

Our current system uses three main tables for team management:

- `teams`: Stores basic team information and Stripe subscription data.
- `team_members`: A join table for the many-to-many relationship between users and teams, including user roles.
- `invitations`: Manages invitations for new users to join a team.

While functional, this custom implementation requires ongoing maintenance and does not benefit from the integrated features and security enhancements of the Better-Auth platform. Migrating to the Better-Auth Organization Plugin will involve mapping our existing data to the new schema provided by the plugin, refactoring our backend and frontend logic to use the plugin's API, and ensuring a seamless transition for our users.

## 3. Dependencies & Prerequisites

- **`@better-auth/plugin-organization`**: The official Better-Auth Organization Plugin will need to be installed from npm.
- **`@better-auth/cli`**: The Better-Auth CLI is required to generate the necessary database migrations for the new organization schema.
- **Node.js & pnpm**: The project's existing environment.
- **Stripe Account**: The existing Stripe integration will need to be tested with the new organization structure.

## 4. Architecture Overview

The new architecture will be centered around the Better-Auth Organization Plugin. The plugin will manage the database schema for organizations, members, and invitations.

- **New Tables**: The plugin will introduce its own tables, likely named `organization`, `member`, and `invitation`. These will replace our custom `teams`, `teamMembers`, and `invitations` tables.
- **Backend**: Our backend logic (server actions, API routes) will no longer query our custom tables directly. Instead, they will interact with the Better-Auth organization plugin's server-side API for all organization-related operations.
- **Frontend**: The client-side will use the `organizationClient` from `@better-auth/client/plugins` to interact with the organization data, ensuring a consistent and secure data flow.
- **Data Migration**: A one-time data migration script will be created to move all existing data from our `teams`, `teamMembers`, and `invitations` tables to the new tables created by the Better-Auth plugin. The Stripe-related columns on the `teams` table (`stripeCustomerId`, `stripeSubscriptionId`, etc.) will be migrated to the new `organization` table, which we will extend if necessary.

## 5. Implementation Phases

### Phase 1: Plugin Installation and Configuration

- **Objective**: Install the necessary packages and configure the Better-Auth plugin.
- **Tasks**:
  1. Install the organization plugin: `pnpm add @better-auth/plugin-organization`.
  2. Install the Better-Auth CLI as a dev dependency: `pnpm add -D @better-auth/cli`.
  3. Update the Better-Auth server-side configuration in `lib/auth.ts` to include the `organization` plugin.
  4. Update the Better-Auth client-side configuration in `lib/auth/auth-client.ts` to include the `organizationClient` plugin.
- **Validation**: The application builds and runs successfully with the new plugin configured.

### Phase 2: Database Schema Generation

- **Objective**: Create the new database tables required by the organization plugin.
- **Tasks**:
  1. Run the Better-Auth CLI to generate the database migration: `pnpm exec better-auth-cli migrate` or `npx @better-auth/cli migrate`. This will create a new migration file in `lib/db/migrations/`.
  2. Review the generated migration file to understand the new schema.
  3. Apply the migration to the local development database: `pnpm db:migrate`.
- **Validation**: The new tables (`organization`, `member`, `invitation`, etc.) are created in the database.

### Phase 3: Data Migration Script

- **Objective**: Create and test a script to migrate data from the old team tables to the new organization tables.
- **Tasks**:
  1. Create a new script file (e.g., `scripts/migrate-teams-to-orgs.ts`).
  2. The script should:
     - Fetch all records from the `teams` table.
     - For each team, create a corresponding record in the `organization` table, mapping all fields, including the Stripe-related ones.
     - Fetch all records from the `team_members` table.
     - For each team member, create a corresponding record in the `member` table, linking the user to the new organization with the correct role.
     - Fetch all records from the `invitations` table.
     - For each invitation, create a corresponding record in the `invitation` table.
  3. Thoroughly test the script on a staging or development database.
- **Validation**: Data from the old tables is accurately and completely present in the new tables.

### Phase 4: Backend Refactoring

- **Objective**: Replace all custom team management logic with the Better-Auth Organization Plugin's API.
- **Tasks**:
  1. Identify all backend files that interact with `teams`, `teamMembers`, and `invitations` tables (e.g., in `lib/db/queries.ts`, API routes, and server actions).
  2. Refactor these files to use the functions and methods provided by the `organization` plugin (e.g., `auth.organization.create`, `auth.organization.invite`, etc.).
  3. Pay special attention to the Stripe integration logic to ensure it continues to work with the new `organization` table.
- **Validation**: All backend tests pass, and manual testing confirms that organization-related features work correctly through the API.

### Phase 5: Frontend Refactoring

- **Objective**: Update the UI to use the new organization data structure and client-side plugin.
- **Tasks**:
  1. Identify all React components and pages that display or manage team information.
  2. Refactor these components to use `authClient.organization` for all data fetching and mutations (e.g., `authClient.organization.list()`, `authClient.organization.invite({...})`).
  3. Replace custom forms and UI elements with Better-Auth's pre-built components if available and desired (e.g., `<OrganizationSwitcher />`).
- **Validation**: The UI correctly displays organization data, and all interactive elements (inviting members, creating organizations, etc.) function as expected.

### Phase 6: Testing and Validation

- **Objective**: Ensure the entire migration is successful and the application is stable.
- **Tasks**:
  1. Conduct end-to-end testing of all user flows related to organizations:
     - Creating an organization.
     - Inviting a user to an organization.
     - Accepting an invitation.
     - User roles and permissions within an organization.
     - Stripe subscription creation and status updates for an organization.
  2. Run the data migration script on a staging environment and perform thorough validation.
- **Validation**: All tests pass, and no regressions are found. The data in staging is consistent and correct after the migration.

### Phase 7: Cleanup

- **Objective**: Remove the old, now-unused team management code and database tables.
- **Tasks**:
  1. Create a new database migration to drop the `teams`, `teamMembers`, and `invitations` tables.
  2. Remove the old table definitions from `lib/db/schema.ts`.
  3. Delete any backend and frontend code that is no longer used.
- **Validation**: The application continues to function correctly after the cleanup. The old tables are removed from the database.

## 6. Folder Structure

- No major changes to the overall folder structure are anticipated.
- A temporary file might be created under `scripts/` for the data migration script (`scripts/migrate-teams-to-orgs.ts`).

## 7. Configuration Changes

The following configuration changes will be necessary:

**`lib/auth.ts` (Server-side):**

```typescript
import { betterAuth } from 'better-auth';
import { organization } from 'better-auth/plugins';

export const auth = betterAuth({
  plugins: [
    organization({
      // Plugin-specific configurations can be added here
    }),
  ],
  // ... other better-auth configurations
});
```

**`lib/auth/auth-client.ts` (Client-side):**

```typescript
import { createAuthClient } from 'better-auth/client';
import { organizationClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  plugins: [organizationClient()],
});
```

## 8. Risk Assessment

- **Data Loss**: The data migration phase is critical. An error in the migration script could lead to data loss. Mitigation: Thoroughly back up the database before running the script and test it extensively in a non-production environment.
- **Downtime**: The migration will likely require a maintenance window to prevent data inconsistencies. Mitigation: Plan for a scheduled downtime and communicate it to users.
- **Bugs and Regressions**: The extensive refactoring could introduce new bugs. Mitigation: Comprehensive testing (automated and manual) is essential to catch any issues before they reach production.

## 9. Success Metrics

- All existing data from `teams`, `teamMembers`, and `invitations` is successfully migrated to the new schema with 100% accuracy.
- All existing functionality related to team management works as expected using the Better-Auth Organization Plugin.
- The old tables and associated code are successfully removed from the codebase and database.
- There are no user-reported issues related to the migration after deployment.

## 10. References

- [Better-Auth Organization Plugin Documentation](https://www.better-auth.com/docs/plugins/organization)
