import { db } from '../drizzle';
import { emailLogs } from '../schemas';
import { CreateEmailLog } from '@/lib/types';
import { eq } from 'drizzle-orm';

/**
 * Inserts a new email log entry into the database.
 * @param {NewEmailLog} data - The email log data to insert.
 * @returns {Promise<any>}
 */
export async function insertEmailLog(data: CreateEmailLog) {
  return await db.insert(emailLogs).values(data);
}

export async function logSentEmail(data: CreateEmailLog) {
  return await db.insert(emailLogs).values(data);
}

/**
 * Updates the status of an email log entry by its emailId.
 * @param {string} emailId - The ID of the email from the provider.
 * @param {NewEmailLog['status']} status - The new status of the email.
 * @returns {Promise<any>}
 */
export async function updateEmailLogStatus(
  emailId: string,
  status: CreateEmailLog['status']
) {
  return await db
    .update(emailLogs)
    .set({ status })
    .where(eq(emailLogs.emailId, emailId));
}

/**
 * Retrieves an email log entry by its emailId.
 * @param {string} emailId - The ID of the email from the provider.
 * @returns {Promise<any>}
 */
export async function getEmailLogByEmailId(emailId: string) {
  return await db.query.emailLogs.findFirst({
    where: eq(emailLogs.emailId, emailId),
  });
}
