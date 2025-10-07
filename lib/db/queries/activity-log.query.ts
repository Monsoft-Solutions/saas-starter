import { desc, eq } from 'drizzle-orm';
import { db } from '../drizzle';
import { activityLogs, NewActivityLog } from '../schemas';
import type { LogActivityInput } from '@/lib/types/activity-log';
import { requireServerSession } from '@/lib/auth/server-context';
import type { AdminRole } from '@/lib/auth/admin-context';
import type { AdminPermission } from '@/lib/types/admin/permission.enum';
import { headers } from 'next/headers';

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
 * Log activity with type-safe parameter support.
 * Enforces usage of ActivityType enum for actions.
 */
export async function logActivity(params: LogActivityInput): Promise<void> {
  // Get IP address for logging
  const requestHeaders = await headers();
  const ip = requestHeaders.get('x-forwarded-for') ?? undefined;

  // Attempt to extract userId if present in params and is an object
  let userId: string | undefined =
    typeof params === 'object' && 'userId' in params
      ? (params as { userId?: string }).userId
      : undefined;

  if (!userId) {
    const session = await requireServerSession();
    userId = session.user.id;
  }

  if (!userId) {
    return;
  }

  // Extract action and metadata based on parameter type
  const action = typeof params === 'string' ? params : params.action;
  const metadata = typeof params === 'object' ? params.metadata : undefined;

  const newActivity: NewActivityLog = {
    userId,
    action,
    ipAddress: ip,
    metadata,
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
