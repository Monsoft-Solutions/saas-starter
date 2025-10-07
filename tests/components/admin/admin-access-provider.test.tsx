/**
 * Tests for admin access context type definitions and structure.
 * UI component tests should be done manually in the browser.
 */
import { describe, it, expect } from 'vitest';
import type { AdminAccessContext } from '@/lib/types/admin/admin-access-context.type';
import { ADMIN_PERMISSIONS } from '@/lib/types/admin/permission.enum';

describe('AdminAccessContext type', () => {
  it('should create a valid super-admin context', () => {
    const superAdminContext: AdminAccessContext = {
      role: 'super-admin',
      permissions: [...ADMIN_PERMISSIONS],
      isSuperAdmin: true,
      canViewActivity: true,
      canViewAnalytics: true,
      canManageAnalytics: true,
      canViewOrganizations: true,
      canEditOrganizations: true,
      canViewUsers: true,
      canEditUsers: true,
    };

    expect(superAdminContext.role).toBe('super-admin');
    expect(superAdminContext.isSuperAdmin).toBe(true);
    expect(superAdminContext.canEditUsers).toBe(true);
    expect(superAdminContext.permissions).toContain('users:write');
  });

  it('should create a valid read-only admin context', () => {
    const adminContext: AdminAccessContext = {
      role: 'admin',
      permissions: [
        'activity:read',
        'analytics:read',
        'organizations:read',
        'users:read',
      ],
      isSuperAdmin: false,
      canViewActivity: true,
      canViewAnalytics: true,
      canManageAnalytics: false,
      canViewOrganizations: true,
      canEditOrganizations: false,
      canViewUsers: true,
      canEditUsers: false,
    };

    expect(adminContext.role).toBe('admin');
    expect(adminContext.isSuperAdmin).toBe(false);
    expect(adminContext.canEditUsers).toBe(false);
    expect(adminContext.canViewUsers).toBe(true);
    expect(adminContext.permissions).not.toContain('users:write');
  });

  it('should validate permission arrays contain only valid permissions', () => {
    const context: AdminAccessContext = {
      role: 'admin',
      permissions: ['users:read', 'analytics:read'],
      isSuperAdmin: false,
      canViewActivity: false,
      canViewAnalytics: true,
      canManageAnalytics: false,
      canViewOrganizations: false,
      canEditOrganizations: false,
      canViewUsers: true,
      canEditUsers: false,
    };

    context.permissions.forEach((permission) => {
      expect(ADMIN_PERMISSIONS).toContain(permission);
    });
  });
});
