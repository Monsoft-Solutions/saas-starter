import { NewEmailLog } from '@/lib/types';
import { insertEmailLog, updateEmailLogStatus } from '@/lib/db/queries';

/**
 * Logs a sent email to the database.
 * @param {NewEmailLog} data - The email log data to insert.
 * @returns {Promise<any>}
 */
export async function logSentEmail(data: NewEmailLog) {
  return await insertEmailLog(data);
}

/**
 * Updates the status of an email log entry.
 * @param {string} emailId - The ID of the email from the provider.
 * @param {NewEmailLog['status']} status - The new status of the email.
 * @returns {Promise<void>}
 */
export async function updateEmailStatus(
  emailId: string,
  status: NewEmailLog['status']
): Promise<void> {
  try {
    await updateEmailLogStatus(emailId, status);
  } catch (error) {
    console.error(
      `Failed to update email status for emailId ${emailId}:`,
      error
    );
    // Optional: Add more robust error handling
  }
}
