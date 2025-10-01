import 'server-only';

import { Client, Receiver } from '@upstash/qstash';

import { env } from '@/lib/env';

/**
 * Builds the singleton QStash client using environment configuration. Throws
 * early if credentials are missing so developers catch misconfiguration during
 * boot rather than at enqueue time.
 */
const createClient = () => {
  if (!env.QSTASH_TOKEN) {
    throw new Error(
      'QSTASH_TOKEN is not configured. Set it in your environment variables.'
    );
  }

  return new Client({
    token: env.QSTASH_TOKEN,
    ...(env.QSTASH_URL ? { baseUrl: env.QSTASH_URL } : {}),
  });
};

/**
 * Shared QStash client instance used by the dispatcher for publishing jobs and
 * managing schedules.
 */
export const qstash = createClient();

/**
 * Constructs a receiver that validates incoming QStash signatures. Keeps the
 * logic in one place so worker routes cannot accidentally skip verification.
 */
export const getQStashReceiver = () => {
  if (!env.QSTASH_CURRENT_SIGNING_KEY || !env.QSTASH_NEXT_SIGNING_KEY) {
    throw new Error(
      'QStash signing keys are not configured. Set QSTASH_CURRENT_SIGNING_KEY and QSTASH_NEXT_SIGNING_KEY.'
    );
  }

  return new Receiver({
    currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
    nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
  });
};
