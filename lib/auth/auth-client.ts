import { createAuthClient } from 'better-auth/react';
import { organizationClient } from 'better-auth/client/plugins';
import { envClient } from '../env-client';

export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: envClient.BETTER_AUTH_URL,
  plugins: [organizationClient()],
});
