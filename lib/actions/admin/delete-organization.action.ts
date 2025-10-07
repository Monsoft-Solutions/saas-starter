'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/drizzle';
import { organization } from '@/lib/db/schemas/organization.table';
import { eq } from 'drizzle-orm';
import { withPermission } from '@/lib/auth/permission-middleware';
import { logActivity } from '@/lib/db/queries/activity-log.query';
import { ActivityType } from '@/lib/types/activity-log';

/**
 * Schema for validating delete organization parameters
 */
const deleteOrganizationSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required'),
});

type DeleteOrganizationParams = z.infer<typeof deleteOrganizationSchema>;

/**
 * Server action to delete an organization.
 * Requires the `organizations:write` admin permission.
 */
export const deleteOrganization = withPermission(
  'organizations:write',
  async (params: DeleteOrganizationParams) => {
    try {
      const data = deleteOrganizationSchema.parse(params);

      // Delete the organization
      await db
        .delete(organization)
        .where(eq(organization.id, data.organizationId));

      // Log admin action
      await logActivity({
        action: ActivityType.ADMIN_ORGANIZATION_DELETED,
        metadata: {
          organizationId: data.organizationId,
        },
      });

      // Revalidate the organizations page to reflect the deletion
      revalidatePath('/admin/organizations');

      return { success: 'Organization deleted successfully' };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { error: error.errors[0].message };
      }

      return { error: 'Failed to delete organization' };
    }
  },
  'admin.organizations.delete'
);
