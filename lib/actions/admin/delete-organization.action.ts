'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/drizzle';
import { organization } from '@/lib/db/schemas/organization.table';
import { eq } from 'drizzle-orm';
import { requireSuperAdminContext } from '@/lib/auth/super-admin-context';

/**
 * Server action to delete an organization.
 * Requires super admin permissions.
 *
 * @param organizationId - The ID of the organization to delete
 * @returns Success status and optional error message
 */
export async function deleteOrganization(organizationId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Verify super admin permissions
    await requireSuperAdminContext();

    // Delete the organization
    await db.delete(organization).where(eq(organization.id, organizationId));

    // Revalidate the organizations page to reflect the deletion
    revalidatePath('/admin/organizations');

    return { success: true };
  } catch (error) {
    console.error('Failed to delete organization:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to delete organization',
    };
  }
}
