import 'server-only';

import { NextRequest } from 'next/server';

import { getQStashReceiver } from './qstash.client';
import type { BaseJob } from '../types/jobs/schemas/base-job.schema';
import { getJobExecutionByJobId, updateJobExecution } from '@/lib/db/queries';
import logger from '@/lib/logger/logger.service';

/**
 * Signature for job worker implementations. Workers receive the parsed payload
 * alongside the base job so they can log context or access metadata.
 */
export interface JobWorkerHandler<T = unknown> {
  (payload: T, job: BaseJob & { payload: T }): Promise<void>;
}

/**
 * Pulls the QStash signature out of headers while tolerating casing
 * differences. Some HTTP runtimes normalise header names, so we check both.
 */
const getSignature = (request: NextRequest) =>
  request.headers.get('Upstash-Signature') ??
  request.headers.get('upstash-signature') ??
  '';

/**
 * Wraps a job handler with QStash signature verification and execution-state
 * bookkeeping. This keeps every worker consistent, so retries and observability
 * behave the same across features.
 */
export const createJobWorker = <T = unknown>(handler: JobWorkerHandler<T>) => {
  return async (request: NextRequest) => {
    const receiver = getQStashReceiver();
    const body = await request.text();
    const signature = getSignature(request);

    if (!signature) {
      logger.error('[jobs] Missing QStash signature header');
      return Response.json({ error: 'Missing signature' }, { status: 401 });
    }

    try {
      await receiver.verify({
        signature,
        body,
        url: request.url,
      });
    } catch (error) {
      logger.error('[jobs] Invalid QStash signature', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    let job: BaseJob & { payload: T };

    try {
      job = JSON.parse(body) as BaseJob & { payload: T };
    } catch (error) {
      logger.error('[jobs] Failed to parse job payload', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return Response.json({ error: 'Invalid job payload' }, { status: 400 });
    }

    logger.info('[jobs] Processing job', {
      jobId: job.jobId,
      type: job.type,
    });

    try {
      const execution = await getJobExecutionByJobId(job.jobId);

      if (execution) {
        await updateJobExecution(job.jobId, {
          status: 'processing',
          startedAt: new Date(),
          retryCount: (execution.retryCount ?? 0) + 1,
        });
      } else {
        logger.warn('[jobs] Job execution record not found for job', {
          jobId: job.jobId,
        });
      }
    } catch (error) {
      logger.error('[jobs] Failed to update job execution to processing', {
        jobId: job.jobId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    try {
      await handler(job.payload, job);

      try {
        await updateJobExecution(job.jobId, {
          status: 'completed',
          completedAt: new Date(),
        });
      } catch (error) {
        logger.error('[jobs] Failed to update job execution to completed', {
          jobId: job.jobId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      logger.info('[jobs] Job processed successfully', {
        jobId: job.jobId,
        type: job.type,
      });

      return Response.json({ success: true });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      logger.error('[jobs] Job processing failed', {
        jobId: job.jobId,
        type: job.type,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });

      try {
        await updateJobExecution(job.jobId, {
          status: 'failed',
          error: errorMessage,
          completedAt: new Date(),
        });
      } catch (updateError) {
        logger.error('[jobs] Failed to update job execution to failed', {
          jobId: job.jobId,
          error:
            updateError instanceof Error
              ? updateError.message
              : 'Unknown error',
        });
      }

      return Response.json({ error: errorMessage }, { status: 500 });
    }
  };
};
