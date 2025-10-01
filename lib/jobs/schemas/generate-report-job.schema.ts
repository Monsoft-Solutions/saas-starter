/**
 * Generate Report Job Schema
 *
 * Defines the structure and validation for report generation job payloads processed by
 * the report worker. This schema ensures type safety and validates report operations
 * for generating analytics and business reports with email delivery.
 *
 * The schema includes:
 * - Report type validation against supported report categories
 * - Date range validation for time-based data aggregation
 * - Recipients validation for email delivery
 * - Format validation for supported report formats
 * - Integration with base job schema for metadata
 */

import { z } from 'zod';
import { BaseJobSchema } from './base-job.schema';
import { JOB_TYPES } from '../../types/jobs';

/**
 * Valid payloads accepted by the report worker. Defines the structure for
 * report generation operations that create analytics and business reports.
 *
 * @param reportType - Type of report to generate (analytics, usage, billing, custom)
 * @param dateRange - Time period for data aggregation (from/to datetime)
 * @param recipients - List of email addresses to receive the report
 * @param format - Output format for the report (PDF, HTML, JSON)
 */
export const GenerateReportJobPayloadSchema = z.object({
  reportType: z.enum(['analytics', 'usage', 'billing', 'custom']),
  dateRange: z.object({
    from: z.string().datetime(),
    to: z.string().datetime(),
  }),
  recipients: z.array(z.string().email()),
  format: z.enum(['pdf', 'html', 'json']),
});

/**
 * Complete report job envelope representing the job received by the worker.
 * Extends the base job schema with report-specific payload validation.
 */
export const GenerateReportJobSchema = BaseJobSchema.extend({
  type: z.literal(JOB_TYPES.GENERATE_REPORT),
  payload: GenerateReportJobPayloadSchema,
});

export type GenerateReportJobPayload = z.infer<
  typeof GenerateReportJobPayloadSchema
>;
export type GenerateReportJob = z.infer<typeof GenerateReportJobSchema>;
