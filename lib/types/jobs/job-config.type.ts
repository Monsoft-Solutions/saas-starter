import type { JobType } from './enums/job-type.enum';

/**
 * Declarative configuration for a job type. Keeps queue behaviour, destination
 * routing, and documentation centralised inside the registry.
 */
export type JobConfig = {
  type: JobType;
  endpoint: string;
  retries: number;
  timeout: number;
  description: string;
};
