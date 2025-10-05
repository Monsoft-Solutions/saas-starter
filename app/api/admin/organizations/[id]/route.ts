import { NextResponse } from 'next/server';
import { requireSuperAdminContext } from '@/lib/auth/super-admin-context';
import {
  getOrganizationWithDetails,
  deleteOrganizationById,
} from '@/lib/db/queries/admin-organization.query';
import { logActivity } from '@/lib/db/queries/activity-log.query';
import logger from '@/lib/logger/logger.service';

/**
 * GET /api/admin/organizations/[id]
 *
 * Get detailed information about a specific organization.
 *
 * @requires Super-admin role
 * @returns Organization details with members and subscription info
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify super-admin access
    await requireSuperAdminContext();

    const { id: organizationId } = await params;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const organization = await getOrganizationWithDetails(organizationId);

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(organization);
  } catch (error) {
    logger.error(
      '[api/admin/organizations/[id]] Failed to load organization details',
      { error }
    );

    return NextResponse.json(
      { error: 'Failed to load organization details' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/organizations/[id]
 *
 * Delete an organization (admin only).
 * This will also delete all associated members.
 *
 * @requires Super-admin role
 * @returns Success message
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify super-admin access
    const context = await requireSuperAdminContext();

    const { id: organizationId } = await params;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Check if organization exists
    const organization = await getOrganizationWithDetails(organizationId);

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Delete organization
    await deleteOrganizationById(organizationId);

    // Log admin action
    await logActivity({
      userId: context.user.id,
      action: 'admin.organization.deleted',
      metadata: {
        organizationId,
        organizationName: organization.name,
      },
    });

    logger.info('[api/admin/organizations/[id]] Organization deleted', {
      organizationId,
      adminUserId: context.user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Organization deleted successfully',
    });
  } catch (error) {
    logger.error(
      '[api/admin/organizations/[id]] Failed to delete organization',
      { error }
    );

    return NextResponse.json(
      { error: 'Failed to delete organization' },
      { status: 500 }
    );
  }
}
