import { desc, eq } from 'drizzle-orm';
import { db } from '../drizzle';
import { activityLogs, NewActivityLog } from '../schemas';
import { ActivityType } from '@/lib/types';
import { requireServerSession } from '@/lib/auth/server-context';

export async function getActivityLogs() {
  const session = await requireServerSession();

  return db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      ipAddress: activityLogs.ipAddress,
    })
    .from(activityLogs)
    .where(eq(activityLogs.userId, session.user.id))
    .orderBy(desc(activityLogs.timestamp))
    .limit(10);
}

/**
 * Log activity with flexible parameter support.
 * Supports both object and individual parameters for backward compatibility.
 */
export async function logActivity(
  userIdOrParams:
    | string
    | { userId: string; action: string; metadata?: any; ipAddress?: string },
  type?: ActivityType,
  ipAddress?: string
) {
  let userId: string;
  let action: string;
  let ip: string;

  // Handle object parameter
  if (typeof userIdOrParams === 'object') {
    userId = userIdOrParams.userId;
    action = userIdOrParams.action;
    ip = userIdOrParams.ipAddress || '';
  } else {
    // Handle individual parameters
    userId = userIdOrParams;
    action = type || '';
    ip = ipAddress || '';
  }

  if (!userId) {
    return;
  }

  const newActivity: NewActivityLog = {
    userId,
    action,
    ipAddress: ip,
  };

  await db.insert(activityLogs).values(newActivity);
}
