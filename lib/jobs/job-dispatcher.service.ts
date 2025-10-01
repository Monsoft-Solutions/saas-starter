import 'server-only';

import { randomUUID } from 'crypto';

import { qstash } from './qstash.client';
import type { BaseJob, BaseJobMetadata } from './schemas/base-job.schema';
import { env } from '@/lib/env';
import { createJobExecution } from '@/lib/db/queries';
import logger from '@/lib/logger/logger.service';
import { JobType } from '../types/jobs';
import { getJobConfig } from './job-registry';

/**
 * Optional overrides that callers can provide when enqueueing jobs.
 * These allow feature teams to dial in retry behaviour without modifying the registry.
 */
export interface EnqueueJobOptions {
  delay?: number;
  retries?: number;
  callback?: string;
  failureCallback?: string;
  headers?: Record<string, string>;
}

/**
 * Normalises the base URL so that we never emit double slashes when composing
 * QStash delivery URLs. QStash treats the URL as an identifier when signing
 * requests, so keeping this consistent prevents signature mismatches.
 */
const normalizeBaseUrl = (url: string) => url.replace(/\/$/, '');

/**
 * Orchestrates communication with QStash, translating logical job types into
 * concrete HTTP deliveries while keeping a persistent execution record.
 */
export class JobDispatcher {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = normalizeBaseUrl(env.BASE_URL);
  }

  /**
   * Publishes a job to QStash and records the pending execution so that
   * operators can observe state transitions even if the downstream worker fails.
   */
  async enqueue<T extends Record<string, unknown>>(
    type: JobType,
    payload: T,
    metadata: Omit<BaseJobMetadata, 'createdAt'> = {},
    options?: EnqueueJobOptions
  ): Promise<string> {
    const config = getJobConfig(type);
    const jobId = randomUUID();

    const job: BaseJob & { payload: T } = {
      jobId,
      type,
      payload,
      metadata: {
        ...metadata,
        createdAt: new Date().toISOString(),
      },
    };

    await createJobExecution({
      jobId,
      jobType: type,
      status: 'pending',
      payload: job,
      userId: metadata.userId,
      organizationId: metadata.organizationId,
    });

    const url = `${this.baseUrl}${config.endpoint}`;

    logger.info('[jobs] Enqueueing job', {
      jobId,
      type,
      url,
    });

    try {
      await qstash.publishJSON({
        url,
        body: job,
        retries: options?.retries ?? config.retries,
        delay: options?.delay,
        callback: options?.callback,
        failureCallback: options?.failureCallback,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      logger.info('[jobs] Job enqueued successfully', {
        jobId,
        type,
      });

      return jobId;
    } catch (error) {
      logger.error('[jobs] Failed to enqueue job', {
        jobId,
        type,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Creates a recurring schedule in QStash, allowing cron-style maintenance
   * jobs to reuse the same dispatch pipeline and execution tracking.
   */
  async schedule(
    type: JobType,
    cron: string,
    payload: Record<string, unknown>,
    metadata: Omit<BaseJobMetadata, 'createdAt'> = {}
  ): Promise<string> {
    const config = getJobConfig(type);
    const url = `${this.baseUrl}${config.endpoint}`;

    const job: BaseJob & { payload: Record<string, unknown> } = {
      jobId: randomUUID(),
      type,
      payload,
      metadata: {
        ...metadata,
        createdAt: new Date().toISOString(),
      },
    };

    logger.info('[jobs] Scheduling job', {
      type,
      cron,
      url,
    });

    const schedule = await qstash.schedules.create({
      destination: url,
      cron,
      body: JSON.stringify(job),
    });

    logger.info('[jobs] Job scheduled successfully', {
      type,
      cron,
      scheduleId: schedule.scheduleId,
    });

    return schedule.scheduleId;
  }
}

/**
 * Shared dispatcher instance so that all features enqueue through the same
 * instrumentation and configuration surface.
 */
export const jobDispatcher = new JobDispatcher();
