import { desc, eq } from 'drizzle-orm';
import { db } from '../drizzle';
import { activityLogs, NewActivityLog } from '../schemas';
import { ActivityType } from '@/lib/types';
import { requireServerSession } from '@/lib/auth/server-context';
import type { AdminRole } from '@/lib/auth/admin-context';
import type { AdminPermission } from '@/lib/types/admin/permission.enum';

export async function getActivityLogs() {
  const session = await requireServerSession();

  return db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      ipAddress: activityLogs.ipAddress,
      metadata: activityLogs.metadata,
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
    | {
        userId: string;
        action: string;
        metadata?: Record<string, unknown>;
        ipAddress?: string;
      },
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
    metadata:
      typeof userIdOrParams === 'object' ? userIdOrParams.metadata : undefined,
  };

  await db.insert(activityLogs).values(newActivity);
}

/**
 * Log admin activity with enhanced metadata including actor role and granted permissions.
 * Used for observability and auditing of admin actions.
 */
export async function logAdminActivity(params: {
  userId: string;
  action: string;
  actorRole: AdminRole;
  grantedPermissions?: AdminPermission[];
  ipAddress?: string;
  additionalMetadata?: Record<string, unknown>;
}): Promise<void> {
  const {
    userId,
    action,
    actorRole,
    grantedPermissions,
    ipAddress,
    additionalMetadata,
  } = params;

  if (!userId) {
    return;
  }

  const metadata: Record<string, unknown> = {
    actorRole,
    ...additionalMetadata,
  };

  if (grantedPermissions && grantedPermissions.length > 0) {
    metadata.grantedPermissions = grantedPermissions;
  }

  const newActivity: NewActivityLog = {
    userId,
    action,
    ipAddress: ipAddress || '',
    metadata,
  };

  await db.insert(activityLogs).values(newActivity);
}
