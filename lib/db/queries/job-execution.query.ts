import 'server-only';

import { eq } from 'drizzle-orm';

import { db } from '@/lib/db/drizzle';
import type { NewJobExecution } from '@/lib/db/schemas';
import { jobExecutions } from '@/lib/db/schemas';

/**
 * Inserts a fresh execution record when a job is enqueued so we can track its
 * progress even before the worker runs.
 */
export const createJobExecution = async (data: NewJobExecution) => {
  const [execution] = await db.insert(jobExecutions).values(data).returning();

  return execution;
};

/**
 * Updates an execution record with status changes or metadata as the worker
 * processes the job.
 */
export const updateJobExecution = async (
  jobId: string,
  data: Partial<NewJobExecution>
) => {
  const [execution] = await db
    .update(jobExecutions)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(jobExecutions.jobId, jobId))
    .returning();

  return execution;
};

/**
 * Fetches a job execution by its QStash job identifier, powering worker status
 * transitions and operator insights.
 */
export const getJobExecutionByJobId = async (jobId: string) => {
  return db.query.jobExecutions.findFirst({
    where: eq(jobExecutions.jobId, jobId),
  });
};

/**
 * Retrieves recent executions for a given job type, useful for dashboards and
 * debugging specific workloads.
 */
export const getJobExecutionsByType = async (
  jobType: string,
  limit: number = 50
) => {
  return db.query.jobExecutions.findMany({
    where: eq(jobExecutions.jobType, jobType),
    orderBy: (executions, { desc }) => [desc(executions.createdAt)],
    limit,
  });
};

/**
 * Returns the latest failed jobs so operators can identify problematic
 * workloads quickly.
 */
export const getFailedJobExecutions = async (limit: number = 50) => {
  return db.query.jobExecutions.findMany({
    where: eq(jobExecutions.status, 'failed'),
    orderBy: (executions, { desc }) => [desc(executions.createdAt)],
    limit,
  });
};
