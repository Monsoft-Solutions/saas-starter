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

export async function logActivity(
  userId: string,
  type: ActivityType,
  ipAddress?: string
) {
  if (!userId) {
    return;
  }

  const newActivity: NewActivityLog = {
    userId,
    action: type,
    ipAddress: ipAddress || '',
  };

  await db.insert(activityLogs).values(newActivity);
}
