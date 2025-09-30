import { NextRequest } from 'next/server';
import { createApiHandler } from '@/lib/server/api-handler';
import logger from '@/lib/logger/logger.service';

/**
 * Client Error Logging API Route
 *
 * Receives error reports from client-side code and logs them using Winston.
 * This allows client-side errors to be captured in server logs without
 * bundling Winston in the client.
 */

type ClientErrorPayload = {
  message: string;
  error?: {
    message: string;
    stack?: string;
    digest?: string;
    name: string;
  };
  timestamp: string;
  userAgent?: string;
  url?: string;
};

export const POST = createApiHandler(
  async ({ request }: { request: NextRequest }) => {
    const payload = (await request.json()) as ClientErrorPayload;

    logger.error('Client-side error', {
      message: payload.message,
      error: payload.error?.message,
      stack: payload.error?.stack,
      digest: payload.error?.digest,
      name: payload.error?.name,
      userAgent: payload.userAgent,
      url: payload.url,
      timestamp: payload.timestamp,
    });

    return { success: true };
  },
  {
    logName: 'Client error logging API',
    successStatus: 200,
  }
);
