import { JOB_TYPES } from '../types/jobs/enums/job-type.enum';
import type { JobConfig } from '../types/jobs/job-config.type';
import type { JobType } from '../types/jobs/enums/job-type.enum';

/**
 * Source of truth mapping job types to their delivery configuration. Enables
 * the dispatcher to remain generic while features describe their own retries,
 * timeouts, and processing endpoints.
 */
export const JOB_REGISTRY: Record<JobType, JobConfig> = {
  [JOB_TYPES.SEND_EMAIL]: {
    type: JOB_TYPES.SEND_EMAIL,
    endpoint: '/api/jobs/email',
    retries: 3,
    timeout: 30,
    description: 'Send transactional emails via Resend',
  },
  [JOB_TYPES.PROCESS_WEBHOOK]: {
    type: JOB_TYPES.PROCESS_WEBHOOK,
    endpoint: '/api/jobs/webhook',
    retries: 5,
    timeout: 60,
    description: 'Process incoming webhooks from third-party services',
  },
  [JOB_TYPES.EXPORT_DATA]: {
    type: JOB_TYPES.EXPORT_DATA,
    endpoint: '/api/jobs/export',
    retries: 2,
    timeout: 300,
    description: 'Generate and export data files (CSV, Excel)',
  },
  [JOB_TYPES.GENERATE_REPORT]: {
    type: JOB_TYPES.GENERATE_REPORT,
    endpoint: '/api/jobs/report',
    retries: 2,
    timeout: 180,
    description: 'Generate analytics and business reports',
  },
  [JOB_TYPES.CLEANUP_OLD_DATA]: {
    type: JOB_TYPES.CLEANUP_OLD_DATA,
    endpoint: '/api/jobs/cleanup',
    retries: 1,
    timeout: 600,
    description: 'Clean up old data and temporary files',
  },
};

/**
 * Retrieves a job configuration, surfacing a descriptive error when consumers
 * reference a job type that has not been registered.
 */
export const getJobConfig = (type: JobType): JobConfig => {
  const config = JOB_REGISTRY[type];

  if (!config) {
    throw new Error(`Unknown job type: ${type}`);
  }

  return config;
};
