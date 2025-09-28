## Real-Time In-App Notifications Implementation Plan

### 1. Executive Summary

This document outlines the implementation plan for a real-time in-app notification system. The system will alert users to important events within the application, such as team invitations or subscription status changes. We will use a third-party service, Pusher, to manage real-time messaging, ensuring a scalable and reliable notification experience. The implementation will include database schema updates, backend service logic, and frontend components to display notifications.

### 2. Technical Analysis

The current stack is a Next.js 15 application using the App Router, a PostgreSQL database with Drizzle ORM, and BetterAuth for authentication. The architecture is well-suited for integrating a real-time notification system. Given the serverless nature of Vercel deployments, using a managed WebSocket service like Pusher is the recommended approach to avoid complexities with managing persistent connections.

This plan will leverage private channels in Pusher to ensure that users only receive notifications intended for them, authenticated via a server-side endpoint.

### 3. Dependencies & Prerequisites

- **Pusher Account**: A Pusher account is required. Create one at [pusher.com](https://pusher.com).
- **NPM Packages**:
  - `pusher`: The official Pusher server SDK for Node.js.
  - `pusher-js`: The official Pusher client-side library for the browser.
- **Environment Variables**:
  - `PUSHER_APP_ID`: Your Pusher application ID.
  - `PUSHER_KEY`: Your Pusher application key.
  - `PUSHER_SECRET`: Your Pusher application secret.
  - `PUSHER_CLUSTER`: The cluster your Pusher application is on (e.g., `us3`).

### 4. Architecture Overview

The notification system will consist of three main parts:

1.  **Backend Service**: A service module (`lib/notifications/service.ts`) will be responsible for creating notification records in the database and triggering events on Pusher channels. This service will be called from various parts of the application where notifications are needed (e.g., after a user is invited to a team).
2.  **Authentication Endpoint**: Pusher requires an authentication endpoint for private channels. We will create an API route (`app/api/pusher/auth/route.ts`) that verifies the user's session and authorizes them to subscribe to their private channel.
3.  **Frontend Client**: A React context provider (`components/providers/notifications-provider.tsx`) will initialize the `pusher-js` client, subscribe to the authenticated user's private channel, and manage the state of notifications (e.g., fetching initial notifications, receiving new ones in real-time, and handling read/unread status).
4.  **UI Components**: A set of React components (`components/notifications/`) will be created to display the notification bell icon, the list of notifications, and individual notification items, using shadcn/ui components.

### 5. Implementation Phases

#### Phase 1: Setup and Configuration

- **Objective**: Configure the project to use Pusher.
- **Tasks**:
  1.  Create a new application on the Pusher dashboard.
  2.  Install the required npm packages: `pnpm install pusher pusher-js`.
  3.  Add the Pusher credentials (`PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER`) to the `.env` file.
  4.  Update the environment schema in `lib/env.ts` to include the new Pusher variables.
  5.  Create a Pusher server client instance in `lib/notifications/client.ts`.

#### Phase 2: Database Schema and Queries

- **Objective**: Create the database table for storing notifications.
- **Tasks**:
  1.  Define the `notifications` table schema in a new file `lib/db/schames/notification.table.ts`. It should include columns: `id`, `user_id` (foreign key to `user`), `type` (enum, e.g., `team_invitation`), `data` (jsonb), `read_at` (timestamp), and `created_at` (timestamp).
  2.  Define a Zod schema for notification types in `lib/types/notifications/notification.type.ts`.
  3.  Run `pnpm db:generate` to create a new migration.
  4.  Run `pnpm db:migrate` to apply the migration.
  5.  Create query functions for notifications (e.g., `getNotificationsForUser`, `markNotificationAsRead`) in `lib/db/queries/notification.query.ts`.

#### Phase 3: Backend Logic

- **Objective**: Implement the backend services for sending and authenticating notifications.
- **Tasks**:
  1.  Create the backend notification service in `lib/notifications/service.ts`. This service will have a function, e.g., `createNotification`, that:
      - Accepts `userId`, `type`, and `data` as arguments.
      - Creates a new notification record in the database.
      - Triggers a Pusher event on a private channel for the user (e.g., `private-user-${userId}`).
  2.  Create the Pusher authentication API route in `app/api/pusher/auth/route.ts`. This route will:
      - Verify the user's session using BetterAuth.
      - Authorize the subscription to the private channel.

#### Phase 4: Frontend Real-time Provider

- **Objective**: Set up the client-side infrastructure for receiving real-time notifications.
- **Tasks**:
  1.  Create a `useNotifications` hook and `NotificationsProvider` in `components/providers/notifications-provider.tsx`.
  2.  The provider will:
      - Initialize the `pusher-js` client.
      - Subscribe to the user's private channel (e.g., `private-user-${user.id}`).
      - Bind to events and update the notification state.
      - Fetch the initial list of unread notifications for the user.
      - Provide the notification state and actions (e.g., `markAsRead`) through context.
  3.  Wrap the application layout in `app/(app)/layout.tsx` with the `NotificationsProvider`.

#### Phase 5: UI Components

- **Objective**: Create the UI for displaying notifications.
- **Tasks**:
  1.  Create a `NotificationBell` component (`components/notifications/notification-bell.component.tsx`) that shows an indicator for unread notifications.
  2.  Use a `Popover` from shadcn/ui to display a `NotificationsList` when the bell is clicked.
  3.  Create a `NotificationItem` component to render individual notifications with appropriate content based on their type.
  4.  Add the `NotificationBell` to the main application header.

#### Phase 6: Integration with an Existing Feature

- **Objective**: Trigger a notification from an existing business process.
- **Tasks**:
  1.  Identify a suitable event, for example, when a user is invited to a team.
  2.  In the server action that handles team invitations, call the `createNotification` service to send a notification to the invited user.
  3.  Verify that the notification is received and displayed in real-time on the client.

### 6. Folder Structure

```
/app
  /api
    /pusher
      /auth
        - route.ts
/components
  /notifications
    - notification-bell.component.tsx
    - notification-item.component.tsx
    - notifications-popover.component.tsx
  /providers
    - notifications-provider.tsx
/lib
  /db
    /schames
      - notification.table.ts
    /queries
      - notification.query.ts
  /notifications
    - client.ts
    - service.ts
  /types
    /notifications
      - notification.type.ts
      - notification.enum.ts
```

### 7. Configuration Changes

- **`.env.example`**: Add the following variables:
  ```
  PUSHER_APP_ID=""
  PUSHER_KEY=""
  PUSHER_SECRET=""
  PUSHER_CLUSTER=""
  ```
- **`lib/env.ts`**: Update the Zod schema to include the new Pusher environment variables.

### 8. Risk Assessment

- **Third-Party Dependency**: The system relies on Pusher. A Pusher outage would disable real-time notifications. Mitigation: The system should gracefully degrade; notifications will still be stored in the database and can be viewed when the service is restored.
- **Security**: Private channels must be correctly authenticated to prevent users from accessing notifications not intended for them. Mitigation: Thoroughly test the authentication endpoint.
- **Cost**: Pusher is a paid service. High notification volume could lead to increased costs. Mitigation: Monitor usage and choose a suitable plan. Implement batching or debouncing for high-frequency events if necessary.

### 9. Success Metrics

- Notifications are delivered to the client in under 2 seconds.
- The unread notification count is accurate and updates in real-time.
- The system is extensible and can support new notification types with minimal changes.
- CPU and memory usage on the server remains stable under load.

### 10. References

- **Pusher Documentation**: [https://pusher.com/docs/channels/](https://pusher.com/docs/channels/)
- **Next.js App Router**: [https://nextjs.org/docs/app](https://nextjs.org/docs/app)
- **Drizzle ORM Documentation**: [https://orm.drizzle.team/](https://orm.drizzle.team/)
