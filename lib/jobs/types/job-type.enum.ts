/**
 * Canonical list of supported job types. Using a const object preserves literal
 * types for consumers while keeping the API ergonomic.
 */
export const JOB_TYPES = {
  SEND_EMAIL: 'send-email',
  PROCESS_WEBHOOK: 'process-webhook',
  EXPORT_DATA: 'export-data',
  GENERATE_REPORT: 'generate-report',
  CLEANUP_OLD_DATA: 'cleanup-old-data',
} as const;

export type JobType = (typeof JOB_TYPES)[keyof typeof JOB_TYPES];
